#define AppName "NuiPet"
#ifndef AppVersion
#define AppVersion "0.2.2"
#endif
#ifndef SourceDir
#define SourceDir "..\releases\v0.2.2"
#endif

[Setup]
AppId={{8C9849A9-9B69-4A66-9CC1-2D03D17F66F9}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Zeroysx
AppPublisherURL=https://github.com/Zeroysx/NuiPet
AppSupportURL=https://github.com/Zeroysx/NuiPet/issues
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=NuiPet-v{#AppVersion}-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\NuiPet-win_x64.exe
LicenseFile={#SourceDir}\LICENSE
PrivilegesRequired=lowest

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\NuiPet-win_x64.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\resources.neu"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "{#SourceDir}\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\NuiPet"; Filename: "{app}\NuiPet-win_x64.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\NuiPet"; Filename: "{app}\NuiPet-win_x64.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\NuiPet-win_x64.exe"; Description: "Launch NuiPet"; Flags: nowait postinstall skipifsilent
