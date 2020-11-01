const express = require("express");
const admin = require("../models/admin");
const testSessions = require("../models/testSessions");
const questions = require("../models/questions");
const xlx = require("node-xlsx");
const user = require("../models/users");
const path = require("path");
const auth = require("../middleware/auth");
const multer = require("multer");
const os = require("os");
const uniqueFilename = require("unique-filename");
const nodemailer = require("nodemailer");
const codeQuestion = require("../models/codeQuestion");
const fs = require("fs");

const router = new express.Router();

router.get("/", async (req, res) => {
    const test = new admin({ emailID: "nikhil", password: "nikhil" });

    await test.save();

    res.send("Done");
});

router.post("/activateUser", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
            const emailID = req.body.emailID;

            await user.findOneAndUpdate(
                { emailID: emailID },
                { loginState: true }
            );
            res.status(200).send("User Activated");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

router.post("/getUser", auth, async (req, res) => {
    try {
        console.log(req.admin, req.error);
        if (req.admin && req.error == undefined) {
            const user1 = await user.findOne({ emailID: req.body.emailID });
            if (user1 != null) {
                res.status(200).send({
                    emailID: user1.emailID,
                    loginState: user1.loginState,
                });
            } else {
                res.status(200).send("N");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

router.post("/admin/login", async (req, res) => {
    try {
        console.log(req.body);
        const user1 = await admin.findOne({ emailID: req.body.emailID });

        if (user1.password == req.body.password) {
            const token = await user1.generateAuthToken();

            res.send({
                token: token,
                isAdmin: true,
            });
        } else {
            res.status(401).send("Login denied");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
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
        res.send("Something went wrong").status(500);
        console.log(e);
    }
});

router.post("/admin/submitQuestion", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
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
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        res.status(500).send("Something went wrong");
        console.log(e);
    }
});

router.get("/getMySessions", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
            const tempUser = await admin.findOne({ emailID: req.emailID });
            const tempsessions = tempUser.sessions;

            // console.log(tempUser);
            const allIDs = [];
            for (let i in tempsessions) {
                if (tempsessions[i].state === false)
                    allIDs.push(tempsessions[i].id);
            }

            res.status(200).send(allIDs);
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong");
    }
});

router.post("/sessionActivation", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
            const emailID = req.emailID;
            const sessionID = req.body.SessionID;
            console.log(emailID, sessionID);
            await user.updateMany(
                { sessionID: sessionID },
                { loginState: true }
            );
            const tempuser = await admin.findOne({ emailID: emailID });

            const tempsessions = tempuser.sessions;
            for (let i in tempsessions) {
                if (tempsessions[i].id === sessionID) {
                    tempsessions[i].state = true;
                }
            }

            tempuser.sessions = tempsessions;
            await tempuser.save();
            console.log(tempuser);
            res.status(200).send("Activated");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (e) {
        res.status(500).send("Something went wrong");
    }
});

//todo: qcount static for now

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/cache"));
    },

    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now());
    },
});

const upload = multer({
    storage: storage,
}).single("excelFile");

