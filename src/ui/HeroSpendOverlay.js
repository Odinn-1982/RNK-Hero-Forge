import * as HeroPoints from "../heroPoints.js";
import { spendHeroPointsAndRoll } from "./HeroHub.js";

const MOD = "rnk-hero-forge";
const OVERLAY_ID = "rnk-hero-overlay";
const BUTTON_ID = "rnk-hero-overlay-button";

import { logger } from "../logger.js";

function canShowOverlay() {
  if (!(game?.user)) return false;
  const allowPlayers = game.settings?.get?.(MOD, "enablePlayersHub") ?? true;
  const result = game.user.isGM || allowPlayers;
  logger.debug("canShowOverlay check", { isGM: game.user.isGM, allowPlayers, result });
  return result;
}

function removeOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing?.parentElement) {
    existing.remove();
  }
}

function escapeLabel(text) {
  const esc = foundry.utils?.escapeHTML;
  if (typeof esc === "function") return esc(text ?? "");
  return (text ?? "").replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[match] || match);
}

function buildOverlay() {
  try {
    removeOverlay();
    // Relaxed check: allow overlay if game is ready, even if canvas isn't fully drawn yet
    if (!canShowOverlay()) {
      console.log("RNK Hero Forge | Hero overlay skipped: canShowOverlay returned false");
      return;
    }

    console.log("RNK Hero Forge | Building hero overlay button...");
    const container = document.createElement("div");
    container.id = OVERLAY_ID;
    container.className = "rnk-hero-overlay";
    container.innerHTML = `
      <button id="${BUTTON_ID}" class="rnk-hero-overlay-button" type="button" title="Spend hero points and roll" aria-label="Spend hero points and roll">
        <i class="fas fa-bolt"></i>
        <span>Hero Roll</span>
      </button>
    `;

    document.body.appendChild(container);

    const button = container.querySelector("#" + BUTTON_ID);
    if (button) {
      button.addEventListener("click", () => handleOverlayClick(button));
    }
  } catch (err) {
    console.error("RNK Hero Forge | Failed to build overlay:", err);
  }
}

function getDefaultActorId(entries) {
  const controlled = canvas?.tokens?.controlled ?? [];
  for (const token of controlled) {
    const id = token?.actor?.id;
    if (id && entries.some((entry) => entry.actor.id === id)) return id;
  }
  const assigned = game.user?.character?.id;
  if (assigned && entries.some((entry) => entry.actor.id === assigned)) return assigned;
  return null;
}

function promptActorSelection(entries) {
  return new Promise((resolve) => {
    const defaultId = getDefaultActorId(entries);
    const options = entries.map((entry) => {
      const { actor, current, max } = entry;
      const selected = actor.id === defaultId ? " selected" : "";
      const label = `${escapeLabel(actor.name)} (${current}/${max})`;
      return `<option value="${actor.id}"${selected}>${label}</option>`;
    }).join("");

    const content = `
      <form class="rnk-hero-spend-form hero-hub-theme">
        <div class="spend-header">
          <div class="spend-hero-identity">
            <span class="spend-hero-name">Select Hero</span>
          </div>
          <div class="spend-helper">Multiple heroes available</div>
        </div>
        <div class="spend-body">
          <div class="spend-row">
            <label for="rnk-hero-overlay-actor">Choose a hero</label>
            <div class="spend-select-wrapper">
              <select id="rnk-hero-overlay-actor">${options}</select>
            </div>
          </div>
        </div>
      </form>
    `;

    let completed = false;
    const finish = (value) => {
      if (completed) return;
      completed = true;
      resolve(value);
    };

    new Dialog({
      title: "Select Hero",
      content,
      buttons: {
        choose: {
          label: "Continue",
          callback: (html) => {
            const root = html instanceof HTMLElement ? html : html[0];
            const select = root.querySelector("#rnk-hero-overlay-actor");
            const value = select?.value;
            if (!value) {
              ui.notifications?.warn?.("Select a hero to continue.");
              return false;
            }
            finish(value);
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null),
        },
      },
      default: "choose",
      close: () => finish(null),
    }, { 
      jQuery: true,
      classes: ["dialog", "rnk-hero-dialog"]
    }).render(true);
  });
}

async function gatherEligibleActors() {
  const actors = game.actors?.contents ?? [];
  const isGM = game.user?.isGM ?? false;
  const eligible = [];

  for (const actor of actors) {
    const type = actor.type ?? actor.data?.type;
    const hasAccess = isGM || actor.isOwner;
    if (!hasAccess) continue;
    if (!isGM && type && type !== "character" && !actor.hasPlayerOwner) continue;
    const heroState = await HeroPoints.get(actor).catch(() => null);
    const current = heroState?.current ?? 0;
    const max = heroState?.max ?? 0;
    if (current <= 0) continue;
    eligible.push({ actor, current, max });
  }

  eligible.sort((a, b) => a.actor.name.localeCompare(b.actor.name, game.i18n.lang));
  return eligible;
}

async function handleOverlayClick(button) {
  if (button.dataset.busy === "true") return;
  button.dataset.busy = "true";
  button.classList.add("is-busy");
  button.disabled = true;

  try {
    const entries = await gatherEligibleActors();
    if (!entries.length) {
      ui.notifications?.warn?.("No eligible heroes with hero points available.");
      return;
    }

    let targetEntry = entries[0];
    if (entries.length > 1) {
      const selection = await promptActorSelection(entries);
      if (!selection) return;
      const found = entries.find((entry) => entry.actor.id === selection);
      if (!found) {
        ui.notifications?.warn?.("Selected hero is no longer available.");
        return;
      }
      targetEntry = found;
    }

    await spendHeroPointsAndRoll(targetEntry.actor, { origin: "overlay" });
  } finally {
    button.dataset.busy = "false";
    button.classList.remove("is-busy");
    button.disabled = false;
  }
}

function scheduleOverlayBuild(delay = 50) {
  setTimeout(() => buildOverlay(), delay);
}

export function registerHeroSpendOverlay() {
  if (game.ready) scheduleOverlayBuild(150);
  else Hooks.once("ready", () => scheduleOverlayBuild(150));
  Hooks.on("canvasReady", () => scheduleOverlayBuild(50));
  // Hooks.on("canvasTearDown", () => removeOverlay()); // Removed to prevent flickering or disappearance on scene change

  Hooks.on("updateSetting", (setting) => {
    if (setting?.namespace === MOD && setting?.key === "enablePlayersHub") {
      scheduleOverlayBuild(0);
    }
  });
}
