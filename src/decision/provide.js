// Tier 3, provide: what she doesn't need now, to the nest for later. And
// pursuing what she perceives, which is also how hunger and thirst get eased.

import { FAGI, BRAIN, ATTENTION } from '../config.js';
import { verdict } from '../learned/rules.js';
import { labelOf } from '../i18n.js';
import { pct, reasonOf, pressing, pantryDone } from './common.js';
import { APPETITE } from '../config.js';
import { seekWaterNear } from './survive.js';
import { uselessNow } from '../appetite.js';
import { smellOnly } from '../percept.js';
import { judge } from './bite.js';

// Her verdict on a candidate, from what she perceives of it (percept.js).
const verdictOf = (fagi, scope, c) => (smellOnly(c)
  ? verdict(fagi, scope, c.key, { traits: c.cues ?? [], blind: true })
  : verdict(fagi, scope, c.key));

// What she's carrying goes to the nest. The only thing that pulls her off the path, without
// it getting pressing, is seeing water nearby while somewhat thirsty: drinking now, on the way,
// is cheaper than coming back later. Food doesn't divert her: she's already carrying one.
export function carry(fagi, world, ctx) {
  if (!fagi.carrying || !ctx.nest || pressing(ctx)) return null;
  const water = ctx.thirstU >= ATTENTION.opportunisticThirst
    && ctx.ranked.find((r) => r.kind === 'water' && r.via === 'sight' && r.score > BRAIN.minScore);
  if (water) {
    return {
      action: 'seekWater',
      reason: reasonOf('reason.detourWater', { thirst: pct(ctx.thirstU), what: labelOf(fagi.carrying.type) }),
      target: water.ref,
      targetKind: 'water',
      trailKey: null,
    };
  }
  return {
    action: 'carry',
    reason: reasonOf('reason.carry', { what: labelOf(fagi.carrying.type) }),
    target: ctx.nest,
    targetKind: 'nest',
  };
}

function useless(fagi, ctx, candidate) {
  return (candidate.kind === 'food' || candidate.kind === 'trail') && pantryDone(fagi, ctx);
}

// The best candidate among what she sees and smells, with hysteresis so she doesn't zigzag.
// She never chooses to pursue food she has already learned to avoid: if she did, the
// score (which knows nothing of rules, only belief+urgency+distance)
// could keep preferring it over anything else, and then she'd walk
// up to it, reject it on touching it, and pick it again the next
// frame because nothing else scores better: stuck next to the fruit forever.
export function pursue(fagi, world, ctx, dt, onlyKind = null) {
  const chosen = pickCandidate(fagi, ctx, onlyKind);
  if (!chosen) return null;

  fagi.memory = FAGI.memorySec;
  return intentToward(fagi, ctx, chosen);
}

function pickCandidate(fagi, ctx, onlyKind) {
  const { ranked } = ctx;
  const j = judge();
  const canPursue = (r) => !useless(fagi, ctx, r)
    && (r.kind !== 'food' || (j ? j.wants(fagi, r) : verdictOf(fagi, 'pursue', r) !== 'avoid' && !uselessNow(fagi, r.key)));
  // Her own trail leads to food (or so she believes): it counts when looking for food.
  const ofType = (r) => !onlyKind || r.kind === onlyKind || (onlyKind === 'food' && r.kind === 'trail');
  const available = ranked.filter((r) => ofType(r) && canPursue(r));
  // The list comes sorted from best to worst: the first one that passes the minimum is
  // the best one that passes the minimum.
  const first = available.find((r) => r.score > BRAIN.minScore);
  const current = fagi.target ? available.find((r) => r.ref === fagi.target) : null;

  // The hysteresis applies to the minimum too: what she's already pursuing isn't dropped
  // until it falls `stickiness` below it. Otherwise, a target hovering around the minimum
  // (the water she remembers, at mid distance) gets picked up and dropped every frame.
  let chosen = first;
  if (current && current.score > 0) {
    const holds = first ? current.score >= first.score - BRAIN.stickiness
      : current.score > BRAIN.minScore - BRAIN.stickiness;
    if (holds) chosen = current;
  }
  return chosen;
}

function intentToward(fagi, ctx, chosen) {
  // Her own trail: the next mark, moving away from the nest.
  if (chosen.kind === 'trail') {
    return {
      action: 'pheromone',
      reason: reasonOf('reason.pheromone'),
      target: chosen.ref,
      targetKind: 'phero',
      trailKey: null,
    };
  }

  // She smells it but can't see it: she doesn't know where it is, so she follows the trail.
  if (chosen.via === 'smell') {
    fagi.trailMemory = FAGI.trailMemory;
    return {
      action: 'track',
      reason: chosen.kind === 'water'
        ? reasonOf('reason.trackWater', { thirst: pct(ctx.thirstU) })
        : reasonOf('reason.trackFood', {
            what: labelOf(chosen.key),
            strength: `${Math.round((chosen.force ?? 0) * 100)}%`,
          }),
      target: chosen.ref,
      targetKind: 'scent',
      trailKey: chosen.key,
    };
  }

  if (chosen.kind === 'water') {
    return {
      action: 'seekWater',
      reason: reasonOf('reason.seekWater', {
        thirst: pct(ctx.thirstU),
        how: reasonOf(chosen.via === 'sight' ? 'water.sees' : 'water.remembers'),
        score: chosen.score.toFixed(2),
      }),
      target: chosen.ref,
      targetKind: 'water',
    };
  }

  return {
    action: 'seekFood',
    reason: reasonOf('reason.seekFood', { n: ctx.candidates.length, score: chosen.score.toFixed(2) }),
    target: chosen.ref,
    targetKind: 'food',
    trailKey: null,
  };
}

// Thirsty, not yet critical, and she has no idea where water is: she stops
// gathering and goes looking for it (appetite.js). Without this, a newborn
// carried fruit home for two minutes with her thirst rising and only started
// looking once it was critical, often already in the dark.
export function thirstSearch(fagi, world, ctx) {
  if (!APPETITE.enabled || fagi.carrying || pressing(ctx)) return null;
  if (ctx.thirstU < APPETITE.searchWater || ctx.thirstU < ctx.hungerU) return null;
  if (ctx.pool || ctx.ranked.some((c) => c.kind === 'water')) return null;
  const search = seekWaterNear(fagi, ctx);
  return { ...search, reason: reasonOf('reason.thirstSearch', { thirst: pct(ctx.thirstU) }) };
}
