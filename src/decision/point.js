// The decision point (DECIDE, docs/research/plan-decision-adaptativa.md,
// step 1b): where a controller, not the fixed hierarchy, says what she goes
// after.
//
// Measured before it (research/adaptive-decision/baseline.md): the learned
// choice (choice.js) made a plan, but only offered its site to the hierarchy
// as one more candidate, and the hierarchy took her there ~5% of the plan's
// time: a smell, something in sight or plain exploring won instead. Whatever
// a controller learned, it decided little of what she did.
//
// With DECIDE on, decision.js walks the reflexes first — they stay common to
// every controller and may replace its choice:
//   survive  all of it (deep water, drinking, critical hunger and thirst, the pantry, lethal heat or cold)
//   endure   all of it (rest when spent, sleep, shelter, the dusk)
//   seen     food she SEES and would eat, while she wants food: eating is
//            the common feeding mechanism, not a choice between places
// and then asks the controller. Its answer is an option, executed here the
// same way whoever chose it:
//   { kind: 'site', id }   back to one of the sites she remembers (sites.js)
//   { kind: 'explore' }    search: follow a smell or her trail, else new ground
//   { kind: 'water' }      the water she knows
//   { kind: 'nest' }       home
//   { kind: 'rest' }       stay still (in the nest if she is in it)
// or null: no opinion, and the rest of the hierarchy answers as always. The
// executed option is the rule 'decide.<kind>' in her thought, so whoever
// watches can tell what the controller decided from what a reflex did.
//
// Controllers register by name (register); DECIDE.controller picks one.
// 'choice' is the learned choice as it is, connected here: it answers only
// while it has a plan and she is after food. It knows nothing of water: when
// her thirst pulls harder than her want of food it has no opinion, and the
// hierarchy weighs water against food as it always did.

import { DECIDE } from '../config.js';
import { reasonOf, pantryDone } from './common.js';
import { pursue } from './provide.js';
import { persistOnScent } from './clues.js';
import { exploreRule } from './explore.js';
import { activePlan, foodDrive } from '../choice.js';

const CONTROLLERS = {
  choice: (fagi, world, ctx) => {
    const plan = activePlan(fagi);
    if (!plan || ctx.thirstU > foodDrive(fagi)) return null;
    return plan.kind === 'site' ? { kind: 'site', id: plan.id } : { kind: 'explore' };
  },
};

export function register(name, controller) {
  CONTROLLERS[name] = controller;
}

export const decideOn = () => Boolean(DECIDE.enabled);

// Reflex: food in sight she would go for, while she wants it.
export function seenFood(fagi, world, ctx, dt) {
  if (fagi.carrying || pantryDone(fagi, ctx)) return null;
  const seen = ctx.ranked.filter((r) => r.kind === 'food' && r.via === 'sight' && !r.source);
  if (!seen.length) return null;
  return pursue(fagi, world, { ...ctx, ranked: seen }, dt);
}

// The controller's answer, executed; null if it has none or it can't be done.
export function decisionPoint(fagi, world, ctx, dt) {
  const controller = CONTROLLERS[DECIDE.controller];
  if (!controller) throw new Error(`DECIDE.controller: unknown controller ${DECIDE.controller}`);
  const option = controller(fagi, world, ctx, dt);
  if (!option) return null;
  const intent = execute(fagi, world, ctx, dt, option);
  if (!intent) return null;
  fagi.decided = option;
  return { intent, who: { tier: 'decide', rule: option.kind } };
}

function execute(fagi, world, ctx, dt, option) {
  switch (option.kind) {
    case 'site': {
      const site = (fagi.brain.sites ?? []).find((s) => s.id === option.id);
      if (!site) return null;
      return { action: 'seekFood', reason: reasonOf('reason.decideSite'), target: site, targetKind: 'food', trailKey: null };
    }
    case 'explore': {
      // Searching is what the senses offer that isn't a remembered place.
      const scent = persistOnScent(fagi, world, ctx, dt);
      if (scent) return scent;
      const clues = ctx.ranked.filter((r) => r.kind === 'food' ? r.via === 'smell' && !r.source : r.kind === 'trail');
      const follow = clues.length ? pursue(fagi, world, { ...ctx, ranked: clues }, dt) : null;
      return follow ?? { ...exploreRule(fagi, world, ctx), reason: reasonOf('reason.decideExplore') };
    }
    case 'water':
      return ctx.pool ? { action: 'seekWater', reason: reasonOf('reason.decideWater'), target: ctx.pool, targetKind: 'water', trailKey: null } : null;
    case 'nest':
      return ctx.nest ? { action: 'toNest', reason: reasonOf('reason.decideNest'), target: ctx.nest, targetKind: 'nest', trailKey: null } : null;
    case 'rest':
      return { action: 'rest', reason: reasonOf('reason.decideRest'), target: null, targetKind: null, trailKey: null };
    default:
      throw new Error(`decision point: unknown option ${option.kind}`);
  }
}
