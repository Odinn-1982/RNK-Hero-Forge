# UI Components

RNK Hero Forge introduces several user-facing interfaces across Foundry VTT. This reference outlines each component, where it lives, and how it behaves.

## Hero Hub

- **Files:** `src/ui/HeroHub.js`, `templates/hub.hbs`, `styles/hub.css`
- **Purpose:** Central command centre for reviewing hero points across actors.
- **Highlights:**
  - Actor cards show current/max points, ownership, pending bonuses, and quick actions.
  - Filters (`data-hub-filter`), search, and summary statistics update the gallery in place.
  - Spend button leverages the shared spend-and-roll flow for immediate dice resolution.
- **Access:** Sidebar button (`sidebar-button.js`) and scene controls hook.

## Scene Hero Tracker

- **Files:** `src/ui/SceneTrackerUI.js`, `templates/scene-tracker.hbs`, `styles/scene-tracker.css`
- **Purpose:** GM-only panel for adjusting hero points on the fly during encounters.
- **Highlights:**
  - Uses Foundry `ApplicationV2` for responsive rendering.
  - Offers add, spend, and set-max actions; optional chat notifications on spend.
  - Exposed via `getSceneControlButtons` under the Token layer.

## Chat Hero Button

- **Files:** `src/ui/HeroButton.js`, `templates/button.hbs`, `styles/button.css`
- **Purpose:** Embed a contextual action on chat messages that include rolls.
- **Highlights:**
  - Only visible to the message author or GMs with available hero points.
  - Supports pending bonus creation and chat notifications.
  - Hooks into `renderChatMessageHTML` to keep markup compatible with other modules.

## Floating Hero Roll Overlay

- **Files:** `src/ui/HeroSpendOverlay.js`, CSS additions in `styles/hub.css`
- **Purpose:** Give players rapid access to the spend-and-roll prompt without opening the hub.
- **Highlights:**
  - Appears as a fixed-position button on the canvas (respects theme colours).
  - Prompts for actor selection when multiple eligible choices exist.
  - Shares spend workflow with the hub to ensure consistent messaging and dice behaviour.

## Sidebar Launcher

- **Files:** `src/ui/sidebar-button.js`, `styles/sidebar-button.css`
- **Purpose:** Provide a reliable entry point to the Hero Hub from the Foundry sidebar.
- **Highlights:**
  - Dynamically locates or creates a shared button stack to coexist with other modules.
  - Applies active/hover feedback and handles placement retries if the sidebar loads slowly.

## Chat Templates

- **Files:** `templates/hero-spend-chat.hbs`, `styles/chat.css`
- **Purpose:** Display hero spend summaries in chat when users opt to broadcast the bonus.
- **Highlights:**
  - Shows actor portrait, points spent, roll formula, and resulting bonus.
  - Used by multiple flows (hub, chat button, scene tracker) for consistent presentation.

Each UI component consumes data from `heroPoints.js` helpers and respects the theme engine to deliver a cohesive, skinnable experience.
