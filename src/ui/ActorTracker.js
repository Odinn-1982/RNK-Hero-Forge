import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

const TRACKER_ANCHOR_SELECTORS = [
  "[data-rnk-hero-tracker-anchor]",
  ".rnk-actor-tracker-anchor",
  ".rnk-hero-tracker-anchor",
  ".abilities-container-inner",
  ".rows .bottom",
];

function insertTracker(html, trackerHtml) {
  for (const selector of TRACKER_ANCHOR_SELECTORS) {
    const anchor = html.find(selector);
    if (anchor.length) {
      const target = anchor.first().get(0);
      if (!target) continue;
      const wrapper = document.createElement('div');
      wrapper.className = 'rnk-actor-tracker-area';
      wrapper.innerHTML = trackerHtml;
      target.appendChild(wrapper);
      return true;
    }
  }
  const header = html.find(".sheet-header");
  if (header.length) {
    header.append(trackerHtml);
    return true;
  }
  const body = html.find(".sheet-body");
  if (body.length) {
    body.prepend(trackerHtml);
    return true;
  }
  return false;
}

export function registerActorTracker() {
  Hooks.on("renderActorSheet", async (app, html, data) => {
    try {
      const actor = app.actor;
      if (!actor) return;

      // Only show to GM or to players if enabled
      const showForPlayers = game.settings.get('rnk-hero-forge', 'enablePlayersHub');
      if (!game.user.isGM && !showForPlayers && !actor.hasPlayerOwner) return;

      const hp = await HeroPoints.get(actor).catch(() => ({ max: 0, current: 0 }));
      const max = hp.max || 0;
      const current = hp.current || 0;

      // Build array of points for template: each item indicates if filled
      const points = [];
      for (let i = 0; i < max; i++) {
        points.push({ filled: i < current });
      }

      const trackerHtml = await renderTemplate('modules/rnk-hero-forge/templates/actor-tracker.hbs', {
        actorId: actor.id,
        name: actor.name,
        current,
        max,
        points,
        isGM: game.user.isGM,
        canManage: game.user.isGM,
        canSpend: game.user.isGM || actor.isOwner
      });

      const inserted = insertTracker(html, trackerHtml);
      if (!inserted) {
        logger.warn("Could not insert actor tracker; no suitable anchor found.");
        return;
      }

      // Attach handlers
      html.find('.rnk-hp-add').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        new Dialog({
          title: game.i18n.format('rnk-hero-forge.dialog.addPoints.title', { name: a.name }),
          classes: ["rnk-hero-dialog"],
          content: `<p>How many hero points to add?</p><input type="number" id="add-amt" min="1" value="1" />`,
          buttons: {
            ok: {
              label: "Add",
              callback: async (dlg) => {
                const amt = parseInt(dlg.find('#add-amt').val(), 10) || 0;
                if (amt <= 0) return;
                await HeroPoints.add(a, amt);
                app.render();
              }
            },
            cancel: { label: "Cancel" }
          }
        }).render(true);
      });

      html.find('.rnk-hp-spend').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        const data = await HeroPoints.get(a);
        const maxSpend = data.current || 0;
        if (maxSpend <= 0) return ui.notifications.warn(`${a.name} has no hero points`);

        new Dialog({
          title: game.i18n.format('rnk-hero-forge.dialog.spendPoints.title', { name: a.name }),
          classes: ["rnk-hero-dialog"],
          content: `
            <form class="rnk-hero-spend-form hero-hub-theme">
              <div class="spend-header">
                <div class="spend-hero-identity">
                  <span class="spend-hero-name">${a.name}</span>
                  <div class="spend-hero-balance" title="Available Hero Points">
                    <i class="fas fa-bolt"></i> ${maxSpend}
                  </div>
                </div>
                <div class="spend-helper">Spend points for a bonus</div>
              </div>

              <div class="spend-body">
                <div class="spend-row">
                  <label for="hp-amt">Spend Amount</label>
                  <div class="spend-input-wrapper">
                    <input id="hp-amt" type="number" min="1" max="${maxSpend}" value="1" />
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
              label: `<i class="fas fa-bolt"></i> Spend`,
              callback: async (dlg) => {
                const rootEl = dlg instanceof HTMLElement ? dlg : dlg?.[0] || null;
                const readInputValue = (selector) => {
                  if (typeof dlg?.find === "function") {
                    const jq = dlg.find(selector);
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
                  await HeroPoints.spend(a, amt);
                } catch (err) {
                  return ui.notifications.error(err.message);
                }

                // Compute bonus according to settings, set pending bonus, and post a chat message
                const { bonus, formula } = await HeroPoints.computeHeroBonus(amt);

                // Read options
                const setPending = readInputValue('#opt-set-pending').checked;
                const postChat = readInputValue('#opt-post-chat').checked;

                if (setPending) {
                  try {
                    await HeroPoints.setPendingBonus(a, bonus, {
                      source: 'sheet',
                      userId: game.user.id,
                      points: amt,
                      formula,
                      postChat,
                    });
                  } catch (err) {
                    logger.warn('could not set pending bonus from sheet', err);
                  }
                }

                // Create a chat message describing the spend and bonus if requested
                let chat = null;
                if (postChat) {
                  try {
                    const speakerImg = a?.img || null;
                    const content = await renderTemplate('modules/rnk-hero-forge/templates/hero-spend-chat.hbs', {
                      speakerImg,
                      speakerName: a.name,
                      actorId: a.id,
                      points: amt,
                      isOne: amt === 1,
                      formula: formula || null,
                      bonus
                    });
                    chat = await ChatMessage.create({
                      speaker: { actor: a.id, alias: a.name },
                      content,
                      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                      flags: {
                        'rnk-hero-forge': {
                          heroBonus: bonus,
                          heroSpent: amt,
                          heroFormula: formula,
                          origin: 'sheet'
                        }
                      }
                    });

                    // Notify other modules/integrations
                    Hooks.callAll('rnk-hero-forge.applyHeroBonus', { message: chat, actor: a, points: amt, bonus });
                  } catch (err) {
                    logger.warn('could not create chat message for hero spend', err);
                  }
                } else {
                  // Still notify integrations if setPending was used
                  Hooks.callAll('rnk-hero-forge.applyHeroBonus', { message: chat, actor: a, points: amt, bonus });
                }

                ui.notifications.info(game.i18n.format('rnk-hero-forge.notification.spendSuccess', { name: a.name, points: amt, bonus }));
                app.render();
              }
            },
            cancel: { label: "Cancel" }
          }
        }).render(true);
      });

      html.find('.rnk-hp-set-max').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        new Dialog({
          title: game.i18n.format('rnk-hero-forge.dialog.setMax.title', { name: a.name }),
          classes: ["rnk-hero-dialog"],
          content: `<p>Enter new max:</p><input id="hp-max" type="number" min="0" value="${game.settings.get('rnk-hero-forge','defaultMax') || 3}" />`,
          buttons: {
            ok: {
              label: "Set",
              callback: async (dlg) => {
                const max = parseInt(dlg.find('#hp-max').val(), 10) || 0;
                await HeroPoints.setMax(a, max);
                app.render();
              }
            },
            cancel: { label: "Cancel" }
          }
        }).render(true);
      });

    } catch (err) {
      logger.warn("ActorTracker error", err);
    }
  });
}
