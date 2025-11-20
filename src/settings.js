export function registerSettings() {
  const mod = "ragnaroks-hero-forge";
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
}
