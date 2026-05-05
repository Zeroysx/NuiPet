const fs = require("fs");
const path = require("path");

const required = [
  "neutralino.config.json",
  "web/index.html",
  "web/main.js",
  "web/styles.css",
  "web/assets/pets/luyi-nui/pet.json",
  "web/assets/pets/luyi-nui/spritesheet.webp",
  "web/assets/icons/app-icon.png",
  "web/assets/icons/tray-icon.png"
];

const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, "..", file)));

if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("NuiPet assets are present.");
