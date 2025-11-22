import * as HeroPoints from "../heroPoints.js";

const ApplicationBase = Application;
const mergeOptions = foundry?.utils?.mergeObject ?? mergeObject;

function readDialogInput(html, selector) {
  if (typeof html?.find === "function") {
    const jq = html.find(selector);
    if (jq?.length) return { value: jq.val?.() ?? null, checked: jq.is?.(":checked") ?? false };
  }
  const root = html instanceof HTMLElement ? html : html?.[0] ?? null;
  const el = root?.querySelector?.(selector) ?? null;
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
    return { value: el.value ?? null, checked: el.checked ?? false };
  }
  return { value: null, checked: false };
}

function formatModifier(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "+0";
  return num >= 0 ? `+${num}` : `${num}`;
}

function getActionTypeLabel(actionType) {
  if (!actionType) return null;
  const map = CONFIG.DND5E?.itemActionTypes ?? {};
  return map[actionType] ?? actionType.toUpperCase();
}

function buildAttackChoices(actor) {
  const items = actor?.items;
  if (!items || typeof items.values !== "function") return [];

  const attackTypes = new Set(["mwak", "rwak", "msak", "rsak", "mgak", "rgak"]);
  const attackItems = Array.from(items.values()).filter((item) => {
    const actionType = item?.system?.actionType;
    if (!actionType) return false;
    return attackTypes.has(actionType);
  });

  return attackItems.map((item) => {
    const actionType = item.system?.actionType ?? null;
    const actionLabel = getActionTypeLabel(actionType);
    const ability = item.system?.ability ?? null;
    const abilityLabel = ability ? (CONFIG.DND5E?.abilities?.[ability] ?? ability.toUpperCase()) : null;
    const qualifiers = [];
    if (actionLabel) qualifiers.push(actionLabel);
    if (abilityLabel) qualifiers.push(abilityLabel);
    const qualifierText = qualifiers.length ? ` (${qualifiers.join(" / ")})` : "";

    return {
      type: "item-attack",
      key: item.id,
      value: `item-attack:${item.id}`,
      label: `${item.name}${qualifierText}`,
      itemId: item.id,
      itemType: item.type,
      actionType,
      ability,
    };
  });
}

function buildToolChoices(actor) {
  const tools = actor?.system?.tools ?? {};
  return Object.entries(tools).map(([key, data]) => {
    const rawLabel = data?.label ?? CONFIG.DND5E?.toolProficiencies?.[key] ?? key.toUpperCase();
    const mod = formatModifier(data?.total ?? data?.mod ?? 0);
    return {
      type: "tool",
      key,
      value: `tool:${key}`,
      label: `${rawLabel} (${mod})`,
    };
  }).filter((opt) => opt && opt.value);
}

function buildRollGroups(actor) {
  const groups = [];
  const optionMap = new Map();

  const pushGroup = (id, label, options) => {
    const filtered = options.filter((opt) => opt && opt.value);
    if (!filtered.length) return;
    groups.push({ id, label, options: filtered });
    filtered.forEach((opt) => optionMap.set(opt.value, opt));
  };

  const abilityData = actor?.system?.abilities ?? {};
  const abilityLabels = CONFIG.DND5E?.abilities ?? {};
  const abilityChecks = Object.entries(abilityData).map(([key, data]) => ({
    type: "ability-check",
    key,
    ability: key,
    label: `${abilityLabels[key] ?? key.toUpperCase()} Check (${formatModifier(data?.mod)})`,
    value: `ability-check:${key}`,
  }));
  const abilitySaves = Object.entries(abilityData).map(([key, data]) => ({
    type: "ability-save",
    key,
    ability: key,
    label: `${abilityLabels[key] ?? key.toUpperCase()} Save (${formatModifier(data?.save ?? data?.mod)})`,
    value: `ability-save:${key}`,
  }));

  const skillData = actor?.system?.skills ?? {};
  const skillLabels = CONFIG.DND5E?.skills ?? {};
  const skills = Object.entries(skillData).map(([key, data]) => ({
    type: "skill",
    key,
    ability: data?.ability ?? null,
    label: `${skillLabels[key] ?? (data?.label ?? key.toUpperCase())} (${formatModifier(data?.total ?? data?.mod)})`,
    value: `skill:${key}`,
  }));

  const attackChoices = buildAttackChoices(actor);
  const toolChoices = buildToolChoices(actor);

  pushGroup("ability-checks", "Ability Checks", abilityChecks);
  pushGroup("ability-saves", "Saving Throws", abilitySaves);
  pushGroup("skills", "Skills", skills);
  pushGroup("attacks", "Attacks & Spells", attackChoices);
  pushGroup("tools", "Tool Checks", toolChoices);

  return { groups, optionMap };
}

