const socket = io();
let playerData = {
    username: userData.username,
    rating: userData.rating,
};

// DOM's Of The Player List
const $playersList = document.getElementById('players-sidebar').children[2];

// DOM's Of The Chat
const $chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const $messageInput = messageForm.firstElementChild;
const $sendMessageButton = messageForm.children[1];

// DOM'S of game invitations
const $invits = document.getElementById('invitations');

// Templates
const playersListTemplate = document.getElementById('players-list-template');
const messageTemplate = document.getElementById('message-template').innerHTML;
const gameInvitesTemplate = document.getElementById('game-invitations-template').innerHTML;

// Functions
const autoscroll = () => {
    const $newMessage = $chatMessages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $chatMessages.offsetHeight;

    const containerHeight = $chatMessages.scrollHeight;

    const scrollOffset = $chatMessages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) $chatMessages.scrollTop = $chatMessages.scrollHeight;
};

// Adding the user to the list of players in the lobby
socket.emit('joinLobby', playerData, (player) => {
    playerData = { ...player };
    window.localStorage.setItem('playerData', JSON.stringify(playerData));
    console.log(`${player.username} joined the lobby.`);
});

// Updating the playerList
socket.on('playerList', (players) => {
    players = players.filter((player) => player.id !== socket.id);

    const html = Mustache.render(playersListTemplate.innerHTML, {
        players,
    });

    $playersList.innerHTML = html;
});

// Sending messages to all the users in the lobby
messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    $sendMessageButton.disabled = true;

    const message = $messageInput.value;
    socket.emit('sendMessage', message, (error) => {
        $sendMessageButton.disabled = false;
        $messageInput.value = '';
        $messageInput.focus();
        if (error) return console.log(error);
        console.log('The message was delivered!');
    });
});

// Updaing the chat
socket.on('message', ({ username, text: message, createdAt }) => {
    const html = Mustache.render(messageTemplate, {
        username,
        message,
        createdAt: moment(createdAt).format('HH:mm'),
    });
    $chatMessages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// Sending an invite and replying
const invite = (event) => {
    const sender = playerData;

    const path = event.path || event.composedPath();
    const reciver = {
        id: path[1].children[0].innerText,
        username: path[1].children[1].innerText,
        rating: {
            wins: parseInt(path[1].children[2].innerText),
            losses: parseInt(path[1].children[3].innerText),
        },
    };

    socket.emit('sendInvite', { sender, reciver }, () => console.log('Your Invite was sent!'));
};

const reply = (event) => {
    const reply = event.target.id;

    if (reply === 'declineInvite') {
        $invits.removeChild(event.target.parentNode.parentNode);
    } else {
        const path = event.path || event.composedPath();
        const player1 = playerData;
        const player2 = {
            username: path[2].children[1].children[0].innerText,
            id: path[2].children[1].children[1].innerText,
            rating: {
                wins: parseInt(path[2].children[1].children[2].innerText),
                losses: parseInt(path[2].children[1].children[3].innerText),
            },
        };
        socket.emit('inviteReply', { player1, player2 }, () => console.log('Your reply was sent!'));
    }
};

document.addEventListener('click', (event) => {
    if (event.target.id === 'invite-to-play') invite(event);
    if (event.target.id === 'declineInvite' || event.target.id === 'acceptInvite') reply(event);
});

// Reciving an invite
socket.on('reciveInvite', ({ username, id, rating: { wins, losses } }) => {
    const html = Mustache.render(gameInvitesTemplate, {
        username,
        id,
        wins,
        losses,
    });
    $invits.insertAdjacentHTML('beforeend', html);
});

// Redirecting to game
socket.on('redirectToGame', (data) => {
    console.log('You are being redirected to the game!');
    window.location.href = `/game/game.html?${Qs.stringify(data)}`;
});
