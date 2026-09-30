// The bite point (DECIDE.eat, docs/research/plan-decision-adaptativa.md,
// revision 1): who judges a fruit — eat it, take a trial bite, carry it home
// or leave it — and which ration to take from the nest.
//
// Everything else about eating stays common to every judge: what a bite does
// to the body and what she feels after it (feeding.js, episodes.js), how long
// a bite takes to handle (APPETITE.handling), that she eats from the nest only
// when hungry (CARRY.eatBelow) and carries one thing at a time.
//
// A judge answers four questions:
//   ground(fagi, p)       touching fruit p: 'eat' | 'taste' | 'carry' | 'leave'
//   pantry(fagi, keys)    hungry in the nest, rations of `keys` there: which one, or null
//   carried(fagi, key)    hungry, carrying `key`: eat it now?
//   wants(fagi, c)        a food candidate (perception.js): worth going to?
//
// 'current' is how she has always judged (verdicts, curiosity, appetite, the
// night's questions), moved here unchanged: with it the episodes are the same
// ones as with the bite point off. Research registers the others.

import { DECIDE, CARRY, APPETITE } from '../config.js';
import { verdict } from '../learned/rules.js';
import { canEat, aversive, uselessNow } from '../appetite.js';
import { habit } from '../habits.js';
import { onAgenda } from '../experiment.js';
import { pantryEstimate, roomAtHome } from '../larder.js';
import { weight } from '../memory.js';
import { smellOnly } from '../percept.js';

const verdictOf = (fagi, scope, c) => (smellOnly(c)
  ? verdict(fagi, scope, c.key, { traits: c.cues ?? [], blind: true })
  : verdict(fagi, scope, c.key));

export const current = {
  ground(fagi, p) {
    // She doesn't accidentally eat or pick up something she has already learned is harmful.
    // She only tries it again when it was her deliberate target (curiosity).
    if (verdict(fagi, 'eat', p.type, { deliberate: fagi.target === p }) === 'avoid') return 'leave';
    // A fruit she has never tasted may be eaten sooner than carried (habits.js).
    const tasted = (fagi.brain.facts[p.type]?.tries ?? 0) > 0;
    const hungry = fagi.hunger >= (tasted ? CARRY.eatBelow : habit(fagi, 'tasteAt'));
    const mayEat = canEat(fagi, p.type);
    // One of last night's questions, and she came for it: a trial bite.
    if (fagi.target === p && mayEat && fagi.thought?.action === 'taste' && onAgenda(fagi, p.type)) return 'taste';
    if (hungry && mayEat) return 'eat';
    // Filling the pantry with what she believes is bad is not curiosity.
    if (verdict(fagi, 'store', p.type) === 'avoid') return 'leave';
    if (!fagi.carrying && !p.refuse && pantryEstimate(fagi) < habit(fagi, 'reserve') && roomAtHome(fagi) && !aversive(fagi, p.type)) return 'carry';
    return 'leave';
  },
  pantry(fagi, keys) {
    // What she remembers best of what's stored, never what she learned disagrees with her.
    const ok = keys.filter((k) => verdict(fagi, 'eat', k) !== 'avoid' && canEat(fagi, k));
    return ok.length ? ok.reduce((a, b) => (weight(fagi.brain, b) > weight(fagi.brain, a) ? b : a)) : null;
  },
  carried: (fagi, key) => canEat(fagi, key),
  wants: (fagi, c) => verdictOf(fagi, 'pursue', c) !== 'avoid' && !uselessNow(fagi, c.key),
};

const JUDGES = { current };

export function registerJudge(name, judge) {
  JUDGES[name] = judge;
}

// The judge in charge, or null with the bite point off.
export function judge() {
  if (!DECIDE.enabled || !DECIDE.eat) return null;
  const j = JUDGES[DECIDE.eat];
  if (!j) throw new Error(`DECIDE.eat: unknown judge ${DECIDE.eat}`);
  return j;
}

// The body's own limit, whatever the judge says: still handling the last bite.
export const chewing = (fagi) => APPETITE.enabled && fagi.age < (fagi.nextBiteAt ?? 0);
