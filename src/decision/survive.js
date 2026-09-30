// Tier 1, survive now: ease hunger and thirst, which are what kill.

import { FAGI, BRAIN, CARRY, NEEDS, HUNGER, THIRST, THERMAL } from '../config.js';
import { statMult } from '../effects.js';
import { waterZone, shorePoint, radiusOf } from '../obstacles.js';
import { pct, reasonOf, pantryIntent, pressing } from './common.js';
import { pursue } from './provide.js';
import { habit } from '../habits.js';
import { canEat } from '../appetite.js';
import { judge, chewing } from './bite.js';

// Trapped in deep water: the first thing is to get out, by the nearest shore. It's
// instinct, not learned; what's learned is not to go in again (swim.js).
export function leaveWater(fagi, world) {
  const zone = waterZone(world, fagi.x, fagi.y);
  if (!zone?.deep) return null;
  const shore = shorePoint(zone.pool, radiusOf(zone.pool), fagi, -FAGI.radius);
  return {
    action: 'swimOut',
    reason: reasonOf('reason.swimOut'),
    target: { x: shore.x, y: shore.y },
    targetKind: 'shore',
    trailKey: null,
  };
}

// She's already in the water and still thirsty: she doesn't move from there.
export function drink(fagi, world, ctx) {
  if (!fagi.drinking || fagi.thirst <= 0) return null;
  return { action: 'drink', reason: reasonOf('reason.drinking', { thirst: pct(ctx.thirstU) }) };
}

function needAtRisk(fagi, ctx) {
  const risks = [];
  if (ctx.hungerU >= habit(fagi, 'hungerAt')) {
    const rate = HUNGER.rate * statMult(fagi, 'hungerRate');
    risks.push({ kind: 'food', seconds: rate > 0 ? (HUNGER.max - fagi.hunger) / rate : Infinity });
  }
  if (ctx.thirstU >= habit(fagi, 'thirstAt')) {
    risks.push({ kind: 'water', seconds: THIRST.rate > 0 ? (THIRST.max - fagi.thirst) / THIRST.rate : Infinity });
  }
  return risks.sort((a, b) => a.seconds - b.seconds)[0] ?? null;
}

// A ration she's already carrying is the closest resource possible.
export function eatCarriedFood(fagi) {
  if (!fagi.carrying || fagi.hunger < CARRY.eatBelow) return null;
  // Sick from the last bite, or still chewing: she keeps it for later (appetite.js).
  const j = judge();
  if (j ? chewing(fagi) || !j.carried(fagi, fagi.carrying.type) : !canEat(fagi, fagi.carrying.type)) return null;
  return {
    action: 'eatCarried',
    reason: reasonOf('reason.seekFood', { n: 1, score: '∞' }),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// With real hunger or thirst, tending to that comes before resting or working.
export function urgency(fagi, world, ctx, dt) {
  const risk = needAtRisk(fagi, ctx);
  if (!risk) return null;

  // The stores exist precisely so she doesn't bet her life chasing an
  // uncertain source when hunger is already critical.
  if (risk.kind === 'food') {
    const pantry = pantryIntent(fagi, ctx);
    if (pantry) return pantry;
  }
  const resource = pursue(fagi, world, ctx, dt, risk.kind);
  if (resource) return resource;

  if (risk.kind === 'water') return seekWaterNear(fagi, ctx);
  // For hunger we let it carry on: the next rule can use the pantry.
  return null;
}

// If she doesn't know where there's water, any food target is a fatal
// distraction: clear the target and search new ground until she finds it.
// First she goes back home and explores from there. Once in the nest, that trip back
// is done until she drinks: otherwise, stepping outside would send her back
// to the nest again, and she'd stay at the door coming and going until she died.
export function seekWaterNear(fagi, ctx) {
  if (ctx.inNest) fagi.homeSearched = true;
  if (ctx.nest && !ctx.inNest && !fagi.homeSearched) {
    return {
      action: 'searchWaterNearHome',
      reason: reasonOf('reason.explore'),
      target: ctx.nest,
      targetKind: 'nest',
      trailKey: null,
    };
  }
  return {
    action: 'explore',
    reason: reasonOf('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Hungry, with nothing in sight and with stores at home: go eat from them.
// It comes right after pursuing what she perceives, because it's the other way to
// ease hunger: that's what it was stored for.
export function goToPantry(fagi, world, ctx) {
  const reachableFood = ctx.ranked.some(
    (candidate) => candidate.kind === 'food' && candidate.score > BRAIN.minScore
  );
  if (!ctx.nest || ctx.inNest || reachableFood) return null;
  if (fagi.hunger < CARRY.eatBelow) return null;
  return pantryIntent(fagi, ctx);
}

// The body is about to give out to the cold or the heat: home, whatever pulls
// her outside. Innate, like leaving deep water; it lets go only once she is
// comfortable again, so she does not bounce at the threshold. What already
// kills sooner (critical hunger or thirst) still comes first.
//
// It goes off with the harm already done (THERMAL.reflex) or, before any, when
// her body reaches the temperature real ectotherms flee at (THERMAL.voluntary):
// well short of what kills, so there is still time to get home.
const tooFar = (fagi) => THERMAL.voluntary
  && (fagi.temperature >= THERMAL.voluntaryMax || fagi.temperature <= THERMAL.voluntaryMin);

export function thermalReflex(fagi, world, ctx) {
  if (!THERMAL.enabled || !THERMAL.behave || !ctx.nest) return null;
  if (fagi.thermalStress >= THERMAL.reflex * THERMAL.maxStress || tooFar(fagi)) fagi.warmingUp = true;
  else if (fagi.warmingUp && fagi.thermalStress <= 0 && !fagi.thermalFeel) fagi.warmingUp = false;
  if (!fagi.warmingUp || pressing(ctx)) return null;
  const params = { stress: pct(fagi.thermalStress / THERMAL.maxStress) };
  if (ctx.inNest) return { action: 'rest', reason: reasonOf('reason.reflexIn', params), target: null, targetKind: null };
  return { action: 'warmUp', reason: reasonOf('reason.reflex', params), target: ctx.nest, targetKind: 'nest', trailKey: null };
}
