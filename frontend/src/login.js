import {startApp} from './channel.js';
import { fetcher, flashElement } from './helpers.js';
console.log('login.js loaded');

let loginFlag = true;

const loginButton = document.getElementById('index-primary-button');
const logoutButton = document.getElementById('index-logout-button');
const registerButton = document.getElementById('index-secondary-button');
const errorModal = document.getElementById('index-error-modal');
const errorMessage = document.getElementById('error-modal-message');

const currentToken = localStorage.getItem('token');
const currentUserid = localStorage.getItem('userid');

const setLoginSession = (data) => {
    console.log('setting token:');
    console.log(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("userid", data.userId);
}

const enterMainApp = () => {
    console.log('inside main app!');
    console.log('login token is:');
    console.log(localStorage.getItem('token'));
    document.getElementById('main-profile-button').style.display = 'block';
    document.getElementById('index-logout-button').style.display = 'block';
    document.getElementById('login-window-container').style.display = 'none';
    document.getElementById('app-container').style.visibility = 'visible';
    startApp();
}

/**
 * automatically login the user if they still have a token
 */
if (currentToken != null && currentUserid != null) {
    enterMainApp({token: currentToken, userid: currentUserid});
} else {
    document.getElementById('login-window-container').style.display = 'flex';
}


const handleLogin = (event) => {
    const email = document.getElementById('input-login-email').value;
    const password = document.getElementById('input-login-password').value;
    localStorage.setItem("last-password", password);
    if (email === '' || password === '') {
        errorMessage.textContent = `Please fill out the missing login fields`;
        errorModal.style.visibility = 'visible';
        flashElement(errorMessage);
        return;
    }
    fetcher('POST', '/auth/login', {email: email, password: password})
    .then((data)=> {
        setLoginSession(data);
        enterMainApp();
    })
    .catch((err) => {
        console.log(`there was an error logging in: ${err}`);
        errorMessage.textContent = `${err}`;
        errorModal.style.visibility = 'visible';
        flashElement(errorMessage);
    })
}

const handleRegister = (event) => {
    const name = document.getElementById('input-register-name').value;
    const email = document.getElementById('input-login-email').value;
    const password = document.getElementById('input-login-password').value;
    const confirmPassword = document.getElementById('input-confirm-password').value;
    if (password !== confirmPassword) {
        errorMessage.textContent = `Error: passwords don't match!`;
        errorModal.style.visibility = 'visible';
        flashElement(errorMessage);
        return;
    }
    if (name === '' || email === '' || password === '') {
        errorMessage.textContent = `Please fill out the missing registration fields`;
        errorModal.style.visibility = 'visible';
        flashElement(errorMessage);
        return;
    }
    fetcher('POST', `/auth/register`, {
        email: email,
        password: password,
        name: name
    })
    .then((data) => {
        setTokens(data);
        enterMainApp();
    })
    .catch((err) => {
        errorMessage.textContent = `${err}`;
        errorModal.style.visibility = 'visible';
        flashElement(errorMessage);
    })
}


const handleLoginRegister = (event) => {
    if (loginFlag) {
        handleLogin(event);
    } else {
        handleRegister(event);
    }
}


const handleLogout = (event) => {
    console.log('inside handle logout');
    console.log('token is:');
    console.log(localStorage.getItem('token'));
    fetcher('POST', `/auth/logout`)
    .catch((err) => {
        console.log(`there was an error logging out: ${err}`);
    })
    // no matter the response, remove tokens and reload
    .then(()=> {
        localStorage.removeItem('token');
        localStorage.removeItem('userid');
        localStorage.removeItem('currentChannel');
        location.reload();
    })
}


loginButton.addEventListener('click', handleLoginRegister);

logoutButton.addEventListener('click', handleLogout);

const closeErrorButton = document.getElementById('index-button-close-error');
closeErrorButton.addEventListener('click', (event) => {
    console.log('click!');
    errorModal.style.visibility = 'hidden';
})

registerButton.addEventListener('click', (event) => {
    console.log('click!');
    loginFlag = !loginFlag;
    // swap layout from register->login
    if (loginFlag) {
        document.getElementById('register-field-name').style.display = 'none';
        document.getElementById('register-field-confirm-password').style.display = 'none';
        document.getElementById('index-primary-button-text').textContent = 'LOGIN';
        document.getElementById('index-secondary-button-text').textContent = 'Register!';
        document.getElementById('index-secondary-text').textContent = "Don't have an account?"
    // swap layout from login->register
    } else {
        document.getElementById('register-field-name').style.display = 'block';
        document.getElementById('register-field-confirm-password').style.display = 'block';
        document.getElementById('index-primary-button-text').textContent = 'REGISTER';
        document.getElementById('index-secondary-button-text').textContent = 'Login!';
        document.getElementById('index-secondary-text').textContent = 'Already have an account?'

    }
})