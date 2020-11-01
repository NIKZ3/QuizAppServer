const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    emailID: { type: String, required: true },
    password: { type: String, required: true },
    loginState: { type: Boolean, default: false },
    sessionID: { type: String },
    admin: { type: Boolean, default: false },
    sessions: [{ state: false, id: String }],
    token: { type: String },
    testType: { type: String },
    state: { type: String, default: "N" },
});

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    let token;
    if (user.admin) {
        //console.log("admin");
        token = jwt.sign(
            { emailID: user.emailID, sessionID: user.sessionID, admin: true },
            "user"
        );
        user.token = token;
    } else {
        //console.log("Not admin");
        token = jwt.sign(
            { emailID: user.emailID, sessionID: user.sessionID, admin: false },
            "user"
        );
        user.token = token;
    }

    await user.save();

    return token;
};

const users = mongoose.model("user", userSchema);

module.exports = users;
