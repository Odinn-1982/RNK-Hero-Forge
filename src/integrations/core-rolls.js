import * as HeroPoints from "../heroPoints.js";
import { logger } from '../logger.js';

const MOD = "rnk-hero-forge";

function escapeHtml(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeImage(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  const quoted = trimmed.match(/<img\s+[^>]*src\s*=\s*(['"])(.*?)\1/i);
  if (quoted?.[2]) return quoted[2];
  const unquoted = trimmed.match(/<img\s+[^>]*src\s*=\s*([^\s'>]+)/i);
  if (unquoted?.[1]) return unquoted[1];
  if (/\.(png|jpg|jpeg|svg|webp|gif|bmp)(\?.*)?$/i.test(trimmed)) {
    return trimmed.replace(/["'<>]/g, "").split("#")[0];
  }
  const cleaned = trimmed.replace(/["'<>]/g, "");
  if (cleaned.includes("/") || cleaned.includes(":")) return cleaned;
  return null;
}

function resolveActorFromRollConfig(config = {}) {
  if (config.actor) return config.actor;
  const speaker = config.speaker ?? {};
  if (speaker.actor) {
    const doc = game.actors?.get(speaker.actor);
    if (doc) return doc;
  }
  if (speaker.token && canvas?.tokens) {
    const token = canvas.tokens.get(speaker.token);
    if (token?.actor) return token.actor;
  }
  return null;
}

function shouldPromptForHeroPoints(actor, rollConfig = {}, options = {}) {
  if (!actor) return false;
  if (!actor.isOwner && !game.user.isGM) return false;
  const fastForward = options?.fastForward ?? rollConfig?.fastForward ?? rollConfig?.config?.fastForward;
  if (fastForward) return false;
  const skip = rollConfig?.flags?.[MOD]?.skipPrompt;
  return !skip;
}

function readInput(html, selector) {
  if (!html) return { value: null, checked: false };
  if (typeof html.find === "function") {
    const jq = html.find(selector);
    if (jq?.length) {
      return {
        value: jq.val?.() ?? null,
        checked: jq.is?.(":checked") ?? false,
      };
    }
  }
  const root = html instanceof HTMLElement ? html : html?.[0] ?? null;
  const element = root?.querySelector?.(selector) ?? null;
  if (element instanceof HTMLInputElement) {
    return { value: element.value, checked: element.checked };
  }
  return { value: null, checked: false };
}

async function promptHeroPointSpend(actor, rollConfig = {}) {
  const heroPoints = await HeroPoints.get(actor).catch(() => null);
  if (!heroPoints || heroPoints.current <= 0) return null;

  const label = rollConfig?.title || rollConfig?.flavor || rollConfig?.abilityId || "d20 Roll";
  const defaultAmount = Math.min(heroPoints.current, 1);

  return new Promise((resolve) => {
    let completed = false;
    const finish = (value) => {
      if (completed) return;
      completed = true;
      resolve(value);
    };

    const content = `
      <form class="rnk-hero-dialog">
        <p>${actor.name} has <strong>${heroPoints.current}/${heroPoints.max}</strong> hero point(s).</p>
        <p>Spend hero points on <strong>${escapeHtml(label)}</strong>?</p>
        <div class="form-group">
          <label for="rnk-hero-amount">Points to spend (0-${heroPoints.current})</label>
          <input id="rnk-hero-amount" type="number" min="0" max="${heroPoints.current}" value="${defaultAmount}" />
        </div>
        <div class="form-group">
          <label><input id="rnk-hero-post" type="checkbox" checked /> Post chat summary</label>
        </div>
      </form>
    `;

    const dialog = new Dialog({
      title: `Hero Points — ${actor.name}`,
      content,
      buttons: {
        spend: {
          label: "Apply",
          callback: (html) => {
            const amountData = readInput(html, "#rnk-hero-amount");
            const rawAmount = parseInt(amountData.value, 10) || 0;
            if (rawAmount <= 0) {
              finish(null);
              return;
            }

            (async () => {
              try {
                await HeroPoints.spend(actor, rawAmount);
              } catch (err) {
                ui.notifications?.error?.(err.message ?? "Unable to spend hero points");
                finish(null);
                return;
              }

              const { bonus, formula, roll } = await HeroPoints.computeHeroBonus(rawAmount, { includeRollObject: true });

              const postChat = readInput(html, "#rnk-hero-post").checked;
              finish({
                points: rawAmount,
                bonus,
                formula,
                postChat,
                pending: false,
                rollJSON: roll ? roll.toJSON() : null,
              });
            })();
          },
        },
        skip: {
          label: "Skip",
          callback: () => finish(null),
        },
      },
      default: defaultAmount > 0 ? "spend" : "skip",
      close: () => finish(null),
    },
    { jQuery: true });

    dialog.render(true);
  });
}

async function postHeroSpendChat(actor, { points, bonus, formula, origin }) {
  const rawImg = actor?.prototypeToken?.texture?.src || actor?.img || "icons/svg/mystery-man.svg";
  const speakerImg = sanitizeImage(rawImg) || "icons/svg/mystery-man.svg";

  const content = await foundry.applications.handlebars.renderTemplate(
    "modules/rnk-hero-forge/templates/hero-spend-chat.hbs",
    {
      speakerImg,
      speakerName: actor.name,
      actorId: actor.id,
      points,
      isOne: points === 1,
      formula,
      bonus,
    },
  );

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    flags: {
      [MOD]: {
        heroBonus: bonus,
        heroSpent: points,
        origin: origin ?? "prompt",
      },
    },
  });
}

function normalizeRollArguments(args) {
  const out = Array.from(args ?? []);

  if (!out.length) {
    out.push({}, {});
  } else if (typeof out[0] !== "object" || Array.isArray(out[0])) {
    // Legacy signature: (parts, data, options)
    const parts = Array.isArray(out[0]) ? [...out[0]] : [out[0]];
    const data = typeof out[1] === "object" ? out[1] : {};
    const options = typeof out[2] === "object" ? out[2] : {};
    const config = foundry.utils.mergeObject({}, options, { inplace: false, recursive: true });
    config.parts = parts;
    config.data = data;
    out.splice(0, out.length, config, options);
  } else if (out.length === 1) {
    out.push({});
  } else if (typeof out[1] !== "object") {
    out[1] = {};
  }

  const config = out[0];
  const options = out[1];
  if (config && options) {
    if (!config.actor) {
      config.actor = options.actor ?? options.entity ?? (config?.speaker?.actor ? game.actors?.get(config.speaker.actor) : undefined);
    }
    config.speaker = config.speaker ?? options.speaker ?? (config.actor ? ChatMessage.getSpeaker({ actor: config.actor }) : config.speaker);
  }

  return out;
}

function applyBonusToRollResult(roll, bonus) {
  if (!roll || !bonus) return;
  const NumericTerm = foundry.dice?.terms?.NumericTerm ?? CONFIG?.Dice?.terms?.NumericTerm;
  if (NumericTerm && Array.isArray(roll.terms)) {
    const term = new NumericTerm({ number: bonus, options: { flavor: "Hero Points" } });
    roll.terms.push(term);
  }

  if (typeof roll._total === "number") roll._total += bonus; else roll._total = (roll.total ?? 0) + bonus;
  if (typeof roll.total === "number") roll.total += bonus; else roll.total = roll._total;
  roll._evaluated = true;

  const formula = roll.formula || roll._formula;
  if (formula) {
    roll._formula = roll.formula = `${formula} + ${bonus}`;
  }

  const result = roll.result || roll._result;
  if (typeof result === "string" && result.length) {
    roll._result = roll.result = `${result} + ${bonus}`;
  }
}

function mergeRolls(primary, bonus) {
  if (!primary || !bonus) return;
  if (!Array.isArray(primary.terms) || !Array.isArray(bonus.terms)) return;

  primary.terms.push(...bonus.terms);

  if (Array.isArray(primary._dice) && Array.isArray(bonus._dice)) {
    primary._dice.push(...bonus._dice);
  }

  const totalBonus = Number(bonus.total) || 0;
  primary._total = (primary._total ?? primary.total ?? 0) + totalBonus;
  primary.total = (primary.total ?? 0) + totalBonus;
  primary._evaluated = true;

  const primaryFormula = primary.formula || primary._formula || "";
  const bonusFormula = bonus.formula || bonus._formula || "";
  const combinedFormula = primaryFormula && bonusFormula ? `${primaryFormula} + (${bonusFormula})` : (primaryFormula || bonusFormula);
  primary._formula = primary.formula = combinedFormula;

  const primaryResult = primary.result || primary._result || "";
  const bonusResult = bonus.result || bonus._result || "";
  if (primaryResult && bonusResult) {
    primary._result = primary.result = `${primaryResult} + ${bonusResult}`;
  }
}

async function executeHeroD20Roll(base, context, originalArgs) {
  const args = normalizeRollArguments(originalArgs);
  const [config, options] = args;

  let applied = null;
  let heroRoll = null;
  const actor = resolveActorFromRollConfig(config);

  logger.debug("d20Roll intercepted", { actor: actor?.name, config, options });

  if (actor) {
    const pending = await HeroPoints.getPendingBonus(actor);
    if (pending?.bonus) {
      applied = {
        bonus: pending.bonus,
        points: pending.meta?.points ?? pending.meta?.spent ?? 0,
        formula: pending.meta?.formula ?? null,
        postChat: pending.meta?.postChat ?? false,
        pending: true,
        rollJSON: pending.meta?.rollJSON ?? null,
        label: pending.meta?.label ?? null,
      };
      await HeroPoints.clearPendingBonus(actor);
      const label = applied.label ? `${applied.label}` : "pending";
      ui.notifications?.info?.(game.i18n.format('rnk-hero-forge.notification.applied', { name: actor.name, bonus: pending.bonus, label }));
    } else if (shouldPromptForHeroPoints(actor, config, options)) {
      applied = await promptHeroPointSpend(actor, config);
    }
  }

  if (applied?.bonus) {
    if (!heroRoll && applied.rollJSON) {
      try {
        heroRoll = await Roll.fromJSON(JSON.stringify(applied.rollJSON));
      } catch (err) {
        logger.warn("Failed to hydrate hero roll from stored JSON", err, applied.rollJSON);
      }
    }

    if (!heroRoll && !applied.pending) {
      const bonusData = await HeroPoints.computeHeroBonus(applied.points ?? 0, { includeRollObject: true });
      heroRoll = bonusData.roll;
      applied.formula = bonusData.formula;
      applied.bonus = bonusData.bonus;
      if (heroRoll) {
        applied.rollJSON = heroRoll.toJSON();
      }
    }

    config.messageData = config.messageData ?? {};
    config.messageData.flags = foundry.utils.mergeObject(config.messageData.flags ?? {}, {
      [MOD]: {
        heroBonus: (config.messageData.flags?.[MOD]?.heroBonus || 0) + applied.bonus,
        heroSpent: (config.messageData.flags?.[MOD]?.heroSpent || 0) + (applied.points || 0),
        heroFormula: applied.formula ?? null,
        heroSource: applied.pending ? "pending" : "prompt",
        heroPostChat: applied.postChat ?? false,
        heroTarget: applied.label ?? config.messageData.flags?.[MOD]?.heroTarget ?? null,
      },
    }, { inplace: false, recursive: false });

    const flavor = config.flavor ?? config.title;
    const heroFlavor = `Hero Points +${applied.bonus}`;
    config.flavor = flavor ? `${flavor} (${heroFlavor})` : heroFlavor;
  }

  const roll = await base.apply(context, args);

  if (applied?.bonus && roll) {
    if (heroRoll) {
      mergeRolls(roll, heroRoll);
    } else {
      applyBonusToRollResult(roll, applied.bonus);
    }

    roll.options = roll.options ?? {};
    roll.options[MOD] = {
      ...(roll.options[MOD] ?? {}),
      heroBonus: (roll.options[MOD]?.heroBonus || 0) + applied.bonus,
      heroSpent: (roll.options[MOD]?.heroSpent || 0) + (applied.points || 0),
      heroFormula: applied.formula ?? null,
      heroSource: applied.pending ? "pending" : "prompt",
      heroBonusRollJSON: heroRoll ? heroRoll.toJSON() : (applied.rollJSON ?? null),
      heroTarget: applied.label ?? roll.options[MOD]?.heroTarget ?? null,
    };

    Hooks.callAll("rnk-hero-forge.applyHeroBonus", {
      actor,
      points: applied.points ?? 0,
      bonus: applied.bonus,
      roll,
      source: applied.pending ? "pending" : "prompt",
      target: applied.label ?? null,
    });

    if (!applied.pending && applied.points) {
      ui.notifications?.info?.(`${actor.name} spends ${applied.points} hero point(s) for +${applied.bonus}`);
    }
  }

  if (applied?.postChat && actor && applied.points) {
    await postHeroSpendChat(actor, {
      points: applied.points,
      bonus: applied.bonus,
      formula: applied.formula,
      origin: applied.pending ? "pending" : "prompt",
    });
  }

  return roll;
}

function wrapD20Roll(target, key) {
  if (!target) return false;
  const base = target[key];
  if (typeof base !== "function") return false;
  if (base.__rnkHeroForgeWrapped) return true;

  const wrapped = async function rnkHeroForgeWrappedD20Roll(...args) {
    logger.debug(`invoking wrapped ${key}`);
    return executeHeroD20Roll(base, this, args);
  };

  wrapped.__rnkHeroForgeWrapped = true;
  wrapped.__rnkHeroForgeOriginal = base;
  target[key] = wrapped;
  logger.log(`Wrapped d20Roll on`, target, key);
  return true;
}

export function registerCoreRollIntegration() {
  if (game.system?.id !== "dnd5e") return;

  const candidates = [
    { target: game?.dnd5e, key: "d20Roll" },
    { target: game?.dnd5e?.dice, key: "d20Roll" },
    { target: CONFIG?.DND5E, key: "d20Roll" },
    { target: CONFIG?.DND5E?.dice, key: "d20Roll" },
  ];

  let wrappedAny = false;
  for (const candidate of candidates) {
    wrappedAny = wrapD20Roll(candidate.target, candidate.key) || wrappedAny;
  }

  if (!wrappedAny) {
    logger.warn("Unable to wrap DND5E d20Roll entry point; hero point dialog will not appear.");
  } else {
    logger.log("Core roll integration active (wrapped d20Roll). Suggestions?", { wrappedAny });
  }

  Hooks.on("preCreateChatMessage", async (chatData) => {
    try {
      const hasRollPayload = !!(
        chatData?.roll ||
        chatData?.flags?.core?.roll ||
        chatData?.flags?.dnd5e?.roll
      );
      if (!hasRollPayload) return true;

      const heroFlags = chatData.flags?.[MOD];
      if (heroFlags?.heroBonus > 0) {
        chatData.content = `${chatData.content || ""}<div class="rnk-hero-attached">+${heroFlags.heroBonus} (hero)</div>`;

        const bonus = heroFlags.heroBonus;
        const storedHeroRoll = heroFlags.heroBonusRollJSON;

        const mergeSerialized = async (raw, idx = 0) => {
          if (!raw) return raw;
          try {
            const isString = typeof raw === "string";
            const json = isString ? raw : JSON.stringify(raw);
            const baseRoll = await Roll.fromJSON(json);
            if (storedHeroRoll) {
              const hero = await Roll.fromJSON(JSON.stringify(storedHeroRoll));
              mergeRolls(baseRoll, hero);
            } else {
              applyBonusToRollResult(baseRoll, bonus);
            }
            const serialized = baseRoll.toJSON();
            if (idx === 0) {
              chatData.flags[MOD].heroTotal = baseRoll.total;
            }
            return isString ? JSON.stringify(serialized) : serialized;
          } catch (err) {
            logger.warn("failed to augment roll JSON", err, raw);
            return raw;
          }
        };

        if (Array.isArray(chatData.rolls) && chatData.rolls.length) {
          for (let i = 0; i < chatData.rolls.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            chatData.rolls[i] = await mergeSerialized(chatData.rolls[i], i);
          }
          if (!chatData.roll && chatData.rolls[0]) {
            chatData.roll = typeof chatData.rolls[0] === "string"
              ? chatData.rolls[0]
              : JSON.stringify(chatData.rolls[0]);
          }
        } else if (chatData.roll) {
          chatData.roll = await mergeSerialized(chatData.roll, 0);
        }
      }
    } catch (err) {
      logger.warn("preCreateChatMessage failed", err);
    }
    return true;
  });
}
