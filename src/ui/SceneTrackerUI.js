import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

// Compatibility: prefer classic Application so module works on Foundry v0.8
export class SceneHeroTrackerUI extends Application {
  constructor(options = {}) {
    super(options);
    this.selectedActorId = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "rnk-scene-tracker",
      template: "modules/rnk-hero-forge/templates/scene-tracker.hbs",
      popOut: true,
      resizable: true,
      classes: ["rnk-scene-tracker"],
      width: 320,
      height: 400,
    });
  }

  async getData(options = {}) {
    const actor = this.selectedActorId ? game.actors.get(this.selectedActorId) : null;
    if (!actor) {
      return {
        actor: null,
        hasActor: false,
        current: 0,
        max: 0,
        points: [],
      };
    }

    const hp = await HeroPoints.get(actor).catch(() => ({ max: 0, current: 0 }));
    const current = hp.current || 0;
    const max = hp.max || 0;

    const points = [];
    for (let i = 0; i < max; i++) {
      points.push({ filled: i < current });
    }

    return {
      actor,
      hasActor: !!actor,
      actorId: actor.id,
      actorName: actor.name,
      current,
      max,
      points,
      isGM: game.user.isGM,
      canEdit: game.user.isGM || actor.hasPlayerOwner,
    };
  }

  async _changeActor(event) {
    event.preventDefault();
    const select = event.target.closest('.rnk-actor-select');
    if (select) {
      this.selectedActorId = select.value || null;
      this.render();
    }
  }

  async _addPoints(event) {
    event.preventDefault();
    const actor = game.actors.get(this.selectedActorId);
    if (!actor) return;

    new Dialog({
      title: game.i18n.format('rnk-hero-forge.dialog.addPoints.title', { name: actor.name }),
      classes: ["rnk-hero-dialog"],
      content: `<p>How many hero points to add?</p><input type="number" id="add-amt" min="1" value="1" />`,
      buttons: {
        ok: {
          label: "Add",
          callback: async (dlg) => {
            const amt = parseInt(dlg.find("#add-amt").val(), 10) || 0;
            if (amt <= 0) return;
            await HeroPoints.add(actor, amt);
            this.render();
          },
        },
        cancel: { label: "Cancel" },
      },
    }).render(true);
  }

  async _spendPoints(event) {
    event.preventDefault();
    const actor = game.actors.get(this.selectedActorId);
    if (!actor) return;

    const data = await HeroPoints.get(actor);
    const maxSpend = data.current || 0;
    if (maxSpend <= 0) return ui.notifications.warn(`${actor.name} has no hero points`);

    new Dialog({
      title: game.i18n.format('rnk-hero-forge.dialog.spendPoints.title', { name: actor.name }),
      classes: ["rnk-hero-dialog"],
      content: `
        <form class="rnk-hero-spend-form hero-hub-theme">
          <div class="spend-header">
            <div class="spend-hero-identity">
              <span class="spend-hero-name">${actor.name}</span>
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

            const amtData = readInputValue("#hp-amt");
            const amt = parseInt(amtData.value, 10) || 0;
            if (amt <= 0) return;
            try {
              await HeroPoints.spend(actor, amt);
            } catch (err) {
              return ui.notifications.error(err.message);
            }

            const { bonus, formula } = await HeroPoints.computeHeroBonus(amt);

            const setPending = readInputValue("#opt-set-pending").checked;
            const postChat = readInputValue("#opt-post-chat").checked;

            if (setPending) {
              try {
                await HeroPoints.setPendingBonus(actor, bonus, {
                  source: "scene-tracker",
                  userId: game.user.id,
                    points: amt,
                    formula,
                    postChat,
                });
              } catch (err) {
                logger.warn("could not set pending bonus from scene tracker", err);
              }
            }

            let chat = null;
            if (postChat) {
              try {
                const speakerImg = actor?.img || null;
                const content = await foundry.applications.handlebars.renderTemplate(
                  "modules/rnk-hero-forge/templates/hero-spend-chat.hbs",
                  {
                    speakerImg,
                    speakerName: actor.name,
                    actorId: actor.id,
                    points: amt,
                    isOne: amt === 1,
                    formula: formula || null,
                    bonus,
                  }
                );
                chat = await ChatMessage.create({
                  speaker: { actor: actor.id, alias: actor.name },
                  content,
                  style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                  flags: {
                    "rnk-hero-forge": {
                      heroBonus: bonus,
                      heroSpent: amt,
                      heroFormula: formula,
                      origin: "scene-tracker",
                    },
                  },
                });

                Hooks.callAll("rnk-hero-forge.applyHeroBonus", {
                  message: chat,
                  actor,
                  points: amt,
                  bonus,
                });
              } catch (err) {
                logger.warn(
                  "RNK Hero Forge | could not create chat message from scene tracker",
                  err
                );
              }
            } else {
              Hooks.callAll("rnk-hero-forge.applyHeroBonus", {
                message: null,
                actor,
                points: amt,
                bonus,
              });
            }

            ui.notifications.info(
              `${actor.name} spent ${amt} hero point(s)${
                setPending ? ` and set a pending bonus of +${bonus}` : ""
              }`
            );
            this.render();
          },
        },
        cancel: { label: "Cancel" },
      },
    }).render(true);
  }

  async _setMax(event) {
    event.preventDefault();
    const actor = game.actors.get(this.selectedActorId);
    if (!actor) return;

    new Dialog({
      title: game.i18n.format('rnk-hero-forge.dialog.setMax.title', { name: actor.name }),
      classes: ["rnk-hero-dialog"],
      content: `<p>Enter new max:</p><input id="hp-max" type="number" min="0" value="${
        game.settings.get("rnk-hero-forge", "defaultMax") || 3
      }" />`,
      buttons: {
        ok: {
          label: "Set",
          callback: async (dlg) => {
            const max = parseInt(dlg.find("#hp-max").val(), 10) || 0;
            await HeroPoints.setMax(actor, max);
            this.render();
          },
        },
        cancel: { label: "Cancel" },
      },
    }).render(true);
  }

  /**
   * Register DOM listeners
   */
  activateListeners(html) {
    super.activateListeners(html);
    const root = html;
    if (!root) return;

    // Wire up handlers using delegation
    root.find('.rnk-actor-select').on('change', (ev) => this._changeActor(ev));
    root.find('.rnk-add-points').on('click', (ev) => this._addPoints(ev));
    root.find('.rnk-spend-points').on('click', (ev) => this._spendPoints(ev));
    root.find('.rnk-set-max').on('click', (ev) => this._setMax(ev));
  }
}

export function registerSceneTrackerUI() {
  if (!game.user.isGM) return;

  let sceneTrackerWindow = null;

  Hooks.on("getSceneControlButtons", (controls) => {
    controls.push({
      name: "rnk-tracker",
      title: "RNK Hero Tracker",
      icon: "fas fa-hammer",
      layer: "token",
      tools: [
        {
          name: "open-tracker",
          title: "Open Scene Tracker",
          icon: "fas fa-fire",
          onClick: () => {
            if (!sceneTrackerWindow) {
              sceneTrackerWindow = new SceneHeroTrackerUI();
            }
            sceneTrackerWindow.render(true);
          },
        },
      ],
    });
  });

  Hooks.on("ready", () => {
    if (!sceneTrackerWindow) {
      sceneTrackerWindow = new SceneHeroTrackerUI();
    }
  });
}
