// Free-flow selection (SELECT; LIBERA phase 3, docs/research/libera/README.md).
//
// Her program as it was decides by order: the first line that answers wins
// (winner-take-all). Here the lines past the survival reflexes vote instead
// (Rosenblatt & Payton 1989; Tyrrell 1993): every line whose condition holds
// says what it would do (imagined, so asking changes nothing of hers), with a
// weight, the need it serves times how much that need is worth to her now
// (κ, drive.js). Proposals for the same act on the same target add up, so an
// act that serves two needs gains (Tyrrell's compromise). The most voted wins.
//
//   'freeflow'          votes alone
//   'freeflow+central'  a central selector that holds on: the act she is on
//                       gets SELECT.hold more, so a near tie does not flip her
//                       back and forth (Tyrrell's persistence and contiguous
//                       sequences, the two "?" of his table 10.1)
//
//   SELECT.veto         a critical need is not put to the vote: while one is
//                       past its threshold (the model's own, as in Tyrrell's
//                       requirement 1), only the lines that serve it may win,
//                       the most pressing first; the vote goes on only if none
//                       of them answers. Summed votes put needs of different
//                       kinds on one scale, and a mild hunger made loud by κ
//                       and the bonus outvoted exhaustion (H2b)
//
// The survival tier stays a reflex, first to answer wins, as in any animal: a
// body drowning does not deliberate. The full vote is held every SELECT.every
// seconds; in between, the winning line acts on its own (cheaper, and what an
// animal committed to an act does). With SELECT.mode 'program' nothing here
// runs.

import { SELECT, NEST, THERMAL, HUNGER, THIRST, NEEDS, ENERGY } from '../config.js';
import { energyMax } from '../biology.js';
import { kappaAt } from '../drive.js';
import { pantryEstimate } from '../larder.js';
import { habit } from '../habits.js';
import { imagine } from '../program/imagine.js';

export const selectOn = () => SELECT.mode === 'freeflow' || SELECT.mode === 'freeflow+central';
const central = () => SELECT.mode === 'freeflow+central';

// The need each behavior serves.
const SERVES = {
  urgency: 'hunger', pantry: 'hunger', eatCarried: 'hunger', pursue: 'hunger', scent: 'hunger', memory: 'hunger', zigzag: 'hunger',
  drink: 'thirst', sip: 'thirst', thirstSearch: 'thirst',
  rest: 'energy', sleep: 'sleep',
  thermal: 'thermal', shelter: 'thermal', anticipate: 'thermal', dusk: 'thermal', huddle: 'thermal', shelterRetreat: 'thermal', thermalReflex: 'thermal',
  carry: 'colony', line: 'colony', directive: 'colony', directiveEarly: 'colony', patrol: 'colony',
  taste: 'curiosity', probe: 'curiosity',
};

// When each need is critical, by the model's own thresholds: hunger and thirst
// at NEEDS.critical, tiredness where she goes to rest (ENERGY.tired), thermal
// stress where the reflex takes her home (THERMAL.reflex).
export const criticalAt = () => ({
  hunger: NEEDS.critical,
  thirst: NEEDS.critical,
  energy: 1 - ENERGY.tired / ENERGY.max,
  thermal: THERMAL.reflex,
});

export function deficits(fagi) {
  return {
    hunger: fagi.hunger / HUNGER.max,
    thirst: fagi.thirst / THIRST.max,
    energy: 1 - fagi.energy / energyMax(fagi),
    thermal: THERMAL.enabled ? (fagi.thermalStress ?? 0) / THERMAL.maxStress : 0,
  };
}

// The needs past their threshold, the most pressing (furthest past it) first.
export function criticalNeeds(fagi) {
  const d = deficits(fagi);
  const at = criticalAt();
  return Object.keys(at).filter((k) => d[k] >= at[k]).sort((a, b) => d[b] / at[b] - d[a] / at[a]);
}

// How loud each need is right now (0-1), before what it is worth to her.
function levels(fagi, ctx) {
  const missing = 1 - Math.min(1, pantryEstimate(fagi) / Math.max(1e-9, habit(fagi, 'reserve')));
  return {
    hunger: ctx.hungerU ?? 0,
    thirst: ctx.thirstU ?? 0,
    energy: 1 - (ctx.energyU ?? 1),
    sleep: fagi.sleepPressure ?? 0,
    thermal: THERMAL.enabled ? (fagi.thermalStress ?? 0) / THERMAL.maxStress + (fagi.thermalFeel ? 0.3 : 0) : 0,
    colony: NEST.forageDrive * missing,
    curiosity: SELECT.curiosity,
  };
}

