# Integration Notes

RNK Hero Forge coordinates with Foundry’s D&D5e system and optional automation modules to keep hero point bonuses consistent across workflows. This guide details each integration touchpoint.

## Core System (D&D5e)

- **File:** `src/integrations/core-rolls.js`
- **Hook:** Wraps `game.dnd5e.d20Roll` (plus fallbacks on `game.dnd5e.dice`, `CONFIG.DND5E`, etc.).
- **Responsibilities:**
  - Normalise roll arguments and resolve actor context.
  - Check for pending hero bonuses before prompting users.
  - Display the hero point prompt when eligible and no pending bonus exists.
  - Merge hero bonus dice into the result, adjusting totals, formulas, and serialized JSON so only one chat message appears.
  - Flag chat messages with metadata (`flags['rnk-hero-forge']`) for other modules.

## Midi-QOL

- **Registration:** `registerMidiQOLIntegration()` invoked during the ready hook.
- **Purpose:** Ensure hero bonuses apply correctly inside Midi-QOL workflows (damage rolls, attack rolls, etc.).
- **Implementation:** The integration file hooks relevant Midi-QOL events (see `src/integrations/midiQOL.js`) to respect pending bonuses and chat flags.

## MATT (Mars Automatic Triage Tool)

- **Registration:** `registerMATTIntegration()` and `registerMATTAdapter()` handle interactions with the MATT ecosystem.
- **Purpose:** Provide compatibility when MATT intercepts attack roll flows, ensuring hero bonuses do not double-apply or get skipped.
- **Implementation:** Hooks into MATT’s prompts and results to pass along hero spend metadata.

## External Hooks & API

- `Hooks.callAll("rnk-hero-forge.applyHeroBonus", payload)` broadcasts whenever a bonus is applied, delivering the actor, points spent, bonus amount, roll reference, and source. Other modules can listen for this event to modify UI, adjust automation, or log analytics.
- The module attaches `game.rnk.heroPoints` to the global game object so macros or third-party modules can programmatically manage hero points (see [api.md](api.md)).

## Pending Bonus Flags

- Stored under `actor.setFlag('rnk-hero-forge', 'pendingBonus', payload)` with metadata (`points`, `formula`, `postChat`, `rollJSON`, `label`, etc.).
- The core roll integration consumes this data to replicate prompts or allow external systems to display pending status.
- UI components (hub cards, badges) read `HeroPoints.getPendingBonus()` to show the +X indicator.

## Template & Asset Considerations

- Because Foundry resolves module assets by folder name, integrations log diagnostic warnings if templates fail to load (helps catch installation path mismatches).
- Chat card templates (`hero-spend-chat.hbs`) are preloaded during `init` to avoid race conditions with other modules mutating Handlebars shared helpers.

These integration patterns keep hero point behaviour predictable whether rolls originate from the character sheet, Midi-QOL, MATT, or supplemental macros.
