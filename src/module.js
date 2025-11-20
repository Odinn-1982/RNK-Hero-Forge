import { registerSettings } from "./settings.js";
import * as HeroPoints from "./heroPoints.js";
import { HeroHub } from "./ui/HeroHub.js";
import { renderHeroButtonForMessage } from "./ui/HeroButton.js";
import { registerMidiQOLIntegration } from "./integrations/midiQOL.js";
import { registerMATTIntegration } from "./integrations/matt.js";
import { registerMATTAdapter } from "./integrations/mattAdapter.js";
import "./levelup.js";

Hooks.once("init", async function () {
  console.log("RagNarok's Hero Forge | Initializing");
  registerSettings();
  // Preload templates
  await loadTemplates([
    "templates/hub.hbs",
    "templates/button.hbs",
  ]);
});

Hooks.once("ready", async function () {
  console.log("RagNarok's Hero Forge | Ready");

  // Add a sidebar button
  const button = new Application({
    id: "ragnaroks-hero-hub-btn",
    title: "Hero Forge",
    template: null,
  });

  // Create a simple control button in the UI
  Hooks.on("getSceneControlButtons", (controls) => {
    // Add under token controls for convenience
    controls.push({
      name: "hero-forge",
      title: "RagNarok's Hero Forge",
      icon: "fas fa-hammer",
      visible: game.user.isGM || game.settings.get("ragnaroks-hero-forge", "enablePlayersHub"),
      layer: "layer",
      tools: [
        {
          name: "open-hub",
          title: "Open Hero Hub",
          icon: "fas fa-fire",
          onClick: () => {
            new HeroHub().render(true);
          },
        },
      ],
    });
  });

  // Render hero-button on chat messages that contain rolls
  Hooks.on("renderChatMessage", (message, html, data) => {
    try {
      renderHeroButtonForMessage(message, html);
    } catch (err) {
      console.error("RagNarok's Hero Forge | renderChatMessage error", err);
    }
  });

  // Expose API
  game.ragnaroks = game.ragnaroks || {};
  game.ragnaroks.heroPoints = HeroPoints;

  console.log("RagNarok's Hero Forge | Module registered API: game.ragnaroks.heroPoints");

  // Initialize integrations
  try {
    registerMidiQOLIntegration();
    registerMATTIntegration();
    registerMATTAdapter();
  } catch (err) {
    console.warn("RagNarok's Hero Forge | midiQOL integration failed to initialize", err);
  }
});

// Provide a small hook others can listen for to apply hero bonuses for integrations like midiQOL
Hooks.on("ragnaroks-hero-forge.applyHeroBonus", (payload) => {
  // payload: {message, actor, points, bonus}
  console.log("RagNarok's Hero Forge | applyHeroBonus", payload);
});
