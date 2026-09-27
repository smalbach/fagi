// Fagi's brain: she decides with what she remembers, and what she remembers lives in
// memory.js. Here we only score: what she wants most out of everything she perceives.

import { BRAIN, CUES } from './config.js';
import { createMemory, recall, weight, curious, reinforce } from './memory.js';
import { createRules } from './learned/rules.js';
import { synthAfterLearn, synthCues, synthInduced } from './learned/synth.js';
import { createCues, cuesOf, learnCues, predict, wariness } from './learned/cues.js';
import { createSynapses, wire } from './synapses.js';

// The brain is memory (what she believes) plus rules (what she has written
// from what she believes). Memory is the single source of truth for value;
// rules are the symbolic layer: existence, scope and explanation.
//   synapses : the trace of what was learned, as connections (synapses.js).
//   cues     : what each trait tends to mean (learned/cues.js).
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
    cues: createCues(), version: 0,
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
    const r = recall(brain, c.key);
    // What she has tasted she knows by itself. What she never tasted she can
    // only guess from its traits: "it smells like the one that made me sick".
    const tasted = r.tries > 0;
    const guess = CUES.enabled && !tasted ? predict(brain.cues, c.cues ?? []) : null;
    // What she knows weighs as much as she trusts it: a memory without confidence
    // barely pulls, and then curiosity comes back and she tries it again.
    const known = guess ? guess.value * guess.confidence : weight(brain, c.key);
    // Curiosity is how she learns anything, but a fruit that looks like poison
    // does not make her curious.
    const wary = guess ? wariness(guess) : 0;
    const curiosity = curious(brain, c.key, BRAIN.curiosityTries) ? BRAIN.curiosityBonus * (1 - wary) : 0;
    // Appetite follows need: when sated, what she knows is good barely pulls her.
    const appetite = BRAIN.baseInterest + (1 - BRAIN.baseInterest) * c.urgency;
    const near = -BRAIN.distanceWeight * (c.dist / c.range);
    const penalty = -(c.penalty ?? 0); // smelling it without seeing it gives an imprecise position

    return {
      ...c,
      value: r.value,
      confidence: r.confidence,
      stage: r.stage,
      guess,
      score: known * appetite + curiosity + c.urgency + near + penalty,
      parts: {
        belief: known * appetite, curiosity, need: c.urgency,
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
export function learn(brain, key, reward, now, because = []) {
  const change = reinforce(brain, key, reward, now, BRAIN.learnRate);
  synthAfterLearn(brain, key, change, because, now);
  // The same experience teaches about each trait of what she ate.
  const traits = CUES.enabled ? cuesOf(key) : [];
  if (traits.length) {
    learnCues(brain.cues, traits, reward, now);
    // Rules about traits: induced from whole species (learned/induce.js), or
    // one trait at a time from its weight.
    if (CUES.induce) synthInduced(brain, key, because, now);
    else synthCues(brain, traits, because, now);
  }
  brain.version = (brain.version ?? 0) + 1;
  // Learning also wires: the concept to what the body felt.
  if (brain.synapses) wire(brain.synapses, key, because, now);
  return change;
}