async function promptSpendSelection(actor, maxSpend) {
  const { groups, optionMap } = buildRollGroups(actor);
  if (!groups.length) {
    ui.notifications?.warn?.("No compatible d20 rolls are available for this actor.");
    return null;
  }

  const heroMode = game.settings.get("rnk-hero-forge", "heroMode") || "roll";
  const per = game.settings.get("rnk-hero-forge", "flatPerPoint") || 2;
  const helperText = heroMode === "flat"
    ? `Flat bonus: ${per} per point.`
    : "Tiered dice: 1pt -> 1d3, 2pt -> +1d4, 3+ -> +1d6 each.";

  const optionsMarkup = groups.map((group) => {
    const opts = group.options.map((opt) => {
      const safeLabel = foundry.utils?.escapeHTML?.(opt.label) ?? opt.label;
      return `<option value="${opt.value}">${safeLabel}</option>`;
    }).join("");
    return `<optgroup label="${group.label}">${opts}</optgroup>`;
  }).join("");

  const safeName = foundry.utils?.escapeHTML?.(actor.name) ?? actor.name;
  const content = `
    <form class="rnk-hero-spend-form hero-hub-theme">
      <div class="spend-header">
        <div class="spend-hero-identity">
          <span class="spend-hero-name">${safeName}</span>
          <div class="spend-hero-balance" title="Available Hero Points">
            <i class="fas fa-bolt"></i> ${maxSpend}
          </div>
        </div>
        <div class="spend-helper">${helperText}</div>
      </div>

      <div class="spend-body">
        <div class="spend-row">
          <label for="rnk-hero-spend-amount">Spend Amount</label>
          <div class="spend-input-wrapper">
            <input id="rnk-hero-spend-amount" type="number" min="1" max="${maxSpend}" value="1" />
          </div>
        </div>

        <div class="spend-row">
          <label for="rnk-hero-roll-select">Roll Type</label>
          <div class="spend-select-wrapper">
            <select id="rnk-hero-roll-select">
              <option value="">Select a roll...</option>
              ${optionsMarkup}
            </select>
          </div>
        </div>

        <div class="spend-row mode-row">
          <label>Roll Mode</label>
          <div class="spend-mode-toggles">
            <label class="mode-option">
              <input type="radio" name="rnk-roll-mode" value="normal" checked>
              <span class="mode-label">Normal</span>
            </label>
            <label class="mode-option">
              <input type="radio" name="rnk-roll-mode" value="advantage">
              <span class="mode-label">Advantage</span>
            </label>
            <label class="mode-option">
              <input type="radio" name="rnk-roll-mode" value="disadvantage">
              <span class="mode-label">Disadv.</span>
            </label>
          </div>
        </div>
        
        <div class="spend-footer">
          <label class="spend-checkbox">
            <input id="rnk-hero-post-chat" type="checkbox" checked />
            <span>Post result to chat</span>
          </label>
        </div>
      </div>
    </form>
  `;

  return new Promise((resolve) => {
    let completed = false;
    const finish = (value) => {
      if (completed) return;
      completed = true;
      resolve(value);
    };

    const dialog = new Dialog({
      title: `Hero Roll: ${actor.name}`,
      content,
      buttons: {
        roll: {
          label: `<i class="fas fa-dice-d20"></i> Spend & Roll`,
          callback: (html) => {
            const root = html instanceof HTMLElement ? html : html[0];
            const amtInput = root.querySelector("#rnk-hero-spend-amount");
            const amount = parseInt(amtInput?.value, 10);
            
            if (!Number.isInteger(amount) || amount < 1 || amount > maxSpend) {
              ui.notifications?.warn?.(`Enter a value between 1 and ${maxSpend}.`);
              return false;
            }

            const rollSelect = root.querySelector("#rnk-hero-roll-select");
            const rollValue = rollSelect?.value;
            const choice = optionMap.get(rollValue ?? "");
            if (!choice) {
              ui.notifications?.warn?.("Select a roll to apply the bonus to.");
              return false;
            }

            const modeInput = root.querySelector('input[name="rnk-roll-mode"]:checked');
            const modeValue = modeInput?.value || "normal";
            
            const postChatInput = root.querySelector("#rnk-hero-post-chat");
            const postChat = postChatInput?.checked ?? false;

            finish({
              points: amount,
              choice,
              rollMode: ["advantage", "disadvantage"].includes(modeValue) ? modeValue : "normal",
              postChat,
            });
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null),
        },
      },
      default: "roll",
      close: () => finish(null),
    }, { 
      jQuery: true,
      classes: ["dialog", "rnk-hero-dialog"] 
    });

    dialog.render(true);
  });
}

