import { DEFAULT_THEME_PRESET, THEME_SLOTS, applyCurrentTheme, getThemePresetChoices, getDefaultColorForSlot } from "./theme.js";

export function registerSettings() {
  const mod = "rnk-hero-forge";
  game.settings.register(mod, "defaultMax", {
    name: "Default Max Hero Points",
    hint: "Default maximum hero points each player gets when assigned or leveled up.",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
  });

  game.settings.register(mod, "defaultCurrent", {
    name: "Default Current Hero Points",
    hint: "Default current hero points assigned to a player when given.",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
  });

  game.settings.register(mod, "heroDie", {
    name: "Hero Point Die",
    hint: "Die rolled per hero point (e.g., d6, d4). Enter the number of faces.",
    scope: "world",
    config: true,
    type: Number,
    default: 6,
  });

  game.settings.register(mod, "heroMode", {
    name: "Hero Point Mode",
    hint: "Choose how hero points generate bonuses: 'roll' = X dY per point, 'flat' = flat bonus per point.",
    scope: "world",
    config: true,
    type: String,
    choices: { roll: "Roll per point (XdY)", flat: "Flat bonus per point" },
    default: "roll",
  });

  game.settings.register(mod, "flatPerPoint", {
    name: "Flat Bonus Per Point",
    hint: "If heroMode is 'flat', how many bonus points per hero point spent.",
    scope: "world",
    config: true,
    type: Number,
    default: 2,
  });

  game.settings.register(mod, "grantOnLevelUp", {
    name: "Grant On Level Up",
    hint: "Automatically grant hero points to actors when they level up.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(mod, "grantAmountPerLevel", {
    name: "Grant Amount Per Level",
    hint: "How many hero points to grant on each level up (added to current and max).",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
  });

  game.settings.register(mod, "enablePlayersHub", {
    name: "Enable Player Hub",
    hint: "Allow players to open the hub (non-GM) to view their hero points.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(mod, 'enableDebug', {
    name: 'Enable Debug Logging',
    hint: 'Toggle debug logging for the module (console logs). Set to true for development or troubleshooting.',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  });

  const presetChoices = getThemePresetChoices();
  game.settings.register(mod, "hubThemePreset", {
    name: "Hero Hub Theme Preset",
    hint: "Choose a color preset for the Hero Hub. Select 'Custom' to use the individual color fields below.",
    scope: "client",
    config: true,
    type: String,
    choices: presetChoices,
    default: DEFAULT_THEME_PRESET,
    onChange: () => applyCurrentTheme(),
  });

  for (const slot of THEME_SLOTS) {
    const defaultValue = getDefaultColorForSlot(slot.key);
    game.settings.register(mod, slot.setting, {
      name: `Hero Hub Color: ${slot.label}`,
      hint: "Only used when the preset is set to Custom. Accepts any valid CSS color value (e.g. #ff6600, rgb(34,139,34), rgba(0,0,0,0.5)).",
      scope: "client",
      config: true,
      type: String,
      default: defaultValue,
      onChange: () => applyCurrentTheme(),
    });
  }
}
