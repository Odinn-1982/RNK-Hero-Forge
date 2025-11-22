# Feature Overview

RNK Hero Forge bundles quality-of-life tools for running hero points in D&D 5e on Foundry VTT. The module combines automated rolls, themable interfaces, and extensible hooks. This page catalogues the major capabilities.

## Hero Point Management

- Track per-actor hero points via document flags (`actor.getFlag('rnk-hero-forge', 'heroPoints')`).
- Configure default max/current values, grant amounts on level-up, and optional auto-grant behaviour.
- Use the Hero Hub UI for a consolidated GM or player-controlled dashboard.
- Support spending, adding, clearing, and setting caps directly from the UI.

## Hero Point Spending Flows

- **Hero Hub Spend & Roll:** Guides players through point selection, roll targeting, advantage state, and automatically performs the d20 with merged hero bonus dice.
- **Floating Overlay Button:** Provides a quick-access “Hero Roll” control on the canvas for players to spend points without opening the hub.
- **Chat Message Button:** Adds a contextual button on rolled chat cards so players can spend points after a roll if heroes remain.
- **Pending Bonus Support:** Allow GMs or players to queue a bonus for the next roll (via hub, overlay, chat action, or trackers).

## Dice Integration

- Wraps the D&D5e `d20Roll` core function (`src/integrations/core-rolls.js`) to inject hero bonuses and merge dice results.
- Serialises hero bonus rolls (`roll.toJSON()`) to maintain a single combined chat card result.
- Broadcasts the `Hooks.callAll('rnk-hero-forge.applyHeroBonus', payload)` event for downstream modules.

## Theming & Styling

- Theme preset system with 10 pre-defined palettes plus a custom override mode (`src/theme.js`).
- CSS custom properties drive the hub, overlay, and future UI surfaces (`styles/hub.css`).
- Client-scoped color settings update the theme live (`applyCurrentTheme()` during ready and on setting change).

## User Interfaces

- **Hero Hub (`HeroHub.js` / `templates/hub.hbs`):** Card-based layout for actors, filters, search, stats, and hero actions.
- **Scene Tracker (`SceneHeroTrackerUI`):** GM-only panel for quick adjustments on the current scene.
- **Sidebar Button:** Launch point inside the Foundry sidebar tabs (`src/ui/sidebar-button.js`).
- **Canvas Overlay:** Floating action button for rapid hero rolls (`src/ui/HeroSpendOverlay.js`).

## Settings & Configuration

- Comprehensive world settings for defaults, modes, and permissions.
- Client settings for theming and per-user color overrides.
- Build-time template preloading for hub, button, chat, and tracker layouts (`src/module.js`).

## Integrations & Extensibility

- Native support for Midi-QOL (`registerMidiQOLIntegration()`) and MATT (`registerMATTIntegration()`) workflows.
- Hooks and exported APIs provide extension points for other modules or macros.
- Macro example (`macros/test-hero-spend-macro.js`) demonstrates spending via script.

## Quality of Life

- Notifications summarise hero point spending, pending bonuses, and invalid states.
- Roll dialogs auto-fast-forward after the hero prompt to keep gameplay smooth.
- Hero spend prompts auto-populate actor name, available points, and roll choices.
