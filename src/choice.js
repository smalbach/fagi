// Explore or come back (CHOICE, phase 9 C, spec §12.11): the choice itself,
// learned.
//
// When she needs food and sees none, she has two kinds of option: go back to
// one of the sites she remembers (sites.js), or go and look somewhere new.
// What each is worth to her comes from her own life:
//   - a site, what she expects to find there (learned on each visit), less
//     the walk;
//   - exploring, what exploring has given her before: a find, or nothing
//     after a long search. Learned the same way, from the surprise.
// She doesn't always take the best: she chooses with some noise (a softmax),
// and how much noise is hers — part innate, drawn once at birth, part her
// recent surprises: a world that keeps surprising her makes her try more.
// Two sisters with different luck early on end up choosing differently.
//
// Once chosen, she keeps to it until it resolves: she reaches the site (and
// sees what is there), or finds food while exploring, or has searched long
// enough without luck. Bringing food home ends a plan without judging it:
// the next time she needs food she chooses again.
//
// How she weighs them (CHOICE.mode):
//   1 — from her own uncertainty (the default). What she believes of each
//       option is her evidence: found / not found, two counts (a Beta
//       belief; sites.js keeps them for each site, here for exploring). Each
//       time she chooses she draws a guess from each belief and takes the
//       option whose guess, per second it would take, is best: food per
//       second, as a forager would (Charnov). Walking to a site takes its
//       distance at her pace; exploring takes what her own explorations have
//       taken. Little evidence, guesses that vary a lot: she tries things.
//       Much evidence, she settles. Nobody sets her noise, her prior for
//       exploring or how fast she learns: they are what she has lived
//       (Thompson sampling). Evidence fades at her memory's own pace.
//   0 — as first built (spec §25.22): values moved by the surprise at a set
//       rate, and a softmax with a set noise, part of it innate.
//
// The choice only decides which remembered site, if any, is offered to the
// "provide" tier (decision/provide.js); the fixed hierarchy — survive,
// endure — stays her safety net. Draws randomness only while choosing.

import { CHOICE, SITES, MEMORY, HUNGER, NEST, FAGI, DECIDE } from './config.js';
import { distanceTo } from './vision.js';
import { habit } from './habits.js';
import { pantryEstimate } from './larder.js';
import { forageGene, priorOf } from './generations.js';

const LOG_MAX = 40;
const EARLY = 5;

function stateOf(fagi) {
  return (fagi.brain.choice ??= {
    exploreValue: CHOICE.explorePrior,
    explore: priorOf(forageGene(fagi, 'explore')),   // mode 1: her evidence that exploring finds food, from her inborn belief
    exploreTime: null,      // mode 1: what her explorations have taken, on average
    explorations: 0,
    innate: null,           // mode 0: her own share of the noise, drawn the first time she chooses
    volatility: 0,          // running size of her recent surprises
    plan: null,
    lastSiteN: fagi.brain.lastSite?.n ?? 0,
    lastStored: fagi.stored ?? 0,
    counts: { site: 0, explore: 0 },
    outcomes: {},           // chose:outcome -> times, over her whole life
    early: [],              // her first few choices and how they went (F3)
    log: [],
  });
}

