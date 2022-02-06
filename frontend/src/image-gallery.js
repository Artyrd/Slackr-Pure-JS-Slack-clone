/* Methods relating to the image gallery displayed upon clicking on an image thumbnail within a channel */

import {messageIndex, localImages, handleGetMessages} from './message.js';

const imageGallery = document.getElementById('image-gallery-modal')

const showImageGallery = (messageImageId) => {
    const imgurl = messageImageId.split('-img-')[1];
    const displayedImage = document.getElementById('displayed-gallery-image');
    displayedImage.src = imgurl;
    displayedImage.value = messageImageId;
    // document.getElementById('image-gallery-modal').style.display = 'block';
    imageGallery.style.display = 'block'

}
const hideImageGallery = () => {
    document.getElementById('image-gallery-modal').style.display = 'none';
}

const closeGalleryButton = document.getElementById('button-close-image-gallery');
closeGalleryButton.addEventListener('click', hideImageGallery)


/**
 * Digs through the locally stored images for the 
 * index of the currently displayed image
 * @returns the index of the current displayed image, undefined if couldnt be found
 */
const findCurrentGalleryImageIndex = () => {
    const displayedImage = document.getElementById('displayed-gallery-image');
    const imageId = displayedImage.value;
    for (const index in localImages) {
        if (localImages[index] === imageId) {
            console.log('index is: ', index)
            return index;
        }
    }
    return undefined;
}

/**
 * Renders the next recent image on the channel
 */
const renderNextGalleryImage = () => {
    const index = findCurrentGalleryImageIndex();
    console.log('flag1')
    if ((parseInt(index) - 1) >= 0) {
        const displayedImage = document.getElementById('displayed-gallery-image');
        const imageId = localImages[parseInt(index) - 1];
        displayedImage.src = imageId.split('-img-')[1];
        displayedImage.value = imageId;
    } else {
        console.log('f')
    }
}
/**
 * Rengers the next oldest image on the channel.
 * Fetches addtional messages/ images when at the oldest of the currently loaded
 */
const renderPrevGalleryImage = () => {
    const index = findCurrentGalleryImageIndex();
    console.log('flag2')
    console.log(localImages.length)
    if ((parseInt(index) + 1) < localImages.length) {
        const displayedImage = document.getElementById('displayed-gallery-image');
        const imageId = localImages[parseInt(index) + 1];
        displayedImage.src = imageId.split('-img-')[1];
        displayedImage.value = imageId;
    } else {
        console.log('f');
        const oldMsgIndex = messageIndex;
        handleGetMessages(messageIndex, 25)
        .then(() => {
            console.log('loading again')
            // load more messages and try again
            if (oldMsgIndex < messageIndex) {
                console.log('rendering again')
            // if (oldMsgIndex < messageIndex && oldImgLength === localImages.length) {
                renderPrevGalleryImage()
            } else {
                console.log('reached the end of messages')
            }

        });
    }
}

const nextImageButton = document.getElementById('next-image-button');
const prevImageButton = document.getElementById('prev-image-button');
nextImageButton.addEventListener('click', renderNextGalleryImage);
prevImageButton.addEventListener('click', renderPrevGalleryImage);

export {
    showImageGallery,
    hideImageGallery
}