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

      const trackerHtml = await renderTemplate('templates/actor-tracker.hbs', {
        actorId: actor.id,
        name: actor.name,
        current: hp.current || 0,
        max: hp.max || 0,
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
        const amount = parseInt(prompt('Add how many hero points?', '1'), 10) || 0;
        if (amount <= 0) return;
        await HeroPoints.add(a, amount);
        app.render();
      });

      html.find('.ragnaroks-hp-spend').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        const data = await HeroPoints.get(a);
        const maxSpend = data.current || 0;
        if (maxSpend <= 0) return ui.notifications.warn(`${a.name} has no hero points`);
        const amt = parseInt(prompt(`Spend how many hero points? (1 - ${maxSpend})`, '1'), 10) || 0;
        if (amt <= 0) return;
        try {
          await HeroPoints.spend(a, amt);
          ui.notifications.info(`${a.name} spent ${amt} hero point(s)`);
          app.render();
        } catch (err) {
          ui.notifications.error(err.message);
        }
      });

      html.find('.ragnaroks-hp-set-max').click(async (ev) => {
        const id = $(ev.currentTarget).data('actor-id');
        const a = game.actors.get(id);
        if (!a) return;
        const newMax = parseInt(prompt('Set new max hero points:', String(game.settings.get('ragnaroks-hero-forge','defaultMax') || 3)), 10) || 0;
        await HeroPoints.setMax(a, newMax);
        app.render();
      });

    } catch (err) {
      console.warn("RagNarok's Hero Forge | ActorTracker error", err);
    }
  });
}
