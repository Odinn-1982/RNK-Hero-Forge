# Theming Guide

RNK Hero Forge ships with a preset-driven theme engine that lets each client tailor colours for the hub, overlay, and related UI components. This guide explains how the system works and how to extend it.

## Architecture

- `src/theme.js` exports preset definitions, slot metadata, and helper functions.
- `applyCurrentTheme()` reads the chosen preset (`hubThemePreset`) and merges any custom slot overrides.
- The computed colour map is applied by setting CSS custom properties on the document root (`document.documentElement.style.setProperty(...)`).
- UI surfaces (`styles/hub.css`, overlay styles, future panels) reference the custom properties via the `--rnk-hub-*` naming scheme.

## Presets

The module currently offers ten curated colour schemes plus a `custom` entry. Each preset is defined as a key in `THEME_PRESETS` containing:

- `label`: Human-friendly name shown in the settings panel.
- `values`: An object where the key matches a slot id (for example `background-start`) and the value is a CSS colour string.

Changing presets updates the hub immediately after the settings window closes because `onChange` re-runs `applyCurrentTheme()`.

## Custom Overrides

Selecting the `custom` preset reveals individual setting fields (all prefixed with `themeColor`). Each field corresponds to a slot declared in `THEME_SLOTS`:

- Each slot defines a `key`, `setting`, and description label.
- Default values come from the `DEFAULT_THEME_PRESET` (`midnight`).
- When custom values are stored, `applyCurrentTheme()` merges them on top of the preset to generate the final palette.

## CSS Variables

These are the key variable families exposed to CSS:

- `--rnk-hub-background-*`: Gradient backgrounds for the hub shell.
- `--rnk-hub-text-*`: Text colours for primary and muted text.
- `--rnk-hub-panel-*` and `--rnk-hub-card-*`: Card, stat panel, and meta container backgrounds/borders.
- `--rnk-hub-progress-*`: Progress bars showing hero point fill state.
- `--rnk-hub-button-*`: Buttons (primary and secondary) across the UI.
- `--rnk-hub-badge-*`: Status badges for “Needs points”, “At cap”, and “Pending”.
- `--rnk-hub-filter-*` and `--rnk-hub-input-*`: Control area styling.
- `--rnk-hub-avatar-badge-*`: Floating numeric badge on hero avatars.

The floating overlay button (`.rnk-hero-overlay-button`) also taps into accent colours and button text variables for visual consistency.

## Applying Themes Programmatically

Modules or macros can reuse the same functionality by importing the helper:

```javascript
import { applyCurrentTheme } from "modules/rnk-hero-forge/src/theme.js";

// Force re-application after changing a setting via code.
applyCurrentTheme();
```

## Extending Presets

1. Add a new preset entry inside `THEME_PRESETS` with a unique key, label, and comprehensive `values` map.
2. Supply defaults for every slot so that users switching to the preset see a fully cohesive theme.
3. (Optional) Update documentation and release notes to advertise the new theme.

## Debug Tips

- Use browser dev tools to inspect `:root` styles and verify the custom properties are set as expected.
- If colours do not change, confirm that `hubThemePreset` is set to `custom` when using overrides.
- Ensure module folder names match `rnk-hero-forge`; missing templates or styles often indicate a misnamed installation directory.
