// Tier 2, endure: without strength there's no surviving later. Rest and, if
// it's raining or about to rain, take cover.

import { FAGI, ENERGY, NEEDS, THIRST } from '../config.js';
import { rainAversion, pressureAversion } from '../weather.js';
import { pct, reasonOf, pressing } from './common.js';
import { habit } from '../habits.js';

// Without strength no work is worth anything: time to rest, preferably in the nest.
export function rest(fagi, world, ctx) {
  // Hunger and thirst kill; running out of energy doesn't. Even if she's dragging herself
  // (ENERGY.weakSpeed), tending to what's urgent comes before lying down.
  if (pressing(ctx)) return null;
  if (fagi.energy <= habit(fagi, 'restAt')) fagi.resting = true;
  if (fagi.resting && fagi.energy >= ENERGY.rested) fagi.resting = false;
  if (!fagi.resting) return null;

  if (ctx.inNest || !ctx.nest) {
    return {
      action: 'rest',
      reason: ctx.inNest
        ? reasonOf('reason.restInNest', { energy: pct(ctx.energyU) })
        : reasonOf('reason.restOutside'),
      target: null,
      targetKind: null,
    };
  }
  return {
    action: 'toNest',
    reason: reasonOf('reason.goRest', { energy: pct(ctx.energyU) }),
    target: ctx.nest,
    targetKind: 'nest',
  };
}

// What pulls her outside: whatever hunger or thirst she has. Sheltering
// competes with that; what's pressing, moreover, always wins (it comes earlier in RULES).
//
// And she feels her thirst rising: if waiting would make it critical before she reaches
// the water she remembers, she leaves now. Otherwise, with what she learned weighing more than
// any non-critical thirst, she'd stay until the limit and make the trip to the water
// already critical.
function jerk(fagi, ctx) {
  const pull = Math.max(ctx.thirstU, ctx.hungerU);
  if (!ctx.pool || THIRST.rate <= 0) return pull;
  const untilCritical = (NEEDS.critical * THIRST.max - fagi.thirst) / THIRST.rate;
  const journey = Math.hypot(ctx.pool.x - fagi.x, ctx.pool.y - fagi.y) / FAGI.speed;
  return untilCritical < journey * 1.5 + NEEDS.shelterMargin ? 1 : pull;
}

// Inside the nest she stays still; outside, she goes back to it.
function sheltered(ctx, reasonInside, reasonOutside) {
  if (ctx.inNest) {
    return { action: 'rest', reason: reasonOf(reasonInside), target: null, targetKind: null };
  }
  return { action: 'shelter', reason: reasonOf(reasonOutside), target: ctx.nest, targetKind: 'nest' };
}

// It's raining: take cover, if the urge beats what pulls her outside.
// The urge is a bit of instinct and, above all, what she learned getting wet
// (weather.js): the first time she carries on and pays for it; afterwards she shelters.
// She stays in the nest until it clears.
export function seekShelter(fagi, world, ctx) {
  if (!fagi.raining || !ctx.nest || pressing(ctx)) return null;
  if (rainAversion(fagi) <= jerk(fagi, ctx)) return null;
  return sheltered(ctx, 'reason.shelterIn', 'reason.shelter');
}

// She notices the pressure dropping. What that announces she has learned ('pressure', weather.js):
// if she already knows rain comes after it, she goes back to the nest before it falls.
export function anticipate(fagi, world, ctx) {
  if (!fagi.pressureFalling || !ctx.nest || pressing(ctx)) return null;
  if (pressureAversion(fagi) <= jerk(fagi, ctx)) return null;
  return sheltered(ctx, 'reason.pressureIn', 'reason.pressure');
}
