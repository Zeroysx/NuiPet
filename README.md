# NuiPet

NuiPet is a desktop pet project based on the virtual streamer 鹿弈Nui. The Windows version focuses on a lightweight, transparent, always-on-top pet window built with Neutralinojs and plain web assets.

## Current MVP

- Transparent frameless desktop pet window.
- Always-on-top behavior with a toggle in the pet menu.
- Sprite animation from a WebP atlas at `192x208` pixels per frame.
- Actions are mapped to the verified atlas row meanings: idle, direction-specific drag runs, wave, jump, cry, sleep, second idle, light jog, thinking, compatibility long idle, nod, and sitting.
- v0.2.0 expands the atlas to `8x14` and adds idle micro-actions for breathing, looking around, stretching, sitting, and blinking.
- v0.2.1 defines the action menu from `pet.json`, so action labels and menu trigger buttons stay bound to the same metadata.
- The renderer reads atlas columns, rows, frame width, and frame height from pet metadata instead of hard-coding the old `8x9` layout.
- Right-click menu for action switching, scale changes, always-on-top, and quit.
- The right-click menu exposes every configured action in `pet.json`, including idle micro-actions used for direct QA triggering.
- The in-app and tray menus use Chinese labels for the target desktop pet experience.
- Left-click reaction feedback and drag-to-move behavior.
- Single-click, double-click, drag start, drag end, idle, and menu interactions use categorized Chinese bubble text pools with distinct single-click and double-click action groups.
- Idle micro-actions play automatically after a short quiet period without overriding a recent drag or menu-selected action.
- Visual feedback includes click pop, double-click hop, drag highlighting, drop squash, and bubble entrance animation.
- The `jump` action uses metadata-driven y-axis motion so the sprite visibly lifts and lands during playback.
- Dragging temporarily plays the `run_right` or `run_left` drag running animation and restores the previous action after the drag ends.
- The drag animation flips horizontally when dragging left so the pet faces the drag direction.
- Drag-facing direction uses direction-specific run rows plus a small accumulated horizontal threshold, so pointer jitter at drag start does not flip the pet the wrong way.
- Dragging is implemented with explicit window movement instead of native drag handoff, which keeps animation direction and always-on-top state consistent.
- The window expands while the right-click menu is open so the menu docks beside the pet instead of covering it.
- Drag movement uses the display scale factor, so the window follows the cursor correctly on high-DPI displays.
- Drag-facing direction updates from the latest pointer movement, so reversing direction mid-drag flips the animation immediately.
- Click reactions rotate through a small Chinese text pool based on 鹿弈Nui references.
- Animation and menu actions are resilient to Neutralino storage/window API failures, so native persistence problems do not freeze the pet on the first frame.
- System tray menu for show/hide and quit.
- The right-click menu and tray quit actions share the same native exit path.
- Persisted settings for action, scale, always-on-top, and last known window position.

## Animation Triggers

Current action keys and trigger conditions:

- `idle`: Default startup action, fallback action when a saved action is invalid, and the baseline action after idle micro-actions finish.
- `run_right`: Drag-only right-facing running variant. It is not shown in the right-click menu. The old `happy_run` and `walk_drag` keys remain compatibility aliases.
- `run_left`: Drag-only left-facing running variant. It is not shown in the right-click menu. The old `run` key remains a compatibility alias.
- `wave`: Can be selected from the right-click menu and can be picked randomly as a single-click reaction.
- `jump`: Can be selected from the right-click menu and can be picked randomly as a double-click reaction. It defines `motionY` offsets for the visible jump arc.
- `cry`: Can be selected from the right-click menu.
- `sleep`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler. This is a dedicated v0.2.3 sleep action instead of an alias to `cry`.
- `idle_alt`: Can be selected from the right-click menu, can be picked randomly as an idle variant, and can be picked randomly as a single-click reaction. This replaces the old `wake` label.
- `walk`: Can be selected from the right-click menu and is labeled as a light jog because the row visually matches running more than walking.
- `think`: Can be selected from the right-click menu, can be picked randomly as a single-click reaction, and can be picked randomly by the automatic idle scheduler. This is the only retained thinking action.
- `idle_long`: Retained for compatibility through the old `idle_breathe` alias, but no longer appears in the menu or automatic idle scheduler.
- `nod`: Can be selected from the right-click menu, can be picked randomly by the automatic idle scheduler, and can be picked randomly as a double-click reaction. Its blank trailing frames are excluded.
- `sit`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler. This is a generated v0.2.1 replacement for the missing sitting row.

