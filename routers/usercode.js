const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");

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

//! Modify dir_name according to your pc
//! also in python script change path to questions to run everything properly
router.post("/submitCode", async (req, res) => {
    try {
        var dataToSend; //Data that we get back from process
        const dir_name = "/home/nikhil";
        const emailID = "ngawade911@gmail.com";
        const qid = "q1";
        const qcnt = 2;
        const dir =
            dir_name +
            "/Quizapp/quizappserver/userCodes/" +
            emailID +
            "/" +
            qid;
        const userRoot =
            dir_name + "/Quizapp/quizappserver/userCodes/" + emailID;
        const pyscript =
            dir_name + "/Quizapp/quizappserver/userCodes/python/test.py";
        var rc; //rc holds status codes for all the test cases
        const testcase_path =
            dir_name + "/Quizapp/quizappserver/questions/" + qid;
        var score = 0;

        if (!fs.existsSync(userRoot)) {
            fs.mkdirSync(userRoot);
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        // console.log(dir);
        // console.log(userRoot);

        console.log(pyscript, dir);
        //Pass cmd args test case path and user output path and test case count
        const python = spawn("python", [
            pyscript,
            dir,
            qid,
            qcnt,
            //"/home/nikhil/Quizapp/quizappserver/userCodes/python/test.py",
            //"/home/nikhil/Quizapp/quizappserver/userCodes/n",
        ]);
        python.stdout.on("data", function (data) {
            console.log("Pipe data from python script ...");

            dataToSend = data.toString();
        });

        python.on("close", (code) => {
            console.log(`child process close all stdio with code ${code}`);

            console.log(dataToSend);
            var rc = dataToSend.split("\n");

            var res_obj = {};
            if (rc[0] == 256 || rc[0] == 159) {
                for (let i = 0; i < qcnt; i++) {
                    const testcase = "t" + (i + 1);
                    res_obj[testcase] = "Compile_Error";
                }
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
                                res.status(200).send(res_obj);
                            }
                        });
                    });
                }
            }
        });

        // res.send("OK");
    } catch (e) {
        console.log(e);
        res.send("error");
    }
});

module.exports = router;
