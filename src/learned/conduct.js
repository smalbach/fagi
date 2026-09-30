// Rules of conduct (docs/research/plan-reglas-de-conducta.md): lines of her
// own code about HOW to act with a fruit, where the rules of dsl.js say only
// WHAT is good or bad. "A kind I never ate, while not too hungry: a trial
// bite first." "A kind that has harmed me as often as it fed me: leave it."
//
// A rule is data, never a function, printed as one line of real JavaScript
// (`conduct('taste-novel', {...})`) and read back with JSON.parse, no eval.
// `conduct()` is the only gatekeeper, as `rule()` is for the others: whoever
// writes a rule — she, the night, an elder at birth, or research — goes
// through it.
//
// The grammar, all of it:
//   if    what must hold, all of it:
//           novel         she has never eaten this kind
//           harmed        it has harmed her at least once
//           harmedMostly  it has harmed her at least once, and as often as it fed her
//           hungerBelow   her hunger is below one of HUNGER_STEPS
//           hungerFrom    her hunger is at least one of HUNGER_STEPS
//           traits        its look has all of these traits (1 to 3)
//         (novel and harmed / harmedMostly never together: nothing can be both)
//   do    'taste' (a trial bite) | 'leave' | 'eat' | 'carry'
// and the life every learned line has: weight, tries, pro/con, stage,
// retired, where it came from.
//
// What she knows of each kind is her own record here (`kinds`), from the
// bites she felt: whether her hunger rose after it. And every bite is kept
// (`meals`, capped) with what the rules of conduct need to be judged later:
// the portion, whether the kind was new to her, whether it had harmed her
// before, and her hunger before and after.
//
// CONDUCT.enabled = 0: nothing is recorded and no rule of conduct exists.

import { CONDUCT } from '../config.js';
import { cuesOf } from './cues.js';

export const HUNGER_STEPS = [45, 60, 75, 90];

// Caution when eating: the two lines the game's Fagi is born with
// (docs/research/caution-protocol.md, confirmed on 200 unused worlds: with
// wild species she survives 0.073 more, poisoned 4 times instead of 29; on
// the classic map, no worse). A kind never eaten, a trial bite first while
// not too hungry; a kind that harmed her as often as it fed her, never again.
export const CAUTION_LINES = [
  { id: 'taste-novel', if: { novel: true, hungerBelow: 75 }, do: 'taste' },
  { id: 'leave-harmed-mostly', if: { harmedMostly: true }, do: 'leave' },
];
export const ACTIONS = ['taste', 'leave', 'eat', 'carry'];
const FLAGS = ['novel', 'harmed', 'harmedMostly'];
const VALID_ID = /^[a-z0-9-]{1,64}$/;
const CUE_FORM = /^(color|shape|smell):[a-z]{1,20}$/;
const SOURCES = ['born', 'self', 'night', 'told'];
const STAGES = ['short', 'medium', 'long'];
const MEALS = 200;

function fail(msg) {
  throw new Error(`invalid rule of conduct: ${msg}`);
}
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isCount = (v) => Number.isInteger(v) && v >= 0;

function validateIf(cond) {
  if (!cond || typeof cond !== 'object' || Array.isArray(cond)) fail('"if" is missing');
  const extra = Object.keys(cond).filter((k) => ![...FLAGS, 'hungerBelow', 'hungerFrom', 'traits'].includes(k));
  if (extra.length) fail(`unknown conditions: ${extra.join(', ')}`);
  const out = {};
  for (const f of FLAGS) {
    if (cond[f] === undefined) continue;
    if (cond[f] !== true) fail(`"${f}" can only be true`);
    out[f] = true;
  }
  if (out.novel && (out.harmed || out.harmedMostly)) fail('a kind never eaten cannot have harmed her');
  for (const h of ['hungerBelow', 'hungerFrom']) {
    if (cond[h] === undefined) continue;
    if (!HUNGER_STEPS.includes(cond[h])) fail(`"${h}" must be one of ${HUNGER_STEPS.join(', ')}`);
    out[h] = cond[h];
  }
  if (out.hungerBelow != null && out.hungerFrom != null && out.hungerFrom >= out.hungerBelow) fail('no hunger is both');
  if (cond.traits !== undefined) {
    const t = cond.traits;
    if (!Array.isArray(t) || t.length < 1 || t.length > 3) fail('"traits" must list 1 to 3 traits');
    if (t.some((c) => typeof c !== 'string' || !CUE_FORM.test(c))) fail('"traits" has a malformed trait');
    if (new Set(t).size !== t.length) fail('"traits" repeats a trait');
    out.traits = [...t].sort();
  }
  if (!Object.keys(out).length) fail('"if" must say something');
  return out;
}

