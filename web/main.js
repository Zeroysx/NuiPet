(function () {
  const pet = document.getElementById("pet");
  const menu = document.getElementById("menu");
  const scaleLabel = document.getElementById("scaleLabel");
  const pinToggle = document.getElementById("pinToggle");
  const quit = document.getElementById("quit");
  const native = window.Neutralino || null;
  const storageKey = "nuipet.settings";

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

  function isNeutralino() {
    return Boolean(native && native.app && native.window);
  }

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

  async function applyWindow() {
    if (!isNeutralino()) {
      return;
    }

    await native.window.setAlwaysOnTop(settings.always_on_top);
    await native.window.setSize({
      width: Math.round(frameWidth * settings.scale),
      height: Math.round(frameHeight * settings.scale)
    });

    if (Number.isFinite(settings.x) && Number.isFinite(settings.y)) {
      await native.window.move(settings.x, settings.y);
    }
  }

  async function persist(applyWindowSettings) {
    if (isNeutralino() && native.storage) {
      await native.storage.setData(storageKey, JSON.stringify(settings));
      if (applyWindowSettings) {
        await applyWindow();
      }
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  async function readPosition() {
    if (!isNeutralino() || !native.window.getPosition) {
      return;
    }

    try {
      const position = await native.window.getPosition();
      settings.x = position.x;
      settings.y = position.y;
    } catch (_error) {
      // Browser preview and some window managers may not expose a position.
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
    if (isNeutralino() && native.storage) {
      try {
        const saved = await native.storage.getData(storageKey);
        settings = Object.assign({}, defaults, JSON.parse(saved || "{}"));
        return;
      } catch (_error) {
        settings = Object.assign({}, defaults);
        return;
      }
    }

    try {
      settings = Object.assign({}, defaults, JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch (_error) {
      settings = Object.assign({}, defaults);
    }
  }

  async function setupTray() {
    if (!isNeutralino() || !native.os || !native.os.setTray) {
      return;
    }

    await native.os.setTray({
      icon: "/assets/icons/tray-icon.png",
      menuItems: [
        { id: "show", text: "Show / Hide" },
        { id: "quit", text: "Quit" }
      ]
    });

    native.events.on("trayMenuItemClicked", async (event) => {
      if (event.detail.id === "quit") {
        await native.app.exit();
        return;
      }

      if (event.detail.id === "show") {
        await native.window.show();
        await native.window.focus();
      }
    });
  }

  async function init() {
    if (native && native.init) {
      native.init();
    }

    const response = await fetch("./assets/pets/luyi-nui/pet.json");
    petData = await response.json();
    await loadSettings();
    if (!petData.animations[settings.action]) {
      settings.action = "idle";
    }
    updateScale();
    updatePin();
    await persist(true);
    await setupTray();
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
    if (isNeutralino() && native.window.beginDrag) {
      try {
        await native.window.beginDrag();
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
    if (isNeutralino()) {
      await native.app.exit();
    }
  });

  setInterval(savePositionSoon, 5000);
  init();
})();