Automatic idle micro-actions do not run while dragging, while the context menu is open, while a pointer interaction is active, or while the current persisted action is not `idle`.

## v0.2.1 Bug Fix Notes

Runtime and menu fixes:

- The native window size is now calculated from the larger of the pet frame and the open menu, so menu size no longer follows pet scale.
- Scale changes while the context menu is open keep the menu-safe native window size.
- Menu placement is recalculated after measuring the rendered menu, which keeps the bottom controls inside the window.
- Animation playback validates row, frame, and fps metadata before rendering and falls back to `idle` instead of showing an invalid blank frame.

Animation asset and action-label fixes:

- The action menu is generated from `pet.json` `menuActions`, replacing hard-coded HTML action buttons.
- `wake`, `blink`, `idle_breathe`, `idle_look`, `idle_stretch`, `idle_sit`, and `idle_blink` are retained as compatibility aliases for the corrected action names.
- `npm run check` now validates animation metadata, menu action metadata, aliases, drag/default actions, and animation group references before packaging.
- The QA contact sheet for the current atlas is generated under `.codex-temp/v0.2.1-atlas-qa/` during local review.

Known remaining asset work:

- Row 12 has been replaced with a generated sitting animation and is now exposed as `sit`; the row is cleared before replacement so old frames do not stack under the sitting frames.

## v0.2.2 Development Notes

Implemented v0.2.2 improvements and packaging work:

- The jump animation now reads optional per-frame `motionY` metadata and moves on the y-axis during playback.
- The right-click menu and tray quit actions both use the same Neutralino native exit path.
- The right-click menu has a tighter polished visual style, compact two-column action grid, focus state, and safer text overflow handling.
- The current spritesheet has been cleaned of strong green-screen/chroma-key residue pixels, and the `sit` row has been redrawn to match the older pixel style.
- Windows x64 releases can build an installer artifact with `npm run installer:win`, but the v0.2.2 installer is marked unavailable pending the v0.2.3 guided installer fix.
- Asset validation now reports malformed animation objects and bad `motionY` metadata as structured validation errors instead of crashing during packaging checks.

## v0.2.3 Development Notes

Implemented v0.2.3 improvements and bug fixes:

- Windows x64 releases now require Inno Setup for the visible guided installer; the unsupported IExpress fallback has been removed.
- The dedicated `sleep` action uses a generated atlas row 10 sleep animation, appears in the menu as `休眠`, and can be selected by the automatic idle scheduler.
- Opening the right-click menu docks it beside the desktop pet and expands the native window width instead of covering the sprite.
- Scaling while the right-click menu is open recalculates the docked menu position before resizing the native window, so the menu remains unscaled and unclipped.
- Drag-only animations are renamed to `run_right` and `run_left`; old `happy_run`, `run`, and `walk_drag` keys remain compatibility aliases.
- Single-click and double-click reactions use distinct animation groups so their feedback does not overlap.
- `idle_long` is removed from the menu and idle scheduler, but remains available through the old `idle_breathe` compatibility alias.

## v0.2.4 Discussion Queue

GitHub Issue #4 用于跟踪 `v0.2.4` 动画改良讨论。当前需要在甩动、摔落等边界清晰的物理效果，和更多交互 / 待机动画之间确定优先级；新动作创意、触发方式、气泡文本和实现逻辑继续保留在 Issue 讨论中，`TODO.md` 只记录明确的代码任务。

## Repository Rules

Do not work directly on `main`. Create a branch for every change and merge only after review. Every completed edit must update both this README and `CHANGELOG.md`; changelog updates must be appended. Deferred code tasks are tracked in `TODO.md`.

## Development

Prerequisites:

