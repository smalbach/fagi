// What the decision API (cortex.js) ordered, as one more rule. Depending on
// BACKEND.authority it goes into one of two places in RULES.

import { BACKEND } from '../config.js';
import { reasonOf, pressing, stillInWorld } from './common.js';

// What the decision API ordered, while it's still valid and its target (if
// it had one) still exists. It decides NOTHING on its own: it only translates
// fagi.directive into an intention, like any other rule.
function directive(fagi, world, ctx) {
  const d = fagi.directive;
  if (!d) return null;
  if (fagi.age >= d.until) { fagi.directive = null; return null; }
  if (d.target && !stillInWorld(world, d.target)) {
    fagi.directive = null;
    return null;
  }
  const isNestObj = ['toNest', 'pantry', 'carry'].includes(d.action);
  const target = d.target ?? (isNestObj ? ctx.nest : null);
  return {
    action: d.action,
    reason: d.reason ?? reasonOf('reason.api', { backend: d.source }),
    target,
    targetKind: d.target ? d.targetKind : (target ? 'nest' : null),
    trailKey: d.trailKey ?? null,
  };
}

// With full authority the directive goes first of all, unless her life
// depends on something it doesn't handle: then it steps aside and instinct takes over.
export function earlyDirective(fagi, world, ctx) {
  if (BACKEND.authority !== 1) return null;
  const d = fagi.directive;
  if (d && pressing(ctx) && d.targetKind !== 'food' && d.targetKind !== 'water') return null;
  return directive(fagi, world, ctx);
}

// With safe authority (the default) instinct covers what kills first:
// drinking, eating, urgency and the pantry. The directive only comes in afterwards,
// where resting/carrying/pursuing used to come in.
export function safeDirective(fagi, world, ctx) {
  return BACKEND.authority === 0 ? directive(fagi, world, ctx) : null;
}
