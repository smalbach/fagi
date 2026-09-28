// What Fagi does with what she perceives.
//
// There is ONE directive: survive. The rest come from it, in this order:
//
//   1. survive now           ease hunger and thirst, which are what kill
//   2. endure                without strength there's no surviving later: rest
//   3. provide               what she doesn't need now, to the nest for later
//   4. explore               with no need and the pantry stocked, knowing the
//                            map is the only thing that prepares the three above
//
// The list of rules below is that hierarchy written in order. Each one looks at
// the situation and returns an intention, or null if it's not its turn; the first
// one that answers wins. Adding a new behavior means adding a function to the list, in
// the tier it belongs to.
//
// An intention is: { action, reason, target, targetKind, trailKey }
//
// The rules live in decision/, one file per tier (plus the API
// directive and what they all share); here there's only the order and whoever walks it.

import { notice, rethink } from './attention.js';
import { leaveWater, drink, eatCarriedFood, urgency, goToPantry, thermalReflex } from './decision/survive.js';
import { rest, seekShelter, anticipate, sleep, thermoregulate, dusk } from './decision/endure.js';
import { carry, pursue, thirstSearch } from './decision/provide.js';
import { persistOnScent, persistFromMemory } from './decision/clues.js';
import { earlyDirective, safeDirective } from './decision/directive.js';
import { exploreRule } from './decision/explore.js';
import { taste } from './decision/experiment.js';
import { sip, huddle, probe } from './decision/things.js';
import { BASELINE } from './config.js';

// Exported: the cortex uses it to know whether an external directive can
// afford to ignore the emergency, or whether instinct has to take over.
export { pressing } from './decision/common.js';

// Each rule with its tier and a name: the brain map shows which one
// answered (the function name is no good, it gets lost when minifying).
const RULES = [
  // 1. survive now
  ['survive', 'swimOut', leaveWater],
  ['survive', 'drink', drink],
  ['survive', 'sip', sip],                        // CONCEPT only: a thing she believes has sap, nearer than water
  ['survive', 'eatCarried', eatCarriedFood],
  ['survive', 'directiveEarly', earlyDirective],   // only answers with BACKEND.authority === 1, and never if something presses that it doesn't handle
  ['survive', 'thermalReflex', thermalReflex],     // THERMAL only: stress about to kill
  ['survive', 'urgency', urgency],
  ['survive', 'pantry', goToPantry],
  // 2. endure
  ['endure', 'rest', rest],
  ['endure', 'sleep', sleep],                     // SLEEP only
  ['endure', 'huddle', huddle],                   // CONCEPT only: a thing she believes warm or cool, nearer than the nest
  ['endure', 'thermal', thermoregulate],          // THERMAL only, once she knows the nest helps
  ['endure', 'shelter', seekShelter],
  ['endure', 'anticipate', anticipate],
  ['endure', 'dusk', dusk],                       // CYCLE only, once the dark means cold to her
  // 3. provide
  ['provide', 'directive', safeDirective],     // only answers with BACKEND.authority === 0 (the default)
  ['provide', 'carry', carry],
  ['provide', 'thirstSearch', thirstSearch],   // only with APPETITE on
  ['provide', 'pursue', pursue],
  // clues of something she already perceived and lost, from the freshest to the oldest
  ['clues', 'scent', persistOnScent],
  ['clues', 'memory', persistFromMemory],
  // 4. explore: last night's questions come first (experiment.js)
  ['explore', 'taste', taste],
  ['explore', 'probe', probe],                    // CONCEPT only: touch, then nibble, a kind she has not figured out
];

// The tiers in order, for whoever wants to draw the hierarchy.
export const TIERS = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function decide(fagi, world, ctx, dt) {
  // What has just entered what she perceives (fagi.js checks it first, so that
  // the cortex hears about it too). The rules decide the same way every frame;
  // what's new gets noted as to whether that frame changed the plan or not.
  const newOnes = ctx.newOnes ?? notice(fagi, ctx);
  const before = { action: fagi.thought?.action ?? null, target: fagi.target };
  const { intent, who } = firstToAnswer(fagi, world, ctx, dt);
  applySets(fagi, intent, before);
  rethink(fagi, newOnes, before, intent, ctx.ranked);
  fagi.thought = thought(fagi, ctx, intent, who, newOnes);
}

// Walks RULES in order; the first one that answers wins. If none
// answers, explore.
function firstToAnswer(fagi, world, ctx, dt) {
  // The random baseline (BASELINE.policy, scripts/evaluate.js) decides nothing.
  if (BASELINE.policy === 'random') return { intent: wander(fagi, world, dt), who: { tier: 'explore', rule: 'random' } };
  for (const [tier, name, rule] of RULES) {
    const intent = rule(fagi, world, ctx, dt);
    if (intent) return { intent, who: { tier: tier, rule: name } };
  }
  return { intent: exploreRule(fagi, world, ctx), who: { tier: 'explore', rule: 'explore' } };
}

function applySets(fagi, intent, before) {
  // Keys the intention doesn't mention stay as they were: that way a
  // rule only has to talk about what it cares about.
  if ('target' in intent) fagi.target = intent.target;
  if ('targetKind' in intent) fagi.targetKind = intent.targetKind;
  if ('trailKey' in intent) fagi.trailKey = intent.trailKey;
  if (intent.action === 'explore') fagi.memory = 0;
  // Back to exploring after something else: the leg she left half done is neither
  // resumed nor dropped as a rule. While moving (movement.js/explore) she chooses between
  // it and whatever she sees now, with the same calculation.
  if (intent.action === 'explore' && before.action !== 'explore') fagi.exploreResume = true;
}

// What the rest (console, brain map, recording) reads from this decision.
function thought(fagi, ctx, intent, who, newOnes) {
  return {
    ...ctx,
    seesPoints: ctx.seen.length,
    smellsPoints: ctx.smelledOnes.length,
    seesWater: Boolean(ctx.visible),
    remembersWater: Boolean(ctx.waterPlace),
    carrying: fagi.carrying?.type ?? null,
    action: intent.action,
    reason: intent.reason,
    news: newOnes.map((c) => c.key),
    rethink: fagi.rethink,
    tier: who.tier,
    rule: who.rule,
  };
}

// The random baseline: a random point of the map, then another when she gets
// there or after a while. Drinking and eating what she touches happen anyway
// (needs.js, feeding.js): any animal would.
function wander(fagi, world, dt) {
  fagi.wanderFor = (fagi.wanderFor ?? 0) - dt;
  const w = fagi.wanderTo;
  if (!w || fagi.wanderFor <= 0 || Math.hypot(w.x - fagi.x, w.y - fagi.y) < 12) {
    fagi.wanderTo = { x: Math.random() * world.width, y: Math.random() * world.height };
    fagi.wanderFor = 20;
  }
  return { action: 'explore', reason: { key: 'reason.explore' }, target: fagi.wanderTo, targetKind: 'point', trailKey: null };
}
