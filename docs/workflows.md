# Workflow Reference

This guide walks through the end-to-end flows that RNK Hero Forge orchestrates. Each section maps the player's or GM's interactions to the relevant code paths and assets.

## Hero Hub Spend & Roll Flow

1. Player or GM clicks **Spend & Roll** on an actor card in the Hero Hub (`templates/hub.hbs`).
2. `HeroHub.js` calls `promptSpendSelection()` to gather points, target roll, advantage mode, and post-chat preference.
3. The shared `spendHeroPointsAndRoll()` helper computes the hero bonus via `HeroPoints.computeHeroBonus()` and writes a pending bonus (`HeroPoints.setPendingBonus()`).
4. The selected d20 roll executes with fast-forwarded options through the actor API (`rollAbilityTest`, `rollAbilitySave`, or `rollSkill`).
5. `core-rolls.js` intercepts the d20, hydrates the stored hero roll JSON, merges dice, and updates the chat message flags.
6. Notifications confirm the spend, and optional chat summaries render via `hero-spend-chat.hbs`.

## Floating Hero Roll Overlay

1. `registerHeroSpendOverlay()` adds a fixed-position button to the DOM after the canvas is ready.
2. Clicking **Hero Roll** calls `handleOverlayClick()` which collects eligible actors (owned or GM-controlled with remaining hero points).
3. If multiple actors qualify, a dialog appears to select the hero; the flow otherwise auto-selects the controlled token or user character.
4. The helper reuses `spendHeroPointsAndRoll()` so the overlay honours identical logic, settings, and theming as the hub.

## Chat Message Hero Button

1. `renderHeroButtonForMessage()` runs on `renderChatMessageHTML` for any roll-bearing chat card.
2. A contextual button is inserted when the message author (or GM) has hero points available.
3. On click, the user chooses how many points to spend, whether to create a pending bonus, and whether to post a summary.
4. Pending bonuses are saved via `HeroPoints.setPendingBonus()` and consumed on the next eligible d20 roll.

## Pending Bonus Consumption

1. `executeHeroD20Roll()` (core-rolls integration) checks `HeroPoints.getPendingBonus(actor)` before offering prompts.
2. If a pending bonus exists, it is applied immediately, the flag cleared, and the merged roll proceeds without additional dialogs.
3. The payload includes metadata (points spent, formula, roll label) for notifications and logging.

## GM Scene Tracker Operations

1. GMs open the `SceneHeroTrackerUI` tool from the Token controls.
2. The tracker renders `templates/scene-tracker.hbs`, listing hero points for a selected actor.
3. Actions inside the tracker call the same heroPoint helpers (`add`, `spend`, `setMax`) to update actor flags.
4. Spending from the tracker optionally queues a pending bonus and posts chat summaries (without auto-rolling).

## Theme Application Lifecycle

1. Client settings changes or the ready hook trigger `applyCurrentTheme()`.
2. The helper derives the chosen preset or custom values from `game.settings` and injects CSS variables under `:root`.
3. The overlay, hub, and other themed surfaces inherit colours via CSS custom properties defined in `styles/hub.css`.