router.post("/createSession", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
            upload(req, res, async (err) => {
                if (err instanceof multer.MulterError) {
                    console.log("==========");
                    let err = new Error("File Upload Error/Server");
                    err.status = 500;
                    console.log(err);
                    res.statusCode = 500;
                    res.send({ err: err });
                } else if (req.file === undefined) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.send({ code: 404, message: "File not found" });
                } else {
                    const questionList = await questions.find();
                    const qcount = 10;
                    const sessionQuestions = [];
                    for (q in questionList) {
                        sessionQuestions.push(questionList[q]._id);
                    }
                    const newSession = new testSessions({
                        sessionQuestions: sessionQuestions,
                        qcount: qcount,
                        testType: "quiz",
                    });
                    await newSession.save();
                    console.log(newSession);
                    const userData = xlx.parse(req.file.path);

                    let bulkUsers = [];

                    let allUsers = userData[0].data;

                    for (let i in allUsers) {
                        let pwd = uniqueFilename("");

                        bulkUsers.push({
                            emailID: allUsers[i][0],
                            password: pwd,
                            sessionID: newSession._id,
                            testType: "quiz",
                        });
                    }

                    await user.insertMany(bulkUsers);
                    bulkUsers.forEach((_user) => {
                        console.log(
                            _user.emailID,
                            _user.password,
                            _user.sessionID
                        );
                        mail(_user.emailID, _user.password, _user.sessionID);
                    });

                    const emailID = req.emailID;

                    const tempsessionID = newSession._id.toString();

                    const up = await admin.findOneAndUpdate(
                        { emailID: emailID },
                        {
                            $push: {
                                sessions: { state: false, id: tempsessionID },
                            },
                        }
                    );

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        code: 200,
                        message: "Sessions created successfully",
                    });
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

//Route for session of coding questions

router.post("/createCodeSession", auth, async (req, res) => {
    try {
        if (req.admin && req.error == undefined) {
            upload(req, res, async (err) => {
                if (err instanceof multer.MulterError) {
                    console.log("==========");
                    let err = new Error("File Upload Error/Server");
                    err.status = 500;
                    console.log(err);
                    res.statusCode = 500;
                    res.send({ err: err });
                } else if (req.file === undefined) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.send({ code: 404, message: "File not found" });
                } else {
                    const questionList = await codeQuestion.find();
                    const qcount = 1;
                    const sessionQuestions = [];
                    for (q in questionList) {
                        sessionQuestions.push(questionList[q].qid);
                        break;
                    }
                    const newSession = new testSessions({
                        sessionQuestions: sessionQuestions,
                        qcount: qcount,
                        testType: "code",
                    });
                    await newSession.save();
                    const sessionID = newSession._id;
                    const dir_name = "/home/nikhil";
                    const dir =
                        dir_name +
                        "/Quizapp/quizappserver/userCodes/" +
                        sessionID;

                    fs.mkdirSync(dir);

                    console.log(newSession);
                    const userData = xlx.parse(req.file.path);

                    let bulkUsers = [];

                    let allUsers = userData[0].data;

                    for (let i in allUsers) {
                        let pwd = uniqueFilename("");

                        bulkUsers.push({
                            emailID: allUsers[i][0],
                            password: pwd,
                            sessionID: newSession._id,
                            testType: "code",
                        });
                    }

                    await admin.insertMany(bulkUsers);
                    bulkUsers.forEach((_user) => {
                        console.log(
                            _user.emailID,
                            _user.password,
                            _user.sessionID
                        );
                        mail(_user.emailID, _user.password, _user.sessionID);
                    });

                    const emailID = req.emailID;

                    const tempsessionID = newSession._id.toString();

                    const up = await user.findOneAndUpdate(
                        { emailID: emailID },
                        {
                            $push: {
                                sessions: { state: false, id: tempsessionID },
                            },
                        }
                    );

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        code: 200,
                        message: "Sessions created successfully",
                    });
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

async function mail(email, pwd, sessionID) {
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "ngawade912@gmail.com",
            pass: "nanagawade",
        },
    });
    console.log("email =====> ", email);
    let info = await transporter.sendMail({
        from: '"Quiz App" <ngawade912@gmail.com>',
        to: email,
        subject: "Quiz Account Credentials",
        text: `Your account for quiz has been created. Account details are as follows:
                 Username : ngawade911@gmail.com
                 Password : 41a0de3d
                 Session ID: 5f56131071c5f41e6c5ccce0
        
               Note: Do not share the credentials with anyone.`,
        html: `Your account for quiz has been created. Account details are as follows:
               <br />
               <b>Username  : </b> ${email}<br />
               <b>Password  : </b> ${pwd}<br />
               <b>Session ID: </b> ${sessionID}<br />
               <br />
               <b>Note: Do not share the credentials with anyone.</b>
        `,
    });
}

module.exports = router;