- Node.js for the small static development server.
- Neutralinojs CLI: `npm install -g @neutralinojs/neu`.
- This workspace can run `neu` through `scripts/neu-runner.js`, which uses `D:\environment\HuaWei\Node\node.exe` when the older default Node 14 runtime cannot start the latest CLI.
- Neutralino runtime/client `6.7.0` or newer. Older `5.6.0` binaries crashed on this Windows/WebView2 environment during window startup.
- Inno Setup 6 for Windows installer builds. If `ISCC.exe` is not in `PATH`, set `ISCC_EXE` to its full path before running the installer command.

Common commands:

```powershell
npm run dev:web
npm run check
neu update
neu run
```

The package scripts wrap those commands:

```powershell
npm run neu:update
npm run neu:run
npm run neu:build
npm run installer:win
```

If the app starts and keeps running during a test, close it from the pet menu or Windows tray before starting another `neu run` session.

On high-DPI Windows displays, the app sizes the native window with `devicePixelRatio` so the full `192x208` sprite frame remains visible instead of showing only the upper part of the character.

If a native API call fails, the pet continues animating and logs the failure to the WebView console instead of blocking startup.

`npm run build:web` verifies that required web, pet metadata, sprite, app icon, and tray icon assets are present before packaging.

`npm run installer:win` expects `npm run neu:build` to have produced `dist/NuiPet/NuiPet-win_x64.exe` and `dist/NuiPet/resources.neu`. It copies those files plus `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` into the current `releases/v<version>/` directory, then emits `NuiPet-v<version>-setup.exe` through Inno Setup. The command fails with a clear message if `ISCC.exe` is unavailable; install Inno Setup 6 or set `ISCC_EXE` before building the installer.

The frontend is intentionally framework-free. `web/main.js` renders the pet and uses Neutralino APIs when running inside the desktop shell. Browser preview falls back to `localStorage`.

Neutralino executable icons use the project-relative `applicationIcon` path. The tray icon uses a runtime resource URL from the `web` document root.

## Assets And Licensing

The source code is MIT licensed. The 鹿弈Nui character artwork, sprite sheet, character name, likeness, and related brand assets are not included in that license unless a separate written license explicitly grants those rights.

The current atlas is stored at `web/assets/pets/luyi-nui/spritesheet.webp` and described by `web/assets/pets/luyi-nui/pet.json`. Pet metadata defines the atlas grid, action frames, optional animation groups, and categorized bubble text used by the runtime.

## Closed-Source Distribution

NuiPet is distributed as a closed-source application package. This does not require publishing the NuiPet application source code under the Neutralinojs license, because Neutralinojs is distributed under the MIT License and permits closed-source use, modification, distribution, sublicensing, and sale.

Distribution packages that include Neutralinojs runtime binaries, the Neutralino client library, or substantial portions of Neutralinojs must preserve the applicable Neutralinojs copyright and license notices. Release packages should include a third-party notices file that covers Neutralinojs and its bundled third-party components.

Neutralinojs attribution must not imply official endorsement, certification, or sponsorship by the Neutralinojs project or its contributors. Describing Neutralinojs as part of the technical stack is acceptable.

The closed-source distribution policy does not change the separate reserved-rights boundary for 鹿弈Nui character artwork, sprites, name, likeness, or related brand assets.

## GitHub

The intended remote is a private repository at `Zeroysx/NuiPet`. Development should happen on `feature/bootstrap-nuipet` or another reviewed feature branch, then be merged into `main` after review.

## Releases

Packaged release builds are stored under `releases/`, with one subdirectory per version. The current archived Windows x64 package is in `releases/v0.2.2/` and must keep `NuiPet-win_x64.exe` next to `resources.neu`. The v0.2.2 release directory also includes `NuiPet-v0.2.2-setup.exe` for archival review, but that installer is marked unavailable and should not be used for distribution. New installer builds should use the v0.2.3 guided Inno Setup path. The version README contains the Chinese release notes, author attribution, usage scope, links, BUG feedback email, version, and technical stack section.

GitHub release `v0.1.0` publishes the same Windows x64 package files as release assets.
