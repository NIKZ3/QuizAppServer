const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");

const router = new express.Router();

const codes = {
    0: "AC",
    256: "COMPILE_ERROR",
    159: "COMPILE_ERROR",
    137: "TLE",
    wa: "WA",
};

router.post("/submitCode", async (req, res) => {
    try {
        var dataToSend; //Data that we get back from process
        const emailID = "ngawade911@gmail.com";
        const qid = "q1";
        const qcnt = 2;
        const dir = "/home/nikhil/Quizapp/quizappserver/userCodes/n"; //+ emailID;
        const pyscript =
            "/home/nikhil/Quizapp/quizappserver/userCodes/python/test.py";
        var rc; //rc holds status codes for all the test cases
        const testcase_path =
            "/home/nikhil/Quizapp/quizappserver/questions/" + qid;
        var score = 0;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
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
                for (let i = 0; i < qcnt; i++) {
                    var filename = "o" + (i + 1) + ".txt";

                    fs.readFile(
                        users_output + "/" + filename,
                        (error1, data1) => {
                            if (error1) {
                                throw new Error(error1);
                            }

                            fs.readFile(
                                actual_output + "/" + filename,
                                (error2, data2) => {
                                    if (error2) {
                                        throw new Error(error2);
                                    }

                                    const testcase = "t" + (i + 1);
                                    if (data1 == data2) {
                                        res_obj[testcase] = "AC";
                                        score = score + 10;
                                    } else if (rc[i] == 137) {
                                        res_obj[testcase] = "TLE";
                                    } else {
                                        res_obj[testcase] = "WA";
                                    }
                                    if (i + 1 == qcnt) {
                                        res.send(res_obj);
                                    }
                                }
                            );
                        }
                    );
                }
            }
        });

        //todo: Add score to database and integrate entire thing

        // res.send("OK");
    } catch (e) {
        console.log(e);
        res.send("error");
    }
});

module.exports = router;
