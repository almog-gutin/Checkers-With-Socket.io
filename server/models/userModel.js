const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
        },
        last_name: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
        },
        username: {
            type: String,
            trim: true,
            unique: true,
            lowercase: true,
            maxlength: 10,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            unique: true,
            validate(value) {
                if (!validator.isEmail(value)) throw new Error('Email is invalid.');
            },
        },
        password: {
            type: String,
            trim: true,
            minlength: 8,
            required: true,
            validate(value) {
                const passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{0,}$/;
                if (!passRegex.test(value))
                    throw new Error(
                        'Password must contain at least 8 characters including numbers, big and small letters'
                    );
            },
        },
        profile_picture: {
            type: Buffer,
            default: fs.readFileSync('assets/images/blank-profile-picture.png'),
        },
        rating: {
            wins: {
                type: Number,
                default: 0,
            },
            losses: {
                type: Number,
                default: 0,
            },
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Unable to login');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Unable to login');

    return user;
};

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) user.password = await bcrypt.hash(user.password, 8);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
