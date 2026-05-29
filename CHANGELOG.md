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

## 2026-05-16

- 在 README 中记录 `v0.2.4` 动画讨论队列。
- 明确 Issue 讨论保留在 GitHub，`TODO.md` 只记录代码任务。
- Started `v0.2.3` development on `codex/v0.2.3-development`.
- Updated package and Neutralino metadata to `0.2.3`.
- Removed the unsupported IExpress installer fallback so `npm run installer:win` now requires the guided Inno Setup path.
- Added the dedicated `sleep` action from atlas row 10, exposed it in the menu, and added it to automatic idle variants.
- Replaced atlas row 10 with a generated eight-frame sleep animation row.
- Cleared semi-transparent background residue from the generated row 10 sleep animation without recoloring the character pixels.
- Renamed drag-only run actions to `run_right` and `run_left` while retaining compatibility aliases for old action keys.
- Docked the right-click menu beside the pet so opening the menu no longer covers the sprite.
- Recalculated the docked menu position during scale changes so the menu no longer follows stale pet-scale bounds or gets clipped.
- Split single-click and double-click reaction animation groups so their visual feedback does not overlap.
- Removed `idle_long` from menu and automatic idle pools while retaining the compatibility alias path.
- Cleared completed v0.2.2 review follow-up code tasks from `TODO.md`.

## 2026-05-18

- Built and archived the Windows x64 `v0.2.3` portable release package under `releases/v0.2.3/`.
- Built the guided Inno Setup installer `NuiPet-v0.2.3-setup.exe` for the archived Windows x64 release package.
- Rebuilt the `sleep` row from idle-scale frames, made it a longer non-looping rest sequence, and returned it to `idle` after playback.
- Redesigned the `sleep` row as a prone sleeping animation with a small attached `Z` cue while preserving idle-scale standing entry and exit frames.
- Regenerated the prone `sleep` row so the lowering and sleeping frames keep the same left-facing body direction.
- Removed an extra white knee-pad fragment from the second `sleep` animation frame.
- Corrected the second `sleep` frame cleanup so both lowered front knees render as smooth exposed knees instead of white pad-like shapes.

## 2026-05-20

- Added the v0.3.0 development plan covering improved pet physics, drag inertia, vertical lift and fall behavior, animation smoothing, menu positioning, and Windows tray icon menu access.
- Added long-term roadmap items for Android and Mac ports, autonomous pet movement, and window interaction capabilities.
- Updated package and Neutralino metadata to `0.3.0`.
- Added drag-release physics for horizontal inertia, vertical lift-and-fall movement, and damped landing after fast throws.
- Added optional `motionX` animation metadata, validation, and a small light-jog x-axis smoothing track.
- Reworked right-click menu docking so the menu can open on the left near the right screen edge without persisting the temporary window offset.
- Expanded the Windows tray menu to expose show/hide, action switching, always-on-top, and quit.
- Clamped restored, dragged, and thrown pet window positions to the primary display so the pet cannot disappear beyond desktop edges.
- Added runtime tray icon extraction to a temporary PNG file, simplified tray menu item IDs, and kept the visible falling animation that lands at the pre-drag height after fast vertical throws.
- Marked the packaged Windows tray icon display failure as an unresolved v0.3.0 BUG in the development plan.
- Added a physics-only `fall` action that plays descending jump poses during fast vertical release, then restores the previous action on landing.
- Replaced the temporary descending-jump `fall` placeholder with a subagent-generated independent falling spritesheet row on atlas row 13.
- Split the `fall` runtime playback into airborne looping frames and landing-only support frames so hand-on-ground poses appear only after the pet reaches the bottom.
- Expanded the generated fall sequence to 16 frames across airborne `fall` and landing `fall_land` rows so vertical throw recovery plays more smoothly.
- Added direction-aware horizontal inertia feedback with temporary run actions plus speed-decaying lean, stretch, offset, and light trailing shadow during left/right glide release.
- Removed vertical landing bounce and replaced the `fall_land` row with a tumble-and-get-up recovery sequence.
- Reworked the fall sequence into 24 generated frames across weightless airborne `fall`, impact-tumble `fall_land`, and extended prone-to-standing `fall_getup` rows.
- Extended the fall sequence to 48 frames with 16-frame airborne, impact, and get-up rows, and raised playback fps so the fall recovery reads longer and more continuous.

## 2026-05-23

