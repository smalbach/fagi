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
// That hierarchy is no longer written here: it is her program (program.js), data
// she carries, one line per behavior, in order. She is born with it exactly as
// it used to stand in this file (INNATE). Here there is only whoever walks it:
// each line is tried in turn and the first that answers wins; with none, she
// explores.
//
// A behavior looks at the situation and returns an intention, or null if it's
// not its turn. They live in decision/, one file per tier (plus the API
// directive and what they all share). Adding one means its function there, its
// name in REPERTOIRE below and in BEHAVIORS (program.js), and its line in
// INNATE, in the tier it belongs to.
//
// An intention is: { action, reason, target, targetKind, trailKey }

import { notice, rethink } from './attention.js';
import { leaveWater, drink, eatCarriedFood, urgency, goToPantry, thermalReflex } from './decision/survive.js';
import { rest, seekShelter, anticipate, sleep, thermoregulate, dusk } from './decision/endure.js';
import { carry, pursue, thirstSearch } from './decision/provide.js';
import { persistOnScent, persistFromMemory } from './decision/clues.js';
import { earlyDirective, safeDirective } from './decision/directive.js';
import { exploreRule } from './decision/explore.js';
import { taste } from './decision/experiment.js';
import { sip, huddle, probe, line } from './decision/things.js';
import { zigzagTactic, patrolTactic, shelterRetreatTactic } from './decision/adaptive-tactics.js';
import { decideOn, decisionPoint, seenFood } from './decision/point.js';
import { BEHAVIORS, programOf, holds, rootOf } from './program.js';
import { watch, trialOf } from './program/watch.js';
import { imagine } from './program/imagine.js';
import { selectOn, selectByVotes } from './decision/select.js';
import { BASELINE, PROGRAM } from './config.js';

// Exported: the cortex uses it to know whether an external directive can
// afford to ignore the emergency, or whether instinct has to take over.
export { pressing } from './decision/common.js';

// The tiers in order, for whoever wants to draw the hierarchy.
export { TIERS } from './program.js';

// The function behind each behavior her program can name. Names, not the
// functions' own: the brain map shows which one answered, and a function's
// name gets lost when minifying.
export const REPERTOIRE = {
  swimOut: leaveWater, drink, sip, eatCarried: eatCarriedFood,
  directiveEarly: earlyDirective, thermalReflex, urgency, pantry: goToPantry,
  rest, sleep, huddle, thermal: thermoregulate, shelter: seekShelter, anticipate, dusk, shelterRetreat: shelterRetreatTactic,
  directive: safeDirective, line, carry, thirstSearch, pursue, patrol: patrolTactic,
  scent: persistOnScent, memory: persistFromMemory, zigzag: zigzagTactic,
  taste, probe,
};

// A program could name a behavior with nothing behind it, or a behavior could
// exist that no program can name: either way, the two lists disagree and
// nothing should run.
{
  const names = Object.keys(REPERTOIRE);
  const missing = BEHAVIORS.filter((b) => !names.includes(b));
  const unnamed = names.filter((b) => !BEHAVIORS.includes(b));
  if (missing.length || unnamed.length) {
    throw new Error(`decision.js: REPERTOIRE and BEHAVIORS differ (missing: ${missing.join(', ') || '-'}; unnamed: ${unnamed.join(', ') || '-'})`);
  }
}

// With the decision point on (DECIDE, decision/point.js): the reflexes common
// to every controller are these two tiers, then food in sight; after them the
// controller answers, and only if it has no opinion does the rest of the
// hierarchy.
const REFLEX_TIERS = new Set(['survive', 'endure']);

export function executeLine(l, fagi, world, ctx, dt) {
  if (l.chain && Array.isArray(l.chain) && l.chain.length > 0) {
    for (const step of l.chain) {
      const fn = REPERTOIRE[step];
      if (fn) {
        const intent = fn(fagi, world, ctx, dt);
        if (intent) return { intent, step };
      }
    }
    return null;
  }
  const fn = REPERTOIRE[l.do];
  if (!fn) return null;
  const intent = fn(fagi, world, ctx, dt);
  return intent ? { intent, step: l.do } : null;
}

