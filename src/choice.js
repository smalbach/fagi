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
// The choice only decides which remembered site, if any, is offered to the
// "provide" tier (decision/provide.js); the fixed hierarchy — survive,
// endure — stays her safety net. Draws randomness only while choosing.

import { CHOICE, SITES, MEMORY, HUNGER, NEST } from './config.js';
import { distanceTo } from './vision.js';
import { habit } from './habits.js';
import { pantryEstimate } from './larder.js';

const LOG_MAX = 40;
const EARLY = 5;

function stateOf(fagi) {
  return (fagi.brain.choice ??= {
    exploreValue: CHOICE.explorePrior,
    innate: null,           // her own share of the noise, drawn the first time she chooses
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

// A normal draw (Box-Muller), for the innate spread.
function gauss() {
  const u = Math.max(1e-12, Math.random());
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// How much noise she chooses with now.
export function temperatureOf(fagi) {
  const c = stateOf(fagi);
  return CHOICE.temper * (c.innate ?? 1) * (1 + CHOICE.surpriseHeat * c.volatility);
}

// What going back to a site is worth: what she expects to find there, less the
// walk. How sure she is doesn't lower it — what she expects already drops
// when she finds it empty — it makes her estimate looser: the less she
// trusts a site, the more its worth wobbles from one choice to the next.
// (CHOICE.trustDiscount = 1: trust multiplies the worth instead, as first
// measured in spec §25.22.)
function siteUtility(fagi, s) {
  const walk = CHOICE.cost * distanceTo(fagi, s) / MEMORY.travelRange;
  if (CHOICE.trustDiscount) return s.value * s.confidence - walk;
  return s.value - walk + CHOICE.doubt * (1 - s.confidence) * gauss();
}

// The options she has now, and what each is worth to her.
export function optionsOf(fagi) {
  const c = stateOf(fagi);
  const out = [{ kind: 'explore', u: c.exploreValue }];
  for (const s of fagi.brain.sites ?? []) {
    if (s.confidence <= 0) continue;
    out.push({ kind: 'site', id: s.id, u: siteUtility(fagi, s) });
  }
  return out;
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
  let r = Math.random() * total;
  for (let i = 0; i < options.length; i++) { r -= w[i]; if (r <= 0) return { ...options[i], p: w[i] / total }; }
  return { ...options.at(-1), p: w.at(-1) / total };
}

// Does she want food now? Her hunger or what the pantry lacks as she remembers it.
function wantsFood(fagi) {
  const hunger = fagi.hunger / HUNGER.max;
  const missing = 1 - Math.min(1, pantryEstimate(fagi) / habit(fagi, 'reserve'));
  return !fagi.carrying && Math.max(hunger, NEST.forageDrive * missing) > 0.15;
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
  if (plan && busy) plan.spent = (plan.spent ?? 0) + Math.max(0, fagi.age - (c.lastAge ?? fagi.age));
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
    const long = (c.plan.spent ?? 0) > CHOICE.exploreWindow;
    if (found || long) {
      const got = found ? Math.min(1, seen.length / SITES.full) : 0;
      const surprise = got - c.exploreValue;
      c.exploreValue += CHOICE.rate * surprise;
      resolve(fagi, found ? 'found' : 'nothing', surprise);
    }
  }

  if (!c.plan && busy && seen.length === 0) {
    c.innate ??= Math.exp(CHOICE.temperSpread * gauss());
    const options = optionsOf(fagi);
    const chosen = pick(fagi, options);
    c.plan = { kind: chosen.kind, id: chosen.id, p: chosen.p ?? 1, at: fagi.age,
      options: options.map((o) => ({ kind: o.kind, id: o.id ?? null, u: Math.round(o.u * 100) / 100 })) };
    c.counts[chosen.kind] += 1;
  }

  if (c.plan?.kind !== 'site') return null;
  return (fagi.brain.sites ?? []).find((s) => s.id === c.plan.id) ?? null;
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
    temperature: r2(temperatureOf(fagi)),
    innate: c.innate == null ? null : r2(c.innate),
    volatility: r2(c.volatility),
    outcomes: c.outcomes,
    early: c.early,
  };
}
