# Changelog

## 2026-05-06

- Started `v0.2.1` bug-fix development on `codex/v0.2.1-bugfixes`.
- Updated package and Neutralino metadata to `0.2.1`.
- Centralized native window sizing so the open context menu uses menu-safe bounds independent from pet scale.
- Added animation metadata normalization so invalid rows, frames, and fps values fall back to `idle` instead of rendering blank frames.
- Marked the duplicated v0.2.0 final atlas rows as duplicate assets and removed them from menu and automatic trigger groups.
- Expanded asset checks to validate `pet.json`, menu actions, and animation groups before packaging.
- Documented the v0.2.1 bug-fix behavior and remaining row replacement work in the README.
- Built and archived the Windows x64 `v0.2.1-beta` test package under `releases/v0.2.1-beta/`.
- Rebuilt action metadata so each atlas row has one action key and menu trigger buttons are generated from `pet.json`.
- Renamed action keys for clearer row semantics: `happy_run`, `cry`, `walk`, `idle_sit`, and `idle_blink`.
- Added compatibility aliases for old `sleep` and `sit` action names.
- Refreshed the `v0.2.1-beta` test package after rebuilding the action menu bindings.
- Removed the two drag-only run variants from the right-click action menu while keeping them available during drag.
- Remapped mislabeled rows to their verified meanings: `idle_alt`, `think`, `idle_long`, and `nod`.
- Removed blank trailing frames from the nod animation to stop the pet disappearing at the end of that action.
- Replaced atlas row 12 with a generated sitting animation and exposed it as the `sit` menu action.
- Removed redundant thinking actions and aliases so only `think` remains exposed or randomly triggered.
- Rewrote the sitting row after clearing row 12 first to fix stacked old and new sitting frames.
- Made drag-facing direction use accumulated horizontal movement thresholds to reduce wrong-facing flips when drag starts.
- Bound drag-only run rows to explicit left/right directions instead of randomly choosing a run row during drag.
- Added the v0.2.2 development plan for jump y-axis motion, full process quit, menu visual polish, and green-screen residue cleanup.
- Prepared the formal Windows x64 `v0.2.1` release package under `releases/v0.2.1/`.
- Added right-click menu buttons for `run`, `wake`, `blink`, and all v0.2.0 idle micro-actions.
- Made the native menu window expansion use the measured menu size so the larger action list has enough vertical space.
- Updated README animation trigger documentation for the expanded manual action menu.
- Added the v0.2.1 bug-fix plan for menu clipping when pet scaling changes the menu bounds.
- Added the v0.2.1 animation asset bug list for mislabeled or visually duplicated sitting, breathing, wake, blink, looking, stretching, and idle-blink actions.
- Documented v0.2.0 animation trigger conditions in the README.
- Added the v0.2.1 bug-fix plan for occasional pet disappearance and context-menu bottom clipping.
- Expanded the 鹿弈Nui atlas metadata to `8x14` with new idle micro-action rows for breathing, looking around, stretching, sitting, and blinking.
- Added animation groups and categorized Chinese bubble text for click, double-click, drag, idle, and menu interactions.
- Made the pet renderer read frame and atlas geometry from `pet.json` instead of hard-coding the old `8x9` spritesheet size.
- Added automatic idle micro-action scheduling that respects drag and menu interaction priority.
- Added richer visual-only interaction feedback for clicking, double-clicking, dragging, dropping, and bubble display.
- Updated package and Neutralino metadata for `v0.2.0` development.
- Ignored local `.codex-temp/` QA artifacts created during visual asset review.

## 2026-05-05

- Fixed the garbled 鹿弈Nui name in the closed-source distribution documentation.
- Documented the closed-source distribution policy and Neutralinojs license notice obligations.
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

## 2026-05-08

- Started `v0.2.2` development on `codex/v0.2.2-installer-and-polish`.
- Updated package and Neutralino metadata to `0.2.2`.
- Added metadata-driven `jump` y-axis motion so the action visibly lifts and lands during playback.
- Unified right-click and tray quit behavior through the same Neutralino native exit path.
- Polished the compact right-click menu styling, focus state, and text overflow handling.
- Cleaned strong green-screen/chroma-key residue pixels from the current spritesheet.
- Added Inno Setup installer packaging with `npm run installer:win`, `installer/NuiPet.iss`, and `releases/v0.2.2/`.
- Added third-party notices for packaged Neutralinojs runtime distribution.
- Redrew the `cry` animation row in the older hard-edged pixel style and removed remaining green-screen residue from the atlas.
- Added a Windows IExpress fallback so `npm run installer:win` can produce `NuiPet-v0.2.2-setup.exe` even when Inno Setup is not installed.
- Corrected the animation-style target from `cry` to `sit` and redrew the sitting row to match the older hard-edged pixel style.
- Replaced the failed stitched `sit` redraw with a coherent pixelized sitting row to fix head/body alignment artifacts.
- Replaced the faulty patched `cry` face and rebuilt `sit` with nearest-neighbor pixelation instead of blur-based scaling.

## 2026-05-10

- Added the v0.2.3 development plan for a guided installer UI, a new `sleep` action, and the menu-over-pet wake-up bug.
- Marked the archived `v0.2.2` installer as unavailable and documented the portable Windows x64 package as the supported release package.
- Hardened asset validation so invalid animation objects and malformed `motionY` metadata report structured errors instead of crashing.
- Added a header comment to the Windows installer build script.
- Replaced one unnatural idle bubble text entry.
- Added `TODO.md` for deferred PR review follow-ups and expanded the v0.2.3 plan with the non-blocking animation design items.
