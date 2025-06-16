function shutdown(isReboot){
    var proc = require("child_process").spawn
    if (isReboot !== undefined && isReboot) {
        proc("shutdown", ["-r", "/t 0"]);
    } else {
        proc("shutdown", ["-s", "/t 0"]);
    }
}

function clearDatabase(){
    const fs = require("node:fs")
    fs.writeFileSync("./users.json", "[]");
}

module.exports = {shutdown, clearDatabase}