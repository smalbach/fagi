// Fagi's brain: she decides with what she remembers, and what she remembers lives in
// memory.js. Here we only score: what she wants most out of everything she perceives.

import { BRAIN, CUES, SOCIAL, MEMORY, BASELINE, TASTE } from './config.js';
import { tasteCuesOf } from './chemistry.js';
import { createMemory, recall, weight, curious, reinforce, reinforceSeen } from './memory.js';
import { createRules } from './learned/rules.js';
import { synthAfterLearn, synthCues, synthInduced, checkTold } from './learned/synth.js';
import { createCues, cuesOf, learnCues, predict, wariness } from './learned/cues.js';
import { createSynapses, wire } from './synapses.js';
import { logBite } from './learned/explain.js';
import { createHabits } from './habits.js';
import { smellOnly } from './percept.js';
import { learnedDrives, needOfKind, kappaAt } from './drive.js';

// A smell she has met fewer than BRAIN.curiosityTries times is still new.
const smellIsNew = (brain, cues = []) => cues.every((c) => (brain.cues[c]?.n ?? 0) < BRAIN.curiosityTries);

// The brain is memory (what she believes) plus rules (what she has written
// from what she believes). Memory is the single source of truth for value;
// rules are the symbolic layer: existence, scope and explanation.
//   synapses : the trace of what was learned, as connections (synapses.js).
//   cues     : what each trait tends to mean (learned/cues.js).
//   bites    : the last experiences with fruit, to explain herself (learned/explain.js).
//   habits   : the thresholds of her behavior she tunes from experience (habits.js).
//   lastRule : the last rule written, revised or retired. The narrator
//              reads it; no need to store it anywhere else.
//   version  : goes up every time what she learned changes (each experience, and
//              every second through forgetting). The learned-code panel
//              repaints when it changes: with rules.seq it only noticed the
//              rules, and beliefs that never become a rule (water,
//              puddles) stayed frozen on screen.
export function createBrain() {
  return {
    ...createMemory(), rules: createRules(), lastRule: null, synapses: createSynapses(),
    cues: createCues(), bites: [], habits: createHabits(), lastHabit: null, version: 0,
  };
}

// Candidate: { key, kind, ref, dist, range, urgency, cues }
//   urgency = the need THAT candidate would relieve (hunger or thirst).
//   cues    = the traits she perceives of it (learned/cues.js).
//
// Returns the list sorted from best to worst with the breakdown of the sum,
// which is exactly what the console shows.
export function evaluate(brain, candidates) {
  return candidates.map((c) => {
    // Only smelled (percept.js): she knows the smell, not which fruit it is.
    const blind = smellOnly(c);
    const r = blind ? { value: 0, confidence: 0, stage: 'short', tries: 0 } : recall(brain, c.key);
    // What she has tasted she knows by itself. What she never tasted she can
    // only guess from its traits: "it smells like the one that made me sick".
    const tasted = r.tries > 0;
    const guess = CUES.enabled && !tasted ? predict(brain.cues, c.cues ?? []) : null;
    // What she knows weighs as much as she trusts it: a memory without confidence
    // barely pulls, and then curiosity comes back and she tries it again.
    const known = guess ? guess.value * guess.confidence : weight(brain, c.key);
    // Curiosity is how she learns anything, but a fruit that looks like poison
    // does not make her curious. A smell alone is new until she has met it.
    const wary = guess ? wariness(guess) : 0;
    const isNew = blind ? smellIsNew(brain, c.cues) : curious(brain, c.key, BRAIN.curiosityTries);
    const curiosity = isNew ? BRAIN.curiosityBonus * (1 - wary) : 0;
    // Appetite follows need: when sated, what she knows is good barely pulls her.
    // With learned drives (drive.js) the curve is hers: κ at this need, and the
    // need itself pulls by what she has learned it is worth.
    const need = learnedDrives() ? needOfKind(c.kind) : null;
    const appetite = need ? kappaAt(brain, need, c.urgency) : BRAIN.baseInterest + (1 - BRAIN.baseInterest) * c.urgency;
    const pull = need ? appetite * c.urgency : c.urgency;
    const near = -BRAIN.distanceWeight * (c.dist / c.range);
    const penalty = -(c.penalty ?? 0); // smelling it without seeing it gives an imprecise position

    return {
      ...c,
      value: r.value,
      confidence: r.confidence,
      stage: r.stage,
      guess,
      score: known * appetite + curiosity + pull + near + penalty,
      parts: {
        belief: known * appetite, curiosity, need: pull,
        distance: near, ...(penalty ? { smell: penalty } : {}),
      },
    };
  }).sort((a, b) => b.score - a.score);
}

