import * as HeroPoints from "../heroPoints.js";

export function registerMidiQOLIntegration() {
  // Only register if midi-qol is present
  if (!game.modules.get("midi-qol")?.active) return;

  // Apply pending bonus to attack rolls (pre-attack) and damage rolls (pre-damage)
  // midi-qol workflows vary across versions. We attempt to detect and apply the pending bonus
  const applyPendingToWorkflow = async (workflow, target = 'attack') => {
    try {
      // Resolve actor: midiQOL sometimes stores workflow.actor as Token5e or Actor
      const actor = workflow?.actor?.actor ?? workflow?.actor ?? workflow?.token?.actor ?? null;
      if (!actor) return false;
      const pending = await HeroPoints.getPendingBonus(actor);
      if (!pending) return false;
      const bonus = pending.bonus || 0;
      if (!bonus) return false;

      // Try common properties depending on target
      if (target === 'attack') {
        // attackRoll, roll, or a nested rolls array
        if (workflow.attackRoll && typeof workflow.attackRoll.total === 'number') {
          workflow.attackRoll.total += bonus; return true;
        }
        if (workflow.roll && typeof workflow.roll.total === 'number') {
          workflow.roll.total += bonus; return true;
        }
        if (Array.isArray(workflow.rolls) && workflow.rolls.length) {
          // apply to the first numeric total we find
          for (const r of workflow.rolls) {
            if (r && typeof r.total === 'number') { r.total += bonus; return true; }
          }
        }
      }

      if (target === 'damage') {
        // damageRoll, damageTotal, or other properties
        if (workflow.damageRoll && typeof workflow.damageRoll.total === 'number') {
          workflow.damageRoll.total += bonus; return true;
        }
        if (typeof workflow.damageTotal === 'number') { workflow.damageTotal += bonus; return true; }
        if (Array.isArray(workflow.rolls) && workflow.rolls.length) {
          for (const r of workflow.rolls) {
            if (r && typeof r.total === 'number') { r.total += bonus; return true; }
          }
        }
      }

      // Not applied
      return false;
    } catch (err) {
      console.warn("RagNarok's Hero Forge | error applying pending bonus", err);
      return false;
    }
  };

  Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    const applied = await applyPendingToWorkflow(workflow, 'attack');
    if (applied) {
      const actor = workflow?.actor?.actor ?? workflow?.actor ?? workflow?.token?.actor ?? null;
      if (actor) {
        await HeroPoints.clearPendingBonus(actor);
        ui.notifications.info(`${actor.name} receives hero bonus applied to attack`);
      }
    }
  });

  Hooks.on("midi-qol.preDamageRoll", async (workflow) => {
    const applied = await applyPendingToWorkflow(workflow, 'damage');
    if (applied) {
      const actor = workflow?.actor?.actor ?? workflow?.actor ?? workflow?.token?.actor ?? null;
      if (actor) {
        await HeroPoints.clearPendingBonus(actor);
        ui.notifications.info(`${actor.name} receives hero bonus applied to damage`);
      }
    }
  });
}
