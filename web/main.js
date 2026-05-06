(function () {
  const pet = document.getElementById("pet");
  const bubble = document.getElementById("bubble");
  const menu = document.getElementById("menu");
  const scaleLabel = document.getElementById("scaleLabel");
  const pinToggle = document.getElementById("pinToggle");
  const quit = document.getElementById("quit");
  const native = window.Neutralino || null;
  const storageKey = "nuipet.settings";

  const frameWidth = 192;
  const frameHeight = 208;
  const menuWidth = 194;
  const menuHeight = 260;
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
  let pointerStart = null;
  let bubbleTimer = 0;
  let renderStarted = false;
  let actionBeforeDrag = null;
  let facing = 1;
  let dragWindowStart = null;
  let lastDragScreenX = null;
  let menuOpen = false;

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
    pinToggle.textContent = settings.always_on_top ? "置顶：开" : "置顶：关";
  }

  function setFacing(nextFacing) {
    facing = nextFacing < 0 ? -1 : 1;
    document.documentElement.style.setProperty("--facing", String(facing));
  }

  function resetDragState() {
    dragging = false;
    pointerStart = null;
    dragWindowStart = null;
    lastDragScreenX = null;
    setFacing(1);
    if (actionBeforeDrag) {
      setAction(actionBeforeDrag);
      actionBeforeDrag = null;
    }
  }

  function getNativeScale() {
    return isNeutralino() ? Math.max(1, window.devicePixelRatio || 1) : 1;
  }

  function getWindowSize(extraWidth = 0, extraHeight = 0) {
    const nativeScale = getNativeScale();
    return {
      width: Math.ceil((frameWidth * settings.scale + extraWidth) * nativeScale),
      height: Math.ceil((frameHeight * settings.scale + extraHeight) * nativeScale)
    };
  }

  async function tryNative(action) {
    try {
      return await action();
    } catch (error) {
      console.warn("Neutralino native call failed:", error);
      return null;
    }
  }

  async function applyWindow() {
    if (!isNeutralino()) {
      return;
    }

    await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
    await tryNative(() => native.window.setSize(getWindowSize()));

    if (Number.isFinite(settings.x) && Number.isFinite(settings.y)) {
      await tryNative(() => native.window.move(settings.x, settings.y));
    }
  }

  function resizeWindowForMenu() {
    if (!isNeutralino() || !native.window.setSize) {
      return;
    }

    const framePixelWidth = frameWidth * settings.scale;
    const framePixelHeight = frameHeight * settings.scale;
    const extraWidth = Math.max(0, menuWidth - framePixelWidth);
    const extraHeight = Math.max(0, menuHeight - framePixelHeight);
    tryNative(() => native.window.setSize(getWindowSize(extraWidth, extraHeight)));
  }

  function restoreWindowSize() {
    if (!isNeutralino() || !native.window.setSize) {
      return;
    }

    tryNative(() => native.window.setSize(getWindowSize()));
  }

  async function persist(applyWindowSettings) {
    if (isNeutralino() && native.storage) {
      await tryNative(() => native.storage.setData(storageKey, JSON.stringify(settings)));
      if (applyWindowSettings) {
        await applyWindow();
      }
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (_error) {
      // Storage is optional; visual state should still update immediately.
    }
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
    renderCurrentFrame();
    persist(false);
  }

  function showBubble(text) {
    window.clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleTimer = window.setTimeout(() => {
      bubble.hidden = true;
    }, 1100);
  }

  function playClickFeedback() {
    pet.classList.remove("is-clicked");
    pet.offsetHeight;
    pet.classList.add("is-clicked");
  }

  async function reactToClick() {
    const reactions = ["wave", "jump", "idle"];
    const next = reactions[(reactions.indexOf(settings.action) + 1) % reactions.length] || "wave";
    await setAction(next);
    playClickFeedback();
    showBubble(next === "jump" ? "Nui!" : "Hi!");
  }

  function showMenu(x, y) {
    menu.hidden = false;
    menuOpen = true;
    resizeWindowForMenu();
    const maxX = Math.max(0, window.innerWidth - menu.offsetWidth - 4);
    const maxY = Math.max(0, window.innerHeight - menu.offsetHeight - 4);
    menu.style.left = `${Math.min(x, maxX)}px`;
    menu.style.top = `${Math.min(y, maxY)}px`;
  }

  function hideMenu() {
    if (!menuOpen) {
      return;
    }

    menu.hidden = true;
    menuOpen = false;
    restoreWindowSize();
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

  function renderCurrentFrame() {
    if (!petData) {
      return;
    }

    const animation = petData.animations[settings.action] || petData.animations.idle;
    const column = animation.frames[frameIndex % animation.frames.length];
    const row = animation.row;
    pet.style.backgroundPosition = `-${column * frameWidth}px -${row * frameHeight}px`;
  }

  function startAnimation() {
    if (renderStarted) {
      return;
    }

    renderStarted = true;
    renderCurrentFrame();
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

    await tryNative(() => native.os.setTray({
      icon: "/assets/icons/tray-icon.png",
      menuItems: [
        { id: "show", text: "显示/隐藏" },
        { id: "quit", text: "退出" }
      ]
    }));

    native.events.on("trayMenuItemClicked", async (event) => {
      if (event.detail.id === "quit") {
        await tryNative(() => native.app.exit());
        return;
      }

      if (event.detail.id === "show") {
        await tryNative(() => native.window.show());
        await tryNative(() => native.window.focus());
      }
    });
  }

  async function init() {
    try {
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
      startAnimation();
      persist(true);
      setupTray();
    } catch (error) {
      console.error("NuiPet failed to initialize:", error);
      petData = petData || {
        animations: {
          idle: { row: 0, frames: [0], fps: 1 }
        }
      };
      settings = Object.assign({}, defaults, { action: "idle" });
      updateScale();
      updatePin();
      startAnimation();
    }
  }

  pet.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showMenu(event.clientX, event.clientY);
  });

  pet.addEventListener("pointerdown", async (event) => {
    if (event.button !== 0) {
      return;
    }

    pet.setPointerCapture(event.pointerId);
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      at: Date.now()
    };
    lastDragScreenX = event.screenX;
    dragWindowStart = isNeutralino() ? await tryNative(() => native.window.getPosition()) : null;
    hideMenu();
  });

  window.addEventListener("pointermove", async (event) => {
    if (!pointerStart) {
      return;
    }

    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (distance < 4) {
      return;
    }

    const dx = event.screenX - pointerStart.screenX;
    const dy = event.screenY - pointerStart.screenY;
    const stepX = event.screenX - (lastDragScreenX ?? pointerStart.screenX);
    if (Math.abs(stepX) >= 1) {
      setFacing(stepX < 0 ? -1 : 1);
      lastDragScreenX = event.screenX;
    }

    if (!dragging) {
      dragging = true;
      actionBeforeDrag = settings.action;
      setAction("walk");
    }

    if (!isNeutralino() || !dragWindowStart || !native.window.move) {
      return;
    }

    const nativeScale = getNativeScale();
    tryNative(() => native.window.move(
      Math.round(dragWindowStart.x + dx * nativeScale),
      Math.round(dragWindowStart.y + dy * nativeScale)
    ));
  });

  window.addEventListener("pointerup", async () => {
    if (!pointerStart) {
      return;
    }

    const wasDragging = dragging;

    if (wasDragging) {
      resetDragState();
      await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
      await savePositionSoon();
      return;
    }

    resetDragState();
    await reactToClick();
  });

  pet.addEventListener("dblclick", async (event) => {
    event.preventDefault();
    await setAction("jump");
    playClickFeedback();
    showBubble("!");
  });

  pet.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    await reactToClick();
  });

  pet.addEventListener("lostpointercapture", async () => {
    if (!dragging) {
      return;
    }

    resetDragState();
    await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
    await savePositionSoon();
  });

  window.addEventListener("blur", hideMenu);

  menu.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.dataset.action) {
      setAction(button.dataset.action);
      hideMenu();
    }

    if (button.dataset.scale) {
      settings.scale += button.dataset.scale === "+" ? 0.1 : -0.1;
      updateScale();
      persist(true);
    }
  });

  pinToggle.addEventListener("click", async () => {
    settings.always_on_top = !settings.always_on_top;
    updatePin();
    persist(true);
  });

  quit.addEventListener("click", async () => {
    if (isNeutralino()) {
      await tryNative(() => native.app.exit());
    }
  });

  setInterval(savePositionSoon, 5000);
  init();
})();