// conduct(id, spec) → the validated rule, or throws with a readable reason.
// spec: { if, do, weight, tries, pro?, con?, stage, learnedAt, revisedAt?, source, retired?, retiredAt?, why? }
export function conduct(id, spec) {
  if (typeof id !== 'string' || !VALID_ID.test(id)) fail(`id "${id}" is malformed`);
  if (!spec || typeof spec !== 'object') fail('the body is missing');
  const { if: cond, do: act, weight, tries, pro, con, stage, learnedAt, revisedAt, source, retired, retiredAt, why, ...rest } = spec;
  const extra = Object.keys(rest);
  if (extra.length) fail(`unknown fields: ${extra.join(', ')}`);
  const when = validateIf(cond);
  if (!ACTIONS.includes(act)) fail(`"do" must be ${ACTIONS.join('|')}`);
  if (!isNumber(weight) || weight < 0 || weight > 1) fail('"weight" must be within 0..1');
  if (!isCount(tries)) fail('"tries" must be an integer ≥ 0');
  if (pro !== undefined && !isCount(pro)) fail('"pro" must be an integer ≥ 0');
  if (con !== undefined && !isCount(con)) fail('"con" must be an integer ≥ 0');
  if (!STAGES.includes(stage)) fail(`"stage" must be ${STAGES.join('|')}`);
  if (!isNumber(learnedAt)) fail('"learnedAt" must be numeric');
  if (revisedAt !== undefined && !isNumber(revisedAt)) fail('"revisedAt" must be numeric');
  if (!SOURCES.includes(source)) fail(`"source" must be ${SOURCES.join('|')}`);
  if (retired !== undefined && typeof retired !== 'boolean') fail('"retired" must be a boolean');
  if (retiredAt !== undefined && !isNumber(retiredAt)) fail('"retiredAt" must be numeric');
  if (why !== undefined && (typeof why !== 'string' || why.length > 160)) fail('"why" must be a short text');
  return {
    id, if: when, do: act, weight, tries,
    ...(pro !== undefined ? { pro } : {}), ...(con !== undefined ? { con } : {}),
    stage, learnedAt, ...(revisedAt !== undefined ? { revisedAt } : {}), source,
    ...(retired ? { retired: true, retiredAt: retiredAt ?? learnedAt } : {}),
    ...(why ? { why } : {}),
  };
}

// One line of code per rule; the object is valid JSON.
export const renderConduct = (r) => `conduct('${r.id}', ${JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')))});`;

const LINE = /^conduct\('([a-z0-9-]{1,64})', (\{.*\})\);$/;
export function parseConduct(line) {
  const m = LINE.exec(line.trim());
  if (!m) fail('not a line of conduct');
  return conduct(m[1], JSON.parse(m[2]));
}

