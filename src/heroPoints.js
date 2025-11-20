const MOD = "ragnaroks-hero-forge";

export async function get(actor) {
  if (!actor) return null;
  const flags = actor.getFlag(MOD, "heroPoints");
  if (flags) return flags;
  // fallback to defaults
  const max = game.settings.get(MOD, "defaultMax");
  const current = game.settings.get(MOD, "defaultCurrent");
  await set(actor, { max, current });
  return { max, current };
}

export async function set(actor, { max = 0, current = 0 } = {}) {
  if (!actor) return null;
  return actor.setFlag(MOD, "heroPoints", { max, current });
}

export async function add(actor, amount = 1) {
  if (!actor) return null;
  const data = await get(actor);
  const max = data.max || 0;
  const current = Math.min(max, (data.current || 0) + amount);
  return set(actor, { max, current });
}

export async function spend(actor, amount = 1) {
  if (!actor) return null;
  const data = await get(actor);
  const current = data.current || 0;
  if (amount <= 0) return null;
  if (current < amount) throw new Error("Not enough hero points");
  const newCurrent = current - amount;
  await set(actor, { max: data.max || 0, current: newCurrent });
  return newCurrent;
}

// Store a pending bonus on the actor so integrations can apply it to the next workflow
export async function setPendingBonus(actor, bonus, meta = {}) {
  if (!actor) return null;
  const payload = {
    bonus,
    created: Date.now(),
    meta,
  };
  return actor.setFlag(MOD, "pendingBonus", payload);
}

export async function clearPendingBonus(actor) {
  if (!actor) return null;
  return actor.unsetFlag(MOD, "pendingBonus");
}

export async function getPendingBonus(actor) {
  if (!actor) return null;
  return actor.getFlag(MOD, "pendingBonus");
}

export async function setMax(actor, max) {
  if (!actor) return null;
  const data = await get(actor);
  const current = Math.min(max, data.current || 0);
  return set(actor, { max, current });
}

export async function clear(actor) {
  if (!actor) return actor.unsetFlag(MOD, "heroPoints");
}
