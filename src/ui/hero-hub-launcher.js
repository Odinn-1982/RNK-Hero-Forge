import { HeroHub } from "./HeroHub.js";
import { logger } from "../logger.js";

const MODULE_ID = "rnk-hero-forge";
const DEFAULT_TOOLTIP_KEY = "rnk-hero-forge.sidebar.openHub";

function getHubTitle() {
  try {
    return game?.i18n?.localize?.(DEFAULT_TOOLTIP_KEY) || "Hero Forge";
  } catch (err) {
    logger.warn("Failed to localize GM hub title", err);
    return "Hero Forge";
  }
}

async function renderHub(triggerElement, showOnlyOwned = !game.user.isGM) {
  const hub = new HeroHub({ showOnlyOwned });
  try {
    await hub.render(true);
  } catch (err) {
    logger.error(`${MODULE_ID} | Hero Hub render failed`, err);
    ui.notifications?.error?.(
      "RNK Hero Forge: Failed to render the Hub UI. If you see an ENOENT error for templates/hub.hbs, ensure the installed module folder name exactly matches the module id 'rnk-hero-forge' and then restart Foundry."
    );
    return null;
  }

  window.rnkHeroHub = hub;
  try {
    triggerElement?.classList?.add("active");
  } catch (err) {
    logger.warn(`${MODULE_ID} | Failed to add active class`, err);
  }

  const origClose = hub.close && hub.close.bind(hub);
  if (origClose) {
    hub.close = async function (options) {
      await origClose(options);
      try {
        triggerElement?.classList?.remove("active");
      } catch (err) {
        logger.warn(`${MODULE_ID} | Failed to remove active class`, err);
      }
    };
  }

  return hub;
}

export async function openHeroHub(triggerElement, options = {}) {
  const showOnlyOwned = options?.showOnlyOwned ?? (!game.user.isGM);
  return await renderHub(triggerElement, showOnlyOwned);
}

export function applyHeroHubTooltip(element) {
  if (!element) return;
  const title = getHubTitle();
  try {
    element.title = title;
    element.setAttribute("aria-label", title);
  } catch (err) {
    logger.warn(`${MODULE_ID} | Failed to apply hub tooltip`, err);
  }
}