async function performSelectedRoll(actor, choice, rollMode) {
  if (!actor || !choice) throw new Error("Missing roll context");

  const advantage = rollMode === "advantage";
  const disadvantage = rollMode === "disadvantage";
  const rollOptions = {
    advantage,
    disadvantage,
    fastForward: true,
    skipRollDialog: true,
    dialog: false,
    event: {
      shiftKey: advantage,
      ctrlKey: disadvantage,
      metaKey: false,
      altKey: false,
    },
  };

  switch (choice.type) {
    case "ability-check":
      if (typeof actor.rollAbilityTest !== "function") throw new Error("Ability check rolling is unavailable for this actor.");
      return actor.rollAbilityTest(choice.key, rollOptions);
    case "ability-save":
      if (typeof actor.rollAbilitySave !== "function") throw new Error("Saving throw rolling is unavailable for this actor.");
      return actor.rollAbilitySave(choice.key, rollOptions);
    case "skill":
      if (typeof actor.rollSkill !== "function") throw new Error("Skill rolling is unavailable for this actor.");
      return actor.rollSkill(choice.key, rollOptions);
    case "tool":
      if (typeof actor.rollToolCheck !== "function") throw new Error("Tool checks are unavailable for this actor.");
      return actor.rollToolCheck(choice.key, rollOptions);
    case "item-attack": {
      const item = actor.items?.get?.(choice.itemId) ?? null;
      if (!item) throw new Error("The selected attack or spell is no longer available.");
      if (typeof item.rollAttack === "function") return item.rollAttack(rollOptions);
      if (typeof item.roll === "function") return item.roll(rollOptions);
      throw new Error("This item does not support rolling attacks in D&D5e.");
    }
    default:
      throw new Error(`Unsupported roll type: ${choice.type}`);
  }
}

export async function spendHeroPointsAndRoll(actor, { origin = "hero-hub" } = {}) {
  if (!actor) {
    ui.notifications?.warn?.("No actor available for hero point spend.");
    return false;
  }

  const heroData = await HeroPoints.get(actor).catch(() => null);
  const maxSpend = heroData?.current ?? 0;
  if (maxSpend <= 0) {
    ui.notifications?.warn?.(`${actor.name} has no hero points`);
    return false;
  }

  const selection = await promptSpendSelection(actor, maxSpend);
  if (!selection) return false;

  const { points, choice, rollMode, postChat } = selection;
  let spentApplied = false;

  try {
    const bonusData = await HeroPoints.computeHeroBonus(points, { includeRollObject: true });
    await HeroPoints.spend(actor, points);
    spentApplied = true;

    await HeroPoints.setPendingBonus(actor, bonusData.bonus, {
      points,
      formula: bonusData.formula,
      postChat,
      rollJSON: bonusData.roll ? bonusData.roll.toJSON() : null,
      label: choice.label,
      source: origin,
      rollType: choice.type,
      rollKey: choice.key,
      itemId: choice.itemId ?? null,
      actionType: choice.actionType ?? null,
      ability: choice.ability ?? null,
    });

    await performSelectedRoll(actor, choice, rollMode);

    ui.notifications?.info?.(`${actor.name} spends ${points} hero point(s) for +${bonusData.bonus}`);
    return true;
  } catch (err) {
    await HeroPoints.clearPendingBonus(actor).catch(() => {});
    if (spentApplied) {
      await HeroPoints.add(actor, points).catch(() => {});
    }
    logger.warn("Spend & roll flow failed", err);
    const errorMessage = err?.message ?? game.i18n.localize('rnk-hero-forge.notification.spendError');
    const notifyError = ui.notifications?.error;
    if (notifyError) notifyError(errorMessage || "Unable to resolve hero point spend.");
    return false;
  }
}

