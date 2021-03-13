const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const userAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) throw new Error();
        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        res.status(401).send({ status: 401, message: 'User could not be authenticated.' });
    }
};

module.exports = userAuth;
