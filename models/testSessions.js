const mongoose = require("mongoose");

const testSessionSchema = new mongoose.Schema({
    time: { type: String },
    date: { type: String },
    sessionQuestions: [String],
    data: [{ emailID: String, score: Number }],
});

const testSessions = mongoose.model("testSessionSchema", testSessionSchema);

module.exports = testSessions;
