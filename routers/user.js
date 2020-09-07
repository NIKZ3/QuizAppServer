const express = require("express");
const admin = require("../models/admin");
const sessionData = require("../models/sessionData");
const testSessions = require("../models/testSessions");
const question = require("../models/questions");

const router = new express.Router();

//! this is test api
router.get("/user", async (req, res) => {
    // const test = new admin({ emailID: "NIKHIL", password: "Password" });

    const questions = new question({
        question: "This is question",
        options: [
            { id: 1, option: "YOOO" },
            { id: 2, option: "YOOO" },
            { id: 3, option: "YOOO" },
        ],
        answer: 1,
    });

    const tests = new testSessions({ sessionQuestions: ["1"] });

    console.log(questions);
    console.log(tests);
    await questions.save();
    await tests.save();
    // await test.save();

    res.send("Done");
});

// !When the user logs in we will get his details then we will use sessionID from that
router.get("/user/questions", async (req, res) => {
    try {
        //SessionID static for testing
        console.log("request");
        const sessionID = "5f54d5a76454b631e308b295"; // todo : Extract from user schema
        const testsession = await testSessions.findOne({ _id: sessionID });

        const qid = testsession.sessionQuestions;

        const sessionQuestions = await question
            .find({ _id: { $in: qid } })
            .select({ _id: 1, options: 1, q: 1 });

        console.log(sessionQuestions);
        res.send({
            questions: sessionQuestions,
            nQuestions: testsession.qcount,
            sessionID: sessionID,
        }).status(200);
    } catch (e) {
        res.send("Something went wrong").status(404);
        console.log(e);
    }
});

// ! req.body.answers = "sessionID":"...","answers":[{"id":"..",ans:"..."},{...}]
// ! By checking auth we will get userEmail
// ! While sending answers from frontend always send -1 for not selected answers to avoid errors

router.post("/user/submit", async (req, res) => {
    // ! Fetch answers from frontend

    try {
        const answers = req.body.answers;
        let qid = [];
        let userAnswers = {};
        let dataInsertion = []; //userAnswer insertion in sessionData
        let sessionID = "5f54d5a76454b631e308b295"; // TODO : req.body.sessionID,
        let emailID = "n@gmail.com"; //todo will come from token

        // ! get data ready by aligning questions and answers

        console.log(req.body);
        Object.keys(answers).forEach(function (key, index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            qid.push(key);
            userAnswers[key] = Number(answers[key]);
            const dataTemp = {};
            dataTemp.qID = key;
            dataTemp.userOption = Number(answers[key]);
            dataInsertion.push(dataTemp);
        });

        //! Use array created above to fetch questions
        const sessionQuestions = await question
            .find({ _id: { $in: qid } })
            .select({ _id: 1, answer: 1 });

        //! calculate the score
        let score = 0;
        for (data in sessionQuestions) {
            if (
                sessionQuestions[data].answer ===
                userAnswers[sessionQuestions[data]._id]
            )
                score += 100;
        }

        //! create session data consisting of user answers to all questions
        const dataUser = new sessionData({
            emailID: emailID,
            sessionID: sessionID, //
            data: dataInsertion,
            score: score,
        });

        const up = await testSessions.findByIdAndUpdate(
            { _id: sessionID },
            { $push: { data: { emailID: emailID, score: score } } }
        );

        console.log(up);

        await dataUser.save();
        /* console.log("This is object of users questions", sessionQuestions);
        console.log("This is object of users answers", userAnswers);
        console.log("This is for sessionData", dataUser);
        console.log("This is dataInsertion", dataInsertion);*/

        res.send({ score: score }).status(200);
    } catch (e) {
        res.send("Network Error").status(404);
        console.log(e);
    }
});

//! Api to view my result along with my selected options
router.get("/user/view", async (req, res) => {
    const emailID = req.body.emailID;
    const sessionID = req.body.sessionID;

    const sessionData1 = await sessionData.findOne({
        emailID: emailID,
        sessionID: sessionID,
    });
    console.log(sessionData1);

    //qid to extract questions
    let qid = [];
    //ans to create an array of qid and user selected options
    let ans = [];

    const data1 = sessionData1.data;
    for (i in data1) {
        qid.push(data1[i].qID);
        const ans1 = {};
        ans1.qID = data1[i].qID;
        ans1.userOption = data1[i].userOption;
        ans.push(ans1);
    }

    const allQuestions = await question.find({ _id: { $in: qid } });
    console.log(allQuestions);
    console.log(ans);

    res.send({ allQuestions: allQuestions, ans: ans }).status(200);
});

//! Final user Api not yet tested
//! this api simply gives user the result of test of whose sessionID he provided
router.get("/user/result", async (req, res) => {
    const sessionID = req.body.sessionID;

    const data1 = await testSessions.findOne({ _id: sessionID });

    res.send({ results: data1.data }).status(200);
});

module.exports = router;
