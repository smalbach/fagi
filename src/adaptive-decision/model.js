// The adaptive judge's model of consequences (step 3): what a bite of a kind
// will do to her, learned only from bites she took.
//
// Per kind and per trait of its look (color, shape, smell) she keeps two
// counts, bites that harmed (her hunger rose) and bites that didn't. What she
// expects of a kind is its own counts over a prior drawn from its traits, so a
// kind she never ate is judged by what its look has meant before. She also
// learns how much a harmful bite adds and a good one takes, how fast her
// hunger rises, and how long it takes her between safe meals.
//
// One rule for how fast old evidence fades: after each bite, by how
// surprised she was (the gap between what she expected and what happened),
// kept as a running volatility. A world that behaves as learned forgets
// nothing; one that keeps surprising her lets old lessons go. No detector of
// any particular change.

const K0 = 2;                   // weight of the look-based prior, in bites
const TRAIT_PRIOR = { bad: 1, good: 2 };
const VOL_RATE = 0.3;           // how fast volatility follows the last surprises
const FORGET = 0.5;             // evidence lost per bite at volatility 1

// `version` 1 (as first run, discarded): a trial bite counted as a quarter of
// the evidence. Version 2: whether a bite harmed is as plain after a trial
// bite as after a whole one, so every bite is one piece of evidence; only
// how much it harmed or fed is scaled by its size.
export function createModel({ adaptive = true, version = 2 } = {}) {
  return {
    adaptive,
    version,
    kinds: {},                  // key -> { bad, good }
    traits: {},                 // cue -> { bad, good }
    harm: { n: 0, mean: 20 },   // hunger a harmful full bite adds (prior)
    relief: { n: 0, mean: 25 }, // hunger a good full bite takes (prior)
    rate: { n: 0, mean: 0.1 },  // hunger per second (prior)
    between: { n: 0, mean: 200 }, // seconds between safe meals (prior)
    volatility: 0,
    meals: 0,
    lastSafe: null,
    last: null,                 // { age, hunger } between meals, for the rate
    bites: 0,
    surprises: [],              // the last few, for whoever watches
  };
}

const beta = (c, prior) => (c.bad + prior.bad) / (c.bad + c.good + prior.bad + prior.good);

// How likely a bite of `key` (look `cues`) harms, and how much evidence
// is behind it (in bites).
export function predict(model, key, cues) {
  const ts = cues.map((c) => model.traits[c]).filter(Boolean);
  const q = cues.length
    ? cues.reduce((a, c) => a + beta(model.traits[c] ?? { bad: 0, good: 0 }, TRAIT_PRIOR), 0) / cues.length
    : beta({ bad: 0, good: 0 }, TRAIT_PRIOR);
  const k = model.kinds[key] ?? { bad: 0, good: 0 };
  const n = k.bad + k.good;
  return { p: (K0 * q + k.bad) / (K0 + n), evidence: n, traitEvidence: ts.length };
}

function forget(model, f) {
  if (f <= 0) return;
  for (const c of [...Object.values(model.kinds), ...Object.values(model.traits)]) { c.bad *= 1 - f; c.good *= 1 - f; }
}

const follow = (stat, x) => { stat.n += 1; stat.mean += (x - stat.mean) / Math.min(stat.n + 1, 20); };

// Learn from what she observes now (observation.js). `portionOf(meal)`: the
// share of a full bite it was (a trial bite is smaller); `cuesOf(key)`: a look.
export function learn(model, obs, portionOf, cuesOf) {
  // Hunger rising between meals: her body's pace.
  if (model.last && obs.age > model.last.age && obs.hunger > model.last.hunger && (obs.meal?.n ?? 0) === model.meals) {
    follow(model.rate, (obs.hunger - model.last.hunger) / (obs.age - model.last.age));
  }
  model.last = { age: obs.age, hunger: obs.hunger };
  const meal = obs.meal;
  if (!meal || meal.n === model.meals) return null;
  model.meals = meal.n;
  const portion = Math.max(0.05, portionOf(meal));
  const delta = (meal.after - meal.before) / portion;
  const harmed = meal.after > meal.before;
  const cues = cuesOf(meal.key);
  const expected = predict(model, meal.key, cues).p;
  const surprise = Math.abs((harmed ? 1 : 0) - expected);
  const weight = model.version >= 2 ? 1 : portion;
  if (model.adaptive) {
    model.volatility += VOL_RATE * (surprise * surprise - model.volatility);
    forget(model, FORGET * model.volatility * weight);
  }
  const k = (model.kinds[meal.key] ??= { bad: 0, good: 0 });
  if (harmed) k.bad += weight; else k.good += weight;
  for (const c of cues) {
    const t = (model.traits[c] ??= { bad: 0, good: 0 });
    if (harmed) t.bad += weight; else t.good += weight;
  }
  if (harmed) follow(model.harm, delta);
  else if (meal.before > 0) {
    follow(model.relief, -delta);
    if (model.lastSafe != null) follow(model.between, obs.age - model.lastSafe);
    model.lastSafe = obs.age;
  }
  model.bites += 1;
  model.surprises.push(Math.round(surprise * 100) / 100);
  if (model.surprises.length > 20) model.surprises.shift();
  return { key: meal.key, harmed, expected, surprise };
}
