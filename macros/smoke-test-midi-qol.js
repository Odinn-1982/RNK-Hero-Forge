// RNK Hero Forge — Midi-QOL Integration Smoke Test (Macro)
// Run as GM with a selected character
(async () => {
  const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
  if (!actor) return ui.notifications?.warn?.('Select a token with an actor first.');

  if (!game.modules.get('midi-qol')?.active) {
    ui.notifications?.info('midi-qol not active; skipping Midi-QOL smoke test.');
    return;
  }

  // Ensure pending bonus exists
  await game.rnk.heroPoints.set(actor, { max: 5, current: 5 });
  const { bonus, formula } = await game.rnk.heroPoints.computeHeroBonus(2, { includeRollObject: true });
  await game.rnk.heroPoints.setPendingBonus(actor, bonus, { points: 2, formula, postChat: false, rollJSON: bonus ? null : null });

  const workflow = {
    actor,
    attackRoll: { total: 4 },
    rolls: [],
  };

  console.log('MidiQOL Smoke: Before call', workflow.attackRoll.total);
  Hooks.callAll('midi-qol.preAttackRoll', workflow);
  console.log('MidiQOL Smoke: After call', workflow.attackRoll.total);
  ui.notifications?.info(`Midi-QOL integration test: attack roll total is now ${workflow.attackRoll?.total}`);

  // Clean up any pending
  await game.rnk.heroPoints.clearPendingBonus(actor);
})();
