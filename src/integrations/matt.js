import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

export function registerMATTIntegration() {
  if (!game.modules.get("matt")?.active && !game.modules.get("monk-tokenbar")?.active) return;

  // MATT (Monk's Active Tile Triggers) can produce rolls for trap disarm/trigger actions.
  // We cannot rely on a single stable hook across all versions, so we take a defensive approach:
  // 1) Listen for the module-specific hook if present (common names tried below).
  // 2) Also listen to our own applyHeroBonus hook and forward to MATT via a dedicated hook name.

  // Try a set of likely hook names MATT might emit when resolving a trap or disarm roll.
  const candidateHooks = [
    "matt.trapTriggered",
    "matt.trapResolve",
    "matt.trapRoll",
    "matt.disarmRoll",
    "monk-tokenbar.trapRoll",
    "matt.triggerTrap",
  ];

  candidateHooks.forEach(hookName => {
    Hooks.on(hookName, async (payload) => {
      try {
        // Payload structures vary; try to find an actor and message or roll inside
        const actor = payload?.actor || payload?.token?.actor || null;
        const message = payload?.message || payload?.chatMessage || payload?.msg || null;
        if (!actor && !message) return; // nothing we can do

        // If a pending bonus exists on the actor (e.g., from spending), apply it by emitting a helper hook
        const a = actor || (message?.speaker ? game.actors.get(message.speaker.actor) : null);
        if (!a) return;
        const pending = await HeroPoints.getPendingBonus(a);
        if (!pending) return;
        // Forward to a MATT-specific hook so module adapters can apply it
        Hooks.callAll("rnk-hero-forge.mattApplyBonus", { actor: a, pending, payload, originalHook: hookName });
        // Optionally clear the pending bonus; leave option configurable later
        await HeroPoints.clearPendingBonus(a);
        ui.notifications.info(game.i18n.format('rnk-hero-forge.notification.applied', { name: a.name, bonus: pending.bonus, label: 'trap' }));
      } catch (err) {
        logger.warn("MATT hook handler error", err);
      }
    });
  });

  // Forward our generic applyHeroBonus event to MATT consumers as well
  Hooks.on('rnk-hero-forge.applyHeroBonus', (payload) => {
    Hooks.callAll('rnk-hero-forge.mattApplyBonus', Object.assign({ originalHook: 'applyHeroBonus' }, payload));
  });
}
