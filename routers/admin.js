const express = require("express");
const admin = require("../models/admin");
const testSessions = require("../models/testSessions");
const questions = require("../models/questions");

const router = new express.Router();

router.get("/", async (req, res) => {
    const test = new admin({ name: "NIKHIL", password: "Password" });

    await test.save();

    res.send("Done");
});

router.get("/createSession", async (req, res) => {
    const questionList = await questions.find();
    const qcount = 10; //todo static for now
    const sessionQuestions = [];
    for (q in questionList) {
        sessionQuestions.push(questionList[q]._id);
    }
    const newSession = new testSessions({
        sessionQuestions: sessionQuestions,
        qcount: qcount,
    });
    await newSession.save();

    console.log(newSession);
    //todo sessionID storage somewhere

    res.send(newSession._id).status(200);
});

module.exports = router;
