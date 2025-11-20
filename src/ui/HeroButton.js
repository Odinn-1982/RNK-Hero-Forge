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
      content: `
        <p>Hero Points available: ${maxAvailable}. Roll ${game.settings.get('ragnaroks-hero-forge', 'heroDie')} per point. How many to spend?</p>
        <input id="hp-amt" type="number" min="1" max="${maxAvailable}" value="1" />
        <div style="margin-top:8px">
          <label><input type="checkbox" id="opt-set-pending" checked/> Set pending bonus (applies to next roll)</label><br/>
          <label><input type="checkbox" id="opt-post-chat" checked/> Post chat message for the bonus</label>
        </div>
      `,
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
            let roll = null;
            if (mode === 'flat') {
              const per = game.settings.get('ragnaroks-hero-forge', 'flatPerPoint') || 2;
              bonus = per * amt;
            } else {
              const die = game.settings.get('ragnaroks-hero-forge', 'heroDie') || 6;
              roll = new Roll(`${amt}d${die}`);
              await roll.evaluate({async: false});
              bonus = roll.total;
            }

            const setPending = dlg.find('#opt-set-pending').is(':checked');
            const postChat = dlg.find('#opt-post-chat').is(':checked');

            if (setPending) {
              try {
                await HeroPoints.setPendingBonus(actor, bonus, { originMessageId: message.id, userId: game.user.id });
              } catch (err) {
                console.warn("RagNarok's Hero Forge | could not set pending bonus", err);
              }
            }

            if (postChat) {
              try {
                const speakerImg = actor?.img || null;
                const content = await renderTemplate('templates/hero-spend-chat.hbs', {
                  speakerImg,
                  speakerName: actor.name,
                  actorId: actor.id,
                  points: amt,
                  isOne: amt === 1,
                  formula: roll ? roll.formula : null,
                  bonus
                });
                const chat = await ChatMessage.create({
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

                Hooks.callAll('ragnaroks-hero-forge.applyHeroBonus', {
                  message: chat,
                  actor,
                  points: amt,
                  bonus,
                });
              } catch (err) {
                console.warn('RagNarok\'s Hero Forge | failed to create spend chat message', err);
              }
            } else {
              Hooks.callAll('ragnaroks-hero-forge.applyHeroBonus', { message: null, actor, points: amt, bonus });
            }

            // Optionally, try to update the original chat message total if it includes a roll
            try {
              const orig = message.getRoll();
              if (orig) {
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
