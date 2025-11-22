const MOD = "rnk-hero-forge";

function clone(value) {
  const deepClone = globalThis.foundry?.utils?.deepClone;
  if (typeof deepClone === "function") return deepClone(value);
  return JSON.parse(JSON.stringify(value));
}

export const DEFAULT_THEME_PRESET = "midnight";

export const THEME_SLOTS = [
  { key: "background-start", setting: "themeColorBackgroundStart", label: "Background Gradient (Start)" },
  { key: "background-end", setting: "themeColorBackgroundEnd", label: "Background Gradient (End)" },
  { key: "text-primary", setting: "themeColorTextPrimary", label: "Primary Text" },
  { key: "text-muted", setting: "themeColorTextMuted", label: "Secondary Text" },
  { key: "accent-primary", setting: "themeColorAccentPrimary", label: "Primary Accent" },
  { key: "accent-highlight", setting: "themeColorAccentHighlight", label: "Accent Highlight" },
  { key: "panel-bg", setting: "themeColorPanelBackground", label: "Panel Background" },
  { key: "panel-border", setting: "themeColorPanelBorder", label: "Panel Border" },
  { key: "card-bg", setting: "themeColorCardBackground", label: "Card Background" },
  { key: "card-border", setting: "themeColorCardBorder", label: "Card Border" },
  { key: "progress-track", setting: "themeColorProgressTrack", label: "Progress Track" },
  { key: "progress-start", setting: "themeColorProgressStart", label: "Progress Fill (Start)" },
  { key: "progress-end", setting: "themeColorProgressEnd", label: "Progress Fill (End)" },
  { key: "button-primary-text", setting: "themeColorButtonPrimaryText", label: "Primary Button Text" },
  { key: "button-secondary-bg", setting: "themeColorButtonSecondaryBackground", label: "Secondary Button Background" },
  { key: "button-secondary-text", setting: "themeColorButtonSecondaryText", label: "Secondary Button Text" },
  { key: "button-secondary-border", setting: "themeColorButtonSecondaryBorder", label: "Secondary Button Border" },
  { key: "button-secondary-hover", setting: "themeColorButtonSecondaryHover", label: "Secondary Button Hover" },
  { key: "badge-alert-bg", setting: "themeColorBadgeAlertBackground", label: "Badge – Needs Points Background" },
  { key: "badge-alert-text", setting: "themeColorBadgeAlertText", label: "Badge – Needs Points Text" },
  { key: "badge-soft-bg", setting: "themeColorBadgeSoftBackground", label: "Badge – At Cap Background" },
  { key: "badge-soft-text", setting: "themeColorBadgeSoftText", label: "Badge – At Cap Text" },
  { key: "badge-pending-bg", setting: "themeColorBadgePendingBackground", label: "Badge – Pending Background" },
  { key: "badge-pending-text", setting: "themeColorBadgePendingText", label: "Badge – Pending Text" },
  { key: "input-bg", setting: "themeColorInputBackground", label: "Search Input Background" },
  { key: "input-border", setting: "themeColorInputBorder", label: "Search Input Border" },
  { key: "filter-bg", setting: "themeColorFilterBackground", label: "Filter Button Background" },
  { key: "filter-border", setting: "themeColorFilterBorder", label: "Filter Button Border" },
  { key: "filter-text", setting: "themeColorFilterText", label: "Filter Button Text" },
  { key: "avatar-badge-bg", setting: "themeColorAvatarBadgeBackground", label: "Avatar Badge Background" },
  { key: "avatar-badge-text", setting: "themeColorAvatarBadgeText", label: "Avatar Badge Text" }
];