// Where her choosing draws from. With the decision point on (DECIDE.ownStream)
// it is a stream of her own, seeded once from hers the first time she
// chooses: a controller that draws more or less then changes what she
// decides, not how she walks. Otherwise the simulation's own, as always.
let drawFrom = () => Math.random;
function streamFor(fagi) {
  if (!DECIDE.enabled || !DECIDE.ownStream) return Math.random;
  const c = stateOf(fagi);
  // Its state is a number in her brain (it is copied and saved like the rest).
  c.stream ??= Math.floor(Math.random() * 4294967296) >>> 0;
  return () => {
    c.stream = (c.stream + 0x6D2B79F5) >>> 0;
    let t = Math.imul(c.stream ^ (c.stream >>> 15), c.stream | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A normal draw (Box-Muller). `rnd`: the simulation's own, unless drawing.
function gauss(rnd = drawFrom()) {
  const u = Math.max(1e-12, rnd());
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// A guess from a Beta(a, b) belief, both ≥ 1 (Marsaglia-Tsang gammas).
function gamma(k, rnd) {
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x; let v;
    do { x = gauss(rnd); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rnd();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function betaDraw(a, b, rnd) {
  const x = gamma(a, rnd);
  return x / (x + gamma(b, rnd));
}
const betaMean = (a, b) => a / (a + b);

// A small stream of its own, for drawing her chances in the brain map and the
// inspector without touching the simulation's.
function viewStream(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mode 1: seconds each option would take her. Before she has ever explored on
// purpose, what finding food takes her is what it has taken her so far: her
// life over the sites she has found.
const walkTime = (fagi, s) => 1 + distanceTo(fagi, s) / FAGI.speed;
const exploreTimeOf = (fagi, c) => c.exploreTime ?? Math.max(1, fagi.age / Math.max(1, fagi.brain.siteN ?? 0));

// Mode 1: each option as food per second, from a guess (`guess(a, b)`) of her belief.
function rates(fagi, guess) {
  const c = stateOf(fagi);
  const out = [{ kind: 'explore', u: guess(c.explore.a, c.explore.b) / exploreTimeOf(fagi, c) }];
  for (const s of fagi.brain.sites ?? []) {
    // Going back to where she already stands, and sees no food, is no option.
    if (s.confidence <= 0 || s.inside) continue;
    out.push({ kind: 'site', id: s.id, u: guess(s.a ?? 1, s.b ?? 1) / walkTime(fagi, s) });
  }
  return out;
}

const bestOf = (options) => options.reduce((x, y) => (y.u > x.u ? y : x));

// How much noise she chooses with now (mode 0; mode 1 has none set).
export function temperatureOf(fagi) {
  if (CHOICE.mode === 1) return null;
  const c = stateOf(fagi);
  return CHOICE.temper * (c.innate ?? 1) * (1 + CHOICE.surpriseHeat * c.volatility);
}

// What going back to a site is worth: what she expects to find there, less the
// walk. How sure she is doesn't lower it — what she expects already drops
// when she finds it empty — it makes her estimate looser: the less she
// trusts a site, the more its worth wobbles from one choice to the next.
// (CHOICE.trustDiscount = 1: trust multiplies the worth instead, as first
// measured in spec §25.22.)
// `noisy` false: the worth without the wobble, for drawing it (draws nothing).
function siteUtility(fagi, s, noisy = true) {
  const walk = CHOICE.cost * distanceTo(fagi, s) / MEMORY.travelRange;
  if (CHOICE.trustDiscount) return s.value * s.confidence - walk;
  return s.value - walk + (noisy ? CHOICE.doubt * (1 - s.confidence) * gauss() : 0);
}

// The options she has now, and what each is worth to her.
export function optionsOf(fagi, noisy = true) {
  const c = stateOf(fagi);
  const out = [{ kind: 'explore', u: c.exploreValue }];
  for (const s of fagi.brain.sites ?? []) {
    if (s.confidence <= 0) continue;
    out.push({ kind: 'site', id: s.id, u: siteUtility(fagi, s, noisy) });
  }
  return out;
}

// Her options as she would weigh them now, with the chance of each, for the
// brain map and the inspector. Reads, never draws: the simulation's
// randomness is untouched.
export function choiceView(fagi) {
  const c = fagi.brain.choice;
  if (!CHOICE.enabled || !SITES.enabled || !c) return null;
  if (CHOICE.mode === 1) {
    // Her chances: how often each option would win among many guesses.
    const rnd = viewStream(fagi.id * 7919 + (fagi.brain.lastPlan?.n ?? 0));
    const means = rates(fagi, betaMean);
    const wins = means.map(() => 0);
    const N = 300;
    for (let k = 0; k < N; k++) {
      const guess = rates(fagi, (a, b) => betaDraw(a, b, rnd));
      wins[guess.indexOf(bestOf(guess))] += 1;
    }
    return {
      options: means.map((o, i) => ({ ...o, p: wins[i] / N, site: o.kind === 'site' ? fagi.brain.sites.find((s) => s.id === o.id) : null })),
      plan: c.plan, exploreValue: betaMean(c.explore.a, c.explore.b), exploreEvidence: c.explore.a + c.explore.b - 2,
      exploreTime: exploreTimeOf(fagi, c), temperature: null, innate: null, volatility: null, mode: 1,
      counts: c.counts, recent: c.log.slice(-5),
    };
  }
  const options = optionsOf(fagi, false);
  const t = Math.max(1e-6, temperatureOf(fagi));
  const top = Math.max(...options.map((o) => o.u));
  const w = options.map((o) => Math.exp((o.u - top) / t));
  const total = w.reduce((a, b) => a + b, 0);
  return {
    options: options.map((o, i) => ({ ...o, p: w[i] / total, site: o.kind === 'site' ? fagi.brain.sites.find((s) => s.id === o.id) : null })),
    plan: c.plan, exploreValue: c.exploreValue, temperature: t, innate: c.innate, volatility: c.volatility,
    counts: c.counts, recent: c.log.slice(-5),
  };
}

// Mode 1: fixed policies weigh what she expects; the learned one, a guess.
function pickSampled(fagi) {
  if (CHOICE.policy === 2) return { kind: 'explore', u: null, options: [] };
  const means = rates(fagi, betaMean);
  if (CHOICE.policy === 1) {
    const sites = means.filter((o) => o.kind === 'site');
    return { ...(sites.length ? bestOf(sites) : means[0]), options: means };
  }
  const guess = rates(fagi, (a, b) => betaDraw(a, b, drawFrom()));
  const chosen = guess.indexOf(bestOf(guess));
  return { ...means[chosen], options: means };
}

function pick(fagi, options) {
  if (CHOICE.policy === 1) {   // fixed: always back to the best site, if any
    const sites = options.filter((o) => o.kind === 'site');
    return sites.length ? sites.reduce((a, b) => (b.u > a.u ? b : a)) : options[0];
  }
  if (CHOICE.policy === 2) return options[0];   // fixed: always explore
  const t = Math.max(1e-6, temperatureOf(fagi));
  const top = Math.max(...options.map((o) => o.u));
  const w = options.map((o) => Math.exp((o.u - top) / t));
  const total = w.reduce((a, b) => a + b, 0);
  let r = drawFrom()() * total;
  for (let i = 0; i < options.length; i++) { r -= w[i]; if (r <= 0) return { ...options[i], p: w[i] / total }; }
  return { ...options.at(-1), p: w.at(-1) / total };
}

// How much she wants food now: her hunger or what the pantry lacks as she
// remembers it, whichever is greater.
export function foodDrive(fagi) {
  const hunger = fagi.hunger / HUNGER.max;
  const missing = 1 - Math.min(1, pantryEstimate(fagi) / habit(fagi, 'reserve'));
  return Math.max(hunger, NEST.forageDrive * missing);
}

const wantsFood = (fagi) => !fagi.carrying && foodDrive(fagi) > 0.15;

// Her plan, while it runs: she wants food and is awake (for the decision point).
export function activePlan(fagi) {
  const plan = fagi.brain.choice?.plan;
  if (!CHOICE.enabled || !SITES.enabled || !plan) return null;
  return wantsFood(fagi) && !fagi.sleeping ? plan : null;
}

function resolve(fagi, outcome, surprise) {
  const c = stateOf(fagi);
  const plan = c.plan;
  c.plan = null;
  if (surprise != null) c.volatility += CHOICE.surpriseMemory * (Math.abs(surprise) - c.volatility);
  const entry = { t: Math.round(fagi.age), chose: plan.kind, site: plan.id ?? null, p: plan.p ?? null, options: plan.options, outcome };
  c.log.push(entry);
  if (c.log.length > LOG_MAX) c.log.shift();
  const key = `${plan.kind}:${outcome}`;
  c.outcomes[key] = (c.outcomes[key] ?? 0) + 1;
  if (c.early.length < EARLY && outcome !== 'home') c.early.push({ chose: plan.kind, outcome });
  fagi.brain.lastChoice = { n: (fagi.brain.lastChoice?.n ?? 0) + 1, ...entry };
}

// Every frame, after she has looked (sites.js noteSites): resolve her plan if
// its moment came, and choose a new one if she needs food and sees none.
// `seen`: the edible fruit in sight. Returns the site to offer, or null.
export function updateChoice(fagi, seen) {
  if (!CHOICE.enabled || !SITES.enabled) return undefined;
  const c = stateOf(fagi);
  const plan = c.plan;
  // A plan's clock runs only while she is after food: asleep, resting or
  // sated, she isn't failing at it.
  const busy = wantsFood(fagi) && !fagi.sleeping;
  const dt = Math.max(0, fagi.age - (c.lastAge ?? fagi.age));
  if (plan && busy) plan.spent = (plan.spent ?? 0) + dt;
  c.lastAge = fagi.age;

  // She brought food home: whatever the plan was, it's over, unjudged.
  if ((fagi.stored ?? 0) !== c.lastStored) {
    c.lastStored = fagi.stored ?? 0;
    if (plan) resolve(fagi, 'home', null);
  }

  const lastSite = fagi.brain.lastSite;
  const siteNews = lastSite && lastSite.n !== c.lastSiteN;
  if (siteNews) c.lastSiteN = lastSite.n;

  if (c.plan?.kind === 'site') {
    const site = (fagi.brain.sites ?? []).find((s) => s.id === c.plan.id);
    if (!site) resolve(fagi, 'forgotten', null);
    else if (siteNews && lastSite.id === site.id && lastSite.what !== 'found') resolve(fagi, lastSite.what, lastSite.surprise);
    else if ((c.plan.spent ?? 0) > CHOICE.planMax) resolve(fagi, 'gave up', null);
  } else if (c.plan?.kind === 'explore') {
    const found = seen.length > 0;
    // How long she searches before calling it fruitless: inherited (patience).
    const long = (c.plan.spent ?? 0) > CHOICE.exploreWindow * Math.exp(forageGene(fagi, 'patience'));
    if (found || long) {
      const got = found ? Math.min(1, seen.length / SITES.full) : 0;
      if (CHOICE.mode === 1) {
        const surprise = got - betaMean(c.explore.a, c.explore.b);
        c.explore.a += got;
        c.explore.b += 1 - got;
        c.explorations += 1;
        c.exploreTime = (c.exploreTime ?? 0) + ((c.plan.spent ?? 0) - (c.exploreTime ?? 0)) / c.explorations;
        c.exploreValue = betaMean(c.explore.a, c.explore.b);
        resolve(fagi, found ? 'found' : 'nothing', surprise);
      } else {
        const surprise = got - c.exploreValue;
        c.exploreValue += CHOICE.rate * surprise;
        resolve(fagi, found ? 'found' : 'nothing', surprise);
      }
    }
  }

  // Mode 1: what she learned of exploring fades like the rest of her memory.
  // It fades toward what she was born believing, at her memory's inherited pace.
  if (CHOICE.mode === 1 && dt > 0) {
    const fade = Math.max(0, 1 - MEMORY.decayMedium * Math.exp(forageGene(fagi, 'memory')) * dt);
    const born = priorOf(forageGene(fagi, 'explore'));
    c.explore.a = born.a + (c.explore.a - born.a) * fade;
    c.explore.b = born.b + (c.explore.b - born.b) * fade;
  }

  if (!c.plan && busy && seen.length === 0) {
    const rnd = streamFor(fagi);
    drawFrom = () => rnd;
    try { choose(fagi, c); } finally { drawFrom = () => Math.random; }
  }

  if (c.plan?.kind !== 'site') return null;
  return (fagi.brain.sites ?? []).find((s) => s.id === c.plan.id) ?? null;
}

// A new plan: her options, weighed, one taken.
function choose(fagi, c) {
  let chosen;
  let options;
  if (CHOICE.mode === 1) {
    chosen = pickSampled(fagi);
    options = chosen.options;
  } else {
    c.innate ??= Math.exp(CHOICE.temperSpread * gauss());
    options = optionsOf(fagi);
    chosen = pick(fagi, options);
  }
  c.plan = { kind: chosen.kind, id: chosen.id, p: chosen.p ?? 1, at: fagi.age,
    options: options.map((o) => ({ kind: o.kind, id: o.id ?? null, u: Math.round(o.u * 1000) / 1000 })) };
  c.counts[chosen.kind] += 1;
  const best = Math.max(...options.filter((o) => o.kind === 'site').map((o) => o.u), -Infinity);
  // What she expected of the site she took (or of her best one) and of exploring.
  const siteOf = (id) => (fagi.brain.sites ?? []).find((s) => s.id === id);
  const bestSite = CHOICE.mode === 1
    ? (fagi.brain.sites ?? []).reduce((x, s) => (!x || betaMean(s.a ?? 1, s.b ?? 1) > betaMean(x.a ?? 1, x.b ?? 1) ? s : x), null)
    : null;
  const siteExpect = CHOICE.mode === 1
    ? (() => { const s = chosen.kind === 'site' ? siteOf(chosen.id) : bestSite; return s ? betaMean(s.a ?? 1, s.b ?? 1) : null; })()
    : chosen.kind === 'site' ? chosen.u : (Number.isFinite(best) ? best : null);
  fagi.brain.lastPlan = { n: (fagi.brain.lastPlan?.n ?? 0) + 1, kind: chosen.kind, id: chosen.id ?? null,
    p: CHOICE.mode === 1 ? null : chosen.p ?? 1, explore: c.exploreValue, site: siteExpect };
}

// What batch reports of her choices.
export function choiceSummary(fagi) {
  const c = fagi.brain.choice;
  const r2 = (v) => Math.round(v * 100) / 100;
  if (!c) return { site: 0, explore: 0, exploreShare: null, exploreValue: null, temperature: null, innate: null, volatility: null, outcomes: {}, early: [] };
  const n = c.counts.site + c.counts.explore;
  return {
    site: c.counts.site,
    explore: c.counts.explore,
    exploreShare: n ? r2(c.counts.explore / n) : null,
    exploreValue: r2(c.exploreValue),
    exploreEvidence: r2(c.explore.a + c.explore.b - 2),
    exploreTime: c.exploreTime == null ? null : r2(c.exploreTime),
    temperature: temperatureOf(fagi) == null ? null : r2(temperatureOf(fagi)),
    innate: c.innate == null ? null : r2(c.innate),
    volatility: r2(c.volatility),
    outcomes: c.outcomes,
    early: c.early,
  };
}
