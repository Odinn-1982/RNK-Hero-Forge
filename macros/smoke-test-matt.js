// RNK Hero Forge — MATT Integration Smoke Test (Macro)
// Run as GM with a selected character
(async () => {
  const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
  if (!actor) return ui.notifications?.warn?.('Select a token with an actor first.');

  if (!game.modules.get('matt')?.active && !game.modules.get('monk-tokenbar')?.active) {
    ui.notifications?.info('MATT/monk-tokenbar not active; skipping MATT smoke test.');
    return;
  }

  // Ensure pending bonus exists
  await game.rnk.heroPoints.set(actor, { max: 5, current: 5 });
  const { bonus, formula } = await game.rnk.heroPoints.computeHeroBonus(1, { includeRollObject: true });
  await game.rnk.heroPoints.setPendingBonus(actor, bonus, { points: 1, formula, postChat: false, rollJSON: bonus ? null : null });

  const payload = { actor };
  console.log('MATT Smoke: calling candidate hooks');
  Hooks.callAll('matt.trapRoll', payload);
  Hooks.callAll('matt.trapTriggered', payload);
  Hooks.callAll('monk-tokenbar.trapRoll', payload);

  ui.notifications?.info('MATT integration test: hooks fired (check debug console for processing).');

  await game.rnk.heroPoints.clearPendingBonus(actor);
})();
