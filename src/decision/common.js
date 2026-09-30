// What the rules in decision.js share: how a reason is written, when
// what kills is pressing, and the questions several tiers ask.

import { NEEDS, CARRY } from '../config.js';
import { habit } from '../habits.js';
import { verdict } from '../learned/rules.js';
import { canEat } from '../appetite.js';
import { pantryEstimate } from '../larder.js';
import { judge } from './bite.js';

export const pct = (u) => `${Math.round(u * 100)}%`;

// Reasons are stored as key + data, never as a ready-made sentence: that way the
// console can write them in whatever language is set at the moment.
export const reasonOf = (key, params) => ({ key, params });

// Hunger or thirst are already critical. decision.js re-exports it for the cortex.
export const pressing = (ctx) => Math.max(ctx.thirstU, ctx.hungerU) >= NEEDS.critical;

// What she had spotted (a food point or a map object) is still there.
export const stillInWorld = (world, ref) => world.points.includes(ref) || world.objects.includes(ref);

// Food that can be neither eaten nor stored: with the pantry stocked and no
// hunger, chasing it leads nowhere. It's exactly the case where
// she used to end up orbiting a fruit she could no longer pick up.
export function pantryDone(fagi, ctx) {
  if (fagi.hunger >= CARRY.eatBelow || fagi.carrying) return false;
  return Boolean(ctx.nest) && pantryEstimate(fagi) >= habit(fagi, 'reserve');
}

export function pantryIntent(fagi, ctx) {
  if (!ctx.nest || ctx.inNest) return null;
  // What she believes she has stored. If she's wrong, she finds out on arrival: entering
  // the nest rewrites fagi.pantry and the next decision is already the right one.
  // The same test the nest applies when she is inside (nest.js useNest), or
  // she walks in, finds nothing she can eat, walks out and is sent back.
  // With the bite point on (bite.js), what she believes is there is worth the trip if her judge would take one.
  const j = judge();
  const has = j
    ? j.pantry(fagi, Object.keys(fagi.pantry).filter((k) => fagi.pantry[k] > 0)) != null
    : Object.entries(fagi.pantry).some(
      ([type, amount]) => amount > 0 && verdict(fagi, 'eat', type) !== 'avoid' && canEat(fagi, type)
    );
  if (!has) return null;
  return {
    action: 'pantry',
    reason: reasonOf('reason.pantry', { hunger: pct(ctx.hungerU) }),
    target: ctx.nest,
    targetKind: 'nest',
    trailKey: null,
  };
}
