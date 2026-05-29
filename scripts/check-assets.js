const fs = require("fs");
const path = require("path");

const required = [
  "neutralino.config.json",
  "web/index.html",
  "web/main.js",
  "web/styles.css",
  "web/assets/pets/luyi-nui/pet.json",
  "web/assets/pets/luyi-nui/spritesheet.webp",
  "web/assets/icons/app-icon.png",
  "web/assets/icons/tray-icon.png"
];

const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, "..", file)));

if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

const root = path.join(__dirname, "..");
const petPath = path.join(root, "web/assets/pets/luyi-nui/pet.json");
const errors = [];
const warnings = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Unable to parse ${path.relative(root, file)}: ${error.message}`);
    return null;
  }
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateMotionTrack(name, animation, hasFrames, key) {
  let safe = true;
  if (animation[key] !== undefined) {
    if (!Array.isArray(animation[key])) {
      errors.push(`Animation "${name}" ${key} must be an array when defined.`);
      safe = false;
    } else if (!hasFrames) {
      errors.push(`Animation "${name}" ${key} can only be validated after frames are defined.`);
      safe = false;
    } else if (animation[key].length !== animation.frames.length) {
      errors.push(`Animation "${name}" ${key} must match the frame count.`);
      safe = false;
    } else {
      animation[key].forEach((offset) => {
        if (!Number.isFinite(offset)) {
          errors.push(`Animation "${name}" ${key} values must be finite numbers.`);
          safe = false;
        }
      });
    }
  }

  return safe;
}

function hasSafeAnimation(name, animation, grid) {
  if (!animation || typeof animation !== "object") {
    errors.push(`Animation "${name}" must be an object.`);
    return false;
  }

  let safe = true;
  const hasFrames = Array.isArray(animation.frames) && animation.frames.length > 0;
  if (!Number.isInteger(animation.row) || animation.row < 0 || animation.row >= grid.rows) {
    errors.push(`Animation "${name}" row must be between 0 and ${grid.rows - 1}.`);
    safe = false;
  }

  if (!hasFrames) {
    errors.push(`Animation "${name}" must define at least one frame.`);
    safe = false;
  } else {
    animation.frames.forEach((frame) => {
      if (!Number.isInteger(frame) || frame < 0 || frame >= grid.columns) {
        errors.push(`Animation "${name}" frame ${frame} must be between 0 and ${grid.columns - 1}.`);
        safe = false;
      }
    });
  }

  if (!Number.isFinite(animation.fps) || animation.fps <= 0) {
    errors.push(`Animation "${name}" must define a positive fps.`);
    safe = false;
  }

  safe = validateMotionTrack(name, animation, hasFrames, "motionX") && safe;
  safe = validateMotionTrack(name, animation, hasFrames, "motionY") && safe;

  return safe;
}

const pet = readJson(petPath);

if (pet) {
  const grid = pet.grid || {};
  ["columns", "rows", "frameWidth", "frameHeight"].forEach((key) => {
    if (!isPositiveInteger(grid[key])) {
      errors.push(`Grid "${key}" must be a positive integer.`);
    }
  });

  const animations = pet.animations || {};
  if (!animations.idle) {
    errors.push('Animation "idle" is required as the runtime fallback.');
  }

  if (!errors.length) {
    const safeAnimations = new Set();
    const rowOwners = new Map();

    Object.entries(animations).forEach(([name, animation]) => {
      const isSafe = hasSafeAnimation(name, animation, grid);

      if (!animation || typeof animation !== "object") {
        return;
      }

      if (isSafe) {
        safeAnimations.add(name);
      }

      const owners = rowOwners.get(animation.row) || [];
      owners.push(name);
      rowOwners.set(animation.row, owners);
      if (animation.assetStatus === "duplicate-v0.2.0") {
        warnings.push(`Animation "${name}" is retained only as a v0.2.0 duplicate asset row.`);
      }
    });

    rowOwners.forEach((owners, row) => {
      if (owners.length > 1) {
        warnings.push(`Atlas row ${row} is referenced by multiple animations: ${owners.join(", ")}.`);
      }
    });

    Object.entries(pet.animationGroups || {}).forEach(([groupName, names]) => {
      if (!Array.isArray(names)) {
        errors.push(`Animation group "${groupName}" must be an array.`);
        return;
      }

      names.forEach((name) => {
        const resolvedName = pet.actionAliases && pet.actionAliases[name] ? pet.actionAliases[name] : name;
        if (!safeAnimations.has(resolvedName)) {
          errors.push(`Animation group "${groupName}" references missing or unsafe animation "${name}".`);
        }

        if (animations[resolvedName] && animations[resolvedName].assetStatus === "duplicate-v0.2.0") {
          warnings.push(`Animation group "${groupName}" uses duplicate v0.2.0 asset "${resolvedName}" for QA access.`);
        }
      });
    });

    if (!Array.isArray(pet.menuActions) || !pet.menuActions.length) {
      errors.push("pet.json must define a non-empty menuActions array.");
    } else {
      pet.menuActions.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          errors.push(`menuActions[${index}] must be an object.`);
          return;
        }

        const name = item.action;
        const resolvedName = pet.actionAliases && pet.actionAliases[name] ? pet.actionAliases[name] : name;
        if (!safeAnimations.has(resolvedName)) {
          errors.push(`Menu action "${name}" references missing or unsafe animation.`);
        }

        if (typeof item.label !== "string" || !item.label.trim()) {
          errors.push(`Menu action "${name}" must define a non-empty label.`);
        }

        if (animations[resolvedName] && animations[resolvedName].assetStatus === "duplicate-v0.2.0") {
          warnings.push(`Menu exposes duplicate v0.2.0 asset "${resolvedName}" for direct QA triggering.`);
        }
      });
    }

    if (pet.dragAction && !safeAnimations.has(pet.dragAction)) {
      errors.push(`dragAction "${pet.dragAction}" references missing or unsafe animation.`);
    }

    if (pet.dragActionsByDirection) {
      ["left", "right"].forEach((direction) => {
        const action = pet.dragActionsByDirection[direction];
        if (!action || !safeAnimations.has(action)) {
          errors.push(`dragActionsByDirection.${direction} references missing or unsafe animation.`);
        }
      });
    }

    if (pet.slideStopActionsByDirection) {
      ["left", "right"].forEach((direction) => {
        const action = pet.slideStopActionsByDirection[direction];
        if (!action || !safeAnimations.has(action)) {
          errors.push(`slideStopActionsByDirection.${direction} references missing or unsafe animation.`);
        }
      });
    }

    if (pet.diagonalPounceActionsByDirection) {
      ["left", "right"].forEach((direction) => {
        const action = pet.diagonalPounceActionsByDirection[direction];
        if (!action || !safeAnimations.has(action)) {
          errors.push(`diagonalPounceActionsByDirection.${direction} references missing or unsafe animation.`);
        }
      });
    }

    if (pet.diagonalPounceLandingActionsByDirection) {
      ["left", "right"].forEach((direction) => {
        const action = pet.diagonalPounceLandingActionsByDirection[direction];
        if (!action || !safeAnimations.has(action)) {
          errors.push(`diagonalPounceLandingActionsByDirection.${direction} references missing or unsafe animation.`);
        }
      });
    }

    if (pet.defaultAction && !safeAnimations.has(pet.defaultAction)) {
      errors.push(`defaultAction "${pet.defaultAction}" references missing or unsafe animation.`);
    }

    Object.entries(pet.actionAliases || {}).forEach(([alias, target]) => {
      if (!safeAnimations.has(target)) {
        errors.push(`Action alias "${alias}" references missing or unsafe target "${target}".`);
      }
    });
  }
}

if (warnings.length) {
  console.warn(`NuiPet asset warnings:\n${warnings.join("\n")}`);
}

if (errors.length) {
  console.error(`NuiPet asset validation failed:\n${errors.join("\n")}`);
  process.exit(1);
}

console.log("NuiPet assets are present and metadata is valid.");
