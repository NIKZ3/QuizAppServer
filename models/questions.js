const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    q: { type: String, required: true },
    options: [{ id: Number, option: String }],
    answer: { type: Number }, //Option Number
});

const questions = mongoose.model("questions", questionSchema);

module.exports = questions;
