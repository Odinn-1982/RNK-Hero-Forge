import * as HeroPoints from "../heroPoints.js";

export function registerActorTracker() {
  // Insert a small hero point tracker into the 5e character sheet header
  Hooks.on("renderActorSheet5eCharacter", async (app, html, data) => {
    try {
      const actor = app.actor;
      if (!actor) return;

      // Only show to GM or to players if enabled
      const showForPlayers = game.settings.get('ragnaroks-hero-forge', 'enablePlayersHub');
      if (!game.user.isGM && !showForPlayers && !actor.hasPlayerOwner) return;

      const hp = await HeroPoints.get(actor).catch(() => ({ max: 0, current: 0 }));
      const max = hp.max || 0;
      const current = hp.current || 0;

      // Build array of points for template: each item indicates if filled
      const points = [];
      for (let i = 0; i < max; i++) {
        points.push({ filled: i < current });
      }

      const trackerHtml = await renderTemplate('templates/actor-tracker.hbs', {
        actorId: actor.id,
        name: actor.name,
        current,
        max,
        points,
        isGM: game.user.isGM,
        canEdit: game.user.isGM || actor.hasPlayerOwner
      });

      // Put it into the sheet header area
      const header = html.find('.sheet-header');
      if (header.length) header.append(trackerHtml);
      else html.find('.sheet-body').prepend(trackerHtml);

      // Attach handlers
      html.find('.ragnaroks-hp-add').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        new Dialog({
          title: `Add Hero Points — ${a.name}`,
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

      html.find('.ragnaroks-hp-spend').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        const data = await HeroPoints.get(a);
        const maxSpend = data.current || 0;
        if (maxSpend <= 0) return ui.notifications.warn(`${a.name} has no hero points`);

        new Dialog({
          title: `Spend Hero Points — ${a.name}`,
          content: `<p>Hero Points available: ${maxSpend}. How many to spend?</p><input id="hp-amt" type="number" min="1" max="${maxSpend}" value="1" />`,
          buttons: {
            ok: {
              label: "Spend",
              callback: async (dlg) => {
                const amt = parseInt(dlg.find('#hp-amt').val(), 10) || 0;
                if (amt <= 0) return;
                try {
                  await HeroPoints.spend(a, amt);
                } catch (err) {
                  return ui.notifications.error(err.message);
                }

                // Compute bonus according to settings and set pending bonus
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

                try {
                  await HeroPoints.setPendingBonus(a, bonus, { source: 'sheet', userId: game.user.id });
                } catch (err) {
                  console.warn('RagNarok\'s Hero Forge | could not set pending bonus from sheet', err);
                }

                ui.notifications.info(`${a.name} spent ${amt} hero point(s) and set a pending bonus of +${bonus}`);
                app.render();
              }
            },
            cancel: { label: "Cancel" }
          }
        }).render(true);
      });

      html.find('.ragnaroks-hp-set-max').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        new Dialog({
          title: `Set Max Hero Points — ${a.name}`,
          content: `<p>Enter new max:</p><input id="hp-max" type="number" min="0" value="${game.settings.get('ragnaroks-hero-forge','defaultMax') || 3}" />`,
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
      console.warn("RagNarok's Hero Forge | ActorTracker error", err);
    }
  });
}