// The best candidate, if it clears the minimum. Anything marginal doesn't budge her.
export function choose(brain, candidates) {
  const ranked = evaluate(brain, candidates);
  const best = ranked[0];
  return { best: best && best.score > BRAIN.minScore ? best : null, ranked };
}

// Learn from what just happened to her. Every learning step ALWAYS goes through
// synthAfterLearn: that way nobody has to remember to synthesize rules at every
// place that calls learn(), and any future source of learning (whatever it is)
// gets them for free just by calling this function.
// Learn from watching a sister eat `key` and feel `reward` (social.js). The
// same paths as learn(), at SOCIAL.observe of the strength, without counting as
// a try, and every rule it writes says where it came from: { kind: 'saw', from }.
// With BASELINE.learn = 0 (a baseline that cannot learn, scripts/evaluate.js)
// nothing changes and the change reported is none.
function unchanged(brain, key) {
  const r = recall(brain, key);
  const snap = { value: r.value, confidence: r.confidence, stage: r.stage };
  return { before: snap, after: { ...snap }, kind: 'none' };
}

export function learnSeen(brain, key, reward, now, from) {
  if (!BASELINE.learn) return unchanged(brain, key);
  const change = reinforceSeen(brain, key, reward, now, BRAIN.learnRate * SOCIAL.observe, MEMORY.first * SOCIAL.observe);
  const because = [{ sense: 'saw', v: Math.round(reward * 100) / 100 }];
  brain.learningFrom = { kind: 'saw', from, at: Math.round(now * 10) / 10, trust: SOCIAL.observe };
  try {
    synthAfterLearn(brain, key, change, because, now);
    const traits = CUES.enabled ? cuesOf(key) : [];
    if (traits.length) {
      learnCues(brain.cues, traits, reward, now, CUES.rate * SOCIAL.observe);
      if (CUES.induce !== 1) synthCues(brain, traits, because, now);
    }
    logBite(brain, key, reward, now, false, from);
    brain.lastSeen = { n: (brain.lastSeen?.n ?? 0) + 1, from, key, reward };
  } finally {
    brain.learningFrom = null;
  }
  brain.version = (brain.version ?? 0) + 1;
  return change;
}

// Tastes take the blame for what a bite did more readily than looks do: the
// preparedness of taste-illness learning (Garcia and Koelling, 1966).
const tasteSalience = (c) => (c.startsWith('taste:') ? TASTE.salience : 1);

export function learn(brain, key, reward, now, because = []) {
  if (!BASELINE.learn) return unchanged(brain, key);
  const change = reinforce(brain, key, reward, now, BRAIN.learnRate);
  synthAfterLearn(brain, key, change, because, now);
  // Kept to point at later, when she explains herself (learned/explain.js).
  logBite(brain, key, reward, now, because.some((s) => s.sense === 'peril'));
  // The same experience teaches about each trait of what she ate, and, with
  // TASTE, about each taste she felt in her mouth (taste.js).
  const traits = CUES.enabled ? [...cuesOf(key), ...(TASTE.enabled && TASTE.learn ? brain.tasting ?? tasteCuesOf(key) : [])] : [];
  if (traits.length) {
    learnCues(brain.cues, traits, reward, now, CUES.rate, TASTE.enabled ? tasteSalience : null);
    // Rules about traits: induced from whole species (learned/induce.js), or
    // one trait at a time from its weight.
    if (CUES.induce !== 1) synthCues(brain, traits, because, now);
    if (CUES.induce >= 1) synthInduced(brain, key, because, now);
    checkTold(brain, key, now);
  }
  brain.version = (brain.version ?? 0) + 1;
  // Learning also wires: the concept to what the body felt.
  if (brain.synapses) wire(brain.synapses, key, because, now);
  return change;
}
