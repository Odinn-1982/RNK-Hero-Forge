# Draft Release — v1.0.0

This is a draft release note summarising features and breaking changes for v1.0.0.

## Release Summary

- Version: v1.0.0 (Draft)
- Date: 2025-11-22
- Status: Release candidate — QA pending

## Highlights

- Spend & Roll: Central UI and overlay workflows that allow players to spend hero points and apply the bonus before the d20 roll resolves. The hero dice merge into a single combined d20 result in chat.
- Chat integration: Chat button for quick post-roll spending with optional pending bonuses and chat summaries.
- Theming: 10 presets plus a per-slot custom mode with live theme application.
- Attack & Spell support: Hero bonuses apply to item attack rolls (we call `item.rollAttack()` or `item.roll()` when present).
- Integrations: `midi-qol` and `MATT` compatibility layers to apply pending bonuses in automated workflows.
- Packaging & CI: Zip packaging and CI validation to create distributable module zips.

## Testing notes & blockers

- Confirm none of the `module.json` or `manifest.json` fields still contain placeholder values.
- Verify `midi-qol` integration across a couple of versions if possible, and test `matt`/`monk-tokenbar` triggers.
- Ensure the hub and overlay displays are responsive and that the meta (heroSpent, heroBonus, heroBonusRollJSON) are present as flags in chat messages.

## Post-release tasks

- Submit a PR to the community manifest index for the module manifest.
- Create a stable release tag `v1.0.0` and upload the zipped artifact.
- Announce release details and include the changelog.
