import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

export async function renderHeroButtonForMessage(message, html) {
  // Only show for messages with rolls
  if (!message.flags?.core?.roll) {
    // Fallback: check for rolls array
    if (!message.isRoll) return;
  }

  // Only show to users who own the actor (GM counts as owner)
  if (!actor?.isOwner) return;

  // Determine the actor that issued the roll (if any)
  const speaker = message.speaker || {};
  const actor = game.actors.get(speaker.actor) || null;
  // Only render the hero button for messages linked to actor documents (do not show the button for actor-less messages)
  if (!actor) return;

  const hp = actor ? await HeroPoints.get(actor) : null;
  const hasPoints = !!(hp && hp.current > 0);
  const heroMode = game.settings.get('rnk-hero-forge', 'heroMode') || 'roll';
  const rollHelp = heroMode === 'flat'
    ? `Flat bonus: ${(game.settings.get('rnk-hero-forge', 'flatPerPoint') || 2)} per point.`
    : 'Bonus dice: 1 point -> 1d3, 2 points -> +1d4, 3+ points -> +1d6 each.';

  const buttonHtml = await foundry.applications.handlebars.renderTemplate("modules/rnk-hero-forge/templates/button.hbs", {
    hasPoints,
    current: hp ? hp.current : 0,
    max: hp ? hp.max : 0,
  });

  // Remove any existing hero button for this message before inserting a fresh one
  html.querySelectorAll('.rnk-hero-btn').forEach((node) => node.remove());

  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'rnk-hero-btn';
  buttonWrapper.innerHTML = buttonHtml;

  const contentArea = html.querySelector('.message-content') || html;
  contentArea.appendChild(buttonWrapper);

  // Attach click handler
  const button = buttonWrapper.querySelector('.rnk-use-hero');
  if (button) {
    button.addEventListener('click', async (ev) => {
      ev.preventDefault();
      
      // Re-fetch current HP to ensure we have latest data
      const currentHp = await HeroPoints.get(actor);
      const maxAvailable = currentHp?.current || 0;
      if (!actor) return ui.notifications.warn("No actor associated with this roll");
      if (maxAvailable <= 0) return ui.notifications.warn(game.i18n.localize('rnk-hero-forge.notification.noHero'));

      new Dialog({
        title: `Use Hero Points: ${actor.name}`,
        classes: ["rnk-hero-dialog"],
        content: `
          <form class="rnk-hero-spend-form hero-hub-theme">
            <div class="spend-header">
              <div class="spend-hero-identity">
                <span class="spend-hero-name">${actor.name}</span>
                <div class="spend-hero-balance" title="Available Hero Points">
                  <i class="fas fa-bolt"></i> ${maxAvailable}
                </div>
              </div>
              <div class="spend-helper">${rollHelp}</div>
            </div>

            <div class="spend-body">
              <div class="spend-row">
                <label for="hp-amt">Spend Amount</label>
                <div class="spend-input-wrapper">
                  <input id="hp-amt" type="number" min="1" max="${maxAvailable}" value="1" />
                </div>
              </div>

              <div class="spend-footer">
                <label class="spend-checkbox">
                  <input type="checkbox" id="opt-set-pending" checked/>
                  <span>Set pending bonus (next roll)</span>
                </label>
                <label class="spend-checkbox">
                  <input type="checkbox" id="opt-post-chat" checked/>
                  <span>Post chat message</span>
                </label>
              </div>
            </div>
          </form>
        `,
        buttons: {
          ok: {
            label: `<i class="fas fa-bolt"></i> Use Points`,
            callback: async (html) => {
              const rootEl = html instanceof HTMLElement ? html : html?.[0] || null;
              const readInputValue = (selector) => {
                if (typeof html?.find === "function") {
                  const jq = html.find(selector);
                  if (jq?.length) return { value: jq.val(), checked: jq.is(":checked") };
                }
                const el = rootEl?.querySelector?.(selector) || null;
                if (!el) return { value: null, checked: false };
                if (el instanceof HTMLInputElement) {
                  return { value: el.value, checked: el.checked };
                }
                return { value: null, checked: false };
              };

              const amtData = readInputValue('#hp-amt');
              const amt = parseInt(amtData.value, 10) || 0;
              if (amt <= 0) return;
              
              try {
                await HeroPoints.spend(actor, amt);
              } catch (err) {
                return ui.notifications.error(err.message);
              }

              const { bonus, formula } = await HeroPoints.computeHeroBonus(amt);

              const setPending = readInputValue('#opt-set-pending').checked || false;
              const postChat = readInputValue('#opt-post-chat').checked || false;

              if (setPending) {
                try {
                  await HeroPoints.setPendingBonus(actor, bonus, {
                    originMessageId: message.id,
                    userId: game.user.id,
                    points: amt,
                    formula,
                    postChat,
                  });
                } catch (err) {
                  logger.warn("could not set pending bonus", err);
                }
              }

              if (postChat) {
                try {
                  function extractImageUrl(value) {
                    if (!value || typeof value !== 'string') return null;
                    const s = value.trim();
                    // If the field contains an <img ... /> HTML, extract src attribute
                    const imgMatch = s.match(/<img\s+[^>]*src\s*=\s*(['\"])(.*?)\1/i);
                    if (imgMatch && imgMatch[2]) return imgMatch[2];
                    const imgMatch2 = s.match(/<img\s+[^>]*src\s*=\s*([^\s'>]+)/i);
                    if (imgMatch2 && imgMatch2[1]) return imgMatch2[1];
                    // fallback: if it appears to be a URL or path to an image
                    if (/\.(png|jpg|jpeg|svg|webp|gif|bmp)(\?.*)?$/i.test(s)) return s.replace(/["'<>]/g, '');
                    // remove angle brackets and quotes if present
                    const cleaned = s.replace(/[<>"']/g, '');
                    if (cleaned.includes('/') || cleaned.includes(':')) return cleaned;
                    return null;
                  }
                  const rawSpeakerImg = actor?.prototypeToken?.texture?.src || actor?.img || 'icons/svg/mystery-man.svg';
                  const speakerImg = extractImageUrl(rawSpeakerImg) || 'icons/svg/mystery-man.svg';
                  if (!extractImageUrl(rawSpeakerImg) && rawSpeakerImg) logger.warn('Speaker image not valid or parseable', { actor: actor?.name, rawSpeakerImg });
                  const content = await foundry.applications.handlebars.renderTemplate('modules/rnk-hero-forge/templates/hero-spend-chat.hbs', {
                    speakerImg,
                    speakerName: actor.name,
                    actorId: actor.id,
                    points: amt,
                    isOne: amt === 1,
                    formula,
                    bonus
                  });
                  const chat = await ChatMessage.create({
                    speaker: message.speaker,
                    content,
                    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                    flags: {
                      'rnk-hero-forge': {
                        heroBonus: bonus,
                        heroSpent: amt,
                        heroFormula: formula,
                        originMessageId: message.id
                      }
                    }
                  });

                  Hooks.callAll('rnk-hero-forge.applyHeroBonus', {
                    message: chat,
                    actor,
                    points: amt,
                    bonus,
                  });
                } catch (err) {
                  logger.warn('failed to create spend chat message', err);
                }
              } else {
                Hooks.callAll('rnk-hero-forge.applyHeroBonus', { message: null, actor, points: amt, bonus });
              }

              // Optionally, try to update the original chat message total if it includes a roll
              try {
                const orig = message.getRoll();
                if (orig) {
                  const badge = `<div class="rnk-hero-attached">+${bonus} (hero)</div>`;
                  const msgHtml = message.content + badge;
                  await message.update({ content: msgHtml, flags: foundry.utils.mergeObject(message.flags || {}, { 'rnk-hero-forge': { lastBonus: bonus } }) });
                }
              } catch (err) {
                // ignore
              }

              ui.notifications.info(game.i18n.format('rnk-hero-forge.notification.spendSuccess', { name: actor.name, points: amt, bonus }));
            }
          },
          cancel: { label: "Cancel" }
        }
      }).render(true);
    });
  }

  // Remove button if actor has no points (visual)
  if (!hasPoints) html.querySelector('.rnk-hero-button-wrapper')?.classList.add('disabled');
}
