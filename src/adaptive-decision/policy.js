// The adaptive judge's policy (step 3): at the bite point
// (src/decision/bite.js), compare what each action would lead to, with the
// model of consequences (model.js), and take the one least likely to kill her.
//
// What kills, as the model sees it: a harmful bite that takes her hunger to
// the top, or going hungry longer than it usually takes her to find a safe
// meal. Both come from what she has learned (harm, relief, her hunger's pace,
// the time between safe meals), not from the world's numbers.
//
// Horizon 2 (HORIZON): each action is followed by what she learns from it and
// a second decision about the same kind (another fruit of it is often right
// there): a trial bite is worth what it lets her do next. Horizon 1 (the
// ablation) looks only at what the bite itself does.
//
// Hungry, she weighs eating, a trial bite and leaving it. Not hungry, she
// eats nothing whole: she gives a kind she never ate a trial bite, carries
// home what probably feeds, and leaves the rest — the one exploration rule.

import { CARRY, EXPERIMENT } from '../config.js';
import { pantryEstimate, roomAtHome } from '../larder.js';
import { habit } from '../habits.js';
import { observe, lookOf } from './observation.js';
import { createModel, predict, learn } from './model.js';

const NEXT = 0.6;              // chance another fruit of the same kind is at hand
const CARRY_BELOW = 0.34;      // store only what probably feeds
const TIE = 1e-4;              // among equal risks, less hunger

const logistic = (x) => 1 / (1 + Math.exp(-x));

const HOME = 60;               // v2: seconds she allows for getting home to a safe ration

// She starves before her next safe meal: how likely, at hunger h. Version 2:
// a ration at home she believes safe (the pantry as she remembers it) is a
// safe meal within reach.
function starve(model, h, max, homeSafe = false) {
  const left = (max - h) / Math.max(1e-3, model.rate.mean);
  const wait = homeSafe ? Math.min(HOME, model.between.mean) : model.between.mean;
  return logistic((wait - left) / (0.25 * wait));
}

// Is there a ration at home she believes safe?
const SAFE = 0.25;
function safeAtHome(model, obs) {
  if (model.version < 2) return false;
  return Object.entries(obs.pantry).some(([k, n]) => n > 0 && predict(model, k, lookOf(k)).p < SAFE);
}

// A bite of `portion` with harm probability p: its two outcomes.
function branches(model, h, max, p, portion) {
  const bad = h + portion * model.harm.mean;
  return [
    { prob: p, h: Math.min(max, bad), dies: bad >= max, harmed: true },
    { prob: 1 - p, h: Math.max(0, h - portion * model.relief.mean), dies: false, harmed: false },
  ];
}

// Risk of dying, after doing `action` now (and, at horizon 2, deciding once more).
function riskOf(model, horizon, h, max, pred, action, home = false) {
  if (action === 'leave') return starve(model, h, max, home) + TIE * h;
  const portion = action === 'taste' ? EXPERIMENT.portion : 1;
  let risk = 0;
  for (const b of branches(model, h, max, pred.p, portion)) {
    if (b.prob <= 0) continue;
    if (b.dies) { risk += b.prob; continue; }
    let after = starve(model, b.h, max, home) + TIE * b.h;
    if (horizon >= 2) {
      // What she would believe of this kind after this bite, and her next call on it.
      const n = pred.evidence + 2;
      const p2 = (pred.p * n + (b.harmed ? portion : 0)) / (n + portion);
      const w = model.version >= 2 ? 1 : portion;
      const p2v = model.version >= 2 ? (pred.p * n + (b.harmed ? 1 : 0)) / (n + 1) : p2;
      const eatAgain = riskOf(model, 1, b.h, max, { p: p2v, evidence: n + w }, 'eat', home);
      after = NEXT * Math.min(after, eatAgain) + (1 - NEXT) * after;
    }
    risk += b.prob * after;
  }
  return risk;
}

