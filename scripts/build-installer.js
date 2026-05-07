const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const version = require(path.join(root, "package.json")).version;
const appName = "NuiPet";
const distDir = path.join(root, "dist", appName);
const releaseDir = path.join(root, "releases", `v${version}`);
const installerScript = path.join(root, "installer", "NuiPet.iss");
const requiredDistFiles = [
  "NuiPet-win_x64.exe",
  "resources.neu"
];
const releaseFiles = [
  "README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md"
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function findInnoCompiler() {
  const candidates = [
    process.env.ISCC_EXE,
    "ISCC.exe",
    "iscc.exe",
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe"
  ].filter(Boolean);

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["/?"], { encoding: "utf8", shell: false });
    if (!result.error) {
      return candidate;
    }
  }

  return null;
}

function prepareReleaseFiles() {
  requiredDistFiles.forEach((file) => {
    const source = path.join(distDir, file);
    if (!fs.existsSync(source)) {
      fail(`Missing ${path.relative(root, source)}. Run "npm run neu:build" before "npm run installer:win".`);
    }

    copyFile(source, path.join(releaseDir, file));
  });

  copyFile(path.join(root, "LICENSE"), path.join(releaseDir, "LICENSE"));
  copyFile(path.join(root, "THIRD_PARTY_NOTICES.md"), path.join(releaseDir, "THIRD_PARTY_NOTICES.md"));

  releaseFiles.forEach((file) => {
    const target = path.join(releaseDir, file);
    if (!fs.existsSync(target)) {
      fail(`Missing ${path.relative(root, target)}.`);
    }
  });
}

if (!fs.existsSync(installerScript)) {
  fail(`Missing ${path.relative(root, installerScript)}.`);
}

prepareReleaseFiles();

const iscc = findInnoCompiler();
if (!iscc) {
  fail("Unable to find Inno Setup compiler. Install Inno Setup 6 or set ISCC_EXE to the full ISCC.exe path.");
}

const result = spawnSync(iscc, [
  `/DAppVersion=${version}`,
  `/DSourceDir=${releaseDir}`,
  `/O${releaseDir}`,
  installerScript
], {
  cwd: root,
  stdio: "inherit",
  shell: false
});

if (result.error) {
  fail(result.error.message);
}

process.exit(result.status || 0);
