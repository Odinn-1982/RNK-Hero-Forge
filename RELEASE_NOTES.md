# RNK Hero Forge — Release v0.1.2 (Private)

Release date: 2025-11-22

Highlights
- Modernized the Hero Hub UI and standardized the "Spend & Roll" dialog across entry points.
- Replaced native dropdowns for actor selection with a themed, readable, keyboard-accessible list.
- Fixed z-index/visibility issues for overlay and sidebar buttons.
- Restricted non-GM users to only see their assigned character in the Hub and overlay (players no longer see other players' characters).

Notes for release
- This is a private release. Upload `dist/rnk-hero-forge-v0.1.2.zip` to the GitHub release `v0.1.2` as the module asset.
- The `module.json` `download` and `manifest` fields already reference the expected release URLs for tag `v0.1.2`.

Suggested changelog entry
```
v0.1.2 — 2025-11-22
- UI: Modernized Hero Hub and spend dialogs
- UX: Readable, themed actor selection list in overlay
- Security/Privacy: Players only see their assigned character (GM unchanged)
- Fix: dialog styling and selection controls
```

Upgrade steps
1. Upload `dist/rnk-hero-forge-v0.1.2.zip` to GitHub release `v0.1.2`.
2. Verify `module.json` `download` URL points to the uploaded asset. If you change the asset name, update `module.json` accordingly and push a new tag.

If you'd like, I can also create the GitHub release via API (requires a GitHub token), or prepare a draft release description and open a browser to the release page for you.
