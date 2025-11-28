import { logger } from "../logger.js";
import { openHeroHub, applyHeroHubTooltip } from "./hero-hub-launcher.js";

const MODULE_ID = "rnk-hero-forge";
const HOTBAR_SLOT = 4;
const HOTBAR_SLOT_SELECTOR = `#hotbar .slot[data-slot="${HOTBAR_SLOT}"]`;
const ICON_CLASS = "fas fa-hammer";

function decorateHotbarSlot(slot) {
  if (!slot) return;
  slot.classList.add("rnk-hero-hotbar-slot");
  slot.dataset.tooltip = game?.i18n?.localize?.("rnk-hero-forge.sidebar.openHub") || "Hero Forge";
  slot.setAttribute("role", "button");
  slot.setAttribute("aria-haspopup", "dialog");
  slot.setAttribute("aria-label", slot.dataset.tooltip);

  applyHeroHubTooltip(slot);

  let icon = slot.querySelector(".rnk-hero-hotbar-icon");
  if (!icon) {
    icon = document.createElement("span");
    icon.className = "rnk-hero-hotbar-icon";
    icon.innerHTML = `<i class="${ICON_CLASS}" aria-hidden="true"></i>`;
    slot.appendChild(icon);
  }

  const key = slot.querySelector(".key");
  if (key) {
    key.classList.add("rnk-hero-hotbar-key");
  }
}

function attachHotbarListeners(slot) {
  if (!slot) return;

  const blocker = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    slot.addEventListener(eventName, blocker, { capture: true });
  });

  const opener = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openHeroHub(slot, { showOnlyOwned: !game.user.isGM });
  };

  slot.addEventListener("click", opener, { capture: true });
}

function ensureHeroHotbarSlot() {
  const slot = document.querySelector(HOTBAR_SLOT_SELECTOR);
  if (!slot) {
    logger.debug(`${MODULE_ID} | Hotbar slot ${HOTBAR_SLOT} not yet available`);
    return;
  }

  decorateHotbarSlot(slot);
  attachHotbarListeners(slot);
}

export function registerHotbarButton() {
  Hooks.on("renderHotbar", () => ensureHeroHotbarSlot());
  Hooks.on("hotbarDrop", (_hotbar, _data, dropSlot) => {
    if (Number(dropSlot) === HOTBAR_SLOT) return false;
    return undefined;
  });

  ensureHeroHotbarSlot();
}
