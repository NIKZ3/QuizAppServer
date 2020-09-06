const mongoose = require("mongoose");
const fs = require("fs");
const testSessions = require("../../models/testSessions");

async function init() {
    console.log("works");
    try {
        let sessionData = JSON.parse(fs.readFileSync("./testSessionData.json"));
        for (data in sessionData) {
            const data1 = new testSessions(sessionData[data]);
            await data1.save();
            console.log(data1);
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