- Added a horizontal inertia slide-tackle visual state that lowers, skews, squashes, and trails the pet during fast left/right glide release without adding new atlas rows.
- Updated v0.3.0 documentation to describe the improved left/right inertia slide feedback.
- Reworked horizontal inertia slide feedback into a low slide-step that decays with speed and removes the previous fall-like recovery motion at the end of the glide.
- Strengthened the low slide-step speed curve and visual range so ordinary horizontal inertia releases show a visible low sliding posture before smoothly returning to idle height.
- Anchored the low slide-step inside the native frame bounds so the feet no longer clip during horizontal inertia sliding.
- Added a delayed `app.killProcess()` fallback to right-click and tray quit actions so closing the desktop pet does not leave the packaged process alive.

## 2026-05-24

- Added a lower-body overlay during horizontal inertia sliding so the slide effect shows clearer limb motion synced to the current run frame cadence.
- Rebuilt the horizontal inertia visual as an ice-glide balance pose with forward glide, counter-lean, light lift, and no lower-body overlay or slide-tackle styling.
- Completed the ice-glide tuning by driving forward offset, counter-lean, stretch, and trail from the same speed-decay curve so ordinary horizontal releases visibly glide and naturally return upright.
- Reworked the release-only horizontal inertia visual into a stronger brake-slide stop animation that preserves normal drag running, then drops into a low counter-leaning slide with a distinct braking trail after release.
- Added real `slide_stop_right` and `slide_stop_left` spritesheet frames on row 1/2 columns 8-15 and routed horizontal inertia release to those atlas frames instead of CSS shape distortion.
- Replaced the transformed run-derived slide stop frames with subagent-generated low slide-stop pose sequences that use distinct arm and leg poses for clearer ice-glide braking.
- Smoothed horizontal inertia braking with exponential speed decay, a capped horizontal throw speed, a longer minimum slide-stop window, and slower slide-stop frame playback.
- Marked horizontal drag physics as complete in the documentation and added a development plan for diagonal composite drag-release physics.
- Added normalized diagonal release classification so mixed horizontal and vertical throw velocity is routed separately from pure slide-stop or pure fall.
- Added `diagonal_pounce_right` and `diagonal_pounce_left` physics actions, currently using the row 13 airborne imbalance frames as the fly-pounce phase before landing recovery or brake sliding.
- Added a diagonal release state machine that plays the pounce phase first, then switches to fall recovery or horizontal slide-stop according to the landing moment and remaining horizontal speed.
- Expanded asset validation to check slide-stop and diagonal-pounce direction mappings.
- Updated the README physics plan to mark diagonal drag release behavior complete and document the current row 13 pounce-frame reuse.

## 2026-05-25

- Regenerated diagonal pounce resources with subagent-produced low forward-pounce frames on row 11 and row 12 columns 8-15 instead of reusing the row 13 fall frames.
- Tightened diagonal release classification so only clearly downward throws with strong, balanced horizontal and vertical components trigger the pounce state.
- Shifted diagonal pounce landing slightly below the release point to better match delayed human release perception.
- Updated documentation to describe the dedicated diagonal pounce rows and stricter trigger behavior.
- Relaxed diagonal release classification so visible off-axis throws are no longer blocked by the full vertical fall threshold or downward-only requirement.
- Preserved airborne horizontal velocity during diagonal pounce with light air drag, reserving hard brake decay and stop thresholds for the post-landing slide.
- Redesigned diagonal pounce frames as a low front-pounce sequence and removed the extra runtime mirror that made left diagonal releases face the wrong direction.
- Mirrored the row 12 diagonal pounce frames at the asset level so leftward diagonal releases use a true left-facing pounce without runtime double-flip risk.
- Removed the horizontal slide-stop follow-up from diagonal pounce landing so the pet no longer appears to stand up and then abruptly kick or fall again.
- Added newly generated `diagonal_pounce_land_right` and `diagonal_pounce_land_left` recovery actions on row 5/6 columns 8-15, and routed diagonal pounce touch-down into those completion frames before restoring the previous action.
- Removed the CSS transform keyframes from diagonal pounce playback so the generated atlas frames are no longer distorted by runtime rotation, scaling, or offset animation.

## 2026-05-30

- Regenerated the diagonal pounce landing frames from an image-generated recovery strip, replacing the broken subagent cut with a visually checked low touch-down, brace, crouch, and stand sequence.
- Rebuilt row 5/6 columns 8-15 in `spritesheet.webp` from the checked landing atlas and verified the final WebP can be decoded back into a QA contact sheet.
- Stopped diagonal landing physics from extending residual horizontal slide after the landing completion animation has finished, so the pet restores its previous action immediately after the recovery frames.
- Rebuilt and replaced the `v0.3.0` portable release resources so the packaged app includes the regenerated diagonal landing spritesheet.
- Rescaled the diagonal pounce landing frames to match the existing idle/run sprite height while preserving the checked landing motion.