export class HeroHub extends ApplicationBase {
  static get defaultOptions() {
    return mergeOptions(super.defaultOptions, {
      id: "rnk-hero-hub",
      template: "modules/rnk-hero-forge/templates/hub.hbs",
      popOut: true,
      resizable: true,
      width: 640,
      height: 540,
      classes: ["rnk-hero-hub", "hero-hub-theme"],
    });
  }

  constructor(options = {}) {
    super(options);
    // Option to force showing only owned actors regardless of GM status.
    this.showOnlyOwned = !!options?.showOnlyOwned;
  }

  async getData() {
    const isGM = game.user.isGM;

    let actors;
    if (this.showOnlyOwned && !isGM) {
      actors = game.actors.contents.filter((a) => a.isOwner);
    } else if (isGM) {
      actors = game.actors.contents.filter((a) => (a.type === "character" || a.data?.type === "character" || a.hasPlayerOwner));
    } else {
      actors = game.actors.contents.filter((a) => a.isOwner);
    }

    function extractImageUrl(value) {
      if (!value || typeof value !== 'string') return null;
      let s = value.trim();
      // If it's an HTML fragment (e.g., '<img src="...">'), extract the src attribute
      const imgMatch = s.match(/<img\s+[^>]*src\s*=\s*(['\"])(.*?)\1/i);
      if (imgMatch && imgMatch[2]) return imgMatch[2];
      // handle unquoted src=src.jpg (less likely but possible)
      const imgMatch2 = s.match(/<img\s+[^>]*src\s*=\s*([^\s'>]+)/i);
      if (imgMatch2 && imgMatch2[1]) return imgMatch2[1];
      // if value itself is a URL or a paths to image: return it (strip dangerous characters)
      if (/\.(png|jpg|jpeg|svg|webp|gif|bmp)(\?.*)?$/i.test(s)) {
        return s.replace(/["'<>]/g, '').split('#')[0];
      }
      // Some bad imports set a full <img .../> into the actor.img field. Strip angle braces and return cleaned portion.
      s = s.replace(/[<>"']/g, '');
      if (s.includes('/') || s.includes(':')) return s;
      return null;
    }
    const list = await Promise.all(actors.map(async (a) => {
      const hp = await HeroPoints.get(a).catch(() => ({ max: 0, current: 0 }));
      const pending = await HeroPoints.getPendingBonus(a).catch(() => null);
      const rawImg = a.prototypeToken?.texture?.src || a.img || "icons/svg/mystery-man.svg";
      const parsedImg = extractImageUrl(rawImg);
      if (!parsedImg && rawImg) logger.warn("Actor image not valid or parseable", { actor: a.name, rawImg });
      const img = parsedImg || "icons/svg/mystery-man.svg";

      const max = Math.max(0, Number(hp.max) || 0);
      let current = Math.max(0, Number(hp.current) || 0);
      if (max > 0) current = Math.min(current, max);
      const percent = max > 0 ? Math.round((current / max) * 100) : 0;
      const players = Array.isArray(a.players) ? a.players.map((p) => p.name).filter(Boolean) : [];
      const ownerLabel = players.length ? `Owned by ${players.join(", ")}` : (a.hasPlayerOwner ? "Player controlled" : "GM only");
      const pendingBonus = Number(pending?.bonus) || 0;

      return {
        id: a.id,
        name: a.name,
        img,
        max,
        current,
        owned: a.isOwner,
        canEdit: game.user.isGM || a.isOwner,
        ownerLabel,
        fillPercent: Math.max(0, Math.min(100, percent)),
        isEmpty: current === 0,
        isAtCap: max > 0 && current >= max,
        pendingBonus,
      };
    }));

    const sorted = list.sort((a, b) => {
      if (a.isEmpty !== b.isEmpty) return a.isEmpty ? -1 : 1;
      if (a.isAtCap !== b.isAtCap) return a.isAtCap ? 1 : -1;
      return a.fillPercent === b.fillPercent ? a.name.localeCompare(b.name) : b.fillPercent - a.fillPercent;
    });

    const totals = sorted.reduce((acc, actor) => {
      acc.totalCurrent += actor.current;
      acc.totalMax += actor.max;
      if (actor.isEmpty) acc.zeroCount += 1;
      if (actor.isAtCap) acc.atCapCount += 1;
      return acc;
    }, { totalCurrent: 0, totalMax: 0, zeroCount: 0, atCapCount: 0 });
    totals.actorCount = sorted.length;
    totals.average = sorted.length ? Math.round((totals.totalCurrent / sorted.length) * 10) / 10 : 0;
    totals.percent = totals.totalMax > 0 ? Math.round((totals.totalCurrent / totals.totalMax) * 100) : 0;

    return {
      actors: sorted,
      isGM: game.user.isGM,
      totals,
      viewingOwnedOnly: this.showOnlyOwned && !isGM,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = html?.[0];
    if (!root) return;

    const getActorFromEvent = (event) => {
      const id = event?.currentTarget?.dataset?.actorId;
      return id ? game.actors.get(id) : null;
    };

    root.querySelectorAll('.action-add').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        const actor = getActorFromEvent(event);
        if (!actor) return;
        if (!game.user.isGM && !actor.isOwner) {
          ui.notifications.warn('You do not have permission to add hero points to this actor.');
          return;
        }
        await HeroPoints.add(actor, 1);
        this.render();
      });
    });

    root.querySelectorAll('.action-spend').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        const actor = getActorFromEvent(event);
        if (!actor) return;
        if (!game.user.isGM && !actor.isOwner) {
          ui.notifications.warn('You do not have permission to spend hero points for this actor.');
          return;
        }
        const success = await spendHeroPointsAndRoll(actor, { origin: "hero-hub" });
        if (success) this.render();
      });
    });

    root.querySelectorAll('.action-set-max').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        const actor = getActorFromEvent(event);
        if (!actor) return;
        if (!game.user.isGM && !actor.isOwner) {
          ui.notifications.warn(game.i18n.localize('rnk-hero-forge.permission.noEdit'));
          return;
        }
        new Dialog({
          title: `Set Max Hero Points — ${actor.name}`,
          content: `<p>Enter new max:</p><input id="hp-max" type="number" min="0" value="${actor.getFlag('rnk-hero-forge', 'heroPoints')?.max ?? 3}" />`,
          buttons: {
            ok: {
              label: "Set",
              callback: async (dlgHtml) => {
                const max = parseInt(dlgHtml.find('#hp-max').val(), 10) || 0;
                await HeroPoints.setMax(actor, max);
                this.render();
              },
            },
            cancel: { label: "Cancel" },
          },
        }).render(true);
      });
    });

