# NuiPet

NuiPet is a desktop pet project based on the virtual streamer 鹿弈Nui. The first version targets Windows and focuses on a lightweight, transparent, always-on-top pet window built with Tauri v2, Rust, and plain web assets.

## Current MVP

- Transparent frameless desktop pet window.
- Always-on-top behavior with a toggle in the pet menu.
- Sprite animation from an `8x9` WebP atlas at `192x208` pixels per frame.
- Actions for idle, walk, jump, wave, sit, sleep, and wake.
- Right-click menu for action switching, scale changes, always-on-top, and quit.
- System tray menu for show/hide and quit.
- Persisted settings for action, scale, always-on-top, and last known window position.

## Repository Rules

Do not work directly on `main`. Create a branch for every change and merge only after review. Every completed edit must update both this README and `CHANGELOG.md`; changelog updates must be appended.

## Development

Prerequisites:

- Rust stable toolchain.
- Microsoft C++ Build Tools and WebView2 Runtime for Windows Tauri development.
- Node.js for the small static development server.
- Tauri CLI, installed either as a Cargo subcommand or npm package.

Common commands:

```powershell
npm run dev:web
cargo check --manifest-path src-tauri/Cargo.toml
cargo tauri dev
```

`npm run build:web` verifies that required web, pet metadata, sprite, and tray icon assets are present before Tauri packaging.

The frontend is intentionally framework-free. `web/main.js` renders the pet and calls Tauri commands through the global Tauri API. Rust code in `src-tauri/src/lib.rs` owns the window, tray, and settings file.

## Assets And Licensing

The source code is MIT licensed. The 鹿弈Nui character artwork, sprite sheet, character name, likeness, and related brand assets are not included in that license unless a separate written license explicitly grants those rights.

The current atlas is stored at `web/assets/pets/luyi-nui/spritesheet.webp` and described by `web/assets/pets/luyi-nui/pet.json`.

## GitHub

The intended remote is a private repository at `Zeroysx/NuiPet`. Development should happen on `feature/bootstrap-nuipet` or another reviewed feature branch, then be merged into `main` after review.
