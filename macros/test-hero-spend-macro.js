// RagNarok's Hero Forge test macro
// Paste into a Foundry Macro and run while you have a character selected (or a token controlled).
(async () => {
  const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
  if (!actor) return ui.notifications.error('No actor selected or assigned to user.');
  const mod = 'ragnaroks-hero-forge';
  // Ensure actor has hero points
  await game.ragnaroks.heroPoints.set(actor, { max: 3, current: 3 });
  ui.notifications.info(`Set ${actor.name} hero points to 3/3`);

  // Spend 1 point and set pending bonus + post chat
  const amt = 1;
  try {
    await game.ragnaroks.heroPoints.spend(actor, amt);
  } catch (err) {
    return ui.notifications.error(err.message);
  }

  const mode = game.settings.get(mod, 'heroMode') || 'roll';
  let bonus = 0;
  let formula = null;
  if (mode === 'flat') {
    const per = game.settings.get(mod, 'flatPerPoint') || 2;
    bonus = per * amt;
    formula = `${amt} x ${per}`;
  } else {
    const die = game.settings.get(mod, 'heroDie') || 6;
    const r = await new Roll(`${amt}d${die}`).evaluate({async: false});
    bonus = r.total;
    formula = r.formula;
  }

  await game.ragnaroks.heroPoints.setPendingBonus(actor, bonus, { source: 'macro' });
  const content = await renderTemplate('templates/hero-spend-chat.hbs', {
    speakerImg: actor.img,
    speakerName: actor.name,
    points: amt,
    isOne: amt === 1,
    formula,
    bonus
  });
  const chat = await ChatMessage.create({ speaker: { actor: actor.id, alias: actor.name }, content, flags: { 'ragnaroks-hero-forge': { heroBonus: bonus, heroSpent: amt, origin: 'macro' } } });
  Hooks.callAll('ragnaroks-hero-forge.applyHeroBonus', { message: chat, actor, points: amt, bonus });
  ui.notifications.info(`Macro: ${actor.name} spent ${amt} hero point(s) and set pending bonus +${bonus}`);

  // Optionally simulate midiQOL workflow hooks for testing integrations
  const fakeWorkflow = {
    actor: actor,
    token: canvas.tokens.controlled[0] || null,
    attackRoll: { total: 0 },
    damageRoll: { total: 0 },
    rolls: [],
  };
  console.log('RagNarok\'s Hero Forge | test macro calling midi-qol.preAttackRoll and midi-qol.preDamageRoll with fake workflow');
  Hooks.callAll('midi-qol.preAttackRoll', fakeWorkflow);
  Hooks.callAll('midi-qol.preDamageRoll', fakeWorkflow);
})();
