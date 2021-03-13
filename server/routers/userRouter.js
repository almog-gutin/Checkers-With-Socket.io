const fs = require('fs');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const chalk = require('chalk');
const User = require('../models/userModel');
const userAuth = require('../middleware/userAuth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/accounts');

const router = new express.Router();

// Access The Game page
router.get('/game', userAuth, async (req, res) => {
    try {
        res.send({ status: 200, message: 'Success' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// New user sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        // sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        console.log(chalk.green('New user has signed up!'));
        res.status(201).send({ status: 201, user, token, message: 'Successfully created an account' });
    } catch (err) {
        const data = { status: 400 };
        if (err.errors.password) data.message = err.errors.password.properties.message;
        if (err.errors.email) data.message = err.errors.email.properties.message;
        if (err.errors.username) data.message = err.errors.username.properties.message;
        res.status(400).send(data);
    }
});

// User login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        if (user.tokens.length === 2)
            return res.status(403).send({
                status: 403,
                message: 'User has logged in too many times. Please logout from your other devices.',
            });
        const token = await user.generateAuthToken();
        if (user.tokens.length === 2) user.username = `${user.username}(1)`;
        res.send({ status: 200, user, token, message: 'User successfully logged in.' });
    } catch (err) {
        res.status(400).send(err);
    }
});

// User logout
router.post('/users/me/logout', userAuth, async (req, res) => {
    const user = req.user;
    const token = req.token;
    try {
        user.tokens = user.tokens.filter((tokenDoc) => tokenDoc.token !== token);
        console.log(user.tokens);
        await user.save();
        console.log(true);
        res.send({ status: 200, message: 'User has been successfully been logged out.' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// User logout from all devices
router.post('/users/me/logout-all', userAuth, async (req, res) => {
    const user = req.user;
    try {
        user.tokens = [];
        await user.save();
        res.send({ status: 200, message: 'User has been successfully been logged out from all devices.' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// User gets his information
router.get('/users/me', userAuth, async (req, res) => {
    const user = req.user;
    try {
        res.send({ status: 200, user });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// User edits his information
router.patch('/users/me', userAuth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['first_name', 'last_name', 'username', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) return res.status(400).send({ status: 400, message: 'Invalid update.' });

    const user = req.user;
    try {
        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();
        res.send({ status: 200, user, message: 'User has successfully updated his information.' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// Updating user's rating
router.patch('/users/me/rating', userAuth, async (req, res) => {
    const update = Object.keys(req.body);
    const user = req.user;
    try {
        user.rating[update] = req.body[update];
        await user.save();
        res.send({ status: 200, rating: user.rating, message: 'User rating has successfully been updated,' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// User deletes his account
router.delete('/users/me', userAuth, async (req, res) => {
    try {
        await req.user.remove();
        // sendCancelationEmail(req.user.email, req.user.name);
        console.log(chalk.red('A user has deleted his account!'));
        res.send({ status: 200, message: 'User has successfully deleted his account.' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// Uploading a profile picture
const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) return cb(new Error('Please upload an image.'));
        cb(undefined, true);
    },
});

router.post('/users/me/profile_picture', userAuth, upload.single('profile_picture'), async (req, res) => {
    try {
        const user = req.user;
        console.log(req.file);
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
        console.log(buffer);
        user.profile_picture = buffer;
        await user.save();
        res.send({ status: 200, user, message: 'User has successfully uploaded a profile picture!' });
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
});

// Deleting a profile picture
router.delete('/users/me/profile_picture', userAuth, async (req, res) => {
    const user = req.user;
    try {
        user.profile_picture = fs.readFileSync('assets/images/blank-profile-picture.png');
        await user.save();
        res.send({ status: 200, user, message: 'User has successfully deleted his profile picture.' });
    } catch (err) {
        res.status(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

// getting a profile picture
router.get('/users/me/profile_picture', userAuth, async (req, res) => {
    try {
        res.set('Content-Type', 'image/png');
        res.send(req.user.profile_picture);
    } catch (err) {
        res.staus(500).send({ status: 500, message: 'Something went wrong.' });
    }
});

module.exports = router;
