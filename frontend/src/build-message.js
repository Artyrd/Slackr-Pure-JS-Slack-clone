import { fileToDataUrl, fetcher, timeFromIsoString, countReacts} from './helpers.js';
import {showImageGallery} from './image-gallery.js'
console.log('Loading messages.js!');
import {showingEditForm, showEditMessageForm, resetPinnedMessagesModal, reactEmojis, handleGetPinnedMessages, handlePinMessage, handleUnpinMessage, handleDeleteMessage, handleEditImage, handleReactMessage, handleUnreactMessage, handleEditMessage, closeEditMessageForm, localImages, userNames, userIcons, userEmails, userBios} from './message.js';
import {showProfile} from './profile-popup.js';

/**
 * Given a message object, dynmically creates the message DOM element
 * @param {*} message 
 * @returns the newly created message element
 */
const buildMessage = (message) => {
    return new Promise((resolve, reject) => {
        const newMessage = document.getElementById('channel-message-template').cloneNode(true);
        if (!newMessage) {
            reject('Failed to build message element')
        }
        newMessage.id = 'msg-' + message['id'];
        const userid = message['sender'];
        newMessage.value = userid;
        newMessage.children[1].textContent = userid;
        newMessage.children[2].textContent = `${timeFromIsoString(message['sentAt'])}`;
        const messageContent = newMessage.children[4];
        if (message['image']) {
            const messageImage = document.createElement('img');
            if (!messageImage) {
                reject('Failed to build message element')
            }
            messageImage.src = message['image'];
            messageImage.id = newMessage.id + '-img-' + message['image']; 
            messageImage.addEventListener('click', (event) => {
                showImageGallery(messageImage.id);
            })
            messageContent.appendChild(messageImage);
        } else {
            messageContent.textContent = message['message'];
        }
        buildMsgOptions(message, newMessage);
        buildMsgReacts(message, newMessage);
        buildProfileLinks(message, newMessage);
        newMessage.style.display = 'grid';
        resolve(newMessage);
    })
    // return buildUserInfo(userid, newMessage, newMessage.children[0], newMessage.children[1]);
}


/**
 * For a given message and specified message DOM element,
 * attaches the required event listeners to the edit and delete buttons.
 * @param {*} message - the message json given by the backend
 * @param {*} newMessage - the created message DOM element
 */
const buildMsgOptions = (message, newMessage) => {
    const msgOptions = newMessage.children[3];

    const editButton = msgOptions.children[0].children[0];
    const cancelEditButton = msgOptions.children[0].children[1];
    const pinMsgButton = msgOptions.children[1];
    const deleteMsgButton = msgOptions.children[2];
    // only show edit and delete message options if client is the sender
    if (message['sender'] != localStorage.getItem('userid')) {
        editButton.style.display = 'none';
        deleteMsgButton.style.display = 'none';
    }

    editButton.addEventListener('click', (event) => {
        // close the currently shown editform before displaying new one
        if (showingEditForm[0] == true) {
            closeEditMessageForm(showingEditForm[1], false)
        }
        showEditMessageForm(newMessage['id']);
    })
    cancelEditButton.addEventListener('click', (event) => {
        if (showingEditForm[0] == true) {
            closeEditMessageForm(newMessage['id'], false);
        }
    })
    pinMsgButton.value = message['pinned'];
    reRenderPinButton(pinMsgButton);
    // NTS: .value only stores strings
    pinMsgButton.addEventListener('click', (event) => {
        if (pinMsgButton.value === 'true') {
            handleUnpinMessage(message['id'])
            .then(()=>{
                console.log('unpinned message');
                pinMsgButton.value = 'false';
                reRenderPinButton(pinMsgButton);
            })
            .then(() => {
                resetPinnedMessagesModal()
                handleGetPinnedMessages()
            })
        } else {
            handlePinMessage(message['id'])
            .then(() => {
                console.log('pinned message');
                pinMsgButton.value = 'true';
                reRenderPinButton(pinMsgButton);
            })
            .then(() => {
                resetPinnedMessagesModal()
                handleGetPinnedMessages()
            })
        }
    })
    deleteMsgButton.addEventListener('click', (event) => {
        handleDeleteMessage(message['id'])
        .then(() => {
            // if message contained image, remove from gallery
            console.log(newMessage.children[4]);
            const image = newMessage.children[4].children[0];
            if (image) {
                const index = localImages.indexOf(newMessage.children[4].children[0].id);
                if (index > -1) {
                    localImages.splice(index, 1);
                }
            }
        })
        .then(newMessage.parentNode.removeChild(newMessage))
        .catch((err) => {
            console.log('there was an error deleting the msg:', err);
        })
    })
    if (message['edited'] == true) {
        newMessage.children[5].textContent = 'edited';
        newMessage.children[6].textContent = `${timeFromIsoString(message['editedAt'])}`;
    }
}

const reRenderPinButton = (pinButton) => {
    if (pinButton.value === 'true') {
        pinButton.style.filter = "hue-rotate(-90deg)"
        pinButton.title = "Unpin message"
    } else {
        pinButton.style.filter = "hue-rotate(0deg)"
        pinButton.title = "Pin message"
    }
}


/**
 * For a given message and specified message DOM element,
 * displays the current reacts and,
 * attaches the required event listeners to the react buttons.
 * @param {*} message - the message json given by the backend
 * @param {*} newMessage - the created message DOM element
 */
