import * as HeroPoints from "../heroPoints.js";

export class HeroHub extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "ragnaroks-hero-hub",
      template: "templates/hub.hbs",
      popOut: true,
      resizable: true,
      width: 520,
      height: 480,
      classes: ["ragnaroks-hero-hub", "hero-hub-theme"],
    });
  }

  constructor(options = {}) {
    super(options);
  }

  async getData() {
    const actors = game.actors.contents.filter(a => a.hasPlayerOwner || a.isOwner);
    const list = await Promise.all(actors.map(async (a) => {
      const hp = await HeroPoints.get(a).catch(() => ({ max: 0, current: 0 }));
      return {
        id: a.id,
        name: a.name,
        img: a.img,
        max: hp.max || 0,
        current: hp.current || 0,
      };
    }));
    return { actors: list, isGM: game.user.isGM };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".hp-add").click(async (ev) => {
      const id = $(ev.currentTarget).data("actor-id");
      const actor = game.actors.get(id);
      await HeroPoints.add(actor, 1);
      this.render();
    });

    html.find(".hp-spend").click(async (ev) => {
      const id = $(ev.currentTarget).data("actor-id");
      const actor = game.actors.get(id);
      const data = await HeroPoints.get(actor);
      const maxSpend = data.current || 0;
      if (maxSpend <= 0) return ui.notifications.warn(`${actor.name} has no hero points`);
      new Dialog({
        title: `Spend Hero Points — ${actor.name}`,
        content: `<p>How many hero points to spend? (1 - ${maxSpend})</p><input id="hp-amt" type="number" min="1" max="${maxSpend}" value="1" />`,
        buttons: {
          ok: {
            label: "Spend",
            callback: async (html) => {
              const amt = parseInt(html.find("#hp-amt").val(), 10) || 0;
              try {
                await HeroPoints.spend(actor, amt);
                ui.notifications.info(`${actor.name} spent ${amt} hero point(s)`);
                this.render();
              } catch (err) {
                ui.notifications.error(err.message);
              }
            }
          },
          cancel: { label: "Cancel" }
        }
      }).render(true);
    });

    html.find(".hp-set-max").click(async (ev) => {
      const id = $(ev.currentTarget).data("actor-id");
      const actor = game.actors.get(id);
      new Dialog({
        title: `Set Max Hero Points — ${actor.name}`,
        content: `<p>Enter new max:</p><input id="hp-max" type="number" min="0" value="3" />`,
        buttons: {
          ok: {
            label: "Set",
            callback: async (html) => {
              const max = parseInt(html.find("#hp-max").val(), 10) || 0;
              await HeroPoints.setMax(actor, max);
              this.render();
            }
          },
          cancel: { label: "Cancel" }
        }
      }).render(true);
    });

    html.find(".hp-grant-all").click(async (ev) => {
      const grant = game.settings.get('ragnaroks-hero-forge', 'grantAmountPerLevel') || 1;
      const actors = game.actors.contents.filter(a => a.hasPlayerOwner || a.isOwner);
      for (const a of actors) {
        await HeroPoints.add(a, grant);
      }
      ui.notifications.info(`Granted ${grant} hero point(s) to ${actors.length} actor(s)`);
      this.render();
    });
  }
}
