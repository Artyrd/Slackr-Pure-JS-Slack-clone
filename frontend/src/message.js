import { fileToDataUrl, fetcher, timeFromIsoString, countReacts} from './helpers.js';
import {showImageGallery} from './image-gallery.js'
console.log('Loading messages.js!');
import { buildMessage, buildUserInfo } from './build-message.js';

const reactEmojis = ['\u{1F638}','\u{1F639}','\u{1F63F}']
let userNames = {};
let userIcons = {};
let userEmails = {};
let userBios = {};
let loadTimeout = false;
let messageIndex = 0;
let showingEditForm = [false, '']; // [bool, current editform being shown]
let savedMessage = '';
let localImages = [];

const channelMessages = document.getElementById('channel-messages');

/**
 * clears the currently displayed channel messages
 */
const resetChannelMessages = () => {
    const channelMessages = document.getElementById('channel-messages');
    let currChild = channelMessages.firstChild;
    while(currChild != null && currChild.id != 'message-loading-block') {
        channelMessages.removeChild(channelMessages.firstChild);
        currChild = channelMessages.firstChild;
    }
    console.log('channel message reset done');
    resetPinnedMessagesModal();
    showingEditForm = [false, ''];
    messageIndex = 0;
    localImages.length = 0; // clears the existing array, keeping the original references
    console.log('channel reset done');
}

const resetPinnedMessagesModal = () => {
    const pinnedMessages = document.getElementById('pinned-messages');
    while (pinnedMessages.hasChildNodes()) {
        pinnedMessages.removeChild(pinnedMessages.lastChild);
    }
}


const handleGetMessages = (index, numMessages, order) => {
    const currentChannel = localStorage.getItem('currentChannel');
    // console.log('index is: ', index);
    const loadingBlock = document.getElementById('message-loading-block');
    loadingBlock.textContent = 'Loading...';

    return fetcher('GET', `/message/${currentChannel}?start=${index}`)
    .then((data) => {
        return data['messages'];
    })
    .then((messages)=> {
        let loadedMessages = 0;
        let promiseList = [];
        for (const message of messages) {
            if (loadedMessages < numMessages) {
                promiseList.push(buildMessage(message));
                loadedMessages++;
                messageIndex++;
            }
        }
        return Promise.all(promiseList);
    })
    .then((builtMessages)=>{
        const loadingBlock = document.getElementById('message-loading-block');
        for (const newMessage of builtMessages) {
            const messageImage = newMessage.children[4].children[0];
            if (order !== -1) {
                channelMessages.insertBefore(newMessage, loadingBlock);
                if (messageImage) {
                    localImages.push(messageImage.id);
                }
            } else {
                channelMessages.prepend(newMessage);
                if (messageImage) {
                    localImages.unshift(messageImage.id);
                }
            }
        }
        return builtMessages;
    })
    .then((builtMessages) => {
        let promiseList = [];
        for (const newMessage of builtMessages) {
            promiseList.push(buildUserInfo(newMessage.value, newMessage, newMessage.children[0], newMessage.children[1]));
        }
        return Promise.all(promiseList);
    })
    .then(() => {
        loadingBlock.textContent = '';
    })
    .catch((err)=> {
        console.log('there was an error fetching channel messages:' + err);
    })
}



// const sendMsgButton = document.getElementById('send-msg-button');
// const sendMsgInput = document.getElementById('send-msg-input');
const handleSendMessage = () => {
    return new Promise((resolve, reject) => {
        const message = document.getElementById('send-msg-input');
        if ((!message.value || /^\s*$/.test(message.value))) {
            resolve();
        } else {
            const channelId = localStorage.getItem('currentChannel');
            return fetcher('POST', `/message/${channelId}`, {
                message: message.value
            })
            .then(()=>{
                console.log('submitted ' + message.value);
            })
            .then(()=>{
                return handleGetMessages(0, 1, -1)
            })
            .then(()=>{
                console.log(`requested sent message`);
                document.getElementById('send-msg-input').value = '';
                resolve();
            })
            .catch((err) => {
                reject(err);
            })
        }
    })
    .then(() => {
        return handleSendImage()
    })
    .catch((err) => {
        console.log(`There was an error sending the message: ${err}`);
    })
}

const handleSendImage = () => {
    const imageInput = document.getElementById('input-message-image');
    if (imageInput.value) {
        console.log('submitting image...')
        return fileToDataUrl(imageInput.files[0])
        .then((imgurl) => {
            const channelId = localStorage.getItem('currentChannel');
            return fetcher('POST', `/message/${channelId}`, {
                image: imgurl
            })
        })
        .then(() => {
            clearMessageImpageInput();
            return handleGetMessages(0, 1, -1)
        })
    }
}



