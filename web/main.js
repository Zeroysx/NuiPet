(function () {
  const pet = document.getElementById("pet");
  const menu = document.getElementById("menu");
  const scaleLabel = document.getElementById("scaleLabel");
  const pinToggle = document.getElementById("pinToggle");
  const quit = document.getElementById("quit");
  const tauri = window.__TAURI__;
  const invoke = tauri && tauri.core ? tauri.core.invoke : null;
  const appWindow = tauri && tauri.window ? tauri.window.getCurrentWindow() : null;

  const frameWidth = 192;
  const frameHeight = 208;
  const defaults = {
    action: "idle",
    scale: 1,
    always_on_top: true,
    x: null,
    y: null
  };

  let petData = null;
  let settings = Object.assign({}, defaults);
  let frameIndex = 0;
  let lastFrameAt = 0;
  let lastPositionSave = 0;
  let dragging = false;

  function clampScale(value) {
    return Math.min(3, Math.max(0.5, Math.round(value * 10) / 10));
  }

  function updateScale() {
    settings.scale = clampScale(settings.scale);
    document.documentElement.style.setProperty("--scale", String(settings.scale));
    scaleLabel.textContent = `${Math.round(settings.scale * 100)}%`;
  }

  function updatePin() {
    pinToggle.classList.toggle("is-active", settings.always_on_top);
    pinToggle.textContent = settings.always_on_top ? "On top: On" : "On top: Off";
  }

  async function persist(applyWindow) {
    if (invoke) {
      await invoke(applyWindow ? "apply_settings" : "save_settings", { settings });
      return;
    }
    localStorage.setItem("nuipet.settings", JSON.stringify(settings));
  }

  async function readPosition() {
    if (!appWindow || !appWindow.outerPosition) {
      return;
    }

    try {
      const position = await appWindow.outerPosition();
      settings.x = position.x;
      settings.y = position.y;
    } catch (_error) {
      // Position access is best effort because browser preview mode has no Tauri window.
    }
  }

  async function savePositionSoon() {
    const now = Date.now();
    if (now - lastPositionSave < 350) {
      return;
    }

    lastPositionSave = now;
    await readPosition();
    await persist(false);
  }

  async function setAction(action) {
    if (!petData.animations[action]) {
      return;
    }

    settings.action = action;
    frameIndex = 0;
    lastFrameAt = 0;
    await persist(false);
  }

  function showMenu(x, y) {
    menu.hidden = false;
    const maxX = Math.max(0, window.innerWidth - menu.offsetWidth - 4);
    const maxY = Math.max(0, window.innerHeight - menu.offsetHeight - 4);
    menu.style.left = `${Math.min(x, maxX)}px`;
    menu.style.top = `${Math.min(y, maxY)}px`;
  }

  function hideMenu() {
    menu.hidden = true;
  }

  function renderFrame(timestamp) {
    const animation = petData.animations[settings.action] || petData.animations.idle;
    const interval = 1000 / animation.fps;

    if (!lastFrameAt || timestamp - lastFrameAt >= interval) {
      const column = animation.frames[frameIndex % animation.frames.length];
      const row = animation.row;
      pet.style.backgroundPosition = `-${column * frameWidth}px -${row * frameHeight}px`;
      frameIndex += 1;
      lastFrameAt = timestamp;
    }

    requestAnimationFrame(renderFrame);
  }

  async function loadSettings() {
    if (invoke) {
      settings = Object.assign({}, defaults, await invoke("load_settings"));
      return;
    }

    try {
      settings = Object.assign({}, defaults, JSON.parse(localStorage.getItem("nuipet.settings") || "{}"));
    } catch (_error) {
      settings = Object.assign({}, defaults);
    }
  }

  async function init() {
    const response = await fetch("./assets/pets/luyi-nui/pet.json");
    petData = await response.json();
    await loadSettings();
    if (!petData.animations[settings.action]) {
      settings.action = "idle";
    }
    updateScale();
    updatePin();
    await persist(true);
    requestAnimationFrame(renderFrame);
  }

  pet.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showMenu(event.clientX, event.clientY);
  });

  pet.addEventListener("pointerdown", async (event) => {
    if (event.button !== 0) {
      return;
    }

    dragging = true;
    hideMenu();
    if (appWindow && appWindow.startDragging) {
      try {
        await appWindow.startDragging();
      } catch (_error) {
        dragging = false;
      }
    }
  });

  window.addEventListener("pointerup", async () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    await savePositionSoon();
  });

  window.addEventListener("blur", hideMenu);

  menu.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.dataset.action) {
      await setAction(button.dataset.action);
      hideMenu();
    }

    if (button.dataset.scale) {
      settings.scale += button.dataset.scale === "+" ? 0.1 : -0.1;
      updateScale();
      await persist(true);
    }
  });

  pinToggle.addEventListener("click", async () => {
    settings.always_on_top = !settings.always_on_top;
    updatePin();
    await persist(true);
  });

  quit.addEventListener("click", async () => {
    if (invoke) {
      await invoke("quit_app");
    }
  });

  setInterval(savePositionSoon, 5000);
  init();
})();
