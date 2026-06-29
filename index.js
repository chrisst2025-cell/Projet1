const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Project HedgehogGPT uptaded successfully if you want to fork this, take this link https://github.com/Ismael04-lag/Sonic-Bot-V2 !');
});

app.listen(PORT, () => {
    console.log(`✅ Serveur web factice lancé sur le port ${PORT}`);
});
const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
        const child = spawn("node", ["Goat.js"], {
                cwd: __dirname,
                stdio: "inherit",
                shell: true
        });

        child.on("close", (code) => {
                if (code == 2) {
                        log.info("Restarting Project...");
                        startProject();
                }
        });
}

startProject();