const sendMsgForm = document.getElementById('messaging-form');
sendMsgForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSendMessage();
})

const handleEditMessage = (channelId, messageId, editedMessage) => {
    // const editedMessage = document.getElementById('edit-message-input').value
    console.log('editing in:', channelId, messageId)
    return fetcher('PUT', `/message/${channelId}/ ${messageId}`, {
        message: editedMessage
        // image: document.getElementById('')
    })
    .then(() => {
        const messageElement = document.getElementById('msg-'+messageId);
        messageElement.children[5].textContent = 'edited';
        messageElement.children[6].textContent = `${timeFromIsoString(new Date().toISOString())}`;
    })
}

const handleEditImage = (channelId, messageId, editedImageUrl) => {
    console.log('editing in:', channelId, messageId)
    return fetcher('PUT', `/message/${channelId}/ ${messageId}`, {
        image: editedImageUrl
    })
    .then(() => {
        const messageElement = document.getElementById('msg-'+messageId);
        messageElement.children[5].textContent = 'edited';
        messageElement.children[6].textContent = `${timeFromIsoString(new Date().toISOString())}`;
    })
}

const imageInput = document.getElementById('input-message-image');
const imageInputName = document.getElementById('messaging-form-img-name');
imageInput.addEventListener('change', (event) => {
    imageInputName.textContent = imageInput.files[0].name;
})
const clearMessageImpageInput = () => {
    imageInput.value = '';
    imageInputName.textContent = '';
}

const showEditMessageForm = (messageElementId) => {
    const messageElement = document.getElementById(messageElementId);
    const messageId = messageElementId.split('-')[1]
    const messageContent = messageElement.children[4];
    const msgOptions = messageElement.children[3];
    const editButton = msgOptions.children[0].children[0];
    const cancelEditButton = msgOptions.children[0].children[1];

    console.log(messageContent)
    savedMessage = messageContent.cloneNode(true)
    // // console.log('saved message:')
    // console.log(savedMessage)
    const inputEditContainer = document.createElement('div');
    const inputEdit = document.createElement('input');
    if (!messageContent.children[0]) {
        inputEdit.type = 'text';
        inputEdit.value = savedMessage.textContent;
        inputEdit.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {
                if (inputEdit.value !== savedMessage.textContent) {
                    handleEditMessage(localStorage.getItem('currentChannel'), messageId, inputEdit.value);
                }
                closeEditMessageForm(messageElementId, true);

            } else if (event.key == 'Escape') {
                closeEditMessageForm(messageElementId, false);
            }
        })
    } else {
        inputEditContainer.appendChild(messageContent.children[0])
        inputEdit.type = 'file';
        inputEdit.addEventListener('input', (event) => {
            fileToDataUrl(inputEdit.files[0])
            .then((imgurl) => {
                return handleEditImage(localStorage.getItem('currentChannel'), messageId, imgurl);
            })
            .then(()=> {
                closeEditMessageForm(messageElementId, true)
            })
            .catch((err) => {
                console.log(err);
            })
        })
    }
    inputEditContainer.appendChild(inputEdit);
    // inputEdit.id = 'edit-message-input';
    inputEditContainer.classList.add('message-content');
    // inputEdit.value = savedMessage.textContent;

    messageElement.replaceChild(inputEditContainer, messageContent)
    editButton.style.display = 'none';
    cancelEditButton.style.display = 'block';
    showingEditForm = [true, messageElementId];
}

const closeEditMessageForm = (messageElementId, confirm) => {
    const messageElement = document.getElementById(messageElementId);
    const msgOptions = messageElement.children[3];
    const editButton = msgOptions.children[0].children[0];
    const cancelEditButton = msgOptions.children[0].children[1];
    const inputEditContainer = messageElement.children[4];
    const inputEdit = inputEditContainer.lastChild;

    // const messageContent = document.createElement('div');
    let messageContent = savedMessage;

    // messageContent.classList.add('message-content');
    if (confirm) {
        // save the edited message
        if (messageContent.children[0]) {
            console.log(messageContent)
            fileToDataUrl(inputEdit.files[0])
            .then((imgurl) => {
                const messageImage = messageContent.children[0];
                messageImage.src = imgurl;
                const oldImageId = messageImage.id;
                const newId =  messageElementId + '-img-' + imgurl;
                messageImage.id = newId;
                // messageContent.children[0].id = messageElementId + '-img-' + imgurl;
                for (const index in localImages) {
                    if (localImages[index] === oldImageId) {
                        localImages[index] = newId; 
                        break;
                    }
                }
                messageImage.addEventListener('click', (event) => {
                    showImageGallery(messageImage.id);
                })
            })
        } else {
            messageContent.textContent = inputEdit.value;
        }
    } else {
        // revert the edited message
        messageContent = savedMessage;
    }
    messageElement.replaceChild(messageContent, inputEditContainer);
    cancelEditButton.style.display = 'none'
    editButton.style.display = 'block'
    // console.log('closing!', messageElement);
    showingEditForm = [false, ''];
}

