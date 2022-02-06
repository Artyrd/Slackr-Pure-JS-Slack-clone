import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, fetcher, timeFromIsoString, flashElement} from './helpers.js';
import {resetChannelMessages, handleGetMessages, handleGetPinnedMessages} from './message.js';
import {closeMainProfile} from './profile.js'
import {hideImageGallery} from './image-gallery.js'

console.log('Let\'s gooo!');

const channelsPublicList = document.getElementById('channels-public-list');
const channelsPrivateList = document.getElementById('channels-private-list');
const createPublicChannelButton = document.getElementById('create-public-channel');
const createPrivateChannelButton = document.getElementById('create-private-channel');


/**
 * After login, loads the channels list
 */
export const startApp = () => {
    // fill up the channels list
    console.log('loading app')
    fetcher('GET', `/channel`)
    .then((data) => {
        const channels = data.channels;
        for (let channel of channels) {
            loadChannelsList(channel);
        }
    })
    .catch((err)=>{
        console.log(`There was an error loading the app: ${err}`)
    })
}

/**
 * Renders the given channel object into buttons on the top banner.
 */
const loadChannelsList = (channel) => {
    // convert userid into a primitive for it to work with .includes()
    const userid = parseInt(localStorage.getItem('userid'));
    if (!channel.private) {
        channelsPublicList.insertBefore(createChannelIcon(channel), createPublicChannelButton);
    } else if (channel.members.includes(userid)) {
        channelsPrivateList.insertBefore(createChannelIcon(channel), createPrivateChannelButton);
    }
}

/**
 * Shows the join channel modal page and dynamically renders its content
 */
const showJoinChannelPage = (channelId, channelName) => {
    const joinChannelPage = document.getElementById('join-channel-page');
    const joinChannelMessage = document.getElementById('join-channel-message');
    const joinChannelButton = document.getElementById('join-channel-button');
    joinChannelMessage.textContent = `Join channel '${channelName}'?`;
    // store the channelid inside the join channel button
    joinChannelButton.value = channelId;
    joinChannelPage.style.display = 'flex';
}

/**
 * For a given channel object, resets the current page and renders up the new channel's details.
 * Does not render the new messages!
 * @param {*} channel - an object with a channel's details: name, description, private, createdAt, creator
 */
const showChannelPage = (channel) => {
    resetChannelMessages();
    console.log(channel);
    const channelTitle = document.getElementById('channel-page-title');
    channelTitle.style.display = 'block';
    channelTitle.textContent = channel.name;
    document.getElementById('channel-details-name').textContent = channel.name;
    document.getElementById('channel-details-description').textContent = channel.description;
    document.getElementById('channel-details-privacy').textContent = (channel.private ? 'Private' : 'Public');
    document.getElementById('channel-details-created').textContent = timeFromIsoString(channel.createdAt);
    const creator = document.getElementById('channel-details-creator');
    creator.textContent = channel.creator;
    const channelPage = document.getElementById('channel-page');
    // change creator from id to name
    fetcher('GET', `/user/${channel.creator}`)
    .then((data)=>{
        creator.textContent = data.name;
    })
    .catch((err)=>{
        console.log(`failed to fetch creator's name`);
    })
    channelPage.style.display = 'flex';
}

/**
 * Given a channel object consisting of {id: channelid},
 * Either opens the channel page,
 * or displays the join channel page
 * @param {*} channel, with body: {id : channelid}
 */
const handleGetChannel = (channel) => {
    localStorage.setItem('currentChannel', channel.id);
    //close any other open windows
    closeModals();
    // now fetch Channel details
    fetchChannel(channel);
};

/**
 * Close any open modals in the app
 */
const closeModals = () => {
    closeJoinChannelPage();
    closeChannelSettings();
    closeChannelDetails();
    closePinnedMessages();
    closeInviteModal();
    closeMainProfile();
    hideImageGallery();
}

/**
 * Fetches and calls the necessary functions to render the channel details and its messages.
 * calls the joinChannel page if the user is not a member.
 * @param {*} channel - a channel object
 * @returns a promise from the fetcher helper function
 */
const fetchChannel = (channel) => 
    fetcher('GET', `/channel/${channel.id}`)
    .then((data) => {
        showChannelPage(data);
        handleGetMessages(0, 25);
    })
    .then(()=>{
        console.log('getting pinend messages')
        handleGetPinnedMessages();
    })
    .catch((err)=>{
        console.log(`There was an error fetching channel details: ${err}`)
        // if we implemented everything correctly, the only error would be from not being a member of the channel
        showJoinChannelPage(channel.id, channel.name);
    })

