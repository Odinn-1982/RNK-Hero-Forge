// RNK Hero Forge test macro
// Paste into a Foundry Macro and run while you have a character selected (or a token controlled).
(async () => {
  const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
  if (!actor) return ui.notifications.error(game.i18n.localize('rnk-hero-forge.notification.noActor'));
  const mod = 'rnk-hero-forge';
  // Ensure actor has hero points
  await game.rnk.heroPoints.set(actor, { max: 3, current: 3 });
  ui.notifications.info(`Set ${actor.name} hero points to 3/3`);

  // Spend 1 point and set pending bonus + post chat
  const amt = 1;
  try {
    await game.rnk.heroPoints.spend(actor, amt);
  } catch (err) {
    return ui.notifications.error(err.message);
  }

  const { bonus, formula } = await game.rnk.heroPoints.computeHeroBonus(amt);

  await game.rnk.heroPoints.setPendingBonus(actor, bonus, { source: 'macro', points: amt, formula, postChat: true });
  const content = await renderTemplate('modules/rnk-hero-forge/templates/hero-spend-chat.hbs', {
    speakerImg: actor.img,
    speakerName: actor.name,
    points: amt,
    isOne: amt === 1,
    formula,
    bonus
  });
  const chat = await ChatMessage.create({ speaker: { actor: actor.id, alias: actor.name }, content, flags: { 'rnk-hero-forge': { heroBonus: bonus, heroSpent: amt, origin: 'macro' } } });
  Hooks.callAll('rnk-hero-forge.applyHeroBonus', { message: chat, actor, points: amt, bonus });
  ui.notifications.info(`Macro: ${actor.name} spent ${amt} hero point(s) and set pending bonus +${bonus}`);

  // Optionally simulate midiQOL workflow hooks for testing integrations
  const fakeWorkflow = {
    actor: actor,
    token: canvas.tokens.controlled[0] || null,
    attackRoll: { total: 0 },
    damageRoll: { total: 0 },
    rolls: [],
  };
  console.log('RNK Hero Forge | test macro calling midi-qol.preAttackRoll and midi-qol.preDamageRoll with fake workflow');
  Hooks.callAll('midi-qol.preAttackRoll', fakeWorkflow);
  Hooks.callAll('midi-qol.preDamageRoll', fakeWorkflow);
})();
