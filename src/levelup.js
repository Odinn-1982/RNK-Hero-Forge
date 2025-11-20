import * as HeroPoints from "./heroPoints.js";

// Listen for actor level increases and grant hero points if enabled
Hooks.on("updateActor", async (actor, diff, options, userId) => {
  try {
    if (!game.settings.get('ragnaroks-hero-forge', 'grantOnLevelUp')) return;
    // only apply to characters
    if (actor.type !== 'character' && actor.data?.type !== 'character') return;

    // DND5E stores level in actor.data.data.details.level
    const oldLevel = getProperty(actor, "data._source.data.details.level");
    const newLevel = getProperty(actor, "data.data.details.level");
    if (typeof oldLevel === 'number' && typeof newLevel === 'number' && newLevel > oldLevel) {
      const diffLevels = newLevel - oldLevel;
      const grantPer = game.settings.get('ragnaroks-hero-forge', 'grantAmountPerLevel') || 1;
      const totalGrant = grantPer * diffLevels;
      // add to both max and current
      const hp = await HeroPoints.get(actor);
      const newMax = (hp.max || 0) + totalGrant;
      const newCurrent = (hp.current || 0) + totalGrant;
      await HeroPoints.set(actor, { max: newMax, current: newCurrent });
      ui.notifications.info(`${actor.name} gained ${totalGrant} hero point(s) for leveling to ${newLevel}`);
    }
  } catch (err) {
    console.warn("RagNarok's Hero Forge | level-up handler error", err);
  }
});
