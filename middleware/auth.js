const jwt = require("jsonwebtoken");
const user = require("../models/users");

const auth = async (req, res, next) => {
    try {
        // console.log("in");
        const token = req.header("authorization");
        // console.log(token);
        console.log(req.header("authorization"));
        const decoded = jwt.verify(token, "user");
        console.log(decoded);
        req.admin = decoded.admin;
        req.sessionID = decoded.sessionID;
        req.emailID = decoded.emailID;

        next();
    } catch (e) {
        console.log(e);
        err = { error: "User Token expired or malformed" };
        req.error = err;
        next();
    }
};

module.exports = auth;
