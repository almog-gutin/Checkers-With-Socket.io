const generateMessage = (username, text) => ({
    username,
    text,
    createdAt: new Date().getTime(),
});

module.exports = generateMessage;
