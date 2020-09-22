const mongoose = require("mongoose");

//_ID OF THIS SCHEMA is our sessionID

const codeSessionSchema = new mongoose.Schema({
    sessionQuestions: [String], //Array of StringIDs
    data: [{ emailID: String, score: Number }],
    qcount: { type: Number },
});

const codeSession = mongoose.model("codeSessionSchema", codeSessionSchema);

module.exports = codeSession;
