const express = require("express");
const admin = require("../models/admin");

const router = new express.Router();

router.get("/", async (req, res) => {
    const test = new admin({ name: "NIKHIL", password: "Password" });

    await test.save();

    res.send("Done");
});

module.exports = router;
