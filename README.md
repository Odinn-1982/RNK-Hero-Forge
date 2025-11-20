# RagNarok's Hero Forge

Foundry VTT module (initial scaffold) to manage "Hero Points" for players.

Features (v0.1):
- World settings for default max/current hero points and hero die.
- Actor flag API to get/set/add/spend hero points (`game.ragnaroks.heroPoints`).
- A GM/Player Hub UI to view and manage actor hero points (`HeroHub`).
- A small button rendered on roll chat messages allowing players to spend hero points; the module creates a chat message showing the bonus and emits a hook `ragnaroks-hero-forge.applyHeroBonus` for integrations.
- Modular file layout: each feature in its own file, separate templates and styles.

Installation: copy this folder into your Foundry `Data/modules/` directory, enable the module in the Module Management UI.

I initialized a git repository for this project and added integration adapters for `midi-qol` and a defensive adapter for Monk's Active Tile Triggers (MATT) / Monk Tokenbar. The adapters try to apply pending hero bonuses to trap, disarm, attack, and damage workflows and forward a dedicated hook `ragnaroks-hero-forge.mattApplyBonus` so MATT-specific handlers can apply the bonus exactly where needed.
Would you like me to:
 - Expand midiQOL integration to be version-aware and support specific workflow shapes you use? If so, tell me which midiQOL version or which other modules (Monk's Tokenbar, MATT) you want explicit adapters for and I’ll extend the integration.
 - Add unit tests or a small runtime test harness (e.g., a macro) to simulate spending and show how the bonus is applied?
 - Initialize a git repo and make commits, or package a zip manifest for easy installation?