    const grantAll = root.querySelector('.action-grant-all');
    if (grantAll) {
      grantAll.addEventListener('click', async () => {
        if (!game.user.isGM) {
          ui.notifications.warn(game.i18n.localize('rnk-hero-forge.permission.onlyGMGrant'));
          return;
        }
        const grant = game.settings.get('rnk-hero-forge', 'grantAmountPerLevel') || 1;
        const targets = game.actors.contents.filter((actor) => (actor.type === 'character' || actor.data?.type === 'character' || actor.hasPlayerOwner));
        for (const actor of targets) {
          // eslint-disable-next-line no-await-in-loop
          await HeroPoints.add(actor, grant);
        }
        ui.notifications.info(game.i18n.format('rnk-hero-forge.notification.granted', { grant, count: targets.length }));
        this.render();
      });
    }

    const filterButtons = Array.from(root.querySelectorAll('[data-hub-filter]'));
    const searchInput = root.querySelector('[data-hub-search]');
    const emptyState = root.querySelector('[data-empty-state="filters"]');

    const applyFilters = () => {
      const cards = root.querySelectorAll('.hero-card');
      if (cards.length === 0) {
        if (emptyState) emptyState.classList.add('hidden');
        return;
      }

      const filter = root.getAttribute('data-filter') || 'all';
      const query = (searchInput?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const name = (card.dataset.name || '').toLowerCase();
        const matchesSearch = !query || name.includes(query);
        let matchesFilter = true;
        if (filter === 'needs') matchesFilter = card.dataset.empty === 'true';
        else if (filter === 'full') matchesFilter = card.dataset.full === 'true';
        else if (filter === 'pending') matchesFilter = Number(card.dataset.pending || 0) > 0;
        const show = matchesSearch && matchesFilter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });
      if (emptyState) emptyState.classList.toggle('hidden', visible > 0);
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((btn) => btn.classList.remove('is-active'));
        button.classList.add('is-active');
        root.setAttribute('data-filter', button.dataset.hubFilter || 'all');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => applyFilters());
    }

    applyFilters();
  }
}