export function decide(fagi, world, ctx, dt) {
  // What has just entered what she perceives (fagi.js checks it first, so that
  // the cortex hears about it too). The rules decide the same way every frame;
  // what's new gets noted as to whether that frame changed the plan or not.
  const newOnes = ctx.newOnes ?? notice(fagi, ctx);
  const before = { action: fagi.thought?.action ?? null, target: fagi.target };
  const walk = firstToAnswer(fagi, world, ctx, dt);
  // She watches her own program (program/watch.js): which line came to act and
  // what came of it, imagining the lines the walk passed over. Before anything
  // of this decision is applied, so what she imagines sees what the walk saw.
  if (PROGRAM.watch || PROGRAM.learn) {
    watch(fagi, ctx, dt, walk, (l) => imagine(fagi, (her) => {
      const res = executeLine(l, her, world, ctx, dt);
      return res ? res.intent : null;
    }));
  }
  const { intent, who } = walk;
  applySets(fagi, intent, before);
  rethink(fagi, newOnes, before, intent, ctx.ranked);
  fagi.thought = thought(fagi, ctx, intent, who, newOnes);
}

// Walks her program in order; the first line that answers wins. If none
// answers, explore. `who` says which line answered and the behavior it named;
// for the watch, `kind` ('line', 'none', or who else decided), the line that
// acted and its place and, during a trial, the line whose turn it took (`over`).
function firstToAnswer(fagi, world, ctx, dt) {
  // The random baseline (BASELINE.policy, scripts/evaluate.js) decides nothing.
  if (BASELINE.policy === 'random') return { intent: wander(fagi, world, dt), who: { tier: 'explore', rule: 'random' }, kind: 'random' };
  fagi.decided = null;
  // Free-flow (SELECT): the lines past the survival reflexes vote.
  if (selectOn()) {
    const voted = selectByVotes(fagi, world, ctx, dt, programOf(fagi).lines, { holds, executeLine });
    if (voted) return voted;
    return { intent: exploreRule(fagi, world, ctx), who: { tier: 'explore', rule: 'explore' }, kind: 'none', line: null, index: programOf(fagi).lines.length };
  }
  let asked = !decideOn();
  const trial = trialOf(fagi);
  const lines = programOf(fagi).lines;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // The controller is asked where the reflexes end, whether or not the
    // first line past them is live or holds now.
    if (!asked && !REFLEX_TIERS.has(l.tier)) {
      asked = true;
      const seen = seenFood(fagi, world, ctx, dt);
      if (seen) return { intent: seen, who: { tier: 'provide', rule: 'seen' }, kind: 'decide' };
      const decided = decisionPoint(fagi, world, ctx, dt);
      if (decided) return { ...decided, kind: 'decide' };
    }
    if (l.retired || !holds(l, fagi, ctx)) continue;
    // A trial (program/watch.js): another of her lines, from further down,
    // takes this one's turn, if it would act now.
    if (trial !== null && rootOf(l) === trial.root) {
      const by = lines.find((x) => x.id === trial.by);
      const res = by && executeLine(by, fagi, world, ctx, dt);
      if (res) return { intent: res.intent, who: { tier: by.tier, rule: res.step, line: by.id }, kind: 'line', line: by, index: i, over: l };
    }
    const res = executeLine(l, fagi, world, ctx, dt);
    if (res) return { intent: res.intent, who: { tier: l.tier, rule: res.step, line: l.id }, kind: 'line', line: l, index: i };
  }
  return { intent: exploreRule(fagi, world, ctx), who: { tier: 'explore', rule: 'explore' }, kind: 'none', line: null, index: lines.length };
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
    line: who.line ?? null,   // which line of her program answered (null: none did)
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
