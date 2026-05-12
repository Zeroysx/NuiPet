# NuiPet

NuiPet is a desktop pet project based on the virtual streamer 鹿弈Nui. The Windows version focuses on a lightweight, transparent, always-on-top pet window built with Neutralinojs and plain web assets.

## Current MVP

- Transparent frameless desktop pet window.
- Always-on-top behavior with a toggle in the pet menu.
- Sprite animation from a WebP atlas at `192x208` pixels per frame.
- Actions are mapped to the verified atlas row meanings: idle, drag-only run variants, wave, jump, cry, second idle, light jog, thinking, long idle, nod, and sitting.
- v0.2.0 expands the atlas to `8x14` and adds idle micro-actions for breathing, looking around, stretching, sitting, and blinking.
- v0.2.1 defines the action menu from `pet.json`, so action labels and menu trigger buttons stay bound to the same metadata.
- The renderer reads atlas columns, rows, frame width, and frame height from pet metadata instead of hard-coding the old `8x9` layout.
- Right-click menu for action switching, scale changes, always-on-top, and quit.
- The right-click menu exposes every configured action in `pet.json`, including idle micro-actions used for direct QA triggering.
- The in-app and tray menus use Chinese labels for the target desktop pet experience.
- Left-click reaction feedback and drag-to-move behavior.
- Single-click, double-click, drag start, drag end, idle, and menu interactions use categorized Chinese bubble text pools.
- Idle micro-actions play automatically after a short quiet period without overriding a recent drag or menu-selected action.
- Visual feedback includes click pop, double-click hop, drag highlighting, drop squash, and bubble entrance animation.
- Dragging temporarily plays the direction-specific drag running animation and restores the previous action after the drag ends.
- The drag animation flips horizontally when dragging left so the pet faces the drag direction.
- Drag-facing direction uses direction-specific run rows plus a small accumulated horizontal threshold, so pointer jitter at drag start does not flip the pet the wrong way.
- Dragging is implemented with explicit window movement instead of native drag handoff, which keeps animation direction and always-on-top state consistent.
- The window expands while the right-click menu is open so all menu rows render inside the native window bounds.
- Drag movement uses the display scale factor, so the window follows the cursor correctly on high-DPI displays.
- Drag-facing direction updates from the latest pointer movement, so reversing direction mid-drag flips the animation immediately.
- Click reactions rotate through a small Chinese text pool based on 鹿弈Nui references.
- Animation and menu actions are resilient to Neutralino storage/window API failures, so native persistence problems do not freeze the pet on the first frame.
- System tray menu for show/hide and quit.
- Persisted settings for action, scale, always-on-top, and last known window position.

## Animation Triggers

Current action keys and trigger conditions:

- `idle`: Default startup action, fallback action when a saved action is invalid, and the baseline action after idle micro-actions finish.
- `happy_run`: Drag-only running variant. It is not shown in the right-click menu.
- `run`: Drag-only running variant. It is not shown in the right-click menu.
- `wave`: Can be selected from the right-click menu and can be picked randomly as a single-click reaction.
- `jump`: Can be selected from the right-click menu, can be picked randomly as a single-click reaction, and can be picked randomly as a double-click reaction.
- `cry`: Can be selected from the right-click menu.
- `idle_alt`: Can be selected from the right-click menu and can be picked randomly as an idle variant. This replaces the old `wake` label.
- `walk`: Can be selected from the right-click menu and is labeled as a light jog because the row visually matches running more than walking.
- `think`: Can be selected from the right-click menu and can be picked randomly as a single-click reaction. This is the only retained thinking action.
- `idle_long`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler. This replaces the old `idle_breathe` label.
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
- `sleep`, `wake`, `blink`, `idle_breathe`, `idle_look`, `idle_stretch`, `idle_sit`, and `idle_blink` are retained as compatibility aliases for the corrected action names.
- `npm run check` now validates animation metadata, menu action metadata, aliases, drag/default actions, and animation group references before packaging.
- The QA contact sheet for the current atlas is generated under `.codex-temp/v0.2.1-atlas-qa/` during local review.

Known remaining asset work:

- Row 12 has been replaced with a generated sitting animation and is now exposed as `sit`; the row is cleared before replacement so old frames do not stack under the sitting frames.

## v0.2.2 Development Plan

Planned v0.2.2 improvements and bug fixes:

- Optimize the jump animation by moving the sprite on the y-axis during playback so the action reads as a more natural jump instead of only cycling frames in place.
- Fix the quit menu action so closing the desktop pet fully terminates the Neutralino process instead of only hiding or leaving the process alive.
- Polish the right-click menu visual design while keeping the compact desktop-pet control surface.
- Remove or repair remaining green-screen/chroma-key pixel residue in affected animation frames.

## Repository Rules

Do not work directly on `main`. Create a branch for every change and merge only after review. Every completed edit must update both this README and `CHANGELOG.md`; changelog updates must be appended.

## Development

Prerequisites:

- Node.js for the small static development server.
- Neutralinojs CLI: `npm install -g @neutralinojs/neu`.
- This workspace can run `neu` through `scripts/neu-runner.js`, which uses `D:\environment\HuaWei\Node\node.exe` when the older default Node 14 runtime cannot start the latest CLI.
- Neutralino runtime/client `6.7.0` or newer. Older `5.6.0` binaries crashed on this Windows/WebView2 environment during window startup.

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
```

If the app starts and keeps running during a test, close it from the pet menu or Windows tray before starting another `neu run` session.

On high-DPI Windows displays, the app sizes the native window with `devicePixelRatio` so the full `192x208` sprite frame remains visible instead of showing only the upper part of the character.

If a native API call fails, the pet continues animating and logs the failure to the WebView console instead of blocking startup.

`npm run build:web` verifies that required web, pet metadata, sprite, app icon, and tray icon assets are present before packaging.

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

Packaged release builds are stored under `releases/`, with one subdirectory per version. The current Windows x64 package is in `releases/v0.2.1/` and must keep `NuiPet-win_x64.exe` next to `resources.neu`. The version README contains the Chinese release notes, author attribution, usage scope, links, BUG feedback email, version, and technical stack section.

GitHub release `v0.1.0` publishes the same Windows x64 package files as release assets.
