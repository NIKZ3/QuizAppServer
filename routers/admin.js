const express = require("express");
const admin = require("../models/admin");
const testSessions = require("../models/testSessions");
const questions = require("../models/questions");
const xlx = require("node-xlsx");
const user = require("../models/users");
const path = require("path");

const router = new express.Router();

router.get("/", async (req, res) => {
    const test = new admin({ name: "NIKHIL", password: "Password" });

    await test.save();

    res.send("Done");
});

router.get("/result", async (req, res) => {
    try {
        const sessionID = req.query.sessionID;
        console.log(req.query);
        const testResultData = await testSessions
            .findOne({ _id: sessionID })
            .select({ data: 1, qcount: 1 });

        console.log(testResultData);
        res.send({ testResultData }).status(200);
    } catch (e) {
        res.send("Something went wrong").status(404);
        console.log(e);
    }
});

router.post("/admin/submitQuestion", async (req, res) => {
    try {
        console.log(req.body);
        const data = req.body;
        const options = [];
        let i = 1;
        for (op in data.options) {
            options[i - 1] = { id: i, option: data.options[op].value };
            i++;
        }

        console.log(options);

        const newQuestion = new questions({
            q: data.question,
            options: options,
            answer: data.ans + 1,
        });
        await newQuestion.save();

        res.send("question submitted successfully").status(200);
    } catch (e) {
        res.send("Something went wrong").status(404);
        console.log(e);
    }
});

//todo: qcount static for now
router.get("/createSession", async (req, res) => {
    const questionList = await questions.find();
    const qcount = 10;
    const sessionQuestions = [];
    for (q in questionList) {
        sessionQuestions.push(questionList[q]._id);
    }
    const newSession = new testSessions({
        sessionQuestions: sessionQuestions,
        qcount: qcount,
    });
    await newSession.save();

    //! Creation of user passwords and logins
    let path1 = path.join(__dirname, "../public/users");
    console.log(path1);
    const userData = xlx.parse(path1);

    let bulkUsers = [];

    let allUsers = userData[0].data;
    let pwd = "";
    for (let i in allUsers) {
        pwd = allUsers[i][0] + "1234";
        bulkUsers.push({
            emailID: allUsers[i][0],
            password: pwd,
            sessionID: newSession._id,
        });
    }

    await user.insertMany(bulkUsers);
    console.log(bulkUsers);
    console.log(newSession);

    res.send(newSession._id).status(200);
});

module.exports = router;
