const isUserloggedIn = !!window.localStorage.getItem('userToken');
if (!isUserloggedIn) window.location.href = '/';

const userData = JSON.parse(window.localStorage.getItem('userData'));
const userToken = window.localStorage.getItem('userToken');
const $mainContainer = document.getElementById('main-container');

// DOM's Of The Navbar
const accountButton = document.getElementById('account-button');
const signoutButton = document.getElementById('signout-button');
const signoutAllButton = document.getElementById('signout-all-button');
const $accountModal = document.getElementById('account-modal');

// DOM's Of The User Data
const userDataElement = document.getElementById('user-data');
const $userImg = userDataElement.children[0];
const $userDataName = userDataElement.children[1];
const $userDataUsername = userDataElement.children[2];
const $userDataRating = userDataElement.children[3];

// Templates
const accountModalTemplate = document.getElementById('account-modal-template');
const editAccountInfoTemplate = document.getElementById('edit-account-info-template');
const uploadProfilePictureTemplate = document.getElementById('upload-profile-picture-template');

// Functions
const removeModal = () => {
    if ($accountModal.childElementCount === 1) $accountModal.removeChild($accountModal.lastElementChild);
};

const renderUserData = () => {
    $userImg.src = `data:image/png;base64,${userData.profile_picture}`;
    $userDataName.innerText = `${userData.first_name} ${userData.last_name}`;
    $userDataUsername.innerText = `${userData.username}`;
    $userDataRating.innerText = `${userData.rating.wins} - ${userData.rating.losses}`;
};

const renderAccountModal = () => {
    removeModal();
    const accountModal = accountModalTemplate.content.cloneNode(true);
    const exitbutton = accountModal.firstElementChild.children[0];
    const editAccountButton = accountModal.firstElementChild.children[1];
    const uploadProfilePicture = accountModal.firstElementChild.children[2];
    const deleteProfilePicture = accountModal.firstElementChild.children[3];
    const deleteAccountButton = accountModal.firstElementChild.children[4];

    accountModal.firstElementChild.addEventListener('click', (event) => event.stopPropagation());

    exitbutton.addEventListener('click', () => {
        $accountModal.style.display = 'none';
        $mainContainer.style.display = '';
    });

    editAccountButton.addEventListener('click', () => {
        removeModal();
        const editAccountInfo = editAccountInfoTemplate.content.cloneNode(true);
        const form = editAccountInfo.firstElementChild;
        const cancelButton = form.children[1];

        form.addEventListener('click', (event) => event.stopPropagation());

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const form = $accountModal.lastElementChild;
            const first_name = form.firstElementChild.children[0].lastElementChild.value;
            const last_name = form.firstElementChild.children[1].lastElementChild.value;
            const username = form.firstElementChild.children[2].lastElementChild.value;
            const email = form.firstElementChild.children[3].lastElementChild.value;
            const password = form.firstElementChild.children[4].lastElementChild.value;

            const data = { first_name, last_name, username, email, password };
            for (let key in data)
                if (data[key] === '') {
                    delete data[key];
                    continue;
                }

            fetch(`/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify(data),
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error(res);
                })
                .then((data) => {
                    window.localStorage.setItem('userData', JSON.stringify(data.user));
                    alert(data.message);
                    renderAccountModal();
                    removeModal;
                })
                .catch((err) => alert('Something went wrong.'));
        });
        cancelButton.addEventListener('click', renderAccountModal);

        $accountModal.appendChild(editAccountInfo);
    });

    // BUG - Check with Ariye
    uploadProfilePicture.addEventListener('click', () => {
        removeModal();
        const uploadProfilePicture = uploadProfilePictureTemplate.content.cloneNode(true);
        const form = uploadProfilePicture.firstElementChild;
        const cancelButton = form.children[0];

        form.addEventListener('click', (event) => event.stopPropagation());

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const profilePicture = document.getElementById('profile-picture').files[0];
            console.log(profilePicture);
            const formData = new FormData();
            formData.append('profile_picture', profilePicture);
            console.log(formData);

            fetch('/users/me/profile_picture', {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${userToken}` },
                body: formData,
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error(res);
                })
                .then((data) => {
                    window.localStorage.setItem('userData', JSON.stringify(data.user));
                    alert(data.message);
                    renderAccountModal();
                })
                .catch((err) => alert('Something went wrong!'));
        });

        cancelButton.addEventListener('click', renderAccountModal);

        $accountModal.appendChild(uploadProfilePicture);
    });

    deleteProfilePicture.addEventListener('click', () => {
        fetch('/users/me/profile_picture', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error(res);
            })
            .then((data) => {
                window.localStorage.setItem('userData', JSON.stringify(data.user));
                alert(data.message);
            })
            .catch((err) => alert('Something went wrong.'));
    });

    deleteAccountButton.addEventListener('click', () => {
        fetch('/users/me', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error(res.json());
            })
            .then((data) => {
                alert(data.message);
                window.localStorage.clear();
                window.location.href = '/';
            })
            .catch((err) => alert('Something Went Wrong.'));
    });

    $accountModal.appendChild(accountModal);
    $mainContainer.style.display = 'none';
    $accountModal.style.display = '';
};

// Event Listners
accountButton.addEventListener('click', renderAccountModal);

$accountModal.addEventListener('click', () => {
    $accountModal.style.display = 'none';
    $mainContainer.style.display = '';
});

signoutButton.addEventListener('click', () => {
    fetch('/users/me/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
    })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error(res);
        })
        .then((data) => {
            alert(data.message);
            window.localStorage.clear();
            window.location.href = '/';
        })
        .catch((err) => alert('Something went wrong.'));
});

signoutAllButton.addEventListener('click', () => {
    fetch('/users/me/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
    })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error(res);
        })
        .then((data) => {
            alert(data.message);
            window.localStorage.clear();
            window.location.href = '/';
        })
        .catch((err) => alert('Something went wrong.'));
});

// Rendering The Lobby Data
renderUserData();
