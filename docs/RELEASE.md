# Release Checklist & Steps

This document describes how to prepare and publish a release for RNK Hero Forge.

## Pre-Release Checklist

1. Update `module.json` and `manifest.json`:
   - Set `version` to the new version (semver).
   - Fill `authors` with valid names and contact info.
   - Set `homepage`, `manifest`, and `download` to point to your repository and release zip.
2. Update `package.json` and `manifest.json` `download` link for the release tag.
3. Ensure `README.md` and `docs/` are up to date and link to the live manifest/README.
4. Add a release note entry in `CHANGELOG.md` describing changes.
5. Run `npm ci` and `npm run validate` to catch problems before packaging.
6. Verify that templates, styles, assets, and templates are included in the package.
7. Run the module and test the following flows locally:
   - Spend & roll from the hub.
   - Spend & roll from overlay.
   - Chat button spend and pending application.
   - Midi-QOL and MATT flows if those modules are installed.
8. Verify `game.rnk.heroPoints` exposes the methods and that the hook `rnk-hero-forge.applyHeroBonus` fires correctly.

## Packaging

A simple build helper exists in `npm run package` which uses `tools/package.js`.

1. Run:

```bash
npm ci
npm run package
```

2. Create a release zip in `dist/` named `rnk-hero-forge-<version>.zip`.

## GitHub Release

1. Create a new release tag `vX.Y.Z` (matching version) and upload the zip to the release.
2. Ensure the `manifest.json` `download` points to the release zip you just uploaded.
3. Create a release summary linking to the change log highlights.

## Publishing to Foundry

If you submit your module to the community module manifest index, create a PR against the community repo to add your module's manifest URL.

## Post-Release

1. Update the `README.md` landing page with the release and link to the latest manifest.
2. Close any release-related issues and keep CHANGELOG updated.

---

Optional: Configure GitHub Actions to automatically build the package and upload the artifact when you push a tag (or implement a `release` workflow that packages and creates the release). See `.github/workflows/ci.yml` for sample validations.
