const isUserloggedIn = !!window.localStorage.getItem('userToken');
if (isUserloggedIn) window.location.href = './lobby/lobby.html';

const url = window.location.href;

// DOM's
const $loginSignUpContainer = document.getElementById('login-signup-container');
const loginFormTemplate = document.getElementById('login-form-template');
const signUpFormTemplate = document.getElementById('signup-form-template');

// Remove the form of the the login signup container
const removeForm = () => {
    if ($loginSignUpContainer.childElementCount === 3)
        $loginSignUpContainer.removeChild($loginSignUpContainer.lastElementChild);
};

// Render login/sign up form
const renderLoginForm = () => {
    removeForm();

    const loginForm = loginFormTemplate.content.cloneNode(true).firstElementChild;
    const signUpButton = loginForm.children[1];

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = document.getElementById('login-form');
        const email = form.firstElementChild.children[0].lastElementChild.value;
        const password = form.firstElementChild.children[1].lastElementChild.value;

        fetch(`${url}users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error(res.json);
            })
            .then((data) => {
                window.localStorage.setItem('userData', JSON.stringify(data.user));
                window.localStorage.setItem('userToken', `${data.token}`);
                window.location.href = './lobby/lobby.html';
            })
            .catch((err) => alert('Unable to login.'));
    });

    signUpButton.addEventListener('click', () => renderSignUpForm());

    $loginSignUpContainer.appendChild(loginForm);
};

const renderSignUpForm = () => {
    removeForm();
    const signUpForm = signUpFormTemplate.content.cloneNode(true).firstElementChild;
    const cancelButton = signUpForm.children[1];

    signUpForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = document.getElementById('signup-form');
        const firstName = form.firstElementChild.children[0].lastElementChild.value;
        const lastName = form.firstElementChild.children[1].lastElementChild.value;
        const username = form.firstElementChild.children[2].lastElementChild.value;
        const email = form.firstElementChild.children[3].lastElementChild.value;
        const password = form.firstElementChild.children[4].lastElementChild.value;

        fetch(`${url}users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, password }),
        })
            .then((res) => {
                if (res.status === 201) return res.json();
                throw new Error(res);
            })
            .then((data) => {
                window.localStorage.setItem('userData', JSON.stringify(data.user));
                window.localStorage.setItem('userToken', `${data.token}`);
                window.location.href = './lobby/lobby.html';
            })
            .catch((err) => {
                console.log(err);
            });
    });

    cancelButton.addEventListener('click', () => renderLoginForm());

    $loginSignUpContainer.appendChild(signUpForm);
};

// Render login form on startup or go to lobby
renderLoginForm();
