// Revision 1's reference judges for the bite point (src/decision/bite.js).
//
//   privileged  knows what THIS fruit does, look-alikes included (the hidden
//               spec). Not a fair competitor: it estimates the room there is.
//   informed    knows how this world works — any species may poison, some good
//               species have poisonous look-alikes, the chemistry may turn
//               upside down, rotten fruit harms, a harmful bite adds hunger
//               and hunger at the top kills — but judges only from what she
//               has eaten and felt: whether her hunger rose after a bite.
//
// The informed judge went through three versions in development, each
// documented with its result in viability.md: 1 starved (no risk taken even
// when starving), 2 gambled whole bites on kinds it never ate, 3 tries a
// kind first with a trial bite. It is a diagnostic reference, not the
// learner of step 3.
//
// Both eat from the ground at the same hunger as the current judgment
// (CARRY.eatBelow) and share its carrying conditions; they differ in what
// they believe a fruit will do. What they know is theirs: neither reads her
// brain's facts, rules or cues.

import { CARRY, HUNGER, POINT_TYPES } from '../../src/config.js';
import { specOfFruit } from '../../src/chemistry.js';
import { registerJudge } from '../../src/decision/bite.js';
import { pantryEstimate, roomAtHome } from '../../src/larder.js';
import { habit } from '../../src/habits.js';

const STARVE_SECONDS = 150;    // seconds from starving: take a risk rather than none
const HARM = 25;                 // what a harmful bite adds to hunger (chemistry.js), part of the mechanism
const hungry = (fagi) => fagi.hunger >= CARRY.eatBelow;
// A harmful bite now would take her to the top.
const lethal = (fagi) => fagi.hunger + HARM >= HUNGER.max * 0.97;
const mayCarry = (fagi, p) => !fagi.carrying && !p.refuse && pantryEstimate(fagi) < habit(fagi, 'reserve') && roomAtHome(fagi);

// --- privileged ---------------------------------------------------------------

const harmOf = (key, variant) => (specOfFruit(key, variant)?.hunger ?? 0) > 0;
// A stored ration's look-alike is drawn when she bites it (nest.js): its risk.
const riskStored = (key) => {
  const s = POINT_TYPES[key];
  if (!s) return 1;
  if (s.hunger > 0) return 1;
  return s.twin && s.twin.hunger > 0 ? s.twin.share : 0;
};

registerJudge('privileged', {
  ground(fagi, p) {
    if (harmOf(p.type, p.variant)) return 'leave';
    if (hungry(fagi)) return 'eat';
    return mayCarry(fagi, p) ? 'carry' : 'leave';
  },
  pantry(fagi, keys) {
    const ok = keys.filter((k) => riskStored(k) < 1 && !(lethal(fagi) && riskStored(k) > 0));
    return ok.length ? ok.reduce((a, b) => (riskStored(b) < riskStored(a) ? b : a)) : null;
  },
  carried: (fagi, key) => !harmOf(key, fagi.carrying?.variant),
  wants: (fagi, c) => !harmOf(c.key, c.ref?.variant),
});

// --- informed -----------------------------------------------------------------

// Her own record, per kind of fruit: bites that harmed and that didn't.
function memoryOf(fagi) {
  const m = (fagi.informed ??= { kinds: {}, meals: fagi.eaten ?? 0, flips: 0 });
  // What the last bite did: did her hunger rise? (She feels it.)
  if ((fagi.eaten ?? 0) !== m.meals && fagi.lastMeal) {
    m.meals = fagi.eaten;
    const k = fagi.lastMeal.type;
    const harmed = fagi.lastMeal.hungerAfter > fagi.lastMeal.hungerBefore;
    const r = (m.kinds[k] ??= { good: 0, bad: 0 });
    // Two different kinds she relied on harming within a short span: the
    // world may have turned (the mechanism she knows), and everything she
    // knew flips. One kind alone harming could be its look-alike.
    const reliable = r.good >= 3 && r.good > 2 * r.bad;
    if (harmed) r.bad += 1; else r.good += 1;
    if (harmed && reliable) {
      m.suspects = (m.suspects ?? []).filter((x) => fagi.age - x.at < 400 && x.key !== k);
      if (m.suspects.length) { flip(m); m.suspects = []; } else m.suspects.push({ key: k, at: fagi.age });
    }
  }
  return m;
}

function flip(m) {
  m.flips += 1;
  for (const r of Object.values(m.kinds)) [r.good, r.bad] = [r.bad, r.good + 1];
}

// How likely the next bite of `key` harms: her record, a prior of 1/3 for a
// kind she never ate, and a look-alike's share that no good record removes.
function risk(m, key) {
  if (key === 'toxic') return 1;   // rotten fruit: the mechanism, not a guess
  const r = m.kinds[key];
  const prior = { bad: 1, good: 2 };
  const p = ((r?.bad ?? 0) + prior.bad) / ((r?.bad ?? 0) + (r?.good ?? 0) + prior.bad + prior.good);
  return Math.max(p, r && r.bad > 0 && r.good > 0 ? 0.35 : 0);
}

// Eat what probably feeds; nothing risky when a harmful bite would kill,
// unless going without would kill her sooner than finding something safer
// (version 2: version 1 had no such way out and starved, see viability).
const starving = (fagi) => (HUNGER.max - fagi.hunger) / HUNGER.rate < STARVE_SECONDS;
const acceptableIn = (version) => (fagi, m, key) => {
  if (version >= 2 && starving(fagi)) return risk(m, key) < 0.5;
  return lethal(fagi) ? risk(m, key) < 0.1 : risk(m, key) < 0.5;
};

const informed = (version) => {
  const acceptable = acceptableIn(version);
  return {
    ground(fagi, p) {
      const m = memoryOf(fagi);
      // Version 3: a kind she never ate gets a trial bite first (EXPERIMENT.portion),
      // while a harmful one could not hurt much; only then a meal.
      if (version >= 3 && !m.kinds[p.type] && p.type !== 'toxic') return lethal(fagi) && !starving(fagi) ? 'leave' : 'taste';
      if (hungry(fagi) && acceptable(fagi, m, p.type)) return 'eat';
      return mayCarry(fagi, p) && risk(m, p.type) < 0.34 ? 'carry' : 'leave';
    },
    pantry(fagi, keys) {
      const m = memoryOf(fagi);
      const ok = keys.filter((k) => acceptable(fagi, m, k));
      return ok.length ? ok.reduce((a, b) => (risk(m, b) < risk(m, a) ? b : a)) : null;
    },
    carried(fagi, key) {
      return acceptable(fagi, memoryOf(fagi), key);
    },
    wants(fagi, c) {
      const m = memoryOf(fagi);
      return risk(m, c.key) < 0.5;
    },
  };
};

registerJudge('informed', informed(3));
registerJudge('informed2', informed(2));   // as second run: it gambled on whole bites of kinds it never ate (viability.md)
registerJudge('informed1', informed(1));   // as first run: it starved (viability.md)

export const JUDGE_NAMES = ['current', 'privileged', 'informed', 'informed2', 'informed1'];
