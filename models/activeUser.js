const mongoose = require('mongoose');

const activeUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
}, {timestamps: true});

const ActiveUser = mongoose.model('ActiveUser', activeUserSchema);

module.exports = ActiveUser;
