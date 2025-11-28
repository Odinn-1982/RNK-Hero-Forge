import { registerSettings } from "./settings.js";
import * as HeroPoints from "./heroPoints.js";
import { HeroHub } from "./ui/HeroHub.js";
import { renderHeroButtonForMessage } from "./ui/HeroButton.js";
import { registerMidiQOLIntegration } from "./integrations/midiQOL.js";
import { registerMATTIntegration } from "./integrations/matt.js";
import { registerMATTAdapter } from "./integrations/mattAdapter.js";
import { registerCoreRollIntegration } from "./integrations/core-rolls.js";
import "./levelup.js";
import { registerActorTracker } from "./ui/ActorTracker.js";
import { registerSceneTrackerUI } from "./ui/SceneTrackerUI.js";
import { applyCurrentTheme } from "./theme.js";
import { registerHeroSpendOverlay } from "./ui/HeroSpendOverlay.js";
import { logger } from './logger.js';
import { registerHotbarButton } from './ui/hotbar-button.js';

Hooks.once("init", async function () {
  logger.log("Initializing");
  registerSettings();
  // Preload templates
  await foundry.applications.handlebars.loadTemplates([
    "modules/rnk-hero-forge/templates/hub.hbs",
    "modules/rnk-hero-forge/templates/button.hbs",
    "modules/rnk-hero-forge/templates/hero-spend-chat.hbs",
    "modules/rnk-hero-forge/templates/actor-tracker.hbs",
    "modules/rnk-hero-forge/templates/scene-tracker.hbs",
  ]);
  // Register helper for templates to use localized strings safely
  try {
    Handlebars.registerHelper('localize', (key) => {
      try { return (game?.i18n && game.i18n.localize) ? game.i18n.localize(key) : key; } catch (e) { return key; }
    });
    Handlebars.registerHelper('format', (key, options) => {
      try { return (game?.i18n && game.i18n.format) ? game.i18n.format(key, options.hash || {}) : key; } catch (e) { return key; }
    });
  } catch (e) {
    logger.warn('Failed to register Handlebars helpers localize/format', e);
  }
});

Hooks.once("ready", async function () {
  logger.log("Ready");

  applyCurrentTheme();

  // Warn if module metadata still contains placeholder values
  try {
    const response = await fetch('modules/rnk-hero-forge/module.json');
    if (response.ok) {
      const moduleRaw = await response.json();
      const hasPlaceholder = (s) => typeof s === 'string' && (s.includes('<github-username>') || s.includes('example.com') || s.includes('Your Name') || s.includes('you@example.com'));
      const placeholders = [];
      if (hasPlaceholder(moduleRaw.manifest)) placeholders.push('module.json.manifest');
      if (hasPlaceholder(moduleRaw.download)) placeholders.push('module.json.download');
      if (Array.isArray(moduleRaw.authors)) {
        for (const a of moduleRaw.authors) {
          if (hasPlaceholder(a?.name) || hasPlaceholder(a?.email)) placeholders.push('module.json.authors');
        }
      }
      if (placeholders.length) {
        logger.warn('Detected placeholder metadata in module.json:', placeholders.join(', '));
        ui.notifications?.warn?.('RNK Hero Forge contains placeholder metadata. Run tools/prepare-release.js before publishing.');
      }
    }
  } catch (err) {
    // non-fatal, fetch may be blocked in some contexts
  }

  // Add a sidebar button
    const button = new Application({
      id: "rnk-hero-hub-btn",
    title: "Hero Forge",
    template: null,
  });

  // Create a simple control button in the UI
  Hooks.on("getSceneControlButtons", (controls) => {
    const heroControl = {
      name: "hero-forge",
      title: "RNK Hero Forge",
      icon: "fas fa-hammer",
      visible: game.user.isGM || game.settings.get("rnk-hero-forge", "enablePlayersHub"),
      layer: "token",
      tools: [
        {
          name: "open-hub",
          title: "Open Hero Hub",
          icon: "fas fa-fire",
          onClick: () => {
            new HeroHub({ showOnlyOwned: !game.user.isGM }).render(true);
          },
        },
      ],
    };

    if (Array.isArray(controls)) {
      controls.push(heroControl);
    } else if (controls instanceof Map) {
      controls.set(heroControl.name, heroControl);
    } else if (controls && typeof controls === 'object') {
      controls[heroControl.name] = heroControl;
    }
  });

  // Render hero-button on chat messages that contain rolls
  // V12+ uses renderChatMessageHTML with HTMLElement, V11 uses renderChatMessage with jQuery
  Hooks.on("renderChatMessageHTML", (message, html, data) => {
    try {
      renderHeroButtonForMessage(message, html);
    } catch (err) {
      logger.error("renderChatMessageHTML error", err);
    }
  });
  // Fallback for V11 compatibility
  Hooks.on("renderChatMessage", (message, html, data) => {
    try {
      renderHeroButtonForMessage(message, html);
    } catch (err) {
      logger.error("renderChatMessage error", err);
    }
  });

  // Expose API
  game.rnk = game.rnk || {};
  game.rnk.heroPoints = HeroPoints;

  logger.debug("Module registered API: game.rnk.heroPoints");

  // Initialize integrations
  try {
    registerMidiQOLIntegration();
    registerMATTIntegration();
    registerMATTAdapter();
    registerCoreRollIntegration();
    registerActorTracker();
    registerSceneTrackerUI();
  } catch (err) {
    logger.warn("midiQOL integration failed to initialize", err);
  }

  registerHeroSpendOverlay();
  registerHotbarButton();

  // Diagnostic: check loaded template path (helps catch installed folder <> module.id mismatches)
  try {
    const testTemplate = 'modules/rnk-hero-forge/templates/hub.hbs';
    fetch(testTemplate, { method: 'HEAD' }).then(resp => {
      if (!resp.ok) {
        logger.warn(`Template fetch failed for ${testTemplate} (status ${resp.status}) — this often means the installed folder name does not match module id. Check the modules folder and rename the installed folder to exactly 'rnk-hero-forge'.`);
        ui.notifications?.warn?.("RNK Hero Forge: Template fetch failed. If you see 404/ENOENT errors, check that the installed module folder name matches 'rnk-hero-forge' and restart Foundry.");
      }
    }).catch(e => {
      logger.warn('Failed to perform template fetch check', e);
    });
  } catch (err) { /* ignore */ }
});

// Provide a small hook others can listen for to apply hero bonuses for integrations like midiQOL
Hooks.on("rnk-hero-forge.applyHeroBonus", (payload) => {
  // payload: {message, actor, points, bonus}
  logger.debug('applyHeroBonus', payload);
});
