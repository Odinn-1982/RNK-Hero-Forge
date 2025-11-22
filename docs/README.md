# RNK Hero Forge Documentation

RNK Hero Forge is a Foundry VTT module that centralises hero point tracking, player interactions, and automated bonus application for D&D 5e games. This documentation set breaks down the module architecture, feature set, configuration options, and extension points for developers and game masters.

## Quick Links

- [Features](features.md)
- [Workflow Reference](workflows.md)
- [Settings Catalogue](settings.md)
- [Theming Guide](theming.md)
- [Code Architecture](architecture.md)
- [UI Components](ui-components.md)
- [Integration Notes](integrations.md)
- [Runtime API](api.md)

## Module Snapshot

- **Module Id:** `rnk-hero-forge`
- **Entry Module:** `src/module.js`
- **Primary UI:** `src/ui/HeroHub.js` rendered from `templates/hub.hbs`
- **Hero Logic Core:** `src/heroPoints.js`
- **Theme Engine:** `src/theme.js` with CSS in `styles/hub.css`
- **Latest Additions:** Floating hero roll overlay, theme presets plus custom overrides, merged hero bonus roll serialization.

## Target Audience

- **Game Masters:** Understand and configure the experience for all players.
- **Players:** Learn how to spend hero points and interpret chat results.
- **Admin/Developers:** Extend integrations, tweak workflows, or apply custom themes.

## How To Read These Docs

1. Start with [Features](features.md) for a high-level overview.
2. Review [Workflows](workflows.md) to understand how each interaction plays out.
3. Configure the module using the [Settings Catalogue](settings.md) and [Theming Guide](theming.md).
4. Dive into internals via [Architecture](architecture.md) and [Integration Notes](integrations.md) when customising or debugging.
