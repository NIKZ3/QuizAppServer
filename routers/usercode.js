const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const codeQuestion = require("../models/codeQuestion");
const codeSession = require("../models/codeSession");
const session = require("../models/testSessions");
const auth = require("../middleware/auth");
const users = require("../models/users");

const router = new express.Router();

//todo: Add score to database and integrate entire thing
//todo: Take code as string from frontend and store in 1.cpp for user

const codes = {
    0: "AC",
    256: "COMPILE_ERROR",
    159: "COMPILE_ERROR",
    137: "TLE",
    wa: "WA",
};

router.post("/addCodeQuestion", async (req, res) => {
    const question = req.body.question;
    const qid = req.body.qid;
    const tcnt = req.body.tcnt;
    const cq = new codeQuestion({ q: question, qid: qid, tcnt: tcnt });
    await cq.save();
    res.status(200).send("Question SAved");
});

router.get("/getQuestion", auth, async (req, res) => {
    try {
        if (!req.admin && req.error == undefined) {
            const userID = req.emailID;
            const sessionID = req.sessionID;

            const session1 = await session.find({ _id: sessionID });

            const questionList = session1[0].sessionQuestions;

            const question = await codeQuestion.findOne({
                qid: questionList[0],
            });
            const user1 = await users.findOne({ emailID: req.emailID });
            res.send({ userState: user1.state, question: question });
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

//! Modify dir_name according to your pc
//! also in python script change path to questions to run everything properly
router.post("/submitCode", auth, async (req, res) => {
    try {
        if (!req.admin && req.error == undefined) {
            const userID = req.emailID;
            const sessionID = req.sessionID;
            var dataToSend; //Data that we get back from process
            const dir_name = "/home/nikhil";
            const emailID = userID;
            const sessionInfo = await session.findOne({ _id: sessionID });

            const qid = sessionInfo.sessionQuestions[0];

            const question1 = await codeQuestion.findOne({ qid: qid });

            const qcnt = question1.tcnt; //Testcase Count for that question
            const dir =
                dir_name +
                "/Quizapp/quizappserver/userCodes/" +
                sessionID +
                "/" +
                emailID +
                "/" +
                qid;
            const userRoot =
                dir_name +
                "/Quizapp/quizappserver/userCodes/" +
                sessionID +
                "/" +
                emailID;
            const pyscript =
                dir_name + "/Quizapp/quizappserver/userCodes/python/test.py";
            var rc; //rc holds status codes for all the test cases
            const testcase_path =
                dir_name + "/Quizapp/quizappserver/questions/" + qid;
            var score = 0;

            // console.log(userRoot);
            if (!fs.existsSync(userRoot)) {
                fs.mkdirSync(userRoot);
            }
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            //Initially Copy code to the buffer
            const userCodeFile = dir + "/" + "1.cpp";

            fs.writeFileSync(userCodeFile, req.body.code);

            //Pass cmd args test case path and user output path and test case count
            const python = spawn("python", [pyscript, dir, qid, qcnt]);
            python.stdout.on("data", function (data) {
                // console.log("Pipe data from python script ...");

                dataToSend = data.toString();
            });

            python.on("close", (code) => {
                //  console.log(`child process close all stdio with code ${code}`);

                //  console.log(dataToSend);
                if (dataToSend === undefined) var rc = [256];
                else var rc = dataToSend.split("\n");

                var res_obj = {};
                if (rc[0] == 256 || rc[0] == 159) {
                    for (let i = 0; i < qcnt; i++) {
                        const testcase = "t" + (i + 1);
                        res_obj[testcase] = "Compile_Error";
                    }
                    updateScore(emailID, 0, sessionID);
                    res.send(res_obj);
                }

                //Here we compare input and output files if they match we approve with AC else with WA
                else {
                    var users_output = dir;
                    var actual_output = testcase_path;
                    let cnt = 0;
                    for (let i = 0; i < qcnt; i++) {
                        const filename = "o" + (i + 1) + ".txt";
                        const ufile = users_output + "/" + filename; //User output
                        const afile = actual_output + "/" + filename; //Actual output

                        fs.readFile(ufile, (error1, data1) => {
                            if (error1) {
                                throw new Error(error1);
                            }

                            fs.readFile(afile, (error2, data2) => {
                                if (error2) {
                                    throw new Error(error2);
                                }

                                data1 = data1.toString();

                                data2 = data2.toString();

                                const testcase = "t" + (i + 1);
                                if (data1 == data2) {
                                    res_obj[testcase] = "AC";
                                    score = score + 10;
                                } else if (rc[i] == 137) {
                                    res_obj[testcase] = "TLE";
                                } else {
                                    res_obj[testcase] = "WA";
                                }
                                cnt = cnt + 1;
                                //cnt handles asynchrouns file check
                                if (cnt == qcnt) {
                                    res_obj["score"] = score;
                                    updateScore(emailID, score, sessionID);
                                    res.status(200).send(res_obj);
                                }
                            });
                        });
                    }
                }
            });
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

//Utility function to update scores in database
const updateScore = async (emailID, score, sessionID) => {
    const session1 = await session.findOne({ _id: sessionID });
    let score1 = session1.data;
    let flag = 0;
    for (let i in score1) {
        if (score1[i].emailID == emailID) {
            if (score1[i].score > score) {
                flag = 1;
                break; //If previous submission score was higher keep that score
            }
            score1[i].score = score;
            flag = 1;
            break;
        }
    }
    if (flag == 1) {
        session1.data = score1;
        await session1.save();
    } else {
        score1.push({ emailID: emailID, score: score });
        session1.data = score1;
        await session1.save();
    }
};

module.exports = router;
