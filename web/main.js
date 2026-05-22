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
  const trayIconCandidates = [
    { resource: "assets/icons/tray-icon.png", tray: "/resources/assets/icons/tray-icon.png" },
    { resource: "/assets/icons/tray-icon.png", tray: "/resources/assets/icons/tray-icon.png" },
    { resource: "web/assets/icons/tray-icon.png", tray: "/resources/web/assets/icons/tray-icon.png" },
    { resource: "/web/assets/icons/tray-icon.png", tray: "/resources/web/assets/icons/tray-icon.png" }
  ];

  const menuWidth = 194;
  const menuPadding = 4;
  const menuDockGap = 8;
  const menuEdgePadding = 12;
  const dragStartDistance = 5;
  const dragFacingThreshold = 10;
  const dragFacingDominance = 1.15;
  const dragVelocityWindowMs = 120;
  const inertiaVelocityThreshold = 0.45;
  const fallVelocityThreshold = 0.62;
  const maxThrowVelocity = 2.4;
  const horizontalFriction = 0.0046;
  const gravity = 0.0052;
  const fallLandingHoldMs = 90;
  const inertiaVisualMaxOffset = 7;
  const inertiaVisualMaxTilt = 5;
  const inertiaVisualMaxStretch = 0.06;
  const displayBoundsCacheMs = 5000;
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
  let dragSamples = [];
  let dragDirection = "right";
  let menuOpen = false;
  let menuDockSide = "right";
  let menuAnchorPosition = null;
  let physicsFrame = 0;
  let physicsAnimating = false;
  let actionBeforePhysics = null;
  let fallPlaybackPhase = null;
  let displayBoundsCache = null;
  let displayBoundsCacheAt = 0;
  let trayReady = false;
  let resolvedTrayIconPath = null;
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
      motionX: Array.isArray(animation.motionX) ? animation.motionX.filter(Number.isFinite) : [],
      motionY: Array.isArray(animation.motionY) ? animation.motionY.filter(Number.isFinite) : []
    };
  }

  function isMotionTrackSafe(animation, key) {
    if (animation[key] === undefined) {
      return true;
    }

    return Array.isArray(animation[key])
      && animation[key].length === animation.frames.length
      && animation[key].every(Number.isFinite);
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

    if (!isMotionTrackSafe(animation, "motionX")) {
      return false;
    }

    if (!isMotionTrackSafe(animation, "motionY")) {
      return false;
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
    if (menuOpen) {
      dockMenu();
      resizeWindowForState();
    }
    renderCurrentFrame();
  }

  function updatePin() {
    pinToggle.classList.toggle("is-active", settings.always_on_top);
    pinToggle.textContent = settings.always_on_top ? "置顶：开" : "置顶：关";
    updateTray();
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

  function setActionOffsets(animation, frameSlot) {
    const offsetX = animation.motionX[frameSlot] || 0;
    const offsetY = animation.motionY[frameSlot] || 0;
    document.documentElement.style.setProperty("--action-offset-x", `${offsetX * settings.scale}px`);
    document.documentElement.style.setProperty("--action-offset-y", `${offsetY * settings.scale}px`);
  }

  function setInertiaVisuals(vx = 0) {
    const normalized = Math.min(1, Math.abs(vx) / maxThrowVelocity);
    const direction = vx < 0 ? -1 : 1;
    const offset = normalized * inertiaVisualMaxOffset * direction * settings.scale;
    const tilt = normalized * inertiaVisualMaxTilt * direction;
    const stretch = 1 + normalized * inertiaVisualMaxStretch;
    const shadow = normalized * -4 * direction;

    document.documentElement.style.setProperty("--inertia-offset-x", `${offset.toFixed(2)}px`);
    document.documentElement.style.setProperty("--inertia-tilt", `${tilt.toFixed(2)}deg`);
    document.documentElement.style.setProperty("--inertia-stretch", stretch.toFixed(3));
    document.documentElement.style.setProperty("--inertia-shadow-x", `${shadow.toFixed(2)}px`);
  }

  function clearInertiaVisuals() {
    pet.classList.remove("is-gliding");
    document.documentElement.style.setProperty("--inertia-offset-x", "0px");
    document.documentElement.style.setProperty("--inertia-tilt", "0deg");
    document.documentElement.style.setProperty("--inertia-stretch", "1");
    document.documentElement.style.setProperty("--inertia-shadow-x", "0px");
  }

  function getFrameSlot(animation) {
    if (activeAction === "fall" && fallPlaybackPhase === "air") {
      return frameIndex % animation.frames.length;
    }

    if (fallPlaybackPhase === "land") {
      return Math.min(frameIndex, animation.frames.length - 1);
    }

    return animation.loop === false
      ? Math.min(frameIndex, animation.frames.length - 1)
      : frameIndex % animation.frames.length;
  }

  // The generated fall sequence is split across airborne, impact, and get-up rows.
  // Keep ground-contact frames for after the native window has reached the landing y.
  async function playFallLandingAnimation() {
    const landingActions = ["fall_land", "fall_getup"].filter(hasAnimation);
    const sequence = landingActions.length ? landingActions : ["fall"].filter(hasAnimation);
    if (activeAction !== "fall" || !sequence.length) {
      fallPlaybackPhase = null;
      return;
    }

    fallPlaybackPhase = "land";
    for (const action of sequence) {
      await setAction(action, { persistAction: false });
      const animation = getAnimation(action);
      frameIndex = 0;
      lastFrameAt = 0;
      renderCurrentFrame();
      await wait((animation.frames.length / Math.max(1, animation.fps)) * 1000);
    }
    await wait(fallLandingHoldMs);
    fallPlaybackPhase = null;
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
    dragSamples = [];
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

  function getMenuExtensionWidth() {
    const bounds = getMenuBounds();
    return bounds.width ? bounds.width + menuDockGap + menuPadding : 0;
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
    await hideMenu();
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
      const position = await clampWindowPosition({ x: settings.x, y: settings.y });
      settings.x = position.x;
      settings.y = position.y;
      await tryNative(() => native.window.move(position.x, position.y));
    }
  }

  function resizeWindowForState() {
    if (!isNeutralino() || !native.window.setSize) {
      return Promise.resolve(null);
    }

    return tryNative(() => native.window.setSize(getWindowSize()));
  }

  async function getPrimaryDisplayBounds() {
    const now = Date.now();
    if (displayBoundsCache && now - displayBoundsCacheAt < displayBoundsCacheMs) {
      return displayBoundsCache;
    }

    let bounds = null;
    if (isNeutralino() && native.computer && native.computer.getDisplays) {
      const displays = await tryNative(() => native.computer.getDisplays());
      const primary = Array.isArray(displays) && displays[0];
      const resolution = primary && primary.resolution;
      if (resolution && Number.isFinite(resolution.width) && Number.isFinite(resolution.height)) {
        bounds = {
          width: resolution.width,
          height: resolution.height
        };
      }
    }

    if (!bounds && window.screen && window.screen.availWidth && window.screen.availHeight) {
      const nativeScale = getNativeScale();
      bounds = {
        width: window.screen.availWidth * nativeScale,
        height: window.screen.availHeight * nativeScale
      };
    }

    if (bounds) {
      displayBoundsCache = bounds;
      displayBoundsCacheAt = now;
    }

    return bounds;
  }

  // Keep enough of the pet window on screen so edge throws never make it unreachable.
  async function clampWindowPosition(position, size = getWindowSize()) {
    const bounds = await getPrimaryDisplayBounds();
    if (!bounds || !position) {
      return position;
    }

    return {
      x: Math.max(0, Math.min(Math.round(position.x), Math.max(0, bounds.width - size.width))),
      y: Math.max(0, Math.min(Math.round(position.y), Math.max(0, bounds.height - size.height)))
    };
  }

  async function chooseMenuDockSide(anchorPosition) {
    if (!anchorPosition) {
      return "right";
    }

    const displayBounds = await getPrimaryDisplayBounds();
    if (!displayBounds) {
      return "right";
    }

    const nativeScale = getNativeScale();
    const frame = getFramePixelSize();
    const rightEdge = anchorPosition.x + Math.ceil((frame.width + getMenuExtensionWidth()) * nativeScale);
    return rightEdge + menuEdgePadding * nativeScale > displayBounds.width ? "left" : "right";
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
    if (menuOpen && menuAnchorPosition) {
      settings.x = menuAnchorPosition.x;
      settings.y = menuAnchorPosition.y;
      return;
    }

    if (!isNeutralino() || !native.window.getPosition) {
      return;
    }

    try {
      const position = await native.window.getPosition();
      const clamped = await clampWindowPosition(position);
      settings.x = clamped.x;
      settings.y = clamped.y;
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

  function cancelPhysics() {
    if (physicsFrame) {
      window.cancelAnimationFrame(physicsFrame);
    }

    physicsFrame = 0;
    physicsAnimating = false;
    fallPlaybackPhase = null;
    clearInertiaVisuals();
    pet.classList.remove("is-falling");
    if (actionBeforePhysics) {
      setAction(actionBeforePhysics, { persistAction: false });
      actionBeforePhysics = null;
    }
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function clampVelocity(value) {
    return Math.max(-maxThrowVelocity, Math.min(maxThrowVelocity, value));
  }

  function recordDragSample(event) {
    const nativeScale = getNativeScale();
    const sample = {
      x: event.screenX * nativeScale,
      y: event.screenY * nativeScale,
      at: performance.now()
    };

    dragSamples.push(sample);
    const cutoff = sample.at - dragVelocityWindowMs;
    dragSamples = dragSamples.filter((item) => item.at >= cutoff);
  }

  function getReleaseVelocity() {
    if (dragSamples.length < 2) {
      return { x: 0, y: 0 };
    }

    const latest = dragSamples[dragSamples.length - 1];
    const earliest = dragSamples.find((sample) => latest.at - sample.at <= dragVelocityWindowMs) || dragSamples[0];
    const elapsed = Math.max(1, latest.at - earliest.at);

    return {
      x: (latest.x - earliest.x) / elapsed,
      y: (latest.y - earliest.y) / elapsed
    };
  }

  function shouldStartPhysics(velocity) {
    const speedX = Math.abs(velocity.x);
    const speedY = Math.abs(velocity.y);

    return speedX >= inertiaVelocityThreshold || speedY >= fallVelocityThreshold;
  }

  // Animate a quick throw after release, but route every frame through screen bounds.
  async function playReleasePhysics(velocity, landingY = null) {
    if (!shouldStartPhysics(velocity) || !isNeutralino() || !native.window.getPosition || !native.window.move) {
      return false;
    }

    const start = await tryNative(() => native.window.getPosition());
    if (!start) {
      return false;
    }

    const hasFall = Math.abs(velocity.y) >= fallVelocityThreshold;
    const hasGlide = Math.abs(velocity.x) >= inertiaVelocityThreshold;
    let x = start.x;
    let y = start.y;
    let vx = hasGlide ? clampVelocity(velocity.x) : 0;
    let vy = hasFall ? clampVelocity(velocity.y) : 0;
    let lastAt = performance.now();
    const floorY = hasFall && Number.isFinite(landingY)
      ? Math.max(start.y, landingY)
      : start.y;

    physicsAnimating = true;
    if (hasFall || hasGlide) {
      actionBeforePhysics = activeAction;
    }

    if (hasGlide) {
      setDragDirection(vx < 0 ? "left" : "right");
      setInertiaVisuals(vx);
      pet.classList.add("is-gliding");
      if (!hasFall) {
        await setAction(getDragAction(vx < 0 ? "left" : "right"), { persistAction: false });
      }
    }

    if (hasFall) {
      if (hasAnimation("fall")) {
        fallPlaybackPhase = "air";
        await setAction("fall", { persistAction: false });
      }
      pet.classList.remove("is-dropped");
      pet.classList.add("is-falling");
    }

    return new Promise((resolve) => {
      const step = async (now) => {
        if (!physicsAnimating) {
          pet.classList.remove("is-falling");
          fallPlaybackPhase = null;
          clearInertiaVisuals();
          if (actionBeforePhysics) {
            setAction(actionBeforePhysics, { persistAction: false });
            actionBeforePhysics = null;
          }
          resolve(false);
          return;
        }

        const dt = Math.min(32, Math.max(1, now - lastAt));
        lastAt = now;

        if (vx > 0) {
          vx = Math.max(0, vx - horizontalFriction * dt);
        } else if (vx < 0) {
          vx = Math.min(0, vx + horizontalFriction * dt);
        }
        if (hasGlide) {
          setInertiaVisuals(vx);
        }

        if (hasFall) {
          vy += gravity * dt;
        }

        x += vx * dt;
        y += vy * dt;

        if (hasFall && y > floorY) {
          y = floorY;
          vy = 0;
        }

        const nextPosition = await clampWindowPosition({ x, y });
        x = nextPosition.x;
        y = nextPosition.y;
        if (x === 0 || x === Math.max(0, (displayBoundsCache ? displayBoundsCache.width : 0) - getWindowSize().width)) {
          vx = 0;
          clearInertiaVisuals();
        }
        await tryNative(() => native.window.move(nextPosition.x, nextPosition.y));

        const movingHorizontally = Math.abs(vx) > 0.03;
        const movingVertically = hasFall && (Math.abs(vy) > 0.04 || y < floorY - 0.5);
        if (movingHorizontally || movingVertically) {
          physicsFrame = window.requestAnimationFrame(step);
          return;
        }

        physicsFrame = 0;
        pet.classList.remove("is-falling");
        clearInertiaVisuals();
        if (hasFall) {
          await playFallLandingAnimation();
          physicsAnimating = false;
          if (actionBeforePhysics) {
            await setAction(actionBeforePhysics, { persistAction: false });
            actionBeforePhysics = null;
          }
        } else {
          physicsAnimating = false;
          if (actionBeforePhysics) {
            await setAction(actionBeforePhysics, { persistAction: false });
            actionBeforePhysics = null;
          }
        }
        await savePositionSoon();
        resolve(true);
      };

      physicsFrame = window.requestAnimationFrame(step);
    });
  }

  function getTrayItems() {
    const actionItems = getMenuActions().map((item) => ({
      id: `action_${item.action}`,
      text: item.label || item.action
    }));

    return [
      { id: "show", text: "显示/隐藏" },
      { id: "pin", text: settings.always_on_top ? "取消置顶" : "保持置顶" },
      ...actionItems,
      { id: "quit", text: "退出" }
    ];
  }

  async function updateTray() {
    if (!trayReady || !isNeutralino() || !native.os || !native.os.setTray) {
      return;
    }

    const icon = await resolveTrayIconPath();
    await tryNative(() => native.os.setTray({
      icon,
      menuItems: getTrayItems()
    }));
  }

  async function resolveTrayIconPath() {
    if (resolvedTrayIconPath) {
      return resolvedTrayIconPath;
    }

    // Prefer a real filesystem path on Windows because native tray icon loading is stricter than WebView resource loading.
    if (native.resources && native.resources.getStats && native.resources.extractFile && native.os && native.os.getPath) {
      const tempPath = await tryNative(() => native.os.getPath("temp"));
      const targetPath = tempPath
        ? `${tempPath.replace(/[\\/]+$/, "")}\\nuipet-tray-icon.png`
        : null;

      if (targetPath) {
        for (const candidate of trayIconCandidates) {
          const stats = await tryNative(() => native.resources.getStats(candidate.resource));
          if (stats && stats.isFile) {
            const extracted = await tryNative(() => native.resources.extractFile(candidate.resource, targetPath));
            if (extracted !== null) {
              resolvedTrayIconPath = targetPath;
              return resolvedTrayIconPath;
            }
          }
        }
      }
    }

    if (native.resources && native.resources.getStats) {
      for (const candidate of trayIconCandidates) {
        const stats = await tryNative(() => native.resources.getStats(candidate.resource));
        if (stats && stats.isFile) {
          resolvedTrayIconPath = candidate.tray;
          return resolvedTrayIconPath;
        }
      }
    }

    resolvedTrayIconPath = trayIconCandidates[0].tray;
    return resolvedTrayIconPath;
  }

  async function setAction(action, options = {}) {
    const resolvedAction = resolveAction(action);
    if (!hasAnimation(resolvedAction)) {
      return false;
    }

    const persistAction = options.persistAction !== false;
    activeAction = resolvedAction;
    if (resolvedAction !== "fall" && resolvedAction !== "fall_land" && resolvedAction !== "fall_getup") {
      fallPlaybackPhase = null;
    }
    if (persistAction) {
      actionAfterTransient = null;
      settings.action = resolvedAction;
      persist(false);
      updateTray();
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
        if (!dragging && !physicsAnimating && activeAction === resolvedAction) {
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
    if (dragging || physicsAnimating || menuOpen || pointerStart || activeAction !== settings.action || settings.action !== "idle") {
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
    const bounds = getMenuBounds();
    const menuHeight = menu.offsetHeight || 0;
    const availableHeight = Math.max(frame.height, menuHeight);
    const top = Math.max(0, Math.round((availableHeight - menuHeight) / 2));
    const petOffset = menuOpen && menuDockSide === "left"
      ? bounds.width + menuDockGap
      : 0;

    document.documentElement.style.setProperty("--pet-offset-x", `${petOffset}px`);
    menu.style.left = menuDockSide === "left"
      ? "0px"
      : `${Math.ceil(frame.width + menuDockGap)}px`;
    menu.style.top = `${top}px`;
  }

  async function showMenu() {
    if (physicsAnimating) {
      return;
    }

    noteInteraction();
    menuAnchorPosition = isNeutralino() && native.window.getPosition
      ? await tryNative(() => native.window.getPosition())
      : null;
    if (menuAnchorPosition) {
      menuAnchorPosition = await clampWindowPosition(menuAnchorPosition, {
        width: Math.ceil(getFramePixelSize().width * getNativeScale()),
        height: Math.ceil(getFramePixelSize().height * getNativeScale())
      });
      await tryNative(() => native.window.move(menuAnchorPosition.x, menuAnchorPosition.y));
    }
    menu.hidden = false;
    menuOpen = true;
    menuDockSide = "right";
    dockMenu();
    menuDockSide = await chooseMenuDockSide(menuAnchorPosition);
    dockMenu();
    await resizeWindowForState();
    if (menuDockSide === "left" && menuAnchorPosition && native.window.move) {
      const nativeScale = getNativeScale();
      const leftOffset = getMenuBounds().width + menuDockGap;
      await tryNative(() => native.window.move(
        Math.round(menuAnchorPosition.x - leftOffset * nativeScale),
        menuAnchorPosition.y
      ));
    }
    window.requestAnimationFrame(() => {
      dockMenu();
      resizeWindowForState();
    });
  }

  async function hideMenu() {
    if (!menuOpen) {
      return;
    }

    const anchorPosition = menuAnchorPosition;
    const restorePosition = menuDockSide === "left" && anchorPosition && native.window.move;
    menu.hidden = true;
    menuOpen = false;
    menuDockSide = "right";
    menuAnchorPosition = null;
    document.documentElement.style.setProperty("--pet-offset-x", "0px");
    await resizeWindowForState();
    if (restorePosition) {
      const clampedPosition = await clampWindowPosition(anchorPosition);
      await tryNative(() => native.window.move(clampedPosition.x, clampedPosition.y));
    }
  }

  function renderFrame(timestamp) {
    const animation = getAnimation(activeAction);
    const interval = 1000 / Math.max(1, animation.fps);

    if (!lastFrameAt || timestamp - lastFrameAt >= interval) {
      if (animation.loop === false && !fallPlaybackPhase && frameIndex >= animation.frames.length) {
        const nextAction = actionAfterTransient || animation.next || settings.action || getDefaultAction();
        actionAfterTransient = null;
        setAction(nextAction, { persistAction: false });
        requestAnimationFrame(renderFrame);
        return;
      }

      const frameSlot = getFrameSlot(animation);
      const column = animation.frames[frameSlot] || 0;
      const row = animation.row;
      pet.style.backgroundPosition = `-${column * grid.frameWidth}px -${row * grid.frameHeight}px`;
      setActionOffsets(animation, frameSlot);
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
    const frameSlot = getFrameSlot(animation);
    const column = animation.frames[frameSlot] || 0;
    const row = animation.row || 0;
    pet.style.backgroundPosition = `-${column * grid.frameWidth}px -${row * grid.frameHeight}px`;
    setActionOffsets(animation, frameSlot);
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

    trayReady = true;
    const icon = await resolveTrayIconPath();
    await tryNative(() => native.os.setTray({
      icon,
      menuItems: [
        { id: "show", text: "显示/隐藏" },
        { id: "quit", text: "退出" }
      ]
    }));
    await updateTray();

    native.events.on("trayMenuItemClicked", async (event) => {
      const id = event.detail.id;
      if (id === "quit") {
        await exitApp();
        return;
      }

      if (id === "show") {
        noteInteraction();
        await tryNative(() => native.window.show());
        await tryNative(() => native.window.focus());
        return;
      }

      if (id === "pin") {
        noteInteraction();
        settings.always_on_top = !settings.always_on_top;
        updatePin();
        persist(true);
        return;
      }

      if (id && id.startsWith("action_")) {
        const changed = await setAction(id.slice("action_".length));
        if (changed) {
          noteInteraction();
          await tryNative(() => native.window.show());
          await tryNative(() => native.window.focus());
          showBubble(nextBubbleText("menu"), 1200);
        }
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

  pet.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    await showMenu();
  });

  pet.addEventListener("pointerdown", async (event) => {
    if (event.button !== 0) {
      return;
    }

    noteInteraction();
    cancelPhysics();
    pet.setPointerCapture(event.pointerId);
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      at: Date.now()
    };
    dragSamples = [];
    recordDragSample(event);
    dragFacingAnchorX = event.screenX;
    dragWindowStart = isNeutralino() ? await tryNative(() => native.window.getPosition()) : null;
    await hideMenu();
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
    recordDragSample(event);
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
    const nextPosition = await clampWindowPosition({
      x: dragWindowStart.x + dx * nativeScale,
      y: dragWindowStart.y + dy * nativeScale
    });
    tryNative(() => native.window.move(nextPosition.x, nextPosition.y));
  });

  window.addEventListener("pointerup", async () => {
    if (!pointerStart) {
      return;
    }

    const wasDragging = dragging;

    if (wasDragging) {
      const velocity = getReleaseVelocity();
      const landingY = dragWindowStart && Number.isFinite(dragWindowStart.y) ? dragWindowStart.y : null;
      resetDragState();
      noteInteraction();
      showBubble(nextBubbleText("dragEnd"), 1200);
      await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
      const didAnimate = await playReleasePhysics(velocity, landingY);
      if (!didAnimate) {
        playFeedback("is-dropped");
        await savePositionSoon();
      }
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

    const velocity = getReleaseVelocity();
    const landingY = dragWindowStart && Number.isFinite(dragWindowStart.y) ? dragWindowStart.y : null;
    resetDragState();
    noteInteraction();
    await tryNative(() => native.window.setAlwaysOnTop(settings.always_on_top));
    const didAnimate = await playReleasePhysics(velocity, landingY);
    if (!didAnimate) {
      await savePositionSoon();
    }
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
      await hideMenu();
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
