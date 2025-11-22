# Code Architecture

This document maps the RNK Hero Forge codebase, highlighting how files and directories contribute to the overall experience.

## Directory Layout

| Path | Purpose |
| --- | --- |
| `src/module.js` | Entry point: registers settings, themes, integrations, and UI surfaces on Foundry hooks. |
| `src/heroPoints.js` | Core logic for retrieving, modifying, and serialising hero point data on actor flags. |
| `src/theme.js` | Preset definitions, slot metadata, and theme application helper. |
| `src/levelup.js` | Hook listeners to grant hero points on character level-up depending on settings. |
| `src/integrations/` | Integration glue for D&D5e core rolls, Midi-QOL, MATT, and adapters. |
| `src/ui/` | All user interfaces: Hero Hub, overlay, scene tracker, chat button, sidebar button. |
| `styles/` | Stylesheets powering hub visuals, chat cards, buttons, and overlay. |
| `templates/` | Handlebars templates for hub, chat messages, actor tracker, and UI fragments. |
| `tools/` | Utility scripts such as module validation. |
| `macros/` | Example scripts demonstrating hero point operations. |

## Key Modules

### Hero Points Core (`src/heroPoints.js`)

- Provides `get`, `set`, `add`, `spend`, `setMax`, `clear` helpers operating on actor flags.
- Builds tiered dice formulas based on points spent (`buildTieredRollFormula`).
- Evaluates hero bonus rolls (`computeHeroBonus`) with optional roll objects.
- Stores pending bonuses with metadata for consumption on the next roll.

### Core Roll Integration (`src/integrations/core-rolls.js`)

- Wraps `game.dnd5e.d20Roll` (plus fallbacks) to inject hero point prompts and bonuses.
- Normalises roll arguments, applies pending bonuses, or displays dialogs when appropriate.
- Merges hero bonus dice into the base roll using Foundry `Roll` objects, preserving JSON for chat cards.
- Sets informative flags on `ChatMessage` documents for downstream modules.

### Hero Hub (`src/ui/HeroHub.js` + `templates/hub.hbs`)

- Assembles actor data (images, ownership, pending bonuses) for display.
- Offers filters, search, and quick actions (add, spend, set max, grant-all).
- Uses shared logic (`spendHeroPointsAndRoll`) to drive the spend flow with roll selection.

### Overlay Button (`src/ui/HeroSpendOverlay.js`)

- Injects a floating button onto the canvas once the scene is ready.
- Collects eligible actors and reuses the spend-and-roll workflow for fast access.
- Listens to settings and canvas events to show/hide the control.

### Other UI Components

- `HeroButton.js`: Chat message button for post-roll hero spending.
- `ActorTracker.js`: GM-focused panel for hero point status across scenes.
- `SceneTrackerUI.js`: ApplicationV2 implementation for quick adjustments.
- `sidebar-button.js`: Ensures a sidebar launcher is available even if other modules rearrange the UI.

## Styling & Templates

- `styles/hub.css`: Governs the majority of component styling using CSS variables from the theme engine.
- `styles/button.css`, `styles/chat.css`, `styles/sidebar-button.css`, `styles/scene-tracker.css`: Supporting stylesheets for discrete UI elements.
- `templates/hero-spend-chat.hbs`: Chat card summarising hero point spends.
- `templates/button.hbs`: Chat button partial.

## Hook Usage Summary

- `Hooks.once('init')`: Register settings and preload templates.
- `Hooks.once('ready')`: Apply theme, wire scene controls, expose API, register overlay.
- `Hooks.on('renderChatMessageHTML')`: Inject hero spend button.
- `Hooks.on('getSceneControlButtons')`: Add Hero Hub and Scene Tracker controls.
- `Hooks.callAll('rnk-hero-forge.applyHeroBonus')`: Notify other modules when bonuses apply.
- Various Foundry hooks inside integrations and overlay respond to canvas readiness, settings changes, and player list renders.

## Exported API

- The module attaches `game.rnk.heroPoints` to expose helper functions for macros or other modules (documented in [api.md](api.md)).

This architecture enables modular feature development: hero logic, UI surfaces, and system integrations stay isolated but communicate via shared helpers and hook payloads.
