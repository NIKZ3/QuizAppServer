const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    emailID: { type: String, required: true },
    password: { type: String, required: true },
    loginState: { type: Boolean, default: false },
    sessionID: { type: String },
});

const users = mongoose.model("user", userSchema);

module.exports = users;