const handleDeleteMessage = (messageId) => {
    const channelId = localStorage.getItem('currentChannel');
    return fetcher('DELETE', `/message/${channelId}/${messageId}`)
}

const handlePinMessage = (messageId) => {
    const channelId = localStorage.getItem('currentChannel');
    // recentlyUpdatedPins = true;
    return fetcher('POST', `/message/pin/${channelId}/${messageId}`);
};

const handleUnpinMessage = (messageId) => {
    const channelId = localStorage.getItem('currentChannel');
    // recentlyUpdatedPins = true;
    return fetcher('POST', `/message/unpin/${channelId}/${messageId}`);
};

const handleReactMessage = (messageId, reactNumber) => {
    const channelId = localStorage.getItem('currentChannel');
    // const messageId = messageElementId.split('-')[1];
    return fetcher('POST', `/message/react/${channelId}/${messageId}`, {
        react: reactEmojis[reactNumber]
    })
    // let the caller handle errors
}

const handleUnreactMessage = (messageId, reactNumber) => {
    const channelId = localStorage.getItem('currentChannel');
    // const messageId = messageElementId.split('-')[1];
    return fetcher('POST', `/message/unreact/${channelId}/${messageId}`, {
        react: reactEmojis[reactNumber]
    })
    // let the caller handle errors
}

const handleGetPinnedMessages = () => {
    const currentChannel = localStorage.getItem('currentChannel');
    let allPinnedMessages = [];
    recursePinned(currentChannel, 0, allPinnedMessages)
    .then(()=> {
        const pinnedMessages = document.getElementById('pinned-messages');
        let promiseList = [];
        for (const pinnedMessage of allPinnedMessages) {
            promiseList.push(buildMessage(pinnedMessage)
                .then((newMessage) => {
                    newMessage.children[3].children[0].style.display = 'none';
                    newMessage.children[3].children[2].style.display = 'none';
                    newMessage.id = 'pin' + newMessage['id'];
                    pinnedMessages.appendChild(newMessage);
                    return newMessage
                })
            );
        }
        return Promise.all(promiseList);
    })
    .then((builtMessages) => {
        let promiseList = [];
        for (const newMessage of builtMessages) {
            promiseList.push(buildUserInfo(newMessage.value, newMessage, newMessage.children[0], newMessage.children[1]));
        }
        return Promise.all(promiseList);
    })
    .catch((err)=> {
        console.log('there was an error fetching pinned channel messages:' + err);
    })
}

const recursePinned = (channelid, index, allPinnedMessages) => {
    return fetcher('GET', `/message/${channelid}?start=${index}`)
    .then((data)=> {
        return data['messages'];
    })
    .then((messages)=> {
        if (messages.length === 0) {
            console.log(`the end`);
        } else {
            for (const message of messages) {
                if (message['pinned']) {
                    allPinnedMessages.push(message);
                }
            }
            return (recursePinned(channelid, index + messages.length, allPinnedMessages))
        }
    })
}



channelMessages.addEventListener('scroll', (event)=>{
    const scrollableHeight = channelMessages.scrollHeight - channelMessages.clientHeight;
    const scrollTop = -1 * channelMessages.scrollTop;
    const loadingBlock = document.getElementById('message-loading-block');
    // loadingBlock.textContent = 'Loading...';
    if (scrollTop > (scrollableHeight-10) && loadTimeout == false) {
        console.log('LOADING');
        loadingBlock.textContent = 'Loading...';
        loadTimeout = true;
        handleGetMessages(messageIndex, 25)
        .then(()=>{
            loadingBlock.textContent = ' ';
            loadTimeout = false;
            // setTimeout(()=> {
            //     loadTimeout = false;
            // }, 2000)
        })
        .catch(()=>{
            loadingBlock.textContent = ' ';
            loadTimeout = false;
        })
    }
})

export {
    resetChannelMessages,
    handleGetMessages,
    handleGetPinnedMessages,
    resetPinnedMessagesModal,
    reactEmojis,
    messageIndex,
    userNames,
    userIcons,
    userEmails,
    userBios,
    localImages,
    showingEditForm,
    showEditMessageForm,
    closeEditMessageForm,
    handleDeleteMessage,
    handleEditImage,
    handleEditMessage,
    handlePinMessage,
    handleUnpinMessage,
    handleReactMessage,
    handleUnreactMessage

}