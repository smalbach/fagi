// How she writes her own rules of conduct (docs/research/plan-reglas-de-conducta.md,
// step 3): from her bites, never from what a fruit really is.
//
// Propose. After a bite that harmed her, every line the grammar allows that
// would have changed THAT bite: its conditions come from the moment (the
// kind was new to her, or had harmed her before, or had harmed her mostly;
// her hunger then, bounded by the step above or below it; one trait of its
// look, or none) and its action is a trial bite (if the bite was whole) or
// leaving it.
//
// Judge (the gate). Each candidate is replayed over every bite she has
// recorded: what her hunger would have done had the line been there. A trial
// bite does a quarter of what the bite did; leaving it, nothing — no harm and
// no food. What she weighs is how close to the top it left her: danger(h) =
// (h / max)^CONDUCT.power, so a harm near starving counts far more than a
// meal missed while sated. That one convexity is the valuation, set before
// any tuning. A line is kept only if, over her whole record, it would have
// left her safer, with at least CONDUCT.minSupport harmful bites behind it,
// and never worse on the bites she took while already very hungry.
//
// Keep. At most one new line per harmful bite: the one that would have
// helped most; among near ties, the one that says least. It enters with a
// low weight, and after every bite each line she wrote is judged again on
// her whole record: when it no longer pays, she retires it.
//
// CONDUCT.learn = 0: she writes nothing (only lines she was born with act).

import { CONDUCT, HUNGER, EXPERIMENT } from '../config.js';
import { cuesOf } from './cues.js';
import { conduct, conductOf, HUNGER_STEPS } from './conduct.js';

const HIGH = 75;           // bites taken from this hunger on must not come out worse
const TIE = 0.9;           // within this share of the best, the simpler line wins
const WEIGHT0 = 0.3;

const danger = (h) => Math.min(1, Math.max(0, h / HUNGER.max)) ** CONDUCT.power;

// Did a line's conditions hold at the moment of a recorded bite?
function heldAt(r, m) {
  const w = r.if;
  if (w.novel && !m.novel) return false;
  if (w.harmed && !m.harmedBefore) return false;
  if (w.harmedMostly && !m.harmedMostly) return false;
  if (w.hungerBelow != null && !(m.before < w.hungerBelow)) return false;
  if (w.hungerFrom != null && !(m.before >= w.hungerFrom)) return false;
  if (w.traits && !w.traits.every((c) => cuesOf(m.key).includes(c))) return false;
  return true;
}

// What her hunger would have been after this bite under the line's action.
function afterWith(act, m) {
  const delta = m.after - m.before;
  if (act === 'leave') return m.before;
  if (act === 'taste') return m.before + delta * Math.min(1, EXPERIMENT.portion / Math.max(m.portion, 1e-6));
  return m.after;
}

// The gate: how a line would have done over her record.
//
// Version 1 (CONDUCT.valuation 'static', discarded): each bite judged alone,
// as if a meal left behind cost only what it would have eased right then. It
// wrote "leave everything while not very hungry": food missed while sated
// looked free.
//
// Version 2 ('trajectory'): her hunger is a stock. What a line changes in one
// bite carries on to the next ones — a meal left behind is still missing
// later, a harm avoided is still spared — fading as she makes up for it, at
// the pace she usually eats (half of it gone after the median gap between
// her bites). Every recorded bite is then judged at the hunger she would
// have had.
const clampH = (h) => Math.min(HUNGER.max, Math.max(0, h));

function medianGap(meals) {
  const gaps = [];
  for (let i = 1; i < meals.length; i++) gaps.push(meals[i].at - meals[i - 1].at);
  if (!gaps.length) return 60;
  gaps.sort((a, b) => a - b);
  return Math.max(30, gaps[Math.floor(gaps.length / 2)]);
}

export function replay(r, meals) {
  let gain = 0; let pro = 0; let con = 0; let high = 0;
  if (CONDUCT.valuation === 'static') {
    for (const m of meals) {
      if (!heldAt(r, m)) continue;
      const cf = afterWith(r.do, m);
      if (cf === m.after) continue;
      const g = danger(m.after) - danger(cf);
      gain += g;
      if (m.harmed) pro += 1; else con += 1;
      if (m.before >= HIGH) high += g;
    }
    return { gain, pro, con, high };
  }
  const half = medianGap(meals);
  let shift = 0;
  let t = meals[0]?.at ?? 0;
  for (const m of meals) {
    shift *= 0.5 ** ((m.at - t) / half);
    t = m.at;
    const before = clampH(m.before + shift);
    let delta = m.after - m.before;
    if (heldAt(r, m)) {
      const cf = afterWith(r.do, m) - m.before;
      if (cf !== delta) { if (m.harmed) pro += 1; else con += 1; }
      shift += cf - delta;
      delta = cf;
    }
    const after = clampH(before + delta);
    const g = danger(m.after) - danger(after);
    gain += g;
    if (m.before >= HIGH || before >= HIGH) high += g;
  }
  return { gain, pro, con, high };
}

