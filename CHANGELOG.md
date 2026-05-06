# Changelog

## 2026-05-05

- Rebuilt and published the first GitHub Release package for `v0.1.0`.
- Refined the `v0.1.0` release note technical stack heading.
- Corrected the BUG feedback email in the `v0.1.0` release notes.
- Added the BUG feedback email to the `v0.1.0` release notes.
- Added Chinese release notes for `v0.1.0`, including author attribution, usage scope, links, version, and technical stack.
- Added `releases/v0.1.0/` to store the Windows x64 packaged release files separately from ignored build output.
- Expanded click reaction text and removed the standalone `Nui!` bubble text.
- Updated drag-facing logic to use per-move horizontal deltas so reversing direction mid-drag flips immediately.
- Fixed menu clipping at small pet scales by keeping a fixed menu width and expanding the window to a menu-safe size.
- Applied display-scale correction to controlled dragging so cursor movement and window movement match on high-DPI displays.
- Expanded the native window while the context menu is open and removed drag move throttling to reduce cursor lag.
- Replaced native drag handoff with controlled window movement to fix left-facing animation, drag animation cleanup, and always-on-top state after clicks.
- Flipped the temporary drag-running animation horizontally when dragging left.
- Corrected action labels: the old walk row is a happy running drag animation, sit is walking, and sleep is crying.
- Added temporary happy-run playback while dragging the pet window.
- Localized in-app and tray menu labels to Chinese.
- Made animation startup and menu action switching independent from Neutralino persistence/window API success.
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