/**
 * creates the channel icon element to be placed into the top banner, allowing users to open / join channels.
 * @param {*} channel 
 * @returns 
 */
const createChannelIcon = (channel) => {
    const channelIcon = document.createElement('button');
    channelIcon.classList.add('channel-list-icon');
    const channelIconText = document.createElement('h3');
    channelIcon.appendChild(channelIconText);
    channelIconText.textContent = channel.name;
    channelIcon.addEventListener('click', () => {
        handleGetChannel(channel);
    })
    return channelIcon;
}

const createChannelModal = document.getElementById('create-channel-modal');
const createChannelNameInput = document.getElementById('input-create-channel-name');
const createChannelDescriptionInput = document.getElementById('input-create-channel-description');
const createChannelPrivateInput = document.getElementById('input-channel-type-private');
const createChannelPublicInput = document.getElementById('input-channel-type-public');
const confirmCreateChannelButton = document.getElementById('confirm-create-channel-button');
const cancelCreateChannelButton = document.getElementById('cancel-create-channel-button');
const createChannelErrorMessage = document.getElementById('create-channel-error-message');

const closeCreateChannelModal = (event) => {
    createChannelModal.style.display = 'none';
    createChannelNameInput.value = '';
    createChannelDescriptionInput.value = '';
    createChannelErrorMessage.textContent = null;
}

/**
 * Sends the create channel modal's input to be posted.
 * Handles frontend error checking.
 */
const handleCreateChannel = () => {
    if (createChannelNameInput.value == '') {
        createChannelErrorMessage.textContent = "Please Enter a Channel Name!";
        flashElement(createChannelErrorMessage);
        return;
    }
    const isPrivate = (createChannelPrivateInput.checked ? true : false);
    let newChannelId = '';
    fetcher('POST',`/channel`, {
        name: createChannelNameInput.value,
        private: isPrivate,
        description: createChannelDescriptionInput.value
    })
    .then((data)=> {
        // console.log(`Channelid is: ${data.channelId}`)
        localStorage.setItem('currentChannel', data.channelId);
        newChannelId = data.channelId;
        // now load the newly created channel's details
        return fetcher('GET', `/channel/${data.channelId}`)
    })
    .then((channelData)=> {
        loadChannelsList({
            id: newChannelId,
            name: channelData.name, 
            members: channelData.members,
            private: isPrivate
        });
        closeCreateChannelModal();
    })
    .then(()=>{
        handleGetChannel({id: newChannelId});
    })
    .catch((err)=>{
        console.log(`There was an error in creating channel: ${err}`)
        createChannelErrorMessage.textContent = `There was an error in creating channel: ${err}`;
        flashElement(createChannelErrorMessage);
    })
}

/**
 * Makes the required post to the backend for the user to join the currently selected channel.
 * Automatically closes the join channel modal on success.
 */
const handleJoinChannel = (event) => {
    const channelId = document.getElementById('join-channel-button').value;
    fetcher('POST', `/channel/${channelId}/join`)
    .then((data) => {
        console.log('joined!');
        console.log(data);
        document.getElementById('join-channel-page').style.display = 'none';
    })
    .then(()=> {
        handleGetChannel({id: channelId});
    })
    .catch((err)=>{
        console.log('Error joining channel: ' + err)
        const errorMessage = document.getElementById('join-channel-error-message');
        errorMessage.textContent = `There was an error joining the channel: ${err}`;
        flashElement(errorMessage);
    })
}

createPublicChannelButton.addEventListener('click', (event) => {
    createChannelPublicInput.checked = true;
    createChannelModal.style.display = 'flex';
})

createPrivateChannelButton.addEventListener('click', (event) => {
    createChannelPrivateInput.checked = true;
    createChannelModal.style.display = 'flex';
})

cancelCreateChannelButton.addEventListener('click', closeCreateChannelModal);

confirmCreateChannelButton.addEventListener('click', handleCreateChannel)

const closeJoinChannelPage = () => {
    document.getElementById('join-channel-page').style.display = 'none';
    document.getElementById('join-channel-error-message').textContent = '';
}

const cancelJoinChannelButton = document.getElementById('cancel-join-channel-button');
cancelJoinChannelButton.addEventListener('click', closeJoinChannelPage)

const joinChannelButton = document.getElementById('join-channel-button');
joinChannelButton.addEventListener('click', (event) => {
    handleJoinChannel(event);
})

