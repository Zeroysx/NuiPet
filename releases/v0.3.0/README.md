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
- Animation metadata can define optional `motionX` and `motionY` frame offsets for small in-place movement fixes without adding new atlas rows.
- Dragging temporarily plays the `run_right` or `run_left` drag running animation and restores the previous action after the drag ends.
- The drag animation flips horizontally when dragging left so the pet faces the drag direction.
- Drag-facing direction uses direction-specific run rows plus a small accumulated horizontal threshold, so pointer jitter at drag start does not flip the pet the wrong way.
- Dragging is implemented with explicit window movement instead of native drag handoff, which keeps animation direction and always-on-top state consistent.
- Fast drag release can trigger short horizontal inertia or vertical lift-and-fall physics while slow release remains a normal position adjustment.
- Horizontal inertia release keeps the normal direction-aware running action during drag, then switches after release to independently generated atlas-backed `slide_stop_right` or `slide_stop_left` frames on row 1/2 columns 8-15; horizontal braking uses eased speed decay so the slide-stop reads longer and smoother.
- Diagonal fast release is classified separately when horizontal speed reaches inertia speed and the vertical component is visibly off-axis, plays the low `diagonal_pounce_right` or `diagonal_pounce_left` pounce first, then completes with a dedicated `diagonal_pounce_land_right` or `diagonal_pounce_land_left` recovery instead of freezing on the touch-down frame.
- Dragging, throw physics, and saved window restoration clamp the pet inside the primary display so it cannot disappear beyond the desktop edge.
- The window expands while the right-click menu is open so the menu docks beside the pet instead of covering it.
- The right-click menu can dock to the left when the pet is near the right screen edge, then restore the pet anchor position after closing.
- Drag movement uses the display scale factor, so the window follows the cursor correctly on high-DPI displays.
- Drag-facing direction updates from the latest pointer movement, so reversing direction mid-drag flips the animation immediately.
- Click reactions rotate through a small Chinese text pool based on 鹿弈Nui references.
- Animation and menu actions are resilient to Neutralino storage/window API failures, so native persistence problems do not freeze the pet on the first frame.
- System tray menu for show/hide, action switching, always-on-top, and quit.
- The right-click menu and tray quit actions share the same native exit path, with a process-kill fallback if the graceful Neutralino exit leaves the process alive.
- Persisted settings for action, scale, always-on-top, and last known window position.

## Animation Triggers

Current action keys and trigger conditions:

- `idle`: Default startup action, fallback action when a saved action is invalid, and the baseline action after idle micro-actions finish.
- `run_right`: Drag-only right-facing running variant. It is not shown in the right-click menu. The old `happy_run` and `walk_drag` keys remain compatibility aliases.
- `run_left`: Drag-only left-facing running variant. It is not shown in the right-click menu. The old `run` key remains a compatibility alias.
- `wave`: Can be selected from the right-click menu and can be picked randomly as a single-click reaction.
- `jump`: Can be selected from the right-click menu and can be picked randomly as a double-click reaction. It defines `motionY` offsets for the visible jump arc.
- `fall`: Physics-only action used during fast vertical drag release. It uses an independently generated 16-frame airborne row on atlas row 13 with stronger weightless imbalance and loops while the pet is still falling.
- `fall_land`: Physics-only impact follow-up on atlas row 14. It starts only after the pet reaches the bottom and uses 16 frames for a smoother touch-down into a forward tumble.
- `fall_getup`: Physics-only recovery follow-up on atlas row 15. It extends the recovery with 16 slower prone-to-standing get-up frames.
- `diagonal_pounce_right` / `diagonal_pounce_left`: Physics-only actions used for diagonal drag release. They use dedicated low front-pounce frames on row 11 / row 12 columns 8-15 before the runtime transitions into the matching landing completion action; the left row is pre-mirrored and is not mirrored again at runtime.
- `diagonal_pounce_land_right` / `diagonal_pounce_land_left`: Physics-only landing completion actions for diagonal pounce. They use newly generated row 5 / row 6 columns 8-15 frames to recover from touch-down into a stable stand without reusing fall, slide-stop, or pounce frames.
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
- The right-click menu and tray quit actions both use the same Neutralino native exit path, with a delayed `killProcess` fallback for cases where `app.exit` does not fully terminate the packaged process.
- The right-click menu has a tighter polished visual style, compact two-column action grid, focus state, and safer text overflow handling.
- The current spritesheet has been cleaned of strong green-screen/chroma-key residue pixels, and the `sit` row has been redrawn to match the older pixel style.
- Windows x64 releases can build an installer artifact with `npm run installer:win`, but the v0.2.2 installer is marked unavailable pending the v0.2.3 guided installer fix.
- Asset validation now reports malformed animation objects and bad `motionY` metadata as structured validation errors instead of crashing during packaging checks.

