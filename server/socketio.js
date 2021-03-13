const socketio = require('socket.io');
const Filter = require('bad-words');
const generateMessage = require('./utils/messages');
const {
    addPlayerToLobby,
    removePlayerFromLobby,
    addPlayerToPlayersInGameSession,
    removePlayerFromGameSessions,
    updatePlayerInGameSessionList,
    getPlayerFromPlayersInLobbyList,
    getPlayerFromGameSessionList,
    getPlayersInLobbyList,
    getPlayersInGameSessionList,
} = require('./utils/players');
const chalk = require('chalk');

const initiateSocketio = (server) => {
    const io = socketio(server);

    io.on('connection', (socket) => {
        socket.on('joinLobby', (user, callback) => {
            socket.join('lobby');
            console.log(chalk.blue('A user joined the lobby.'));
            const player = addPlayerToLobby({ id: socket.id, ...user, room: 'lobby' });
            callback(player);

            socket.broadcast.emit('message', generateMessage('Checkers App', `${user.username} joined!`));

            io.emit('playerList', getPlayersInLobbyList());

            socket.on('sendMessage', (message, callback) => {
                const filter = new Filter();
                if (filter.isProfane(message)) return callback(generateMessage('Profanity is not allowed!'));

                io.emit('message', generateMessage(user.username, message));
                callback();
            });

            socket.on('sendInvite', ({ sender, reciver }, callback) => {
                io.to(reciver.id).emit('reciveInvite', sender);
                callback();
            });

            socket.on('inviteReply', ({ player1, player2 }, callback) => {
                const randomNumber = () => {
                    return Math.floor(Math.random() * Math.floor(1)) === 1;
                };

                callback();
                const isWhite = randomNumber ? player1.username : player2.username;
                const room = `${player1.id}-${player2.id}`;

                addPlayerToPlayersInGameSession({
                    username: player1.username,
                    room,
                });
                addPlayerToPlayersInGameSession({
                    username: player2.username,
                    room,
                });
                io.to(player1.id).emit('redirectToGame', { player1, player2, isWhite, room });
                io.to(player2.id).emit('redirectToGame', { player1, player2, isWhite, room });

                io.emit(
                    'message',
                    generateMessage('Checkers App', `${player1.username} and ${player2.username} started a game!`)
                );
                io.emit('playerList', getPlayersInLobbyList());
            });
        });

        socket.on('joinGame', ({ playerData, isWhite, room }, callback) => {
            const checkIfPlayerInTheCorrectRoom = (username) => {
                const player = getPlayerFromGameSessionList(undefined, username);
                if (player === undefined) return callback('error');
                if (player.room !== room) return callback('error');
            };
            if (!playerData || !isWhite || !room) return callback('error');
            checkIfPlayerInTheCorrectRoom(playerData.username);

            socket.join(room);
            const player = updatePlayerInGameSessionList(playerData.username, socket.id);
            console.log(chalk.greenBright(`${playerData.username} joined room:`, room));
            callback(undefined, player);

            if (isWhite === playerData.username) {
                socket.emit('startGame');
            }

            socket.on('sendUpdatedGameData', (data, callback) => {
                socket.broadcast.to(room).emit('updateGameData', data);
                callback();
            });

            socket.on('changePlayerTurn', () => {
                socket.broadcast.to(room).emit('playerTurnChange');
            });

            socket.on('drawRequest', (room) => {
                socket.broadcast.to(room).emit('recieveDrawRequest');
                callback();
            });

            socket.on('drawResponse', (response, callback) => {
                if (!response) {
                    socket.broadcast.to(room).emit('noDraw');
                    return callback();
                }
                io.to(room).emit('draw');
            });

            socket.on('resign', (resignedPlayer, callback) => {
                callback();
                io.to(room).emit('gameOver', resignedPlayer);
            });

            socket.on('lobby', (callback) => {
                callback();
                io.to(room).emit('backToLobby');
            });

            socket.on('rematchRequest', () => {
                socket.broadcast.to(room).emit('recieveRematchRequest');
                callback();
            });

            socket.on('rematchResponse', (response, callback) => {
                if (!response) {
                    socket.broadcast.to(room).emit('rematchDenied');
                    return callback();
                }
                io.to(room).emit('newGame');
            });
        });

        socket.on('disconnect', () => {
            const leavingPlayerFromLobby = removePlayerFromLobby(socket.id);

            if (getPlayerFromGameSessionList(socket.id)) {
                const leavingPlayerFromGameSessions = removePlayerFromGameSessions(socket.id);
                if (leavingPlayerFromGameSessions) {
                    socket.leave(leavingPlayerFromGameSessions.room);
                    io.to(leavingPlayerFromGameSessions.room).emit('playerLeft', leavingPlayerFromGameSessions);
                }
            } else {
                socket.leave('lobby');
                io.to('lobby').emit('playerList', getPlayersInLobbyList());
            }
        });
    });
};

module.exports = initiateSocketio;
