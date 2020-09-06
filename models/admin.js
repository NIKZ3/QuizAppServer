const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    emailID: { type: String },
    password: { type: String },
});

const admin = mongoose.model("admin", adminSchema);

module.exports = admin;