## v0.2.3 Development Notes

Implemented v0.2.3 improvements and bug fixes:

- Windows x64 releases now require Inno Setup for the visible guided installer; the unsupported IExpress fallback has been removed.
- The dedicated `sleep` action uses a row 10 prone sleeping animation with a small attached `Z` cue, appears in the menu as `休眠`, and can be selected by the automatic idle scheduler. It transitions from standing into a consistent left-facing lying pose, fixes the second-frame lowered knees into smooth exposed knees, holds the sleeping frames longer, then returns to `idle` after playback.
- Opening the right-click menu docks it beside the desktop pet and expands the native window width instead of covering the sprite.
- Scaling while the right-click menu is open recalculates the docked menu position before resizing the native window, so the menu remains unscaled and unclipped.
- Drag-only animations are renamed to `run_right` and `run_left`; old `happy_run`, `run`, and `walk_drag` keys remain compatibility aliases.
- Single-click and double-click reactions use distinct animation groups so their feedback does not overlap.
- `idle_long` is removed from the menu and idle scheduler, but remains available through the old `idle_breathe` compatibility alias.

## v0.3.0 Development Notes

Implemented v0.3.0 runtime physics and menu improvements:

- Package and Neutralino metadata are updated to `0.3.0`.
- Drag release samples the last 120ms of pointer movement, so fast horizontal release adds short inertia while slow release remains a precise position adjustment.
- Horizontal inertia release now keeps drag-time left/right run playback separate from release-time brake sliding; after release, `slide_stop_right` and `slide_stop_left` play independently generated low slide-stop atlas frames with slower playback and eased horizontal speed decay instead of relying on CSS skew, squash, stretch, or transformed running frames as the primary motion.
- Fast vertical release triggers a short lift, a dedicated independently generated `fall` action, visible falling animation, and direct landing without bounce; `fall`, `fall_land`, and `fall_getup` now use 16-frame rows with higher fps for smoother airborne, impact, and recovery timing.
- Diagonal release now has a normalized velocity classifier and a low pounce phase, so mixed horizontal and vertical throws do not collapse into only slide-stop or only fall behavior while near-horizontal movement still stays on the slide-stop path.
- Diagonal pounce preserves horizontal velocity through the airborne arc with only light air drag, then plays a dedicated landing completion sequence while applying a short pounce-specific landing brake without playing the pure horizontal slide-stop action.
- The diagonal pounce landing rows have been regenerated and checked from the final WebP output, so the landing completion now reads as touch-down, brace, crouch, and stand instead of holding broken or unrelated frames after impact.
- After the diagonal landing completion animation finishes, residual horizontal velocity is cleared before restoring the previous action to avoid post-landing slide or animation stutter.
- Pet window coordinates are clamped during dragging, release physics, menu restoration, and startup restore so the pet remains interactable at desktop edges.
- Animation metadata supports optional `motionX` tracks, and `walk` uses a small horizontal frame offset to make the light jog less stiff.
- The right-click menu chooses left or right docking based on available screen width and restores the pet anchor position after the menu closes.
- Windows tray menu behavior is still under investigation: show/hide, always-on-top, action switching, and quit are implemented in code, but the tray icon is a known unresolved BUG in the packaged Windows build.

## 物理效果开发计划

### 已完成

- [x] 水平拖拽物理效果：拖动时播放正常 `run_right` / `run_left` 移动动画，松手进入水平惯性后切换到独立 `slide_stop_right` / `slide_stop_left` 滑步刹停动画，并使用平滑速度衰减延长刹停过程。
- [x] 垂直拖拽物理效果：快速竖直释放触发提起、坠落、落地和恢复动作，慢速释放仍作为普通位置调整处理。
- [x] 拖拽、惯性、坠落和窗口恢复过程都会钳制到主显示器范围，避免桌宠滑出屏幕外。
- [x] 斜向拖拽物理效果：根据释放速度向量区分纯水平、纯垂直和斜向释放，斜向释放先播放 row 11/12 的 `diagonal_pounce_right` / `diagonal_pounce_left` 低位飞扑阶段，再落到松手位置下方一小段并衔接 row 5/6 的 `diagonal_pounce_land_right` / `diagonal_pounce_land_left` 落地完成动作。

