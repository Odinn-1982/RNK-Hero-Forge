import * as HeroPoints from "../heroPoints.js";

export async function renderHeroButtonForMessage(message, html) {
  // Only show for messages with rolls
  if (!message.data.flags?.core?.roll) {
    // Fallback: check for rolls array
    if (!message.isRoll) return;
  }

  // Only show to message author or GM
  const isAuthor = message.user?.id === game.user.id;
  const isGM = game.user.isGM;
  if (!isAuthor && !isGM) return;

  // Determine the actor that issued the roll (if any)
  const speaker = message.data.speaker || {};
  const actor = game.actors.get(speaker.actor) || null;
  if (!actor && !isGM) return;

  const hp = actor ? await HeroPoints.get(actor) : null;
  const hasPoints = !!(hp && hp.current > 0);

  const buttonHtml = await renderTemplate("templates/button.hbs", {
    hasPoints,
    current: hp ? hp.current : 0,
    max: hp ? hp.max : 0,
  });

  // Append button area to the message controls
  const controls = html.find('.message-controls');
  if (controls.length === 0) {
    // insert at end of message
    html.append(`<div class="ragnaroks-hero-btn">${buttonHtml}</div>`);
  } else {
    controls.append(buttonHtml);
  }

  // Attach click handler
  html.find('.ragnaroks-use-hero').click(async (ev) => {
    const maxAvailable = hp?.current || 0;
    if (!actor) return ui.notifications.warn("No actor associated with this roll");
    if (maxAvailable <= 0) return ui.notifications.warn("No hero points available");

    new Dialog({
      title: `Use Hero Points — ${actor.name}`,
      content: `<p>Hero Points available: ${maxAvailable}. Roll ${game.settings.get('ragnaroks-hero-forge', 'heroDie')} per point. How many to spend?</p><input id="hp-amt" type="number" min="1" max="${maxAvailable}" value="1" />`,
      buttons: {
        ok: {
          label: "Use",
          callback: async (dlg) => {
            const amt = parseInt(dlg.find('#hp-amt').val(), 10) || 0;
            if (amt <= 0) return;
            try {
              await HeroPoints.spend(actor, amt);
            } catch (err) {
              return ui.notifications.error(err.message);
            }

            const mode = game.settings.get('ragnaroks-hero-forge', 'heroMode') || 'roll';
            let bonus = 0;
            if (mode === 'flat') {
              const per = game.settings.get('ragnaroks-hero-forge', 'flatPerPoint') || 2;
              bonus = per * amt;
            } else {
              const die = game.settings.get('ragnaroks-hero-forge', 'heroDie') || 6;
              const roll = new Roll(`${amt}d${die}`);
              await roll.evaluate({async: false});
              bonus = roll.total;
            }

            // Record pending bonus on actor so integrations (midiQOL etc.) can pick it up
            try {
              await HeroPoints.setPendingBonus(actor, bonus, { originMessageId: message.id, userId: game.user.id });
            } catch (err) {
              console.warn("RagNarok's Hero Forge | could not set pending bonus", err);
            }

            // Append a message describing the bonus and add a flag
            const content = `<div class="ragnaroks-hero-bonus">${actor.name} spent ${amt} hero point(s) and rolled <strong>${roll.formula}</strong> = <strong>${bonus}</strong> bonus.</div>`;
            await ChatMessage.create({
              speaker: message.data.speaker,
              content,
              type: CONST.CHAT_MESSAGE_TYPES.OTHER,
              flags: {
                'ragnaroks-hero-forge': {
                  heroBonus: bonus,
                  heroSpent: amt,
                  originMessageId: message.id
                }
              }
            });

            // Notify other modules via hook for integration
            Hooks.callAll('ragnaroks-hero-forge.applyHeroBonus', {
              message,
              actor,
              points: amt,
              bonus,
            });

            // Optionally, try to update the original chat message total if it includes a roll
            try {
              const orig = message.getRoll();
              if (orig) {
                // We cannot directly mutate the original Roll result, but we can create a new roll display.
                // For now, add a visual badge to the original message
                const badge = `<div class="ragnaroks-hero-attached">+${bonus} (hero)</div>`;
                const msgHtml = message.data.content + badge;
                await message.update({ content: msgHtml, flags: mergeObject(message.data.flags || {}, { 'ragnaroks-hero-forge': { lastBonus: bonus } }) });
              }
            } catch (err) {
              // ignore
            }

            ui.notifications.info(`${actor.name} gained +${bonus} from hero points`);
          }
        },
        cancel: { label: "Cancel" }
      }
    }).render(true);
  });

  // Remove button if actor has no points (visual)
  if (!hasPoints) html.find('.ragnaroks-hero-button-wrapper').addClass('disabled');
}
