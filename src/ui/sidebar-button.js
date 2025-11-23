import { logger } from "../logger.js";
const MODULE_ID = 'rnk-hero-forge';
const BUTTON_ID = 'rnk-hero-sidebar-button';
const BUTTON_CLASS = 'rnk-hero-sidebar-button';
const BUTTON_STACK_ID = 'custom-sidebar-buttons';
const BUTTON_STACK_STYLE_ID = 'rnk-hero-sidebar-button-stack-style';
const SIDEBAR_SELECTOR = '#sidebar-tabs';

const log = (...args) => logger.log(...args);
const warn = (...args) => logger.warn(...args);

function ensureSidebarButtonStackStyles() {
  if (document.getElementById(BUTTON_STACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BUTTON_STACK_STYLE_ID;
  style.textContent = `
    #${BUTTON_STACK_ID} {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 4px 0 !important;
      pointer-events: auto !important;
      width: 52px !important;
      max-width: 52px !important;
    }
    #${BUTTON_STACK_ID} > * {
      width: 36px !important;
      height: 36px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  document.head?.appendChild(style);
}

function getSidebarButtonStack() {
  const tabs = document.querySelector(SIDEBAR_SELECTOR);
  if (!tabs) return null;
  let stack = tabs.querySelector(`#${BUTTON_STACK_ID}`);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = BUTTON_STACK_ID;
    const reference = tabs.querySelector('.item[data-tab="settings"]') ?? tabs.lastElementChild;
    if (reference) reference.insertAdjacentElement('afterend', stack);
    else tabs.append(stack);
  }
  ensureSidebarButtonStackStyles();
  // Move legacy stacks into the new stack if present
  ['#rnk-sidebar-button-stack', '#RNK-sidebar-button-stack'].forEach((legacySelector) => {
    const legacy = tabs.querySelector(legacySelector);
    if (!legacy || legacy === stack) return;
    while (legacy.firstChild) stack.appendChild(legacy.firstChild);
    legacy.remove();
  });
  // Also collect other containers (Deck, Runar, Crimson) often used
  ['#runar-buttons', '#deck-buttons', '#crimson-blood-buttons', '#runar-sidebar-buttons'].forEach(selector => {
    const c = tabs.querySelector(selector);
    if (!c || c === stack) return;
    while (c.firstChild) stack.appendChild(c.firstChild);
    c.remove();
  });

  return stack;
}

// Debug
console.log(`${MODULE_ID} sidebar-button loaded`);

async function openHeroHub(button) {
  try {
    // dynamic import
    const mod = await import('./HeroHub.js');
    const Hub = mod.HeroHub;
    const h = new Hub({ showOnlyOwned: !game.user.isGM });
    try {
      await h.render(true);
    } catch (err) {
      // Enhance error with diagnostic advice
      console.error(`${MODULE_ID} | Hero Hub render failed`, err);
      ui.notifications?.error?.("RNK Hero Forge: Failed to render the Hub UI. If you see an ENOENT error for templates/hub.hbs, ensure the installed module folder name exactly matches the module id 'rnk-hero-forge' and then restart Foundry.");
      return;
    }
    window.rnkHeroHub = h;
    // add an active class
    try { button.classList.add('active'); } catch (e) { }
    // wrap close to remove active class
    const origClose = h.close.bind(h);
    h.close = async function (options) { await origClose(options); try { button.classList.remove('active'); } catch (e) { } };
  } catch (err) {
    console.error(`${MODULE_ID} | Failed to open Hero Hub`, err);
    ui.notifications?.error?.("RNK Hero Forge failed to open.");
  }
}

function initializeHeroSidebarButton() {
  log('Initializing sidebar button...');
  try {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();

    const button = document.createElement('div');
    button.id = BUTTON_ID;
    button.className = BUTTON_CLASS;
    const localizedTitle = game?.i18n?.localize?.('rnk-hero-forge.sidebar.openHub') || 'Hero Forge';
    button.title = localizedTitle;
    button.innerHTML = `<i class="fas fa-hammer" style="font-size: 16px; pointer-events: none;"></i>`;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', 'Hero Forge');

    button.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      button.style.transform = 'scale(0.94)';
      setTimeout(() => button.style.transform = '', 120);
      openHeroHub(button);
    });

    button.addEventListener('mouseenter', () => button.classList.add('hover'));
    button.addEventListener('mouseleave', () => button.classList.remove('hover'));

    // Always use the shared stack for consistency
    const stack = getSidebarButtonStack();
    if (stack) {
      stack.appendChild(button);
      log('Hero sidebar button appended to shared stack.');
      return true;
    }

    // Fallback: Place button - attempt recommended anchors first
    const anchors = [
      'rnk-mark-floating-launcher',
      'rnk-mark-sidebar-button',
      'rnk-spell-codex-sidebar-button',
      'rnk-mark-sidebar-button',
      'rnk-spell-codex-sidebar-button',
      'deck-sidebar-button',
      'tab-users',
      'tab-packs'
    ];
    // Try anchors
    for (const a of anchors) {
      const anchor = document.getElementById(a);
      log(`Checking anchor ${a}: ${!!anchor}`);
      if (anchor?.parentElement) {
        anchor.insertAdjacentElement('afterend', button);
        log(`Placed hero button after ${a}`);
        return true;
      }
    }

    const tabs = document.querySelector(SIDEBAR_SELECTOR);
    if (tabs) {
      tabs.appendChild(button);
      log('Hero sidebar button appended to sidebar tabs fallback.');
      return true;
    }
    warn('Could not place hero sidebar button.');
    return false;
  } catch (err) {
    warn('Failed to initialize Hero Forge sidebar button', err);
    return false;
  }
}

// Try to initialize on DOMContentLoaded
// A robust method to wait until #sidebar-tabs exists in DOM
function waitForSidebarTabs(timeout = 10000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(SIDEBAR_SELECTOR);
    if (existing) return resolve(true);
    const obs = new MutationObserver((mutations) => {
      const found = document.querySelector(SIDEBAR_SELECTOR);
      if (found) {
        obs.disconnect();
        resolve(true);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(false); }, timeout);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForSidebarTabs(10000).then((ok) => { if (ok) initializeHeroSidebarButton(); else initializeHeroSidebarButton(); }));
} else {
  waitForSidebarTabs(10000).then((ok) => { if (ok) initializeHeroSidebarButton(); else initializeHeroSidebarButton(); });
}

try { Hooks.once('ready', () => setTimeout(() => waitForSidebarTabs(10000).then(() => initializeHeroSidebarButton()), 100)); } catch (e) { }

// Retry logic: if the button wasn't placed, try again several times (use console logs to figure out why)
let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 60; // ~60 seconds
(function attemptPlacementLoop() {
  try {
    const perfCheck = document.getElementById(BUTTON_ID);
    if (!perfCheck) {
      // Not present, attempt to place
      const success = initializeHeroSidebarButton();
      retryAttempts++;
      if (!success && retryAttempts < MAX_RETRY_ATTEMPTS) {
        setTimeout(attemptPlacementLoop, 1000);
      }
    }
  } catch (err) {
    console.warn('Hero Forge sidebar placement attempt failed', err);
  }
})();

export default {};

