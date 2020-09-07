const xlx = require("node-xlsx");

let path = "../scripts/users"; // Todo : do this dynamcially using user provided excel
const userData = xlx.parse(path);

let bulkUsers = [];

let allUsers = userData[0].data;
let pwd = "";
for (let i in allUsers) {
    pwd = allUsers[i][0] + "1234";

    bulkUsers.push({
        emailID: allUsers[i][0],
        password: pwd,
        // sessionID: newSession._id,
    });
}

console.log(bulkUsers);
