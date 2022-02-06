import { BACKEND_PORT } from './config.js';

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    console.log(file);
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

/**
 * wrappper around fetch function to contact the backend api,
 * automatically takes the token from localstorage.
 * based off of 6080 week 5 helper lecture code
 * @param {String} method 
 * @param {String} path 
 * @param {Object} body 
 */
export const fetcher = (method, path, body) => {
    console.log('inside fetcher')
    const request = {
        method: method,
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token') 
        },
        body: JSON.stringify(body)
    };
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:${BACKEND_PORT}${path}`, request)
        .then((response) => {
            if (response.status == 200) {
                response.json().then((data) => {
                    resolve(data);
                });
            } else {
                response.json().then((errJson) => {
                    console.log(`Error ${response.status}: ${errJson.error}`);
                    // reject(`Error ${response.status}: ${errJson.error}`);
                    reject(`${errJson.error}`);
                })
            }
        })
        .catch((err)=>{
            console.log(`There was an fetching from the api: ${err}`)
            reject(err);
        })
    })
}

/**
 * Converts a UTC isostring to a human-frindly local time
 * @param {STRING} isoString 
 * @returns a readable string of the time given converted to local time
 */
export const timeFromIsoString = (isoString) => {
    // 14:39:07 GMT-0600 (PDT)
    const localTimeDate = new Date(isoString);
    // 14:39:07
    const timeString = localTimeDate.toLocaleTimeString([],{ hour: 'numeric', hour12: true , minute: '2-digit' });
    // const timeString = localTimeDate.toTimeString().split(' ')[0];
    // // [14, 39, 07]
    // let time = timeString.split(':');
    // console.log('TIME IS')
    // console.log(time)
    // let period = 'am';
    // if (parseInt(time[0]) > 12) {
    //     time[0] = toString(parseInt(time[0]) - 12);
    //     period = 'pm';
    // }
    // if (time[0][0] == '0') {
    //     time[0] = time[0].slice(1);
    // }
    const date = localTimeDate.toDateString();
    
    return timeString + ', ' + date;
}

/**
 * Counts the unique reacts of a given message's reacts array of objects.
 * Also modifies the userReacted array to if the given user of userid has
 * reacted with any of the reacts
 * @param {Array} messageReacts 
 * @param {Array} userReacted 
 * @param {Number} userid 
 * @returns 
 */
export const countReacts = (messageReacts, userReacted, userid) => {
    let count = {};
    for (const messageReact of messageReacts) {
        // console.log('loopin the third')
        const reactString = messageReact['react'];
        if (count[`${reactString}`]) {
            count[`${reactString}`] ++;
        } else {
            count[`${reactString}`] = 1;
        }
        if (parseInt(userid) === parseInt(messageReact['user'])) {
            // console.log(`user has reacted to ${reactString}`)
            userReacted[`${reactString}`] = 'reacted';
        }
    }
    return count;
}

export const flashElement = (element) => {
    const oldFilter = element.style.filter;
    element.style.filter = "brightness(200%)"
    setTimeout(()=> {element.style.filter = oldFilter}, 150);
}