const buildMsgReacts = (message, newMessage) => {
    // const messageElementId = newMessage.id;
    const reactOptionsContainer = newMessage.children[7];
    const addReactButton = reactOptionsContainer.children[0];
    const reactOptions = reactOptionsContainer.children[1];
    const displayedReacts = newMessage.children[8];
    addReactButton.addEventListener('click', (event)=>{
        console.log('click!')
        if (reactOptions.style.display === 'flex') {
            reactOptions.style.display = 'none';
        } else {
            reactOptions.style.display = 'flex';
        }
    })
    let userReacted = {};
    const reactsCount = countReacts(message['reacts'], userReacted, localStorage.getItem('userid'));
    // render the reacts the message currently has
    for (const react in reactsCount) {
        renderReact(displayedReacts, react, reactsCount[react]);
    }
    // attach event listeners to each react button
    for (let index = 0; index < reactOptions.children.length; index++) {
        const reactString = reactEmojis[index];
        const reactButton = reactOptions.children[index];
        if (userReacted[`${reactString}`] === 'reacted') {
            reactButton.style.border = "1px solid #ff71b8";;
        }
        reactButton.value = userReacted[`${reactString}`];
        reactButton.addEventListener('click', (event)=>{
            if (reactButton.value === 'reacted') {
                handleUnreactMessage(message['id'], index)
                .then(() => {
                    reactButton.value = 'unreacted'
                    reactButton.style.border = "0px solid #ff71b8";;
                    reRenderUnreact(displayedReacts, reactString);
                })
            } else {
                handleReactMessage(message['id'], index)
                .then(()=>{
                    reactButton.value = 'reacted'
                    reactButton.style.border = "1px solid #ff71b8";;
                    reRenderReact(displayedReacts, reactString);
                });
            }
            reactOptions.style.display = 'none'
        })
    }
}

const renderReact = (displayedReacts, reactString, reactCount) => {
    const reactEmoji = document.createElement('div');
    reactEmoji.textContent = reactString;
    displayedReacts.appendChild(reactEmoji);
    const reactCountElement = document.createElement('div');
    reactCountElement.style.opacity = 0.60;
    reactCountElement.textContent = reactCount;
    displayedReacts.appendChild(reactCountElement);
}

/**
 * Re-renders the reacts panels on the client side after user reacts
 */
const reRenderReact = (displayedReacts, reactString) => {
    let rendered = false;
    for (const displayedReact of displayedReacts.children) {
        if (displayedReact.textContent === reactString) {
            const count = displayedReact.nextSibling;
            count.textContent = parseInt(count.textContent) + 1;
            rendered = true;
            break;
        }
    }
    if (rendered === false) {
        renderReact(displayedReacts, reactString, 1);
    }
}

/**
 * Re-renders the reacts panels on the client side after user unreacts
 */
const reRenderUnreact = (displayedReacts, reactString) => {
    for (const displayedReact of displayedReacts.children) {
        if (displayedReact.textContent === reactString) {
            const count = displayedReact.nextSibling;
            count.textContent = parseInt(count.textContent) - 1;
            if (parseInt(count.textContent) <= 0) {
                displayedReacts.removeChild(displayedReact);
                displayedReacts.removeChild(count);
            }
            break;
        }
    }
}

/**
 * Finds the name and icon corresponding to a message sender's id,
 * and modifies the given icon and name elements accordingly
 * @param {*} userid - the id of the user we are ifnding the name and icon for
 * @param {*} parentElement - the parent element of the icon and name elements
 * @param {*} iconElement
 * @param {*} nameElement
 */
const buildUserInfo = (userid, parentElement, iconElement, nameElement, emailElement, bioElement) => {
    // message created, now find the name and icon of sender
    return new Promise((resolve, reject) => {
        if (!userNames[`${userid}`]) {
            return fetcher('GET', `/user/${userid}`)
            .then((data)=>{
                //update locally the user's name and image
                userNames[`${userid}`] = data.name;
                userIcons[`${userid}`] = data.image;
                userEmails[`${userid}`] = data.email;
                userBios[`${userid}`] = data.bio;
                console.log("updated:"+ userNames[`${userid}`]);
            })
            .then(() => {
                resolve(parentElement);
            })
            .catch((err)=>{
                console.log(`failed to fetch sender's name: ${err}`);
                reject(err);
            });
        } else {
            console.log("found:"+ userNames[`${userid}`]);
            resolve(parentElement);
        }
    })
    .then(()=> {
        nameElement.textContent = userNames[`${userid}`];
        if (userIcons[`${userid}`]) {
            iconElement.src = userIcons[`${userid}`];
        }
        if (emailElement && userEmails[`${userid}`]) {
            emailElement.textContent = userEmails[`${userid}`];
        }
        if (bioElement && userBios[`${userid}`]) {
            bioElement.textContent = userBios[`${userid}`];
        }
        return parentElement;
    })
    .catch((err) => {
        console.log(`couldn't build message: ${err}`);
    })
};

/**
 * Attaches event listeners to a message element's name and icon,
 * to open the mini profile pop-up
 */
const buildProfileLinks = (message, messageElement) => {
    const iconButton = messageElement.children[0];
    const nameButton = messageElement.children[1];
    iconButton.addEventListener('click', (event)=>{
        showProfile(event, message['sender']);
    });
    nameButton.addEventListener('click', (event)=>{
        showProfile(event, message['sender']);
    });

}


export {
    buildMessage,
    buildUserInfo
}