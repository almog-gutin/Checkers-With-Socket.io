const playersInGameSession = [];
const playersInLobby = [];

const addPlayerToLobby = (player) => {
    playersInLobby.push(player);
    return player;
};

const removePlayerFromLobby = (id) => {
    const index = playersInLobby.findIndex((player) => player.id === id);
    if (index !== -1) return playersInLobby.splice(index, 1)[0];
};

const addPlayerToPlayersInGameSession = (player) => {
    playersInGameSession.push(player);
    return player;
};

const updatePlayerInGameSessionList = (username, id) => {
    const index = playersInGameSession.findIndex((player) => player.username === username);
    if (index !== -1) playersInGameSession[index].id = id;
    return playersInGameSession[index];
};

const removePlayerFromGameSessions = (id) => {
    const index = playersInGameSession.findIndex((player) => player.id === id);
    if (index !== -1) return playersInGameSession.splice(index, 1)[0];
};

const getPlayerFromPlayersInLobbyList = (id) => playersInLobby.find((player) => player.id === id);

const getPlayerFromGameSessionList = (id, username) => {
    if (id) return playersInGameSession.find((player) => player.id === id);
    return playersInGameSession.find((player) => player.username === username);
};

const getPlayersInLobbyList = () => playersInLobby;

const getPlayersInGameSessionList = () => playersInGameSession;

module.exports = {
    addPlayerToLobby,
    removePlayerFromLobby,
    addPlayerToPlayersInGameSession,
    updatePlayerInGameSessionList,
    removePlayerFromGameSessions,
    getPlayerFromPlayersInLobbyList,
    getPlayerFromGameSessionList,
    getPlayersInLobbyList,
    getPlayersInGameSessionList,
};
