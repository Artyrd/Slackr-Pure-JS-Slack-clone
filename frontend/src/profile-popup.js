import { fileToDataUrl, fetcher, timeFromIsoString, countReacts} from './helpers.js';
import {showImageGallery} from './image-gallery.js'
import { buildUserInfo } from './build-message.js';


/**
 * Creates the profile-popup for the selected user at the mouse location
 */
const showProfile = (event, userid) => {
    // close any open profiles first + remove eventlistners
    docCloseProfilePopup(event);
    const channelContainer = document.getElementById('channel-container');
    console.log('userid of profile: ' + userid);
    console.log(event);
    const profilePopup = document.getElementById('profile-modal-template').cloneNode(true);
    profilePopup.id = `profile-popup`;
    profilePopup.style.left = event.pageX +'px';
    profilePopup.style.top = event.pageY + 'px';
    profilePopup.style.display = 'grid';
    channelContainer.appendChild(profilePopup);
    const closeButton = profilePopup.children[4];
    // stop event from triggering the following events
    event.stopPropagation();
    closeButton.addEventListener('click', closeProfilePopup);
    document.addEventListener('click', docCloseProfilePopup)
    buildUserInfo(userid, profilePopup, profilePopup.children[0], profilePopup.children[1], profilePopup.children[2], profilePopup.children[3]);
}

/**
 * An event listener that closes the current profile popup if the user
 * clicks outside of the element
 * @param {} event 
 * @returns 
 */
const docCloseProfilePopup = (event) => {
    const profilePopup = document.getElementById('profile-popup');
    if (!profilePopup) return;
    const clickedOutside = !(profilePopup.contains(event.target));
    if (clickedOutside) {
        console.log('clicked outside!')
        closeProfilePopup();
        document.removeEventListener('click', docCloseProfilePopup);
    }
}

const closeProfilePopup = () => {
    const profilePopup = document.getElementById('profile-popup');
    if (!profilePopup) return;
    profilePopup.parentNode.removeChild(profilePopup);
}

export {
    showProfile

}