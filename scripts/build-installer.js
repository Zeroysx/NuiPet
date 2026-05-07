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
const installerPayloadFiles = [
  ...requiredDistFiles,
  ...releaseFiles
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

function escapeSedValue(value) {
  return String(value).replace(/\r?\n/g, " ");
}

function writeTextFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function buildIexpressInstaller() {
  const iexpress = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "iexpress.exe");
  if (!fs.existsSync(iexpress)) {
    fail("Unable to find Inno Setup compiler or Windows IExpress fallback.");
  }

  const tempDir = path.join(root, ".codex-temp", "installer", `v${version}`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const installCmd = path.join(tempDir, "install.cmd");
  const shortcutScript = path.join(tempDir, "create-shortcuts.ps1");
  const payloadDir = path.join(tempDir, "payload");
  const sedFile = path.join(tempDir, "NuiPet.sed");
  const targetName = path.join(releaseDir, `NuiPet-v${version}-setup.exe`);
  fs.mkdirSync(payloadDir, { recursive: true });

  writeTextFile(installCmd, `@echo off
setlocal
set "APPDIR=%LOCALAPPDATA%\\Programs\\NuiPet"
if not exist "%APPDIR%" mkdir "%APPDIR%"
copy /Y "%~dp0NuiPet-win_x64.exe" "%APPDIR%\\" >nul
copy /Y "%~dp0resources.neu" "%APPDIR%\\" >nul
copy /Y "%~dp0README.md" "%APPDIR%\\" >nul
copy /Y "%~dp0LICENSE" "%APPDIR%\\" >nul
copy /Y "%~dp0THIRD_PARTY_NOTICES.md" "%APPDIR%\\" >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcuts.ps1" "%APPDIR%"
start "" "%APPDIR%\\NuiPet-win_x64.exe"
endlocal
`);

  writeTextFile(shortcutScript, `param([Parameter(Mandatory=$true)][string]$AppDir)

$exe = Join-Path $AppDir "NuiPet-win_x64.exe"
$shell = New-Object -ComObject WScript.Shell
$startMenu = Join-Path $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs\\NuiPet"
New-Item -ItemType Directory -Path $startMenu -Force | Out-Null

$shortcut = $shell.CreateShortcut((Join-Path $startMenu "NuiPet.lnk"))
$shortcut.TargetPath = $exe
$shortcut.WorkingDirectory = $AppDir
$shortcut.IconLocation = $exe
$shortcut.Save()
`);

  installerPayloadFiles.forEach((file) => {
    copyFile(path.join(releaseDir, file), path.join(payloadDir, file));
  });
  copyFile(installCmd, path.join(payloadDir, path.basename(installCmd)));
  copyFile(shortcutScript, path.join(payloadDir, path.basename(shortcutScript)));

  const sourceFiles = installerPayloadFiles.concat([path.basename(installCmd), path.basename(shortcutScript)]);
  const fileStrings = sourceFiles.map((file, index) => `FILE${index}=${escapeSedValue(file)}`).join("\n");
  const sourceFileRows = sourceFiles.map((file, index) => `%FILE${index}%=`).join("\n");

  writeTextFile(sedFile, `[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[Strings]
FriendlyName=NuiPet v${version} Installer
AppLaunched=install.cmd
TargetName=${escapeSedValue(targetName)}
${fileStrings}

[SourceFiles]
SourceFiles0=${escapeSedValue(payloadDir)}

[SourceFiles0]
${sourceFileRows}
`);

  const result = spawnSync(iexpress, ["/N", "/Q", sedFile], {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
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
  console.warn("Unable to find Inno Setup compiler. Falling back to Windows IExpress.");
  buildIexpressInstaller();
  process.exit(0);
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
