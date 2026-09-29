// Tier 2, endure: without strength there's no surviving later. Rest, sleep at
// night and, if it's raining, about to rain, too cold or too hot, take cover.

import { FAGI, ENERGY, NEEDS, THIRST, SLEEP, THERMAL } from '../config.js';
import { rainAversion, pressureAversion } from '../weather.js';
import { thermalAversion, refugeBelief, duskAversion } from '../thermal.js';
import { energyMax } from '../biology.js';
import { pct, reasonOf, pressing } from './common.js';
import { habit } from '../habits.js';

// Without strength no work is worth anything: time to rest, preferably in the nest.
export function rest(fagi, world, ctx) {
  // Hunger and thirst kill; running out of energy doesn't. Even if she's dragging herself
  // (ENERGY.weakSpeed), tending to what's urgent comes before lying down.
  if (pressing(ctx)) return null;
  if (fagi.energy <= habit(fagi, 'restAt')) fagi.resting = true;
  // A body that holds less energy (biology.js) is rested sooner.
  if (fagi.resting && fagi.energy >= Math.min(ENERGY.rested, energyMax(fagi) * 0.95)) fagi.resting = false;
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
export function sheltered(ctx, reasonInside, reasonOutside, action = 'shelter', params = undefined) {
  if (ctx.inNest) {
    return { action: 'rest', reason: reasonOf(reasonInside, params), target: null, targetKind: null };
  }
  return { action, reason: reasonOf(reasonOutside, params), target: ctx.nest, targetKind: 'nest' };
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

// Sleep (sleep.js): in the dark, with enough pressure, she lies down, in the
// nest if she can get there. Exhausted, she sleeps whatever the hour. She
// wakes rested, or at daylight once the worst of it has gone.
// A diurnal body (SLEEP.nightly) goes home at dark whatever her pressure and
// stays asleep until daylight: the night is not hers. Only what presses (the
// check above) gets her up, and back to bed after.
export function sleep(fagi, world, ctx) {
  if (!SLEEP.enabled || pressing(ctx)) return null;
  const dark = Boolean(fagi.dark);
  const nightly = Boolean(SLEEP.nightly);
  if (!fagi.sleeping) {
    if (fagi.sleepPressure >= SLEEP.exhausted || (dark && (nightly || fagi.sleepPressure >= SLEEP.drowsy))) fagi.sleeping = true;
  } else if ((!nightly && fagi.sleepPressure <= SLEEP.wake) || (!dark && fagi.sleepPressure < SLEEP.drowsy / 2)) {
    fagi.sleeping = false;
  }
  if (!fagi.sleeping) return null;
  if (ctx.inNest || !ctx.nest) {
    return {
      action: 'rest',
      reason: reasonOf(ctx.inNest ? 'reason.sleepIn' : 'reason.sleepOutside', { sleep: pct(fagi.sleepPressure) }),
      target: null,
      targetKind: null,
    };
  }
  return {
    action: 'toSleep',
    reason: reasonOf('reason.goSleep', { sleep: pct(fagi.sleepPressure) }),
    target: ctx.nest,
    targetKind: 'nest',
  };
}

// Too cold or too hot, and she has learned the nest helps (thermal.js,
// 'refuge'): she goes to it if the urge beats what pulls her outside. Before
// she knows, she keeps going and pays for it; only the reflex (survive tier)
// takes her home.
export function thermoregulate(fagi, world, ctx) {
  const kind = fagi.thermalFeel;
  if (!THERMAL.behave || !kind || !ctx.nest || pressing(ctx)) return null;
  const refuge = refugeBelief(fagi);
  if (refuge <= 0) return null;
  if (thermalAversion(fagi, kind) + refuge <= jerk(fagi, ctx)) return null;
  const params = { temp: Math.round(fagi.temperature) };
  return kind === 'cold'
    ? sheltered(ctx, 'reason.coldIn', 'reason.cold', 'warmUp', params)
    : sheltered(ctx, 'reason.heatIn', 'reason.heat', 'coolDown', params);
}

// The light goes down. What that announces she has learned ('dusk',
// thermal.js): if the dark means cold to her, she is home before it bites.
export function dusk(fagi, world, ctx) {
  if (!THERMAL.behave || !fagi.dark || !ctx.nest || pressing(ctx)) return null;
  if (duskAversion(fagi) <= jerk(fagi, ctx)) return null;
  return sheltered(ctx, 'reason.duskIn', 'reason.dusk', 'toNest');
}
