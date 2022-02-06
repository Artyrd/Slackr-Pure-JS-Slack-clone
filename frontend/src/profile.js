// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, fetcher, timeFromIsoString, countReacts, flashElement} from './helpers.js';

import {userNames} from './message.js'
import {fetchChannel} from './channel.js'

const mainProfileModal = document.getElementById('main-profile-modal');
const mainProfileButton = document.getElementById('main-profile-button');
const editMainProfileButton = document.getElementById('edit-profile-button');
const closeMainProfileButton = document.getElementById('close-profile-button');

const profileImage = document.getElementById('main-profile-image');
const profileImageInput = document.getElementById('input-main-profile-image');
const nameInput = document.getElementById('input-main-profile-name');
const emailInput = document.getElementById('input-main-profile-email');
const passwordInput = document.getElementById('input-main-profile-password');
const bioInput = document.getElementById('input-main-profile-bio');

const profileErrorMsg = document.getElementById('profile-error-message');
const profileSuccessMsg = document.getElementById('profile-success-message');
let initialEmail = '';
// let updatedProfile = false;

mainProfileButton.addEventListener('click', (event) => {
    if (mainProfileModal.style.display === 'flex') {
        console.log('flag1')
        closeMainProfile();
    } else {
        console.log('flag2')
        openMainProfile();
    }
})
const openMainProfile = () => {
    fillMainProfile();
    mainProfileModal.style.display = 'flex';
}

/**
 * Closes the main profile modal.
 * Updates previously visited channel
 * if user has edited their profile
 */
const closeMainProfile = () => {
    mainProfileModal.style.display = 'none';
    profileErrorMsg.style.display = 'none';
    profileSuccessMsg.style.display = 'none';
    profileImageInput.value = '';
    document.getElementById('main-profile-image-input-message').textContent = '';
}

closeMainProfileButton.addEventListener('click', closeMainProfile);

const handleEditProfile = () => {
    // signal that we changed our profile
    userNames[`${localStorage.getItem('userid')}`] = undefined;
    // let imageUpload = '';
    let bodyEmail = '';
    if (initialEmail !== emailInput.value) {
        bodyEmail = emailInput.value;
    }
    let bodyBio = bioInput.value;
    // if user decides to wipe their bio, this is the only way it will stick
    // without the backend thinking we arent changing the bio.
    if (!bodyBio) {
        bodyBio = ' ';
    }
    return new Promise((resolve, reject) => {
        if (profileImageInput.value) {
            fileToDataUrl(profileImageInput.files[0])
            .then((url) => {
                resolve(url);
            })
            .catch((err) => {
                reject(err);
            })
        } else {
            resolve('');
        }
    })
    .then((imageurl) => {
        return fetcher('PUT', `/user`, {
            "email": bodyEmail,
            "password": passwordInput.value,
            "name": nameInput.value,
            "bio": bodyBio,
            "image": imageurl
        })
    })
    .then(()=> {
        document.getElementById('main-profile-image-input-message').textContent = '';
        profileErrorMsg.style.display = 'none';
        profileSuccessMsg.style.display = 'block';
        flashElement(profileSuccessMsg);
        // updatedProfile = true;
        const currentChannelId = localStorage.getItem('currentChannel');
        // if user was in a channel, update it
        if (currentChannelId) {
            fetchChannel({id: localStorage.getItem('currentChannel')})
        }
    })
    .catch((err) => {
        console.log(err);
        profileSuccessMsg.display = 'none';
        profileErrorMsg.textContent = err;
        profileErrorMsg.style.display = 'block';
        flashElement(profileErrorMsg);
    })
}

/**
 * Updates the main profile image display after the user uploads a new one.
 * Does not submit to the backend yet, it allows the user to visually see waht it looks like
 */
const updateImageDisplay = () => {
    const helperMessage = document.getElementById('main-profile-image-input-message');
    if (!profileImageInput.value) {
        return;
    }
    return new Promise((resolve, reject) => {
        fileToDataUrl(profileImageInput.files[0])
        .then((url) => {
            profileImage.src = url;
            resolve();
        })
        .catch((err) => {
            reject(err);
        })
    })
    .then(() => {
        helperMessage.textContent = 'Press Edit to confirm changes! ';
        helperMessage.classList.remove('error-message');
        helperMessage.classList.add('success-message');
    })
    .catch((err) => {
        helperMessage.textContent = err;
        helperMessage.classList.remove('success-message');
        helperMessage.classList.add('error-message');
    })
}

editMainProfileButton.addEventListener('click', handleEditProfile)

profileImageInput.addEventListener('change', updateImageDisplay);

const showPasswordButton = document.getElementById('input-main-profile-show-password');
showPasswordButton.addEventListener('click', (event) => {
    if (showPasswordButton.checked) {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
})

/**
 * Prefills the main profile with the user's current details,
 * so that it is ready for editing
 */
const fillMainProfile = () => {
    const userid = localStorage.getItem('userid')
    fetcher('GET', `/user/${userid}`)
    .then((userData)=> {
        if (userData['image']) {
            profileImage.src = userData['image'];
        }
        nameInput.value = userData['name'];
        emailInput.value = initialEmail = userData['email'];
        bioInput.value = userData['bio'];
        passwordInput.value = localStorage.getItem('last-password');
    })
}

export {
    closeMainProfile
}