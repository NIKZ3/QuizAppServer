const jwt = require("jsonwebtoken");
const user = require("../models/users");

const auth = async (req, res, next) => {
    try {
        const token = req.header("authorization");
        console.log(token);
        const decoded = jwt.verify(token, "user");

        if (decoded.admin === true) req.admin = true;
        else req.admin = false;
        req.sessionID = decoded.sessionID;
        req.emailID = decoded.emailID;

        next();
    } catch (e) {
        //console.log(e);
        err = { error: "User Token expired or malformed" };
        //console.log(err);
        req.error = err;
        next();
    }
};

module.exports = auth;
