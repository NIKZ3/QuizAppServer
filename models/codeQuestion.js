const mongoose = require("mongoose");

const codeQuestionSchema = new mongoose.Schema({
    q: { type: String, required: true },
    qid: { type: String, unique: true },
    tcnt: { type: Number },
});

const codeQuestion = mongoose.model("codeQuestion", codeQuestionSchema);

module.exports = codeQuestion;