export const THEME_PRESETS = {
  midnight: {
    label: "Midnight Command",
    values: {
      "background-start": "#141b2d",
      "background-end": "#1f2a44",
      "text-primary": "#f2f6ff",
      "text-muted": "rgba(242, 246, 255, 0.75)",
      "accent-primary": "#ff6f61",
      "accent-highlight": "#ffdf6b",
      "panel-bg": "rgba(18, 24, 40, 0.7)",
      "panel-border": "rgba(255, 255, 255, 0.08)",
      "card-bg": "rgba(18, 24, 40, 0.72)",
      "card-border": "rgba(255, 255, 255, 0.08)",
      "progress-track": "rgba(255, 255, 255, 0.08)",
      "progress-start": "#ff9d77",
      "progress-end": "#ff6f61",
      "button-primary-text": "#141b2d",
      "button-secondary-bg": "rgba(18, 24, 40, 0.7)",
      "button-secondary-text": "#f2f6ff",
      "button-secondary-border": "rgba(255, 255, 255, 0.08)",
      "button-secondary-hover": "rgba(255, 255, 255, 0.12)",
      "badge-alert-bg": "rgba(255, 111, 97, 0.18)",
      "badge-alert-text": "#ffb3a8",
      "badge-soft-bg": "rgba(120, 200, 166, 0.18)",
      "badge-soft-text": "#b5f1d7",
      "badge-pending-bg": "rgba(255, 223, 107, 0.18)",
      "badge-pending-text": "#ffe7a3",
      "input-bg": "rgba(18, 24, 40, 0.65)",
      "input-border": "rgba(255, 255, 255, 0.1)",
      "filter-bg": "rgba(18, 24, 40, 0.65)",
      "filter-border": "rgba(255, 255, 255, 0.08)",
      "filter-text": "#f2f6ff",
      "avatar-badge-bg": "#ff6f61",
      "avatar-badge-text": "#141b2d"
    }
  },
  ember: {
    label: "Emberglow Rally",
    values: {
      "background-start": "#2a120a",
      "background-end": "#4b1c10",
      "text-primary": "#fff4e6",
      "text-muted": "rgba(255, 228, 213, 0.75)",
      "accent-primary": "#ff7b39",
      "accent-highlight": "#ffc773",
      "panel-bg": "rgba(60, 24, 14, 0.78)",
      "panel-border": "rgba(255, 198, 152, 0.14)",
      "card-bg": "rgba(52, 20, 10, 0.82)",
      "card-border": "rgba(255, 198, 152, 0.18)",
      "progress-track": "rgba(255, 198, 152, 0.14)",
      "progress-start": "#ff9d67",
      "progress-end": "#ff7b39",
      "button-primary-text": "#2a120a",
      "button-secondary-bg": "rgba(60, 24, 14, 0.78)",
      "button-secondary-text": "#ffe4d5",
      "button-secondary-border": "rgba(255, 198, 152, 0.2)",
      "button-secondary-hover": "rgba(255, 198, 152, 0.25)",
      "badge-alert-bg": "rgba(255, 123, 57, 0.22)",
      "badge-alert-text": "#ffd0b0",
      "badge-soft-bg": "rgba(216, 136, 69, 0.2)",
      "badge-soft-text": "#ffe6d0",
      "badge-pending-bg": "rgba(255, 199, 115, 0.22)",
      "badge-pending-text": "#ffefd2",
      "input-bg": "rgba(60, 24, 14, 0.78)",
      "input-border": "rgba(255, 198, 152, 0.24)",
      "filter-bg": "rgba(60, 24, 14, 0.78)",
      "filter-border": "rgba(255, 198, 152, 0.2)",
      "filter-text": "#ffe4d5",
      "avatar-badge-bg": "#ff7b39",
      "avatar-badge-text": "#2a120a"
    }
  },
  verdant: {
    label: "Verdant Rally",
    values: {
      "background-start": "#102418",
      "background-end": "#1d3b26",
      "text-primary": "#ecfff2",
      "text-muted": "rgba(210, 243, 220, 0.78)",
      "accent-primary": "#4fd37d",
      "accent-highlight": "#a8ffb5",
      "panel-bg": "rgba(18, 43, 27, 0.76)",
      "panel-border": "rgba(191, 255, 204, 0.14)",
      "card-bg": "rgba(15, 36, 23, 0.82)",
      "card-border": "rgba(191, 255, 204, 0.16)",
      "progress-track": "rgba(191, 255, 204, 0.12)",
      "progress-start": "#7ee89c",
      "progress-end": "#4fd37d",
      "button-primary-text": "#0d1b13",
      "button-secondary-bg": "rgba(18, 43, 27, 0.76)",
      "button-secondary-text": "#dafde6",
      "button-secondary-border": "rgba(191, 255, 204, 0.2)",
      "button-secondary-hover": "rgba(191, 255, 204, 0.26)",
      "badge-alert-bg": "rgba(255, 120, 120, 0.22)",
      "badge-alert-text": "#ffc9c9",
      "badge-soft-bg": "rgba(131, 232, 170, 0.22)",
      "badge-soft-text": "#daffe5",
      "badge-pending-bg": "rgba(213, 255, 163, 0.22)",
      "badge-pending-text": "#efffda",
      "input-bg": "rgba(18, 43, 27, 0.76)",
      "input-border": "rgba(191, 255, 204, 0.24)",
      "filter-bg": "rgba(18, 43, 27, 0.76)",
      "filter-border": "rgba(191, 255, 204, 0.2)",
      "filter-text": "#ecfff2",
      "avatar-badge-bg": "#4fd37d",
      "avatar-badge-text": "#0d1b13"
    }
  },
  horizon: {
    label: "Horizon Skies",
    values: {
      "background-start": "#17263b",
      "background-end": "#274d7f",
      "text-primary": "#f0f5ff",
      "text-muted": "rgba(210, 227, 255, 0.78)",
      "accent-primary": "#4aa8ff",
      "accent-highlight": "#a9d1ff",
      "panel-bg": "rgba(19, 39, 63, 0.78)",
      "panel-border": "rgba(169, 209, 255, 0.16)",
      "card-bg": "rgba(17, 31, 49, 0.84)",
      "card-border": "rgba(169, 209, 255, 0.18)",
      "progress-track": "rgba(169, 209, 255, 0.12)",
      "progress-start": "#75c2ff",
      "progress-end": "#4aa8ff",
      "button-primary-text": "#102036",
      "button-secondary-bg": "rgba(19, 39, 63, 0.78)",
      "button-secondary-text": "#eef6ff",
      "button-secondary-border": "rgba(169, 209, 255, 0.24)",
      "button-secondary-hover": "rgba(169, 209, 255, 0.28)",
      "badge-alert-bg": "rgba(255, 120, 120, 0.22)",
      "badge-alert-text": "#ffd0d0",
      "badge-soft-bg": "rgba(116, 197, 255, 0.22)",
      "badge-soft-text": "#e2f2ff",
      "badge-pending-bg": "rgba(169, 209, 255, 0.22)",
      "badge-pending-text": "#edf5ff",
      "input-bg": "rgba(19, 39, 63, 0.78)",
      "input-border": "rgba(169, 209, 255, 0.2)",
      "filter-bg": "rgba(19, 39, 63, 0.78)",
      "filter-border": "rgba(169, 209, 255, 0.2)",
      "filter-text": "#f0f5ff",
      "avatar-badge-bg": "#4aa8ff",
      "avatar-badge-text": "#102036"
    }
  },
  sunrise: {
    label: "Sunrise Muster",
    values: {
      "background-start": "#412742",
      "background-end": "#6f3553",
      "text-primary": "#fff3ff",
      "text-muted": "rgba(250, 212, 250, 0.78)",
      "accent-primary": "#ff8c8c",
      "accent-highlight": "#ffd580",
      "panel-bg": "rgba(60, 30, 61, 0.78)",
      "panel-border": "rgba(255, 206, 225, 0.2)",
      "card-bg": "rgba(50, 24, 51, 0.84)",
      "card-border": "rgba(255, 206, 225, 0.2)",
      "progress-track": "rgba(255, 206, 225, 0.16)",
      "progress-start": "#ffb3b3",
      "progress-end": "#ff8c8c",
      "button-primary-text": "#2c122c",
      "button-secondary-bg": "rgba(60, 30, 61, 0.78)",
      "button-secondary-text": "#ffe6ff",
      "button-secondary-border": "rgba(255, 206, 225, 0.3)",
      "button-secondary-hover": "rgba(255, 206, 225, 0.35)",
      "badge-alert-bg": "rgba(255, 140, 140, 0.22)",
      "badge-alert-text": "#ffd8d8",
      "badge-soft-bg": "rgba(255, 213, 128, 0.24)",
      "badge-soft-text": "#fff0d4",
      "badge-pending-bg": "rgba(255, 228, 170, 0.24)",
      "badge-pending-text": "#fff8e2",
      "input-bg": "rgba(60, 30, 61, 0.78)",
      "input-border": "rgba(255, 206, 225, 0.28)",
      "filter-bg": "rgba(60, 30, 61, 0.78)",
      "filter-border": "rgba(255, 206, 225, 0.28)",
      "filter-text": "#ffe6ff",
      "avatar-badge-bg": "#ff8c8c",
      "avatar-badge-text": "#2c122c"
    }
  },
  amethyst: {
    label: "Amethyst Banner",
    values: {
      "background-start": "#1b1133",
      "background-end": "#2f1f51",
      "text-primary": "#f5eaff",
      "text-muted": "rgba(216, 197, 244, 0.78)",
      "accent-primary": "#a068ff",
      "accent-highlight": "#e2c7ff",
      "panel-bg": "rgba(33, 21, 61, 0.78)",
      "panel-border": "rgba(226, 199, 255, 0.18)",
      "card-bg": "rgba(28, 17, 52, 0.84)",
      "card-border": "rgba(226, 199, 255, 0.2)",
      "progress-track": "rgba(226, 199, 255, 0.14)",
      "progress-start": "#c099ff",
      "progress-end": "#a068ff",
      "button-primary-text": "#1b1133",
      "button-secondary-bg": "rgba(33, 21, 61, 0.78)",
      "button-secondary-text": "#f0e6ff",
      "button-secondary-border": "rgba(226, 199, 255, 0.24)",
      "button-secondary-hover": "rgba(226, 199, 255, 0.3)",
      "badge-alert-bg": "rgba(252, 143, 198, 0.22)",
      "badge-alert-text": "#ffd9ee",
      "badge-soft-bg": "rgba(192, 153, 255, 0.22)",
      "badge-soft-text": "#ecddff",
      "badge-pending-bg": "rgba(226, 199, 255, 0.22)",
      "badge-pending-text": "#f5ecff",
      "input-bg": "rgba(33, 21, 61, 0.78)",
      "input-border": "rgba(226, 199, 255, 0.24)",
      "filter-bg": "rgba(33, 21, 61, 0.78)",
      "filter-border": "rgba(226, 199, 255, 0.2)",
      "filter-text": "#f5eaff",
      "avatar-badge-bg": "#a068ff",
      "avatar-badge-text": "#1b1133"
    }
  },
  obsidian: {
    label: "Obsidian Command",
    values: {
      "background-start": "#090909",
      "background-end": "#1a1a1a",
      "text-primary": "#f0f0f0",
      "text-muted": "rgba(220, 220, 220, 0.72)",
      "accent-primary": "#ffa94d",
      "accent-highlight": "#ffd166",
      "panel-bg": "rgba(20, 20, 20, 0.86)",
      "panel-border": "rgba(255, 255, 255, 0.08)",
      "card-bg": "rgba(15, 15, 15, 0.9)",
      "card-border": "rgba(255, 255, 255, 0.06)",
      "progress-track": "rgba(255, 255, 255, 0.08)",
      "progress-start": "#ffc078",
      "progress-end": "#ffa94d",
      "button-primary-text": "#151515",
      "button-secondary-bg": "rgba(26, 26, 26, 0.86)",
      "button-secondary-text": "#f0f0f0",
      "button-secondary-border": "rgba(255, 255, 255, 0.12)",
      "button-secondary-hover": "rgba(255, 255, 255, 0.16)",
      "badge-alert-bg": "rgba(255, 135, 135, 0.2)",
      "badge-alert-text": "#ffc9c9",
      "badge-soft-bg": "rgba(178, 231, 180, 0.2)",
      "badge-soft-text": "#d9ffe0",
      "badge-pending-bg": "rgba(255, 209, 102, 0.2)",
      "badge-pending-text": "#fff1c4",
      "input-bg": "rgba(26, 26, 26, 0.86)",
      "input-border": "rgba(255, 255, 255, 0.1)",
      "filter-bg": "rgba(26, 26, 26, 0.86)",
      "filter-border": "rgba(255, 255, 255, 0.12)",
      "filter-text": "#f0f0f0",
      "avatar-badge-bg": "#ffa94d",
      "avatar-badge-text": "#151515"
    }
  },
  cobalt: {
    label: "Cobalt Vanguard",
    values: {
      "background-start": "#02152a",
      "background-end": "#063463",
      "text-primary": "#f0f8ff",
      "text-muted": "rgba(200, 220, 245, 0.78)",
      "accent-primary": "#4ec5ff",
      "accent-highlight": "#94e0ff",
      "panel-bg": "rgba(4, 26, 50, 0.8)",
      "panel-border": "rgba(148, 224, 255, 0.2)",
      "card-bg": "rgba(3, 19, 37, 0.86)",
      "card-border": "rgba(148, 224, 255, 0.22)",
      "progress-track": "rgba(148, 224, 255, 0.14)",
      "progress-start": "#6bd6ff",
      "progress-end": "#4ec5ff",
      "button-primary-text": "#031325",
      "button-secondary-bg": "rgba(4, 26, 50, 0.8)",
      "button-secondary-text": "#eef7ff",
      "button-secondary-border": "rgba(148, 224, 255, 0.24)",
      "button-secondary-hover": "rgba(148, 224, 255, 0.3)",
      "badge-alert-bg": "rgba(255, 140, 140, 0.2)",
      "badge-alert-text": "#ffd0d0",
      "badge-soft-bg": "rgba(110, 214, 255, 0.22)",
      "badge-soft-text": "#ddf5ff",
      "badge-pending-bg": "rgba(148, 224, 255, 0.24)",
      "badge-pending-text": "#e9f8ff",
      "input-bg": "rgba(4, 26, 50, 0.8)",
      "input-border": "rgba(148, 224, 255, 0.24)",
      "filter-bg": "rgba(4, 26, 50, 0.8)",
      "filter-border": "rgba(148, 224, 255, 0.24)",
      "filter-text": "#f0f8ff",
      "avatar-badge-bg": "#4ec5ff",
      "avatar-badge-text": "#031325"
    }
  },
  dusk: {
    label: "Duskstone Assembly",
    values: {
      "background-start": "#1e1a24",
      "background-end": "#322c3c",
      "text-primary": "#f8f5ff",
      "text-muted": "rgba(223, 216, 240, 0.78)",
      "accent-primary": "#ff8fb3",
      "accent-highlight": "#ffd1dc",
      "panel-bg": "rgba(36, 31, 45, 0.8)",
      "panel-border": "rgba(255, 209, 220, 0.18)",
      "card-bg": "rgba(30, 24, 38, 0.86)",
      "card-border": "rgba(255, 209, 220, 0.2)",
      "progress-track": "rgba(223, 216, 240, 0.14)",
      "progress-start": "#ffb6cd",
      "progress-end": "#ff8fb3",
      "button-primary-text": "#2b242f",
      "button-secondary-bg": "rgba(36, 31, 45, 0.8)",
      "button-secondary-text": "#f7f2ff",
      "button-secondary-border": "rgba(255, 209, 220, 0.26)",
      "button-secondary-hover": "rgba(255, 209, 220, 0.3)",
      "badge-alert-bg": "rgba(255, 143, 179, 0.22)",
      "badge-alert-text": "#ffd3e1",
      "badge-soft-bg": "rgba(195, 172, 255, 0.22)",
      "badge-soft-text": "#ece4ff",
      "badge-pending-bg": "rgba(255, 209, 220, 0.24)",
      "badge-pending-text": "#fff1f5",
      "input-bg": "rgba(36, 31, 45, 0.8)",
      "input-border": "rgba(255, 209, 220, 0.26)",
      "filter-bg": "rgba(36, 31, 45, 0.8)",
      "filter-border": "rgba(255, 209, 220, 0.26)",
      "filter-text": "#f8f5ff",
      "avatar-badge-bg": "#ff8fb3",
      "avatar-badge-text": "#2b242f"
    }
  },
  alloy: {
    label: "Alloy Assembly",
    values: {
      "background-start": "#27221a",
      "background-end": "#3a3327",
      "text-primary": "#f4efe3",
      "text-muted": "rgba(231, 222, 206, 0.78)",
      "accent-primary": "#d8a04a",
      "accent-highlight": "#f6d47f",
      "panel-bg": "rgba(43, 37, 28, 0.8)",
      "panel-border": "rgba(246, 212, 127, 0.16)",
      "card-bg": "rgba(36, 30, 23, 0.86)",
      "card-border": "rgba(246, 212, 127, 0.18)",
      "progress-track": "rgba(246, 212, 127, 0.14)",
      "progress-start": "#f2c36a",
      "progress-end": "#d8a04a",
      "button-primary-text": "#2d2417",
      "button-secondary-bg": "rgba(43, 37, 28, 0.8)",
      "button-secondary-text": "#f4efe3",
      "button-secondary-border": "rgba(246, 212, 127, 0.24)",
      "button-secondary-hover": "rgba(246, 212, 127, 0.28)",
      "badge-alert-bg": "rgba(226, 122, 95, 0.22)",
      "badge-alert-text": "#ffd2c4",
      "badge-soft-bg": "rgba(206, 178, 120, 0.22)",
      "badge-soft-text": "#fbeed4",
      "badge-pending-bg": "rgba(246, 212, 127, 0.22)",
      "badge-pending-text": "#fff1d4",
      "input-bg": "rgba(43, 37, 28, 0.8)",
      "input-border": "rgba(246, 212, 127, 0.24)",
      "filter-bg": "rgba(43, 37, 28, 0.8)",
      "filter-border": "rgba(246, 212, 127, 0.24)",
      "filter-text": "#f4efe3",
      "avatar-badge-bg": "#d8a04a",
      "avatar-badge-text": "#2d2417"
    }
  },
  custom: {
    label: "Custom (use colors below)",
    values: {}
  }
};