// One line's vote: the need it serves, at its level, times what that need is
// worth to her (κ: learned with DRIVE 'learned', the innate curve otherwise).
function voteOf(fagi, need, lv) {
  const level = lv[need] ?? 0;
  if (need === 'hunger' || need === 'thirst') return level * kappaAt(fagi.brain, need, level) + SELECT.floor;
  return level + SELECT.floor;
}

// Same act on the same target: one proposal.
const keyOf = (intent) => `${intent.action}|${intent.target?.id ?? (intent.target ? `${Math.round(intent.target.x)},${Math.round(intent.target.y)}` : '-')}`;

// The vote, over the lines from `from` on. Returns the winning line or null.
function vote(fagi, world, ctx, dt, lines, from, holds, executeLine, only = null) {
  const lv = levels(fagi, ctx);
  const tally = new Map();
  for (let i = from; i < lines.length; i++) {
    const l = lines[i];
    if (l.retired || !holds(l, fagi, ctx)) continue;
    const res = imagine(fagi, (her) => executeLine(l, her, world, ctx, dt));
    if (!res) continue;
    if (only && SERVES[res.step] !== only) continue;
    const k = keyOf(res.intent);
    // What is within reach is to be consumed, not looked for (Tyrrell 4–5).
    const t0 = res.intent.target;
    const near = t0 && t0.x != null && Math.hypot(t0.x - fagi.x, t0.y - fagi.y) <= SELECT.reach;
    const v = voteOf(fagi, SERVES[res.step] ?? 'colony', lv) * (near ? 1 + SELECT.consume : 1);
    const t = tally.get(k) ?? { votes: 0, line: l, index: i, top: -Infinity };
    t.votes += v;
    if (v > t.top) { t.top = v; t.line = l; t.index = i; }   // the line that speaks for it: its loudest voter
    tally.set(k, t);
  }
  let best = null;
  const now = fagi.selected?.key;
  for (const [k, t] of tally) {
    const score = t.votes + (central() && k === now ? SELECT.hold : 0);
    if (!best || score > best.score) best = { key: k, score, ...t };
  }
  return best;
}

// The free-flow walk: the survival reflexes first (first to answer wins), then
// the vote. Returns the walk record decision.js expects, or null to let the
// program's own walk go on (nothing voted).
export function selectByVotes(fagi, world, ctx, dt, lines, { holds, executeLine }) {
  let from = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.tier !== 'survive') { from = i; break; }
    if (l.retired || !holds(l, fagi, ctx)) continue;
    const res = executeLine(l, fagi, world, ctx, dt);
    if (res) { fagi.selected = null; return { intent: res.intent, who: { tier: l.tier, rule: res.step, line: l.id }, kind: 'line', line: l, index: i }; }
  }
  // A critical need is not voted on: the lines that serve it, if any answers.
  const critical = SELECT.veto ? criticalNeeds(fagi) : [];
  // Between votes, the winner goes on acting while it still answers (unless a
  // critical need it does not serve has come up).
  const held = fagi.selected;
  if (held && (fagi.age ?? 0) < held.until && (!critical.length || critical.includes(held.serves))) {
    const i = lines.findIndex((x) => x.id === held.line);
    const l = lines[i];
    if (l && !l.retired && holds(l, fagi, ctx)) {
      const res = executeLine(l, fagi, world, ctx, dt);
      if (res) return { intent: res.intent, who: { tier: l.tier, rule: res.step, line: l.id }, kind: 'line', line: l, index: i };
    }
  }
  let best = null;
  for (const need of critical) if ((best = vote(fagi, world, ctx, dt, lines, from, holds, executeLine, need))) break;
  best ??= vote(fagi, world, ctx, dt, lines, from, holds, executeLine);
  if (!best) { fagi.selected = null; return null; }
  // The winner acts for real now (what she imagined, she does).
  const res = executeLine(best.line, fagi, world, ctx, dt);
  if (!res) { fagi.selected = null; return null; }
  fagi.selected = { key: best.key, line: best.line.id, serves: SERVES[res.step] ?? 'colony', until: (fagi.age ?? 0) + SELECT.every };
  return { intent: res.intent, who: { tier: best.line.tier, rule: res.step, line: best.line.id }, kind: 'line', line: best.line, index: best.index };
}
