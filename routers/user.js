const express = require("express");
const admin = require("../models/admin");
const sessionData = require("../models/sessionData");
const testSessions = require("../models/testSessions");
const question = require("../models/questions");
const user = require("../models/users");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const router = new express.Router();

//! this is test api
router.get("/user", auth, async (req, res) => {
    try {
        console.log(req.sessionID);
        console.log(req.emailID);
        console.log(req.admin);
        res.send("worked").status(200);
    } catch (e) {
        console.log(e);
        res.send("Something went wrong");
    }
});

router.post("/login", async (req, res) => {
    try {
        const user1 = await user.findOne({ emailID: req.body.emailID });

        if (user1.password == req.body.password && user1.loginState == true) {
            const token = await user1.generateAuthToken();

            user.findByIdAndUpdate(
                { emailID: req.body.emailID },
                { loginState: false }
            );
            res.send({
                testType: user1.testType,
                token: token,
                isAdmin: user1.admin,
            });
        } else {
            res.status(403).send("Login denied");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

router.get("/user/questions", auth, async (req, res) => {
    try {
        if (!req.admin && req.error == undefined) {
            const sessionID = req.sessionID;
            const testsession = await testSessions.findOne({ _id: sessionID });

            const qid = testsession.sessionQuestions;

            const sessionQuestions = await question
                .find({ _id: { $in: qid } })
                .select({ _id: 1, options: 1, q: 1 });
            const user1 = await user.findOne({ emailID: req.emailID });
            res.send({
                questions: sessionQuestions,
                nQuestions: testsession.qcount,
                sessionID: sessionID,
                userState: user1.state,
            }).status(200);
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        res.status(500).send("Something went wrong");
        console.log(e);
    }
});

router.post("/user/submit", auth, async (req, res) => {
    try {
        if (!req.admin && req.error == undefined) {
            const answers = req.body.answers;
            let qid = [];
            let userAnswers = {};
            let dataInsertion = [];
            let sessionID = req.sessionID;
            let emailID = req.emailID;

            console.log(sessionID);

            Object.keys(answers).forEach(function (key, index) {
                qid.push(key);
                userAnswers[key] = Number(answers[key]);
                const dataTemp = {};
                dataTemp.qID = key;
                dataTemp.userOption = Number(answers[key]);
                dataInsertion.push(dataTemp);
            });

            const sessionQuestions = await question
                .find({ _id: { $in: qid } })
                .select({ _id: 1, answer: 1 });

            let score = 0;
            for (data in sessionQuestions) {
                if (
                    sessionQuestions[data].answer ===
                    userAnswers[sessionQuestions[data]._id]
                )
                    score += 100;
            }

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

            await user.deleteOne({ emailID: emailID });
            res.status(200).send({ score: score });
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        res.status(500).send("Something went wrong");
        console.log(e);
    }
});
// Api to save state of user
router.post("/stateSave", auth, async (req, res) => {
    try {
        if (!req.admin && req.error == undefined) {
            // console.log(req.body.state);
            const state = req.body.state;
            const emailID = req.emailID;

            const user1 = await user.findOne({ emailID: emailID });
            const state1 = user1.state;

            if (state1 != "N") {
                const prev_state = JSON.parse(state1);
                if (state.time > prev_state.time) {
                    res.status(200).send("cheat"); //In case user has made changes in timing
                } else {
                    user1.state = JSON.stringify(state);
                    await user1.save();
                    res.status(200).send("ok");
                }
            } else {
                user1.state = JSON.stringify(state);
                await user1.save();
                res.status(200).send("ok");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
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
