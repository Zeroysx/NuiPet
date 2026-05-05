# Changelog

## 2026-05-05

- Fixed high-DPI window sizing so the full pet frame is visible instead of only the head.
- Added visible click reactions and changed drag handling so clicks are not swallowed by window dragging.
- Switched the desktop shell plan from Tauri to Neutralinojs to avoid the Visual Studio Build Tools requirement.
- Added Neutralino configuration, native allow-list, app icon, and tray icon assets.
- Reworked project scripts and documentation around `neu run`, `neu build`, and browser preview checks.
- Added a Neutralino CLI runner that uses the available Node 16 runtime when the default Node 14 runtime is too old.
- Fixed Neutralino icon path configuration: executable icon uses `applicationIcon`, while the tray icon uses a resource URL.
- Updated Neutralino runtime/client from `5.6.0` to `6.7.0` after `5.6.0` crashed during Windows window startup.
- Initialized NuiPet as a private-first Tauri desktop pet project.
- Added a transparent always-on-top pet window with sprite animation, custom context menu, tray actions, and persisted settings.
- Added 鹿弈Nui sprite assets and metadata with a reserved-rights asset licensing boundary.
- Added asset validation notes and corrected the license asset boundary wording.
