# Runtime API

RNK Hero Forge exposes utility functions for macros and third-party modules via `game.rnk.heroPoints`. This reference summarises available helpers and provides usage examples.

## Accessing the API

```javascript
const heroPoints = game.rnk?.heroPoints;
if (!heroPoints) {
  ui.notifications?.error?.("RNK Hero Forge is not available.");
}
```

All helpers return promises because they interact with Foundry documents.

## Hero Point Helpers

| Function | Signature | Description |
| --- | --- | --- |
| `get(actor)` | `Promise<{ max: number, current: number }>` | Reads the hero point flag for the actor, seeding defaults if missing. |
| `set(actor, { max, current })` | `Promise` | Writes hero point data to the actor flag. |
| `add(actor, amount)` | `Promise` | Increments current hero points (clamped to max). |
| `spend(actor, amount)` | `Promise` | Decrements current hero points (throws if insufficient). |
| `setMax(actor, max)` | `Promise` | Updates the max while clamping current to the new ceiling. |
| `clear(actor)` | `Promise` | Removes the hero point flag entirely. |
| `computeHeroBonus(points, { includeRollObject })` | `Promise<{ bonus, formula, roll }>` | Calculates the hero bonus based on the current mode (`roll` or `flat`). When `includeRollObject` is true the returned object contains the evaluated `Roll`. |
| `setPendingBonus(actor, bonus, meta)` | `Promise` | Stores a pending bonus for the actor. `meta` can include `points`, `formula`, `postChat`, `rollJSON`, `label`, etc. |
| `getPendingBonus(actor)` | `Promise<{ bonus, meta } | null>` | Reads the pending bonus flag if present. |
| `clearPendingBonus(actor)` | `Promise` | Removes the pending bonus flag. |

### Example: Spending Hero Points in a Macro

```javascript
const actor = game.actors.getName("Aria");
const pointsToSpend = 2;

const { bonus, formula } = await heroPoints.computeHeroBonus(pointsToSpend, { includeRollObject: true });
await heroPoints.spend(actor, pointsToSpend);

await heroPoints.setPendingBonus(actor, bonus, {
  points: pointsToSpend,
  formula,
  postChat: true,
  source: "macro",
});

ui.notifications.info(`Queued +${bonus} (${formula}) for ${actor.name}.`);
```

## Hooks

- Listen for `rnk-hero-forge.applyHeroBonus` to react whenever a hero bonus is applied to a roll:

```javascript
Hooks.on("rnk-hero-forge.applyHeroBonus", ({ actor, points, bonus, roll, source }) => {
  console.log(`${actor.name} gained +${bonus} from hero points (${source}).`);
});
```

- Standard Foundry hooks (`updateSetting`, `canvasReady`, etc.) are leveraged internally but can also be re-used if you need to mirror overlay logic or trigger UI refreshes.

## Error Handling

- Functions throw descriptive `Error` objects when requirements are not met (for example, spending more points than available).
- Wrap calls in `try/catch` or attach `.catch()` to surface issues through notifications.

## Extending the API

Contributions can add additional helpers to `heroPoints.js` and export them through `game.rnk.heroPoints`. Ensure new methods remain promise-based to align with Foundry’s async document workflow.
