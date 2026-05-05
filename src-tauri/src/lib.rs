use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, LogicalSize, Manager, PhysicalPosition, WebviewWindow,
};

const FRAME_WIDTH: f64 = 192.0;
const FRAME_HEIGHT: f64 = 208.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetSettings {
    pub action: String,
    pub scale: f64,
    pub always_on_top: bool,
    pub x: Option<i32>,
    pub y: Option<i32>,
}

impl Default for PetSettings {
    fn default() -> Self {
        Self {
            action: "idle".to_string(),
            scale: 1.0,
            always_on_top: true,
            x: None,
            y: None,
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("settings.json"))
}

fn normalized_settings(mut settings: PetSettings) -> PetSettings {
    if settings.action.trim().is_empty() {
        settings.action = "idle".to_string();
    }
    settings.scale = settings.scale.clamp(0.5, 3.0);
    settings
}

fn write_settings(app: &AppHandle, settings: &PetSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let json = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| error.to_string())
}

fn apply_window_settings(window: &WebviewWindow, settings: &PetSettings) -> Result<(), String> {
    window
        .set_always_on_top(settings.always_on_top)
        .map_err(|error| error.to_string())?;
    window
        .set_size(LogicalSize::new(
            FRAME_WIDTH * settings.scale,
            FRAME_HEIGHT * settings.scale,
        ))
        .map_err(|error| error.to_string())?;

    if let (Some(x), Some(y)) = (settings.x, settings.y) {
        window
            .set_position(PhysicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<PetSettings, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(PetSettings::default());
    }

    let json = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let settings = serde_json::from_str::<PetSettings>(&json).unwrap_or_default();
    Ok(normalized_settings(settings))
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: PetSettings) -> Result<(), String> {
    write_settings(&app, &normalized_settings(settings))
}

#[tauri::command]
fn apply_settings(
    app: AppHandle,
    window: WebviewWindow,
    settings: PetSettings,
) -> Result<(), String> {
    let settings = normalized_settings(settings);
    apply_window_settings(&window, &settings)?;
    write_settings(&app, &settings)
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Show / Hide", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;
    let icon = Image::from_bytes(include_bytes!("../icons/icon.png"))?;

    TrayIconBuilder::new()
        .tooltip("NuiPet")
        .icon(icon)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            build_tray(app.handle())?;
            if let Some(window) = app.get_webview_window("main") {
                let settings = load_settings(app.handle().clone()).unwrap_or_default();
                let _ = apply_window_settings(&window, &settings);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            apply_settings,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running NuiPet");
}
