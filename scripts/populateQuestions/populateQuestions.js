const mongoose = require("mongoose");
const fs = require("fs");
const questions = require("../../models/questions");

async function init() {
    console.log("works");
    try {
        let questionData = JSON.parse(fs.readFileSync("./Questions.json"));
        for (data in questionData) {
            const question1 = new questions(questionData[data]);
            await question1.save();
            console.log(question1);
        }
    } catch (e) {
        console.log(e);
    }
}

mongoose.connect(
    "mongodb://127.0.0.1:27017/quizapp",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        init();
        console.log("Connection established");
    }
);
