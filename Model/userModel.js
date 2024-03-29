const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required field!'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required field!'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required field!'],
        trim: true
    },
    otpToken: {
        type: Number,
        default: undefined
    },
})

const Users = mongoose.model('Users', usersSchema);

module.exports = Users;