### 斜向动作物理复合效果计划

斜向拖拽释放需要把水平惯性和垂直坠落组合成一个连续物理过程，避免水平滑步和垂直坠落各自独立触发时产生动作割裂。

- 已完成根据释放速度向量同时判断水平与垂直分量，保留低速精确放置、高速水平惯性和高速垂直坠落三类交互边界。
- 已完成斜向释放组合状态机：水平速度达到惯性阈值、垂直分量达到可感知偏移且比例落在斜向范围时，先进入斜向飞出 / 失衡阶段，再根据落地时机切换到落地恢复或滑步刹停阶段。
- 已完成斜向复合动作优先级：纯水平使用 `slide_stop_right` / `slide_stop_left`，纯垂直使用 `fall` / `fall_land` / `fall_getup`，斜向释放使用 `diagonal_pounce_right` / `diagonal_pounce_left` 作为独立飞扑阶段。
- 当前斜向飞扑动作使用 row 11 / row 12 columns 8-15 的专用低位正面前扑帧，不再复用 row 13 坠落帧；row 12 已预先镜像为左向动作，运行时不再额外翻转。
- 当前斜向飞扑视觉只播放 spritesheet 图集帧，运行时不再对整张角色图片叠加 CSS 旋转、缩放或位移动画，避免生成素材被二次扭曲。
- 已保持窗口边界钳制、落地点计算和速度衰减一致，避免斜向释放时穿出屏幕或在屏幕边缘突然中断动作。

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

`npm run build:web` verifies that required web, pet metadata, sprite, app icon, tray icon assets, and drag-release action mappings are present before packaging.

`npm run installer:win` expects `npm run neu:build` to have produced `dist/NuiPet/NuiPet-win_x64.exe` and `dist/NuiPet/resources.neu`. It copies those files plus `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` into the current `releases/v<version>/` directory, then emits `NuiPet-v<version>-setup.exe` through Inno Setup. The command fails with a clear message if `ISCC.exe` is unavailable; install Inno Setup 6 or set `ISCC_EXE` before building the installer.

The frontend is intentionally framework-free. `web/main.js` renders the pet and uses Neutralino APIs when running inside the desktop shell. Browser preview falls back to `localStorage`.

Neutralino executable icons use the project-relative `applicationIcon` path. The tray icon uses a runtime resource URL from the `web` document root.

## 开发计划

### v0.3.0 阶段目标

本阶段开发目标是为桌宠提供更好的物理效果，并修复上个版本存在的一些问题。

- 新增桌宠水平拖动惯性效果，必要时创建对应的滑行动画。
- 新增桌宠垂直提起与坠落效果，并与竖直调整桌宠位置的交互明确区分。
- 修复轻快小跑动画动作生硬的问题；备选方案是为动画添加 x 轴移动效果，并完善移动帧。
- 修复菜单默认出现在模型右边时，在模型靠近屏幕右边界会出现的位置错误。

### v0.3.0 已知 BUG

- Windows 系统托盘 / 菜单栏小图标在当前打包版本中仍无法正常显示；已有资源路径、资源解包临时文件和菜单项简化方案均未解决，需要后续单独调查 Neutralino Windows 托盘图标加载机制或改用其他托盘实现方案。

### 长期计划

- Android 端桌宠移植。
- Mac 端桌宠移植。
- 桌宠自主移动能力。
- 桌宠与窗口交互的能力。

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

Packaged release builds are stored under `releases/`, with one subdirectory per version. The current v0.3.0 Windows x64 portable package is in `releases/v0.3.0/` and includes the rebuilt `NuiPet-win_x64.exe` plus `resources.neu` with the regenerated diagonal landing spritesheet. The v0.2.3 archive remains the latest guided installer package. New installer builds should use the guided Inno Setup path. The version README contains the Chinese release notes, author attribution, usage scope, links, BUG feedback email, version, and technical stack section.

GitHub release `v0.1.0` publishes the same Windows x64 package files as release assets.