const pinnedMsgChannelButton = document.getElementById('pinned-messages-channel-button');
const pinnedMsgModal = document.getElementById('channel-pinned-messages-modal')
pinnedMsgChannelButton.addEventListener('click', (event)=> {
    if (pinnedMsgModal.style.display === 'flex') {
        pinnedMsgModal.style.display = 'none';
    } else {
        pinnedMsgModal.style.display = 'flex';
    }
})

const closePinnedMessages = () => {
    pinnedMsgModal.style.display = 'none';
}



const channelDetailsModal = document.getElementById('channel-details-modal');
const infoChannelButton = document.getElementById('info-channel-button');
const closeInfoChannelButton = document.getElementById('channel-info-close-button');
closeInfoChannelButton.style.display = 'none';

const openChannelDetails = () => {
    closeChannelSettings();
    channelDetailsModal.style.display = 'flex';
    closeInfoChannelButton.style.display = 'block';
    infoChannelButton.style.display = 'none';
};

const closeChannelDetails = () => {
    channelDetailsModal.style.display = 'none';
    infoChannelButton.style.display = 'block';
    closeInfoChannelButton.style.display = 'none';
    document.getElementById('edit-channel-error-message').textContent = '';
};

infoChannelButton.addEventListener('click', openChannelDetails)
closeInfoChannelButton.addEventListener('click', closeChannelDetails)

const channelSettingsModal = document.getElementById('channel-settings-modal');

const openChannelSettings = () => {
    channelSettingsModal.style.display = 'flex';
    showEditChannelFields();
};

const closeChannelSettings = () => {
    document.getElementById('edit-channel-form').style.display = 'none';
    channelSettingsModal.style.display = 'none';
};

const settingsChannelButton = document.getElementById('settings-channel-button');
settingsChannelButton.addEventListener('click', (event) => {
    closeChannelDetails();
    if (!(channelSettingsModal.style.display == 'flex')) {
        openChannelSettings();   
    } else {
        closeChannelSettings();
    }
})

/**
 * If the user is the channel's creator, display the edit channel form
 */
const showEditChannelFields = () => {
    const userid = localStorage.getItem('userid');
    const currentChannel = localStorage.getItem('currentChannel');
    fetcher('GET', `/channel/${currentChannel}`)
    .then((data) => {
        console.log(data.creator)
        console.log(userid)
        if (data.creator == userid) {
            document.getElementById('edit-channel-form').style.display = 'flex'
            document.getElementById('input-channel-settings-name').value = data.name;
            document.getElementById('input-channel-settings-description').value = data.description;
        }
    })
    .catch((err)=> {
        console.log(`There was an error loading channel details for editing: ${err}`);
    })
};

const handleEditChannel = () => {
    const channelId = localStorage.getItem('currentChannel');
    fetcher('PUT', `/channel/${channelId}`, {
        name: document.getElementById('input-channel-settings-name').value,
        description: document.getElementById('input-channel-settings-description').value
    })
    .then((responseData)=> {
        console.log('successfully edited channel');
        handleGetChannel({id: channelId});
    })
    .catch((err)=>{
        const errorMessage = document.getElementById('edit-channel-error-message');
        errorMessage.textContent = err;
        flashElement(errorMessage);
        console.log('there was an error editing the channel' + err);
    })
}

const confirmEditChannelButton = document.getElementById('button-confirm-edit-channel');
const cancelEditChannelButton = document.getElementById('button-cancel-edit-channel');
confirmEditChannelButton.addEventListener('click', handleEditChannel)
cancelEditChannelButton.addEventListener('click', (event)=> {
    closeChannelSettings();
})

const handleLeaveChannel = () => {
    const channelId = localStorage.getItem('currentChannel');
    console.log(`channelId: ${channelId}`)
    fetcher('POST', `/channel/${channelId}/leave`)
    .then((data) => {
        console.log(`left channel ${channelId}`);
        localStorage.removeItem('currentChannel');
        location.reload();
    })
    .catch((err) => {
        console.log(err);
    })
}
const leaveChannelButton = document.getElementById('leave-channel-button');
leaveChannelButton.addEventListener('click', handleLeaveChannel);



const channelInviteModal = document.getElementById('channel-invite-modal');
/**
 * Loads the available users that may be invited to the channel into the invite modal
 */
