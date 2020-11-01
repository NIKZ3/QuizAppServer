const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
    emailID: { type: String },
    password: { type: String },
    sessions: [{ state: false, id: String }],
    token: { type: String },
    superAdmin: { type: Boolean, default: false },
});

adminSchema.methods.generateAuthToken = async function () {
    const user = this;
    let token;

    token = jwt.sign({ emailID: user.emailID, admin: true }, "user");
    user.token = token;

    await user.save();

    return token;
};

const admin = mongoose.model("admin", adminSchema);

module.exports = admin;