const passes = (s) => s.gain > 0 && s.pro >= CONDUCT.minSupport && s.high >= 0;

const idOf = (cond, act) => {
  const parts = [act];
  for (const f of ['novel', 'harmed', 'harmedMostly']) if (cond[f]) parts.push(f.toLowerCase());
  if (cond.hungerFrom != null) parts.push(`from${cond.hungerFrom}`);
  if (cond.hungerBelow != null) parts.push(`below${cond.hungerBelow}`);
  for (const t of cond.traits ?? []) parts.push(t.replace(':', '-'));
  return parts.join('-').slice(0, 64);
};

// Every line that would have changed this bite.
export function candidates(m) {
  const kinds = [{}];
  if (m.novel) kinds.push({ novel: true });
  if (m.harmedBefore) kinds.push({ harmed: true });
  if (m.harmedMostly) kinds.push({ harmedMostly: true });
  const above = HUNGER_STEPS.find((s) => m.before < s);
  const below = [...HUNGER_STEPS].reverse().find((s) => m.before >= s);
  const hungers = [{}, ...(above != null ? [{ hungerBelow: above }] : []), ...(below != null ? [{ hungerFrom: below }] : [])];
  const looks = [{}, ...cuesOf(m.key).map((c) => ({ traits: [c] }))];
  const acts = m.portion > EXPERIMENT.portion + 1e-6 ? ['taste', 'leave'] : ['leave'];
  const out = [];
  for (const k of kinds) for (const h of hungers) for (const l of looks) {
    const cond = { ...k, ...h, ...l };
    if (!Object.keys(cond).length) continue;
    for (const act of acts) out.push({ if: cond, do: act });
  }
  return out;
}

const said = (cond) => Object.keys(cond).length + (cond.traits ? cond.traits.length - 1 : 0);
const sameIf = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// After each bite she recorded (conduct.js noteMeal).
export function learnConduct(fagi, meal) {
  if (!CONDUCT.enabled || !CONDUCT.learn) return;
  const c = conductOf(fagi);
  const log = (c.stats ??= { proposed: 0, kept: 0, retired: 0, rejected: 0 });
  review(fagi, c);
  if (!meal.harmed) return;
  const ok = [];
  for (const cand of candidates(meal)) {
    if (c.list.some((r) => !r.retired && r.do === cand.do && sameIf(r.if, cand.if))) continue;
    log.proposed += 1;
    const s = replay(cand, c.meals);
    if (CONDUCT.gate && !passes(s)) { log.rejected += 1; continue; }
    ok.push({ cand, s });
  }
  if (!ok.length) return;
  const top = Math.max(...ok.map((x) => x.s.gain));
  const best = ok.filter((x) => x.s.gain >= top * TIE)
    .sort((a, b) => said(a.cand.if) - said(b.cand.if) || b.s.gain - a.s.gain)[0];
  const id = idOf(best.cand.if, best.cand.do);
  const old = c.list.findIndex((r) => r.id === id);
  if (old >= 0) c.list.splice(old, 1);   // a retired line written again
  c.list.push(conduct(id, {
    if: best.cand.if, do: best.cand.do, weight: WEIGHT0, tries: 1, pro: best.s.pro, con: best.s.con,
    stage: 'short', learnedAt: Math.round(fagi.age * 10) / 10, source: 'self',
    why: `${best.s.pro} bites it would have spared, ${best.s.con} it would have cost`,
  }));
  log.kept += 1;
  fagi.brain.lastConduct = { n: (fagi.brain.lastConduct?.n ?? 0) + 1, id, kind: 'written' };
}

// Every line she wrote, judged again on her whole record.
function review(fagi, c) {
  for (const r of c.list) {
    if (r.retired || r.source !== 'self') continue;
    const s = replay(r, c.meals);
    r.pro = s.pro; r.con = s.con;
    r.tries += 1;
    if (CONDUCT.retire && !(s.gain > 0 && s.high >= 0)) {
      r.retired = true;
      r.retiredAt = Math.round(fagi.age * 10) / 10;
      c.stats.retired += 1;
      fagi.brain.lastConduct = { n: (fagi.brain.lastConduct?.n ?? 0) + 1, id: r.id, kind: 'retired' };
      continue;
    }
    r.weight = Math.min(1, Math.round((WEIGHT0 + 0.1 * s.pro) * 100) / 100);
    r.stage = r.tries >= 10 ? 'long' : r.tries >= 3 ? 'medium' : 'short';
  }
}
