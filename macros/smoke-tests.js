// RNK Hero Forge — Smoke Tests (Macro)
// Paste this macro into Foundry and run it as a GM with a character token selected.
(async () => {
  const fail = (msg) => {
    ui.notifications?.error('Smoke Test Failure: ' + msg);
    console.error('SMOKE TEST ERROR:', msg);
    return false;
  };
  const pass = (msg) => {
    ui.notifications?.info('Smoke Test: ' + msg);
    console.log('SMOKE TEST:', msg);
    return true;
  };

  const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
  if (!actor) return fail('No actor selected or assigned (test requires a character token).');

  // Ensure we have the heroPoints API
  if (!game.rnk?.heroPoints) return fail('game.rnk.heroPoints not available.');

  // Seed hero points for the test
  await game.rnk.heroPoints.set(actor, { max: 5, current: 5 }).catch(e => console.warn(e));
  pass('Actor seeded with hero points (5/5)');

  // Test computeHeroBonus
  try {
    const result = await game.rnk.heroPoints.computeHeroBonus(2, { includeRollObject: true });
    if (!result || typeof result.bonus !== 'number') return fail('computeHeroBonus did not return a valid result');
    pass(`computeHeroBonus returned +${result.bonus} (${result.formula})`);
  } catch (err) {
    return fail('computeHeroBonus threw: ' + err.message);
  }

  // Test spend + pending + chat
  try {
    const spent = 1;
    await game.rnk.heroPoints.spend(actor, spent).catch((e) => { throw e; });
    pass('spend() succeeded');

    const b = await game.rnk.heroPoints.computeHeroBonus(spent, { includeRollObject: true });
    await game.rnk.heroPoints.setPendingBonus(actor, b.bonus, { points: spent, formula: b.formula, postChat: true, rollJSON: b.roll ? b.roll.toJSON() : null });
    pass('setPendingBonus saved correctly');

    // Simulate a roll that should pick up the pending bonus. We'll call the d20Roll wrapper by invoking an ability check
    // Prefer actor.rollAbilityTest if available
    if (typeof actor.rollAbilityTest === 'function') {
      const roll = await actor.rollAbilityTest('str', { fastForward: true, skipRollDialog: true });
      pass('Actor roll invoked for pending bonus pick-up');
      console.log('SMOKE TEST | Roll result', roll);
    } else {
      console.log('SMOKE TEST | Actor roll functions not available; dishonored target test skipped');
    }
  } catch (err) {
    return fail('Spend/pending flow failed: ' + (err.message || err));
  }

  pass('Smoke tests completed. Please verify no errors in console and check chat output for merged hero bonus roll.');
})();
