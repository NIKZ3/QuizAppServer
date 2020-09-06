const mongoose = require("mongoose");

const sessionDataSchema = new mongoose.Schema({
    emailID: { type: String },
    sessionID: { type: String },
    data: [{ qID: String, userOption: Number }],
    score: { type: Number },
});

const sessionData = mongoose.model("sessionData", sessionDataSchema);

module.exports = sessionData;