function getDefaultValues() {
  return clone(THEME_PRESETS[DEFAULT_THEME_PRESET].values);
}

export function getThemeValues() {
  if (!game?.settings) return getDefaultValues();
  const presetKey = game.settings.get(MOD, "hubThemePreset") || DEFAULT_THEME_PRESET;
  const base = getDefaultValues();
  const preset = THEME_PRESETS[presetKey]?.values;
  if (preset && preset !== THEME_PRESETS.custom.values) {
    Object.assign(base, preset);
  }
  if (presetKey === "custom") {
    for (const slot of THEME_SLOTS) {
      const value = game.settings.get(MOD, slot.setting);
      if (value !== null && value !== undefined && value !== "") {
        base[slot.key] = value;
      }
    }
  }
  return base;
}

export function applyCurrentTheme(doc = document) {
  try {
    if (!doc) return;
    const root = doc.documentElement;
    if (!root) return;
    const values = getThemeValues();
    for (const slot of THEME_SLOTS) {
      const cssVar = `--rnk-hub-${slot.key}`;
      const value = values[slot.key];
      if (value) {
        root.style.setProperty(cssVar, value);
      } else {
        root.style.removeProperty(cssVar);
      }
    }
  } catch (err) {
    logger.warn("Failed to apply theme", err);
  }
}

export function getThemePresetChoices() {
  const entries = Object.entries(THEME_PRESETS).map(([key, preset]) => [key, preset.label]);
  return Object.fromEntries(entries);
}

export function getDefaultColorForSlot(slotKey) {
  const defaults = getDefaultValues();
  return defaults[slotKey];
}