// How many different rules the grammar allows (the size of what "discovering" means).
export function grammarSize(traitsMet = 0) {
  const kinds = 1 + 3;                       // nothing said, novel, harmed, harmedMostly
  const hunger = 1 + HUNGER_STEPS.length * 2 + (HUNGER_STEPS.length * (HUNGER_STEPS.length - 1)) / 2;
  let traits = 1;
  for (let k = 1; k <= 3; k++) traits += choose(traitsMet, k);
  return kinds * hunger * traits * ACTIONS.length - ACTIONS.length;   // minus "if says nothing"
}
function choose(n, k) {
  if (k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

// --- her conduct: the rules and the record ---------------------------------

// Her rules of conduct and her record of kinds, made the first time asked;
// born with CONDUCT.born (validated, as any line).
// A born line needs only { id, if, do }: then it starts trusted and settled.
// One inherited from a mother (research lineages) also brings what her line
// had gathered before this life — { pro, con, gain } in `lineage` — which
// the learner (conduct-learn.js) adds to what this life shows.
export function conductOf(fagi) {
  if (fagi.brain.conduct) return fagi.brain.conduct;
  const base = {};
  const list = (CONDUCT.born ?? []).map(({ id, lineage, ...spec }) => {
    if (lineage) base[id] = { pro: lineage.pro ?? 0, con: lineage.con ?? 0, gain: lineage.gain ?? 0, lives: lineage.lives ?? 0 };
    return conduct(id, { weight: 1, tries: 0, stage: 'long', ...spec, source: 'born', learnedAt: 0 });
  });
  fagi.brain.conduct = { list, kinds: {}, meals: [], base, declined: [], declinedIds: [] };
  return fagi.brain.conduct;
}

// What she knows of a kind, from her own bites.
export function knownOf(fagi, key) {
  const k = conductOf(fagi).kinds[key];
  return { bites: k?.bites ?? 0, harms: k?.harms ?? 0, fed: k?.fed ?? 0 };
}

// Every bite she takes (feeding.js eat), recorded while CONDUCT is on.
export function noteMeal(fagi, { key, portion, before, after }) {
  if (!CONDUCT.enabled) return null;
  const c = conductOf(fagi);
  const k = (c.kinds[key] ??= { bites: 0, harms: 0, fed: 0 });
  const harmed = after > before;
  c.meals.push({
    key, at: Math.round(fagi.age * 10) / 10, portion: Math.round(portion * 100) / 100,
    novel: k.bites === 0, harmedBefore: k.harms > 0, harmedMostly: k.harms > 0 && k.harms >= k.fed,
    before: Math.round(before * 10) / 10, after: Math.round(after * 10) / 10, harmed,
  });
  if (c.meals.length > MEALS) c.meals.shift();
  k.bites += 1;
  if (harmed) k.harms += 1; else k.fed += 1;
  return c.meals.at(-1);
}

// A fruit she wanted and left because a line of hers said so (CONDUCT.declined):
// once per fruit, only while hungry enough to eat. What she would have got
// from it she never learns, but the line must answer for having left it.
export function noteDeclined(fagi, key, ref, hungerFrom) {
  if (!CONDUCT.enabled || !CONDUCT.declined || fagi.hunger < hungerFrom) return false;
  const c = conductOf(fagi);
  const id = ref?.id ?? null;
  if (id != null && c.declinedIds.includes(id)) return false;
  if (id != null) { c.declinedIds.push(id); if (c.declinedIds.length > 50) c.declinedIds.shift(); }
  const k = c.kinds[key];
  c.declined.push({
    key, at: Math.round(fagi.age * 10) / 10, before: Math.round(fagi.hunger * 10) / 10,
    novel: !k || k.bites === 0, harmedBefore: (k?.harms ?? 0) > 0, harmedMostly: (k?.harms ?? 0) > 0 && k.harms >= k.fed,
  });
  if (c.declined.length > MEALS) c.declined.shift();
  return true;
}

// A way out of every ban (CONDUCT.explore, revision 2): now and then she
// breaks a line that makes her leave a fruit she wants, with a trial bite.
// Decided once per fruit, from a stream of her own seeded once from hers, so
// looking at the same fruit twice does not ask twice.
export function breaksBan(fagi, ref, hungerFrom) {
  if (!CONDUCT.enabled || !CONDUCT.explore) return false;
  if (fagi.hunger < hungerFrom || fagi.hunger >= CONDUCT.exploreBelow) return false;
  const c = conductOf(fagi);
  const id = ref?.id;
  if (id == null) return false;
  c.explored ??= {};
  if (id in c.explored) return c.explored[id];
  c.stream ??= Math.floor(Math.random() * 4294967296) >>> 0;
  c.stream = (c.stream + 0x6D2B79F5) >>> 0;
  let t = Math.imul(c.stream ^ (c.stream >>> 15), c.stream | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const draw = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  const keys = Object.keys(c.explored);
  if (keys.length > 100) delete c.explored[keys[0]];
  c.explored[id] = draw < CONDUCT.explore;
  if (c.explored[id]) c.exploredCount = (c.exploredCount ?? 0) + 1;
  return c.explored[id];
}

// Does a rule's `if` hold for this kind, now?
export function holds(fagi, r, key, hunger = fagi.hunger) {
  const w = r.if;
  const k = knownOf(fagi, key);
  if (w.novel && k.bites > 0) return false;
  if (w.harmed && k.harms === 0) return false;
  if (w.harmedMostly && !(k.harms > 0 && k.harms >= k.fed)) return false;
  if (w.hungerBelow != null && !(hunger < w.hungerBelow)) return false;
  if (w.hungerFrom != null && !(hunger >= w.hungerFrom)) return false;
  if (w.traits && !w.traits.every((c) => cuesOf(key).includes(c))) return false;
  return true;
}

// Which of her live rules speaks for this kind now, by precedence: leaving
// first (the cautious answer wins), then a trial bite, then eating, then carrying.
const PRECEDENCE = ['leave', 'taste', 'eat', 'carry'];
export function ruling(fagi, key, hunger = fagi.hunger) {
  if (!CONDUCT.enabled) return null;
  const live = conductOf(fagi).list.filter((r) => !r.retired && holds(fagi, r, key, hunger));
  for (const act of PRECEDENCE) {
    const r = live.find((x) => x.do === act);
    if (r) return r;
  }
  return null;
}

// What batch reports of her conduct in a life.
export function conductSummary(fagi) {
  const c = fagi.brain.conduct;
  if (!c) return null;
  return {
    lines: c.list.map((r) => ({
      id: r.id, if: r.if, do: r.do, source: r.source, at: r.learnedAt, retired: r.retired ? r.retiredAt : null,
      pro: r.pro ?? null, con: r.con ?? null, weight: r.weight, tries: r.tries, stage: r.stage,
      lineage: c.lineage?.[r.id] ?? null,
    })),
    stats: c.stats ?? null,
    explored: c.exploredCount ?? 0,
    bites: c.meals.length,
  };
}
