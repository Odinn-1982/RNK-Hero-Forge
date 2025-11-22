import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

// Defensive adapter: listen for our forwarded MATT hook and try to apply the pending bonus
// directly to any roll-like object found in the payload. This is intentionally broad
// because MATT/MATT-like flows vary across versions.
export function registerMATTAdapter() {
  Hooks.on('rnk-hero-forge.mattApplyBonus', async (data) => {
    try {
      const actor = data?.actor || null;
      const pending = data?.pending || (actor ? await HeroPoints.getPendingBonus(actor) : null);
      if (!pending) return;
      const bonus = pending.bonus || 0;
      if (!bonus) return;

      const payload = data?.payload || data;

      // Candidate places to find a roll object
      const candidates = [
        payload?.roll,
        payload?.rollResult,
        payload?.trapRoll,
        payload?.chatMessage?.data?.flags?.core?.roll,
        payload?.chatMessage?.data?.roll,
        payload?.message?.data?.roll,
        payload?.message?.data?.flags?.core?.roll,
        payload?.rollData,
        payload?.rolls,
        payload?.workflow,
      ];

      let applied = false;

      for (const c of candidates) {
        if (!c) continue;
        // If it's an array of rolls, apply to the first numeric total
        if (Array.isArray(c)) {
          for (const r of c) {
            if (r && typeof r.total === 'number') { r.total += bonus; applied = true; break; }
          }
        } else if (typeof c.total === 'number') {
          c.total += bonus; applied = true; break;
        } else if (c?.terms && Array.isArray(c.terms)) {
          // Could be a Foundry Roll-like object where total isn't yet set; try evaluate
          try {
            if (typeof c.evaluate === 'function') {
              // If it's an unevaluated Roll, evaluate and then add bonus to a synthetic total
              await c.evaluate({ async: true });
              if (typeof c.total === 'number') { c.total += bonus; applied = true; break; }
            }
          } catch (e) { /* ignore */ }
        }
      }

      // If payload contains a chat message id, try to append a badge update
      const chat = payload?.chatMessage || payload?.message || null;
      if (!applied && chat && chat.id) {
        try {
          const msg = await ChatMessage.get(chat.id);
          if (msg) {
            const badge = `<div class="rnk-hero-attached">+${bonus} (hero)</div>`;
            await msg.update({ content: msg.data.content + badge });
            applied = true;
          }
        } catch (err) { /* ignore */ }
      }

      if (applied) {
        if (actor) await HeroPoints.clearPendingBonus(actor);
        ui.notifications.info(game.i18n.format('rnk-hero-forge.notification.applied', { name: actor?.name ?? 'Actor', bonus, label: 'matt' }));
      } else {
        // Not applied; still clear pending so it doesn't linger unless you want that behavior
        if (actor) await HeroPoints.clearPendingBonus(actor);
        ui.notifications.warn(game.i18n.format('rnk-hero-forge.notification.couldNotApply', { name: actor?.name || 'actor' }));
        logger.debug('MATT adapter payload:', data);
      }
    } catch (err) {
      logger.error('MATT adapter error', err, data);
    }
  });
}
