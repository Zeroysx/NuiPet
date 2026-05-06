# NuiPet

NuiPet is a desktop pet project based on the virtual streamer 鹿弈Nui. The Windows version focuses on a lightweight, transparent, always-on-top pet window built with Neutralinojs and plain web assets.

## Current MVP

- Transparent frameless desktop pet window.
- Always-on-top behavior with a toggle in the pet menu.
- Sprite animation from a WebP atlas at `192x208` pixels per frame.
- Actions are labeled by the current sprite reading: idle, happy run while dragging, wave, jump, walking, crying, and wake/blink rows.
- v0.2.0 expands the atlas to `8x14` and adds idle micro-actions for breathing, looking around, stretching, sitting, and blinking.
- The renderer reads atlas columns, rows, frame width, and frame height from pet metadata instead of hard-coding the old `8x9` layout.
- Right-click menu for action switching, scale changes, always-on-top, and quit.
- The right-click menu exposes every current animation action, including idle micro-actions that are otherwise random or reaction-only.
- The in-app and tray menus use Chinese labels for the target desktop pet experience.
- Left-click reaction feedback and drag-to-move behavior.
- Single-click, double-click, drag start, drag end, idle, and menu interactions use categorized Chinese bubble text pools.
- Idle micro-actions play automatically after a short quiet period without overriding a recent drag or menu-selected action.
- Visual feedback includes click pop, double-click hop, drag highlighting, drop squash, and bubble entrance animation.
- Dragging temporarily plays the happy running animation and restores the previous action after the drag ends.
- The drag animation flips horizontally when dragging left so the pet faces the drag direction.
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
- `walk`: Plays temporarily while dragging the desktop pet window. It is labeled as the happy running drag animation in the current menu.
- `run`: Can be selected from the right-click menu.
- `wave`: Can be selected from the right-click menu and can be picked randomly as a single-click reaction.
- `jump`: Can be selected from the right-click menu, can be picked randomly as a single-click reaction, and can be picked randomly as a double-click reaction.
- `sleep`: Can be selected from the right-click menu. The current sprite reading labels this row as crying.
- `wake`: Can be selected from the right-click menu and can be picked randomly as a double-click reaction.
- `sit`: Can be selected from the right-click menu. The current sprite reading labels this row as walking.
- `blink`: Can be selected from the right-click menu. Automatic blinking uses `idle_blink`.
- `idle_breathe`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler after a quiet period while the persisted action is `idle`.
- `idle_look`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler after a quiet period while the persisted action is `idle`.
- `idle_stretch`: Can be selected from the right-click menu, can be picked randomly by the automatic idle scheduler, and can be picked randomly as a double-click reaction.
- `idle_sit`: Can be selected from the right-click menu and can be picked randomly by the automatic idle scheduler after a quiet period while the persisted action is `idle`.
- `idle_blink`: Can be selected from the right-click menu, can be picked randomly by the automatic idle scheduler, and can be picked randomly as a single-click reaction.

Automatic idle micro-actions do not run while dragging, while the context menu is open, while a pointer interaction is active, or while the current persisted action is not `idle`.

## Development Plan

Planned v0.2.1 bug-fix candidates:

Runtime and menu issues:

- The desktop pet can occasionally disappear. The initial suspicion is that some animation playback paths may reference missing or unsuitable frames.
- Switching actions through the right-click menu can render the menu incorrectly and crop the bottom area. v0.2.0 now sizes the native window from the menu's measured height, but v0.2.1 should keep this issue on the verification list if clipping recurs.
- Scaling the pet model can still make the menu follow the model size and crop incorrectly. v0.2.1 should separate menu sizing from pet scale more rigorously.

Animation asset and action-label issues:

- `idle_sit` / sitting is effectively a walking animation, so a real sitting animation is missing.
- `idle_breathe` is not visually distinct from the normal `idle` animation.
- `wake` is closer to a light waist-twist motion than a wake-up animation, and it appears to have missing frames.
- `blink` is closer to part of a thinking animation than a clean blink.
- `idle_look` is effectively a shorter thinking animation rather than a distinct looking-around action.
- `idle_stretch` and `wake` are effectively the same action.
- `idle_blink` is also a shorter thinking-style action rather than a true idle blink.

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

Packaged release builds are stored under `releases/`, with one subdirectory per version. The current Windows x64 package is in `releases/v0.1.0/` and must keep `NuiPet-win_x64.exe` next to `resources.neu`. The version README contains the Chinese release notes, author attribution, usage scope, links, BUG feedback email, version, and technical stack section.

GitHub release `v0.1.0` publishes the same Windows x64 package files as release assets.
