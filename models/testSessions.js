const mongoose = require("mongoose");

//_ID OF THIS SCHEMA is our sessionID

const testSessionSchema = new mongoose.Schema({
    time: { type: String },
    date: { type: String },
    sessionQuestions: [String], //Array of StringIDs
    data: [{ emailID: String, score: Number }],
    qcount: { type: Number },
    testType: { type: String },
});

const testSessions = mongoose.model("testSessionSchema", testSessionSchema);

module.exports = testSessions;
