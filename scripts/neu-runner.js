const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const knownNode = process.env.NUIPET_NODE || "D:\\environment\\HuaWei\\Node\\node.exe";
const knownNeu = process.env.NUIPET_NEU || "D:\\environment\\node-v14.19.1-win-x64\\node_modules\\@neutralinojs\\neu\\bin\\neu.js";

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    return false;
  }

  process.exit(result.status || 0);
}

if (fs.existsSync(knownNode) && fs.existsSync(knownNeu)) {
  run(knownNode, [knownNeu].concat(args));
}

run(process.platform === "win32" ? "neu.cmd" : "neu", args);

console.error("Unable to find Neutralino CLI. Install it with: npm install -g @neutralinojs/neu");
process.exit(1);
