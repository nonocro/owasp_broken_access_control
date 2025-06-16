function shutdown(isReboot){
    var proc = require("child_process").spawn
    if (isReboot !== undefined && isReboot) {
        proc("shutdown", ["-r"]);
    } else {
        proc("shutdown", ["-s"]);
    }
}

function clearDatabase(){
    const fs = require("node:fs")
    fs.writeFileSync("./users.json", "{}");
}

module.exports = {shutdown, clearDatabase}