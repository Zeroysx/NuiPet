(function () {
  const pet = document.getElementById("pet");
  const bubble = document.getElementById("bubble");
  const menu = document.getElementById("menu");
  const actionMenu = document.getElementById("actionMenu");
  const scaleLabel = document.getElementById("scaleLabel");
  const pinToggle = document.getElementById("pinToggle");
  const quit = document.getElementById("quit");
  const native = window.Neutralino || null;
  const storageKey = "nuipet.settings";

  const menuWidth = 194;
  const menuPadding = 4;
  const menuDockGap = 8;
  const dragStartDistance = 5;
  const dragFacingThreshold = 10;
  const dragFacingDominance = 1.15;
  const fallbackFrame = {
    columns: 1,
    rows: 1,
    frameWidth: 192,
    frameHeight: 208
  };
  const fallbackBubbleText = {
    click: [
      "我是鹿弈Nui。",
      "118。",
      "你在干什么？",
      "不要戳啦。",
      "今天也要开心。",
      "要一起玩吗？"
    ],
    doubleClick: ["跳起来啦。"],
    dragStart: ["出发。"],
    dragEnd: ["到这里吗？"],
    idle: ["休息一下。"],
    menu: ["切换好了。"]
  };
  const defaults = {
    action: "idle",
    scale: 1,
    always_on_top: true,
    x: null,
    y: null
  };

  let petData = null;
  let grid = Object.assign({}, fallbackFrame);
  let settings = Object.assign({}, defaults);
  let activeAction = defaults.action;
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
  let dragFacingAnchorX = null;
  let dragDirection = "right";
  let menuOpen = false;
  let lastInteractionAt = Date.now();
  let nextIdleAt = lastInteractionAt + 6500;
  let textIndexes = Object.create(null);
  let actionAfterTransient = null;

  function isNeutralino() {
    return Boolean(native && native.app && native.window);
  }

  function clampScale(value) {
    return Math.min(3, Math.max(0.5, Math.round(value * 10) / 10));
  }

  function resolveAction(action) {
    const aliases = petData && petData.actionAliases;
    let next = action;
    const seen = Object.create(null);

    while (aliases && aliases[next] && !seen[next]) {
      seen[next] = true;
      next = aliases[next];
    }

    return next;
  }

  function normalizeAnimation(action) {
    const resolvedAction = resolveAction(action);
    const source = petData && petData.animations && petData.animations[resolvedAction];
    const fallback = { row: 0, frames: [0], fps: 1 };
    const animation = source || fallback;
    const row = Number.isInteger(animation.row) && animation.row >= 0 && animation.row < grid.rows
      ? animation.row
      : fallback.row;
    const frames = Array.isArray(animation.frames)
      ? animation.frames.filter((frame) => Number.isInteger(frame) && frame >= 0 && frame < grid.columns)
      : [];

    return {
      row,
      frames: frames.length ? frames : fallback.frames,
      fps: Number.isFinite(animation.fps) && animation.fps > 0 ? animation.fps : fallback.fps,
      loop: animation.loop,
      next: animation.next,
      motionY: Array.isArray(animation.motionY) ? animation.motionY.filter(Number.isFinite) : []
    };
  }

  function isAnimationSafe(action) {
    const resolvedAction = resolveAction(action);
    const animation = petData && petData.animations && petData.animations[resolvedAction];
    if (!animation || !Number.isInteger(animation.row) || animation.row < 0 || animation.row >= grid.rows) {
      return false;
    }

    if (!Array.isArray(animation.frames) || !animation.frames.length) {
      return false;
    }

    if (!animation.frames.every((frame) => Number.isInteger(frame) && frame >= 0 && frame < grid.columns)) {
      return false;
    }

    if (animation.motionY !== undefined) {
      return Array.isArray(animation.motionY)
        && animation.motionY.length === animation.frames.length
        && animation.motionY.every(Number.isFinite);
    }

    return true;
  }

  function getAnimation(action) {
    if (isAnimationSafe(action)) {
      return normalizeAnimation(action);
    }

    if (action !== "idle" && isAnimationSafe("idle")) {
      return normalizeAnimation("idle");
    }

    return normalizeAnimation(null);
  }

  function hasAnimation(action) {
    return isAnimationSafe(action);
  }

  function getDefaultAction() {
    return resolveAction((petData && petData.defaultAction) || defaults.action);
  }

  function getDirectionalDragAction(direction) {
    const actions = petData && petData.dragActionsByDirection;
    const action = actions && actions[direction];
    const resolvedAction = resolveAction(action);
    return hasAnimation(resolvedAction) ? resolvedAction : null;
  }

  function getDragAction(direction = dragDirection) {
    const directionalAction = getDirectionalDragAction(direction);
    if (directionalAction) {
      return directionalAction;
    }

    return resolveAction((petData && petData.dragAction) || "run_right");
  }

  function getGroup(name, fallback) {
    const group = petData && petData.animationGroups && petData.animationGroups[name];
    const animations = Array.isArray(group) ? group : fallback;
    return animations.filter(hasAnimation);
  }

  function getBubblePool(category) {
    const text = petData && petData.bubbleText;
    const pool = text && Array.isArray(text[category]) ? text[category] : fallbackBubbleText[category];
    return Array.isArray(pool) && pool.length ? pool : fallbackBubbleText.click;
  }

  function nextBubbleText(category) {
    const pool = getBubblePool(category);
    const index = textIndexes[category] || 0;
    textIndexes[category] = index + 1;
    return pool[index % pool.length];
  }

  function updateScale() {
    settings.scale = clampScale(settings.scale);
    document.documentElement.style.setProperty("--scale", String(settings.scale));
    scaleLabel.textContent = `${Math.round(settings.scale * 100)}%`;
    renderCurrentFrame();
  }

  function updatePin() {
    pinToggle.classList.toggle("is-active", settings.always_on_top);
    pinToggle.textContent = settings.always_on_top ? "置顶：开" : "置顶：关";
  }

  function updateGrid() {
    grid = Object.assign({}, fallbackFrame, petData && petData.grid);
    document.documentElement.style.setProperty("--frame-width", `${grid.frameWidth}px`);
    document.documentElement.style.setProperty("--frame-height", `${grid.frameHeight}px`);
    document.documentElement.style.setProperty("--atlas-width", `${grid.columns * grid.frameWidth}px`);
    document.documentElement.style.setProperty("--atlas-height", `${grid.rows * grid.frameHeight}px`);
  }

  function getMenuActions() {
    const actions = petData && Array.isArray(petData.menuActions) ? petData.menuActions : [];
    return actions.filter((item) => item && hasAnimation(item.action));
  }

  function renderActionMenu() {
    if (!actionMenu) {
      return;
    }

    actionMenu.textContent = "";
    getMenuActions().forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = item.action;
      button.textContent = item.label || item.action;
      actionMenu.appendChild(button);
    });
  }

  function setActionOffsetY(animation, frameSlot) {
    const offset = animation.motionY[frameSlot] || 0;
    document.documentElement.style.setProperty("--action-offset-y", `${offset * settings.scale}px`);
  }

  function noteInteraction() {
    const now = Date.now();
    lastInteractionAt = now;
    nextIdleAt = now + 5500 + Math.random() * 4500;
  }

  function setFacing(nextFacing) {
    facing = nextFacing < 0 ? -1 : 1;
    document.documentElement.style.setProperty("--facing", String(facing));
  }

  function setDragDirection(direction) {
    const nextDirection = direction === "left" ? "left" : "right";
    if (dragDirection === nextDirection && dragging) {
      return;
    }

    dragDirection = nextDirection;
    if (getDirectionalDragAction(nextDirection)) {
      setFacing(1);
      if (dragging) {
        setAction(getDragAction(nextDirection), { persistAction: false });
      }
      return;
    }

    setFacing(nextDirection === "left" ? -1 : 1);
  }

  function updateDragFacing(event) {
    if (!pointerStart) {
      return;
    }

    const totalX = event.screenX - pointerStart.screenX;
    const totalY = event.screenY - pointerStart.screenY;
    const anchorX = dragFacingAnchorX ?? pointerStart.screenX;
    const anchorDeltaX = event.screenX - anchorX;
    const dominantHorizontal = Math.abs(totalX) >= Math.abs(totalY) * dragFacingDominance;

    if (!dragging) {
      if (dominantHorizontal && Math.abs(totalX) >= dragFacingThreshold) {
        setDragDirection(totalX < 0 ? "left" : "right");
        dragFacingAnchorX = event.screenX;
      }
      return;
    }

    if (Math.abs(anchorDeltaX) >= dragFacingThreshold) {
      setDragDirection(anchorDeltaX < 0 ? "left" : "right");
      dragFacingAnchorX = event.screenX;
    }
  }

  function resetDragState() {
    dragging = false;
    pointerStart = null;
    dragWindowStart = null;
    dragFacingAnchorX = null;
    dragDirection = "right";
    pet.classList.remove("is-dragging");
    setFacing(1);
    if (actionBeforeDrag) {
      actionAfterTransient = null;
      setAction(actionBeforeDrag, { persistAction: false });
      actionBeforeDrag = null;
    }
  }

  function getNativeScale() {
    return isNeutralino() ? Math.max(1, window.devicePixelRatio || 1) : 1;
  }

  function getMenuBounds() {
    if (!menuOpen) {
      return { width: 0, height: 0 };
    }

    return {
      width: Math.ceil(menu.offsetWidth || menuWidth),
      height: Math.ceil(menu.offsetHeight || 0)
    };
  }

  function getFramePixelSize() {
    return {
      width: grid.frameWidth * settings.scale,
      height: grid.frameHeight * settings.scale
    };
  }

  function getWindowSize() {
    const nativeScale = getNativeScale();
    const frame = getFramePixelSize();
    const menuBounds = getMenuBounds();
    const width = menuOpen
      ? frame.width + menuDockGap + menuBounds.width + menuPadding
      : frame.width;
    const height = menuOpen
      ? Math.max(frame.height, menuBounds.height + menuPadding)
      : frame.height;

    return {
      width: Math.ceil(width * nativeScale),
      height: Math.ceil(height * nativeScale)
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

  async function exitApp() {
    hideMenu();
    if (!isNeutralino() || !native.app || !native.app.exit) {
      window.close();
      return;
    }

    await tryNative(() => native.app.exit());
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

  function resizeWindowForState() {
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

  async function setAction(action, options = {}) {
    const resolvedAction = resolveAction(action);
    if (!hasAnimation(resolvedAction)) {
      return false;
    }

    const persistAction = options.persistAction !== false;
    activeAction = resolvedAction;
    if (persistAction) {
      actionAfterTransient = null;
      settings.action = resolvedAction;
      persist(false);
    }

    frameIndex = 0;
    lastFrameAt = 0;
    renderCurrentFrame();
    return true;
  }

  function showBubble(text, duration = 1500) {
    window.clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove("is-visible");
    bubble.offsetHeight;
    bubble.classList.add("is-visible");
    bubbleTimer = window.setTimeout(() => {
      bubble.hidden = true;
      bubble.classList.remove("is-visible");
    }, duration);
  }

  function playFeedback(className) {
    pet.classList.remove(className);
    pet.offsetHeight;
    pet.classList.add(className);
  }

  function pickAction(actions, fallback) {
    const available = actions.filter(hasAnimation);
    if (!available.length) {
      return fallback;
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  async function playTransientAction(action, fallbackAction = settings.action) {
    const resolvedAction = resolveAction(action);
    const resolvedFallback = resolveAction(fallbackAction);
    if (!hasAnimation(resolvedAction)) {
      return false;
    }

    actionAfterTransient = resolvedFallback;
    await setAction(resolvedAction, { persistAction: false });
    const animation = getAnimation(resolvedAction);
    if (animation.loop !== false && resolvedFallback && resolvedFallback !== resolvedAction) {
      window.setTimeout(() => {
        if (!dragging && activeAction === resolvedAction) {
          actionAfterTransient = null;
          setAction(resolvedFallback, { persistAction: false });
        }
      }, Math.max(700, (animation.frames.length / Math.max(1, animation.fps)) * 1000));
    }
    return true;
  }

  async function reactToClick() {
    noteInteraction();
    const reactions = getGroup("clickReactions", ["wave", "think", "idle_alt"]);
    const next = pickAction(reactions, "wave");
    await playTransientAction(next, settings.action);
    playFeedback("is-clicked");
    showBubble(nextBubbleText("click"));
  }

  async function reactToDoubleClick() {
    noteInteraction();
    const reactions = getGroup("doubleClickReactions", ["jump", "nod"]);
    const next = pickAction(reactions, "jump");
    await playTransientAction(next, settings.action);
    playFeedback("is-double-clicked");
    showBubble(nextBubbleText("doubleClick"), 1700);
  }

  async function maybePlayIdleVariant() {
    if (dragging || menuOpen || pointerStart || activeAction !== settings.action || settings.action !== "idle") {
      return;
    }

    const now = Date.now();
    if (now < nextIdleAt || now - lastInteractionAt < 5000) {
      return;
    }

    const variants = getGroup("idleVariants", ["idle_breathe", "idle_look", "idle_stretch"]);
    const next = pickAction(variants, null);
    nextIdleAt = now + 6500 + Math.random() * 6500;
    if (!next || next === activeAction) {
      return;
    }

    await playTransientAction(next, "idle");
    if (Math.random() < 0.45) {
      showBubble(nextBubbleText("idle"), 1400);
    }
  }

  function dockMenu() {
    const frame = getFramePixelSize();
    const menuHeight = menu.offsetHeight || 0;
    const availableHeight = Math.max(frame.height, menuHeight);
    const top = Math.max(0, Math.round((availableHeight - menuHeight) / 2));

    menu.style.left = `${Math.ceil(frame.width + menuDockGap)}px`;
    menu.style.top = `${top}px`;
  }

  function showMenu() {
    noteInteraction();
    menu.hidden = false;
    menuOpen = true;
    dockMenu();
    resizeWindowForState();
    window.requestAnimationFrame(() => {
      dockMenu();
      resizeWindowForState();
    });
  }

  function hideMenu() {
    if (!menuOpen) {
      return;
    }

    menu.hidden = true;
    menuOpen = false;
    resizeWindowForState();
  }

  function renderFrame(timestamp) {
    const animation = getAnimation(activeAction);
    const interval = 1000 / Math.max(1, animation.fps);

    if (!lastFrameAt || timestamp - lastFrameAt >= interval) {
      if (animation.loop === false && frameIndex >= animation.frames.length) {
        const nextAction = actionAfterTransient || animation.next || settings.action || getDefaultAction();
        actionAfterTransient = null;
        setAction(nextAction, { persistAction: false });
        requestAnimationFrame(renderFrame);
        return;
      }

      const frameSlot = animation.loop === false ? frameIndex : frameIndex % animation.frames.length;
      const column = animation.frames[frameSlot] || 0;
      const row = animation.row;
      pet.style.backgroundPosition = `-${column * grid.frameWidth}px -${row * grid.frameHeight}px`;
      setActionOffsetY(animation, frameSlot);
      frameIndex += 1;
      lastFrameAt = timestamp;
    }

    requestAnimationFrame(renderFrame);
  }

  function renderCurrentFrame() {
    if (!petData) {
      return;
    }

    const animation = getAnimation(activeAction);
    const frameSlot = Math.min(frameIndex, animation.frames.length - 1);
    const column = animation.frames[frameSlot] || 0;
    const row = animation.row || 0;
    pet.style.backgroundPosition = `-${column * grid.frameWidth}px -${row * grid.frameHeight}px`;
    setActionOffsetY(animation, frameSlot);
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
        await exitApp();
        return;
      }

      if (event.detail.id === "show") {
        noteInteraction();
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
      updateGrid();
      await loadSettings();
      if (!hasAnimation(settings.action)) {
        settings.action = getDefaultAction();
      }
      settings.action = resolveAction(settings.action);
      activeAction = settings.action;
      updateScale();
      updatePin();
      renderActionMenu();
      startAnimation();
      persist(true);
      setupTray();
    } catch (error) {
      console.error("NuiPet failed to initialize:", error);
      petData = petData || {
        grid: fallbackFrame,
        animations: {
          idle: { row: 0, frames: [0], fps: 1 }
        }
      };
      updateGrid();
      settings = Object.assign({}, defaults, { action: getDefaultAction() });
      activeAction = settings.action;
      updateScale();
      updatePin();
      renderActionMenu();
      startAnimation();
    }
  }

  pet.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showMenu();
  });

  pet.addEventListener("pointerdown", async (event) => {
    if (event.button !== 0) {
      return;
    }

    noteInteraction();
    pet.setPointerCapture(event.pointerId);
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      at: Date.now()
    };
    dragFacingAnchorX = event.screenX;
    dragWindowStart = isNeutralino() ? await tryNative(() => native.window.getPosition()) : null;
    hideMenu();
  });

  window.addEventListener("pointermove", async (event) => {
    if (!pointerStart) {
      return;
    }

    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (distance < dragStartDistance) {
      return;
    }

    const dx = event.screenX - pointerStart.screenX;
    const dy = event.screenY - pointerStart.screenY;
    updateDragFacing(event);

    if (!dragging) {
      noteInteraction();
      dragging = true;
      actionBeforeDrag = activeAction;
      updateDragFacing(event);
      if (Math.abs(dx) >= 3) {
        setDragDirection(dx < 0 ? "left" : "right");
      }
      pet.classList.add("is-dragging");
      setDragDirection(dragDirection);
      setAction(getDragAction(), { persistAction: false });
      showBubble(nextBubbleText("dragStart"), 1100);
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
      noteInteraction();
      playFeedback("is-dropped");
      showBubble(nextBubbleText("dragEnd"), 1200);
      await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
      await savePositionSoon();
      return;
    }

    resetDragState();
    await reactToClick();
  });

  pet.addEventListener("dblclick", async (event) => {
    event.preventDefault();
    await reactToDoubleClick();
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
    noteInteraction();
    await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
    await savePositionSoon();
  });

  window.addEventListener("blur", hideMenu);

  menu.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    noteInteraction();
    if (button.dataset.action) {
      const changed = await setAction(button.dataset.action);
      if (changed) {
        showBubble(nextBubbleText("menu"), 1200);
      }
      hideMenu();
    }

    if (button.dataset.scale) {
      settings.scale += button.dataset.scale === "+" ? 0.1 : -0.1;
      updateScale();
      resizeWindowForState();
      persist(true);
    }
  });

  pinToggle.addEventListener("click", async () => {
    noteInteraction();
    settings.always_on_top = !settings.always_on_top;
    updatePin();
    persist(true);
  });

  quit.addEventListener("click", async () => {
    await exitApp();
  });

  setInterval(savePositionSoon, 5000);
  setInterval(maybePlayIdleVariant, 1200);
  init();
})();
