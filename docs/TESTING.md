# Testing & Smoke Tests

This document describes how to run both local (interactive) and CI validation for RNK Hero Forge.

## Local smoke tests (Foundry macro-based)

Use the built-in macro-based smoke tests to validate core functionality inside Foundry (recommended on a fresh world with a character token).

1. Import these to your Foundry macros (or copy & paste):
   - `macros/smoke-tests.js` — General spend/bonus/merge flow.
   - `macros/smoke-test-midi-qol.js` — Midi-QOL integration (invokes the midi hooks with a fake workflow).
   - `macros/smoke-test-matt.js` — MATT / monk-tokenbar integration smoke.

2. Run the macro as GM with a character token selected.
3. Verify:
   - Hero points are set and updated as expected.
   - Pending bonus is created and applied to a d20 roll / workflow.
   - Merged roll appears on chat as a single result (check the formula and flags for `rnk-hero-forge` on the chat message).

## Automated validation (CI and local)

- `node tools/validate.js` checks critical files and settings, warns on placeholder metadata, and ensures template & preloads are available.
- `npm run ci` runs validation and asset checks.

Use the `npm` commands:

```bash
npm ci
npm run validate
npm run check:actors
```

## Packaging

Create release zips with `npm run package` which runs `tools/package.js` and produces `dist/rnk-hero-forge-<version>.zip`.

## Test Reporting

Manual macros will display status via `ui.notifications` and log details to the console. When running the smoke intake macros, check the browser console for roll outputs, hero bonus merges, and flag details on `ChatMessage` objects.

## Integration Notes

- `midi-qol`: The smoke macro triggers `midi-qol.preAttackRoll` and `midi-qol.preDamageRoll` where RNK attempts to patch pending bonuses.
- `MATT`: The macro calls likely hooks to simulate trap resolves; if MATT uses other hook names in your install, check those in the runtime integration layer.

## Smoke Test Limitations

- The macros depend on Foundry runtime (not runnable in Node.js directly).
- For full automated test coverage, a headless Foundry setup or a harness would be required. This is beyond the scope of local macros but doable (I can propose a headless Test plan if you want).
