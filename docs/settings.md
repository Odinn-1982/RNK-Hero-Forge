# Settings Catalogue

RNK Hero Forge exposes a range of world- and client-scoped settings to tailor the hero point experience. The tables below document each option, default values, and related code references.

## World Settings

| Key | Type | Default | Description | Referenced In |
| --- | --- | --- | --- | --- |
| `defaultMax` | Number | 3 | Base maximum hero points assigned to actors without stored flags. | `heroPoints.get()` fallback |
| `defaultCurrent` | Number | 3 | Starting current hero points for new actors. | `heroPoints.get()` fallback |
| `heroDie` | Number | 6 | Faces on the hero die when using roll mode (legacy support). | `settings.js`, legacy workflows |
| `heroMode` | String (`roll` or `flat`) | `roll` | Determines whether hero points generate dice or a flat modifier. | `HeroPoints.computeHeroBonus()` |
| `flatPerPoint` | Number | 2 | Bonus applied per hero point when `heroMode` is `flat`. | `HeroPoints.computeHeroBonus()` |
| `grantOnLevelUp` | Boolean | `false` | Auto-grant hero points when characters level up. | `levelup.js` |
| `grantAmountPerLevel` | Number | 1 | Amount of hero points to add during level-up grants. | `levelup.js`, hub grant-all |
| `enablePlayersHub` | Boolean | `true` | Allows non-GM users to open the Hero Hub and overlay button. | Hub visibility, overlay gating |

## Client Settings

| Key | Type | Default | Description | Referenced In |
| --- | --- | --- | --- | --- |
| `hubThemePreset` | String | `midnight` | Selects a theme preset or `custom` to use slot overrides. | `applyCurrentTheme()` |
| `themeColor*` | String | Slot default | Individual colour overrides used when preset is `custom`. See slot table below. | `applyCurrentTheme()` |

## Theme Slot Overrides

When the preset is set to **Custom**, each slot below can be configured to any valid CSS colour value. All values live under client scope to allow per-user theming. Keys map to CSS custom properties in `styles/hub.css`.

| Setting Key | Label | CSS Variable |
| --- | --- | --- |
| `themeColorBackgroundStart` | Background Gradient (Start) | `--rnk-hub-background-start` |
| `themeColorBackgroundEnd` | Background Gradient (End) | `--rnk-hub-background-end` |
| `themeColorTextPrimary` | Primary Text | `--rnk-hub-text-primary` |
| `themeColorTextMuted` | Secondary Text | `--rnk-hub-text-muted` |
| `themeColorAccentPrimary` | Primary Accent | `--rnk-hub-accent-primary` |
| `themeColorAccentHighlight` | Accent Highlight | `--rnk-hub-accent-highlight` |
| `themeColorPanelBackground` | Panel Background | `--rnk-hub-panel-bg` |
| `themeColorPanelBorder` | Panel Border | `--rnk-hub-panel-border` |
| `themeColorCardBackground` | Card Background | `--rnk-hub-card-bg` |
| `themeColorCardBorder` | Card Border | `--rnk-hub-card-border` |
| `themeColorProgressTrack` | Progress Track | `--rnk-hub-progress-track` |
| `themeColorProgressStart` | Progress Fill (Start) | `--rnk-hub-progress-start` |
| `themeColorProgressEnd` | Progress Fill (End) | `--rnk-hub-progress-end` |
| `themeColorButtonPrimaryText` | Primary Button Text | `--rnk-hub-button-primary-text` |
| `themeColorButtonSecondaryBackground` | Secondary Button Background | `--rnk-hub-button-secondary-bg` |
| `themeColorButtonSecondaryText` | Secondary Button Text | `--rnk-hub-button-secondary-text` |
| `themeColorButtonSecondaryBorder` | Secondary Button Border | `--rnk-hub-button-secondary-border` |
| `themeColorButtonSecondaryHover` | Secondary Button Hover | `--rnk-hub-button-secondary-hover` |
| `themeColorBadgeAlertBackground` | Badge – Needs Points Background | `--rnk-hub-badge-alert-bg` |
| `themeColorBadgeAlertText` | Badge – Needs Points Text | `--rnk-hub-badge-alert-text` |
| `themeColorBadgeSoftBackground` | Badge – At Cap Background | `--rnk-hub-badge-soft-bg` |
| `themeColorBadgeSoftText` | Badge – At Cap Text | `--rnk-hub-badge-soft-text` |
| `themeColorBadgePendingBackground` | Badge – Pending Background | `--rnk-hub-badge-pending-bg` |
| `themeColorBadgePendingText` | Badge – Pending Text | `--rnk-hub-badge-pending-text` |
| `themeColorInputBackground` | Search Input Background | `--rnk-hub-input-bg` |
| `themeColorInputBorder` | Search Input Border | `--rnk-hub-input-border` |
| `themeColorFilterBackground` | Filter Button Background | `--rnk-hub-filter-bg` |
| `themeColorFilterBorder` | Filter Button Border | `--rnk-hub-filter-border` |
| `themeColorFilterText` | Filter Button Text | `--rnk-hub-filter-text` |
| `themeColorAvatarBadgeBackground` | Avatar Badge Background | `--rnk-hub-avatar-badge-bg` |
| `themeColorAvatarBadgeText` | Avatar Badge Text | `--rnk-hub-avatar-badge-text` |

## Implementation Notes

- All settings are registered in `src/settings.js` during the `init` hook.
- Client changes trigger `applyCurrentTheme()` through the `onChange` callbacks.
- World settings are consumed primarily by `heroPoints.js`, `HeroHub.js`, and `levelup.js`.
- Settings modifications for `enablePlayersHub` re-render the overlay automatically (`HeroSpendOverlay.js`).
