import * as HeroPoints from "../heroPoints.js";
import { spendHeroPointsAndRoll } from "./HeroHub.js";

const MOD = "rnk-hero-forge";
const OVERLAY_ID = "rnk-hero-overlay";
const BUTTON_ID = "rnk-hero-overlay-button";
const HERO_ROLL_BUTTON_TOGGLE_HOOK = 'rnk-hero-forge.heroRollButtonToggle';

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

function isHeroRollButtonEnabled() {
  try {
    return !!game.settings.get(MOD, 'enableHeroRollButton');
  } catch (err) {
    return true;
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
    if (!isHeroRollButtonEnabled()) {
      return;
    }
    // Relaxed check: allow overlay if game is ready, even if canvas isn't fully drawn yet
    if (!canShowOverlay()) {
      console.log("RNK Hero Forge | Hero overlay skipped: canShowOverlay returned false");
      return;
    }

    console.log("RNK Hero Forge | Building hero overlay button...");
    const container = document.createElement("div");
    container.id = OVERLAY_ID;
    container.className = "rnk-hero-overlay";
    
    // Apply saved position
    const position = game.settings.get(MOD, "overlayPosition") || { top: 100, left: 100 };
    container.style.position = "fixed";
    container.style.top = (position.top || 100) + "px";
    container.style.left = (position.left || 100) + "px";
    container.style.zIndex = "9999";

    container.innerHTML = `
      <button id="${BUTTON_ID}" class="rnk-hero-overlay-button" type="button" title="Spend hero points and roll" aria-label="Spend hero points and roll">
        <i class="fas fa-bolt"></i>
        <span>Hero Roll</span>
      </button>
    `;

    document.body.appendChild(container);

    makeDraggable(container);

    const button = container.querySelector("#" + BUTTON_ID);
    if (button) {
      button.addEventListener("click", (e) => {
        if (container.dataset.isDragging === "true") {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handleOverlayClick(button);
      });
    }
  } catch (err) {
    console.error("RNK Hero Forge | Failed to build overlay:", err);
  }
}

function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let startX = 0, startY = 0;
  
  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    // Only drag if left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    startX = e.clientX;
    startY = e.clientY;
    
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    element.dataset.isDragging = "false";
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Calculate new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // Check total distance moved to determine if it's a drag vs click
    const totalDist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
    if (totalDist > 3) {
        element.dataset.isDragging = "true";
    }

    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    
    // Save position
    const position = {
      top: element.offsetTop,
      left: element.offsetLeft
    };
    game.settings.set(MOD, "overlayPosition", position);
    
    // Reset dragging flag after a short delay to allow click handler to check it
    setTimeout(() => {
        element.dataset.isDragging = "false";
    }, 50);
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
    const items = entries.map((entry) => {
      const { actor, current, max } = entry;
      const selected = actor.id === defaultId ? " is-selected" : "";
      const label = `${escapeLabel(actor.name)} (${current}/${max})`;
      return `<div class="spend-actor-item${selected}" data-actor-id="${actor.id}" role="option">${label}</div>`;
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
              <div class="spend-actor-list" id="rnk-hero-overlay-actor" role="listbox">
                ${items}
              </div>
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

    const dialog = new Dialog({
      title: "Select Hero",
      content,
      buttons: {
        choose: {
          label: "Continue",
          callback: (html) => {
            const root = html instanceof HTMLElement ? html : html[0];
            const selected = root.querySelector('.spend-actor-item.is-selected') || root.querySelector('.spend-actor-item');
            const value = selected?.dataset?.actorId || null;
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
    });

    // Render and attach click handlers to the custom list items so selection is obvious and accessible.
    dialog.render(true).then(() => {
      try {
        const dlgEl = dialog.element?.[0] || document.querySelector('.rnk-hero-dialog');
        if (!dlgEl) return;
        const list = dlgEl.querySelector('.spend-actor-list');
        if (!list) return;
        // click handler
        list.querySelectorAll('.spend-actor-item').forEach((el) => {
          el.addEventListener('click', (ev) => {
            list.querySelectorAll('.spend-actor-item').forEach((s) => s.classList.remove('is-selected'));
            ev.currentTarget.classList.add('is-selected');
          });
        });
        // keyboard navigation: simple up/down + enter
        list.addEventListener('keydown', (ev) => {
          const items = Array.from(list.querySelectorAll('.spend-actor-item'));
          if (!items.length) return;
          const idx = items.findIndex(i => i.classList.contains('is-selected'));
          if (ev.key === 'ArrowDown') {
            const next = items[Math.min(items.length - 1, Math.max(0, idx + 1))];
            items.forEach(i => i.classList.remove('is-selected'));
            next.classList.add('is-selected');
            next.scrollIntoView({ block: 'nearest' });
            ev.preventDefault();
          } else if (ev.key === 'ArrowUp') {
            const prev = items[Math.max(0, (idx === -1 ? 0 : idx) - 1)];
            items.forEach(i => i.classList.remove('is-selected'));
            prev.classList.add('is-selected');
            prev.scrollIntoView({ block: 'nearest' });
            ev.preventDefault();
          } else if (ev.key === 'Enter') {
            const selected = list.querySelector('.spend-actor-item.is-selected') || items[0];
            if (selected) selected.click();
            // trigger dialog continue button
            const btn = dlgEl.querySelector('.dialog-button[data-action="choose"]') || dlgEl.querySelector('.dialog-button');
            if (btn) btn.click();
          }
        });
        // ensure focus on the list for keyboard nav
        list.setAttribute('tabindex', '0');
        const initially = list.querySelector('.spend-actor-item.is-selected') || list.querySelector('.spend-actor-item');
        if (initially) initially.classList.add('is-selected');
        list.focus();
      } catch (err) {
        console.warn('RNK Hero Forge | actor list enhancement failed', err);
      }
    });
  });
}

async function gatherEligibleActors() {
  const actors = game.actors?.contents ?? [];
  const isGM = game.user?.isGM ?? false;
  const eligible = [];

  // If not GM, prefer the user's assigned character only.
  if (!isGM) {
    const myChar = game.user?.character ?? null;
    if (myChar) {
      const heroState = await HeroPoints.get(myChar).catch(() => null);
      const current = heroState?.current ?? 0;
      const max = heroState?.max ?? 0;
      if (current > 0) eligible.push({ actor: myChar, current, max });
      return eligible.sort((a, b) => a.actor.name.localeCompare(b.actor.name, game.i18n.lang));
    }
  }

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

  Hooks.on(HERO_ROLL_BUTTON_TOGGLE_HOOK, (value) => {
    if (value) {
      scheduleOverlayBuild(0);
    } else {
      removeOverlay();
    }
  });
}