// Her state for this judge, and what she learned since last asked.
function stateOf(fagi, opts) {
  const s = (fagi.adaptive ??= { model: createModel({ adaptive: opts.adaptive, version: opts.version }), pending: null, counts: { eat: 0, taste: 0, carry: 0, leave: 0 }, log: [] });
  const obs = observe(fagi);
  const portionOf = (meal) => (s.pending && s.pending.key === meal.key ? s.pending.portion : 1);
  if (learn(s.model, obs, portionOf, lookOf)) s.pending = null;
  return { s, obs };
}

function best(model, horizon, obs, key, actions) {
  const pred = predict(model, key, lookOf(key));
  const home = safeAtHome(model, obs);
  const risks = actions.map((a) => ({ a, r: riskOf(model, horizon, obs.hunger, obs.hungerMax, pred, a, home) }));
  return { choice: risks.reduce((x, y) => (y.r < x.r ? y : x)).a, pred, risks };
}

function note(fagi, s, key, choice, pred) {
  s.counts[choice] += 1;
  s.log.push({ t: Math.round(fagi.age), key, choice, p: Math.round(pred.p * 100) / 100, n: Math.round(pred.evidence * 10) / 10, h: Math.round(fagi.hunger) });
  if (s.log.length > 40) s.log.shift();
  if (choice === 'eat' || choice === 'taste') s.pending = { key, portion: choice === 'taste' ? EXPERIMENT.portion : 1 };
}

const hungry = (obs) => obs.hunger >= CARRY.eatBelow;
const mayCarry = (fagi, p) => !fagi.carrying && !p.refuse && pantryEstimate(fagi) < habit(fagi, 'reserve') && roomAtHome(fagi);

// A judge for the bite point. `horizon` 2 or 1; `adaptive` false: evidence never fades.
export function adaptiveJudge({ horizon = 2, adaptive = true, version = 2 } = {}) {
  const opts = { horizon, adaptive, version };
  const decideOn = (fagi, key, { canCarry = false } = {}) => {
    const { s, obs } = stateOf(fagi, opts);
    const pred = predict(s.model, key, lookOf(key));
    if (hungry(obs)) return { s, ...best(s.model, horizon, obs, key, ['eat', 'taste', 'leave']) };
    if (pred.evidence < 1 && !branches(s.model, obs.hunger, obs.hungerMax, pred.p, EXPERIMENT.portion)[0].dies) return { s, choice: 'taste', pred };
    return { s, choice: canCarry && pred.p < CARRY_BELOW ? 'carry' : 'leave', pred };
  };
  return {
    ground(fagi, p) {
      const d = decideOn(fagi, p.type, { canCarry: mayCarry(fagi, p) });
      note(fagi, d.s, p.type, d.choice, d.pred);
      return d.choice;
    },
    pantry(fagi, keys) {
      const { s, obs } = stateOf(fagi, opts);
      let pick = null;
      for (const k of keys) {
        const d = best(s.model, horizon, obs, k, ['eat', 'leave']);
        const r = d.risks.find((x) => x.a === 'eat').r;
        if (d.choice === 'eat' && (!pick || r < pick.r)) pick = { k, r, pred: d.pred };
      }
      // Asked also to plan a trip home (decision/common.js): only a bite is noted.
      if (pick && fagi.perceived?.inNest) note(fagi, s, pick.k, 'eat', pick.pred);
      return pick?.k ?? null;
    },
    carried(fagi, key) {
      const { s, obs } = stateOf(fagi, opts);
      const d = best(s.model, horizon, obs, key, ['eat', 'leave']);
      if (d.choice === 'eat') note(fagi, s, key, 'eat', d.pred);
      return d.choice === 'eat';
    },
    wants(fagi, c) {
      return decideOn(fagi, c.key, { canCarry: !fagi.carrying }).choice !== 'leave';
    },
  };
}

// What batch reports of this judge in a life.
export function adaptiveSummary(fagi) {
  const s = fagi.adaptive;
  if (!s) return null;
  const r2 = (v) => Math.round(v * 100) / 100;
  const m = s.model;
  return {
    counts: s.counts, bites: m.bites, volatility: r2(m.volatility),
    harm: r2(m.harm.mean), relief: r2(m.relief.mean), rate: r2(m.rate.mean * 1000) / 1000, between: Math.round(m.between.mean),
    kinds: Object.keys(m.kinds).length, recent: s.log.slice(-8),
  };
}
