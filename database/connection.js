const mongoose = require("mongoose");

mongoose.connect(
    "mongodb://127.0.0.1:27017/quizapp",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("Connection established");
    }
);