const handleGetInviteList = () =>
    fetcher('GET', `/user`)
    .then((data) => {
        return data['users']
    })
    .then((allUsersList) => {
        const channelid = localStorage.getItem('currentChannel');
        return fetcher('GET', `/channel/${channelid}`)
        .then((channelData) => {
            return channelData['members'];
        })
        .then((members) => {
            console.log(members);
            console.log(allUsersList)
            const inviteableUsers = allUsersList.filter(user => !(members.includes(user.id)))
            console.log(inviteableUsers);
            return inviteableUsers;
        })
    })
    .then((usersList) => {
        let promiseList = [];
        for (const user of usersList) {
            promiseList.push(fetcher('GET', `/user/${user.id}`)
                .then((userData) => {
                    userData['id'] = user.id;
                    return userData;
                })
                .catch((err)=> {
                    console.log(`failed to fetch data for user ${user.id}: ${err}`);
                })
            )
        }
        return Promise.all(promiseList);
    })
    .then((usersDataList) => {
        let sortedUsers = usersDataList.sort(function(a, b) {
            let keyA = a['name'];
            let keyB = b['name'];
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });
        return sortedUsers;
    })


/**
 * Creates the DOM element to invite a user to a channel.
 * Also appends it to the given inviteUsersList
 * @param {*} user - an object with user's icon, name, and id
 * @param {*} channelid - the channel id the user is being invited to
 * @param {*} inviteUsersList - the element the invites are being appended to
 */
const renderUserInvite = (user, channelid, inviteUsersList) => {
    console.log(user);
    const inviteElement = document.getElementById('invite-user-template').cloneNode('true');
    const userid = user['id'];
    inviteElement.id = 'invite' + userid;
    const inviteUserIcon = inviteElement.children[0];
    const inviteUserName = inviteElement.children[1];
    const inviteUserButton = inviteElement.children[2];
    if (user['image'] !== null) {
        inviteUserIcon.src = user['image'];
    }
    inviteUserName.textContent = user['name'];
    // inviteUserButton.value = user['id'];
    inviteUserButton.title = `invite ${user['name']}`;
    inviteUserButton.addEventListener('click', (event) => {
        fetcher('POST', `/channel/${channelid}/invite`, {
            'userId': userid
        })
        .then(() => {
            inviteElement.parentNode.removeChild(inviteElement);
        })
        .then(()=> {
            const successMsg = document.getElementById('invite-success-message');
            const errorMsg = document.getElementById('invite-error-message');
            errorMsg.textContent = '';
            successMsg.textContent = `Successfully invited ${inviteUserName.textContent}!`;
            flashElement(successMsg);
        })
        .catch((err) => {
            console.log(`there was an error inviting ${userid}: ${err}`)
            const successMsg = document.getElementById('invite-success-message');
            const errorMsg = document.getElementById('invite-error-message');
            successMsg.textContent = ``;
            errorMsg.textContent = `There was an error inviting ${inviteUserName.textContent}: ${err}`;
            flashElement(errorMsg);

        })
    })
    inviteUsersList.appendChild(inviteElement);
}

/**
 * Dispalys the modal to invite other users to the channel.
 * Fetches and dynamically renders users whom may be invited.
 */
const openInviteModal = () => {
    const loadingText = document.getElementById('invite-loading-text');
    const inviteUsersList = document.getElementById('invite-users-list');
    const channelid = localStorage.getItem('currentChannel');
    loadingText.style.display = 'block'
    loadingText.textContent = 'Loading Users List'
    channelInviteModal.style.display = 'flex';
    handleGetInviteList()
    .then((usersList)=>{
        for (const user of usersList) {
            renderUserInvite(user, channelid, inviteUsersList);
        }
        loadingText.style.display = 'none';
    })
    .catch((err) => {
        loadingText.textContent = 'There was an error loading the inviteable users :('
    })
};

/**
 * Closes the invite modal and clears the user invite list.
 */
const closeInviteModal = () => {
    channelInviteModal.style.display = 'none';
    const inviteUsersList = document.getElementById('invite-users-list');
    while (inviteUsersList.hasChildNodes()) {
        inviteUsersList.removeChild(inviteUsersList.lastChild);
    }
}

// const confirmInviteButton = document.getElementById('confirm-invite-button');
// confirmInviteButton.addEventListener('click', (event) => {
//     console.log('invite sent!')
//     closeInviteModal();
// })

const cancelInviteButton = document.getElementById('cancel-invite-button');
cancelInviteButton.addEventListener('click', (event) => {
    console.log('invite cancelled!!')
    closeInviteModal();
})

const inviteChannelButton = document.getElementById('channel-invite-button');
inviteChannelButton.addEventListener('click', () => {
    console.log('click!')
    closeChannelSettings();
    openInviteModal();
})



// go to user's previous channel since login if they have not logged out
// e.g. Refresh or closed the browser window.
const currentChannel = localStorage.getItem('currentChannel');
if (currentChannel != null) {
    handleGetChannel({id: currentChannel});
}


export {
    fetchChannel
}