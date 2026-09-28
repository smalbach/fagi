// Who decides whether to eat a fruit met in the lab.
//
//   fagi:   Fagi's own brain, exactly as in the game: a fruit her rules say to
//           avoid is never pursued (decision/provide.js), and one she would
//           pursue is eaten if its score clears the minimum (brain.evaluate);
//   ideal:  a Bayesian observer that knows the family of chemistries (which
//           kinds of rule the world can have, not which one it has) and
//           updates exactly on every bite, allowing for the world to change
//           (a small hazard per bite pulls it back toward the prior). The best
//           a lone learner can do with this information: an upper bound;
//   random: eats whatever it meets when hungry. The lower bound;
//   oracle: knows the chemistry. The ceiling.
//
// All of them only eat when hungry enough, with Fagi's own thresholds, so
// what differs is only what they know.

import { BRAIN, CARRY, HUNGER } from '../../src/config.js';
import { TRAITS, FEED, cuesOfTraits } from '../../src/chemistry.js';
import { evaluate } from '../../src/brain.js';
import { verdict } from '../../src/learned/rules.js';
import { cuesOf } from '../../src/learned/cues.js';
import { habit } from '../../src/habits.js';

const CLASSES = ['poison', 'nourishing', 'mild'];
const HAZARD = 0.01;      // chance per bite, for the ideal observer, that the world changed
const EPS = 0.002;        // the ideal observer never rules anything out for good

function fagiEats(ant, key) {
  const tasted = (ant.brain.facts[key]?.tries ?? 0) > 0;
  if (ant.hunger < (tasted ? CARRY.eatBelow : habit(ant, 'tasteAt'))) return false;
  if (verdict(ant, 'pursue', key) === 'avoid') return false;
  const [c] = evaluate(ant.brain, [{
    key, kind: 'food', dist: 0.5, range: 1, urgency: ant.hunger / HUNGER.max, cues: cuesOf(key),
  }]);
  return c.score > BRAIN.minScore;
}

// --- the ideal observer -----------------------------------------------------

const ALL = Object.entries(TRAITS).flatMap(([d, vs]) => vs.map((v) => `${d}:${v}`));

// Every chemistry of the family: poison and food clauses.
function hypotheses(family) {
  const out = [];
  const poisons = family === 'conj'
    ? TRAITS.color.flatMap((c) => TRAITS.smell.map((s) => [`color:${c}`, `smell:${s}`]))
    : ALL.map((c) => [c]);
  for (const poison of poisons) {
    for (const food of ALL) {
      if (poison.includes(food)) continue;
      if (family === 'conj' && !food.startsWith('smell:')) continue;
      out.push({ poison, food });
    }
  }
  return out;
}

const classUnder = (h, cues) => (h.poison.every((c) => cues.includes(c)) ? 'poison'
  : cues.includes(h.food) ? 'nourishing' : 'mild');

function idealState(p) {
  const hyps = hypotheses(p.family);
  return { hyps, post: hyps.map(() => 1 / hyps.length) };
}

function idealEats(ant, key, p, traits) {
  if (ant.hunger < CARRY.eatBelow) return false;
  const s = ant.ideal ?? (ant.ideal = idealState(p));
  const cues = cuesOfTraits(traits);
  let expected = 0;
  s.hyps.forEach((h, i) => { expected += s.post[i] * FEED[classUnder(h, cues)]; });
  return expected < 0;   // it lowers hunger, on average
}

function idealLearns(ant, p, traits, cls) {
  const s = ant.ideal ?? (ant.ideal = idealState(p));
  const cues = cuesOfTraits(traits);
  const noise = Math.max(p.noise, EPS);
  let total = 0;
  s.hyps.forEach((h, i) => {
    s.post[i] *= classUnder(h, cues) === cls ? 1 - noise : noise / (CLASSES.length - 1);
    total += s.post[i];
  });
  const u = 1 / s.hyps.length;
  s.post = s.post.map((w) => (1 - HAZARD) * (w / total) + HAZARD * u);
}

// --- the interface ----------------------------------------------------------

// Does `ant` eat the fruit `key` with these traits, whose true class is `truth`?
export function decides(p, ant, key, traits, truth) {
  if (p.agent === 'fagi') return fagiEats(ant, key);
  if (p.agent === 'ideal') return idealEats(ant, key, p, traits);
  if (ant.hunger < CARRY.eatBelow) return false;
  return p.agent === 'random' || truth !== 'poison';
}

// What the agent learns from a bite beyond what eat() already taught the brain.
export function learns(p, ant, traits, cls) {
  if (p.agent === 'ideal') idealLearns(ant, p, traits, cls);
}

export { CLASSES };
