// Learning from one bad moment (one-trial learning).
//
// program/learn.js needs many moments on each side before it moves a line: a
// whole life may not hold enough. A real animal does not wait for a second
// near-death to change what it does. This is the other way in: one acute
// crisis, lived, can write one line — but everything in the line comes from
// what she lived, nothing from a table of answers.
//
//   onset     her distress (program/watch.js, the same measure, read back as a
//             share of the top) crosses PROGRAM.crisisThreshold and has risen
//             by PROGRAM.crisisRise over the last LOOKBACK seconds: acute, not
//             a need that crept up.
//   culprit   the root that led most over those LOOKBACK seconds: what she was
//             doing as it came on. Never a survive line (nothing goes in front
//             of one).
//   episode   from the onset until her distress falls back under the
//             threshold (or EPISODE_MAX). For every root that leads in it she
//             counts the seconds and how much her distress fell or rose
//             meanwhile.
//   reliever  the root under which her distress fell most, if it fell at all,
//             led at least MIN_LEAD seconds and is not the culprit.
//   the line  the reliever's behavior in front of the culprit's line, where
//             the situation at the onset held (one clause: a flag that was on,
//             or else the need that hurt most, at its step). If the reliever
//             already stands before the culprit, or the grammar cannot say
//             what held, nothing is written.
//   judged    a crisis line answers to her next crises: one whose situation
//             met its clause and under which its behavior led without
//             bringing her distress down retires it. A crisis it was meant
//             for that came on all the same, with the culprit leading, too.
//             program/learn.js judges it on her record like any of her lines.

import { PROGRAM } from '../config.js';
import { programOf, line, condId, meets, featuresOf, LEVELS } from '../program.js';

const LOOKBACK = 20;    // seconds before the onset she looks back on
const EPISODE_MAX = 90; // seconds a crisis episode is followed at most
const MIN_LEAD = 2;     // seconds a root must lead in the episode to be credited
const r3 = (v) => Math.round(v * 1000) / 1000;
const at = (fagi) => Math.round(fagi.age * 10) / 10;
const bodyOf = ({ id, retired, retiredAt, ...spec }) => spec;
// A line this wrote: its why says so (the grammar has no field for it).
export const isCrisisLine = (l) => l.source === 'self' && typeof l.why === 'string' && l.why.startsWith('crisis');

export function crisisOf(fagi) {
  return fagi.brain.crisis ??= { past: [], episode: null, stats: { onsets: 0, written: 0, retired: 0 } };
}

// Her distress as a share of the top (watch.js raises it to PROGRAM.power).
const shareOf = (d) => d ** (1 / PROGRAM.power);

// The one clause that says where it happened: a flag that was on, else the
// need that hurt most, at the highest step it had reached.
export function clauseOf(f) {
  for (const flag of ['dark', 'raining', 'pressureFalling']) if (f[flag]) return { [flag]: true };
  const needs = [['hunger', f.hunger], ['thirst', f.thirst], ['energy', 1 - f.energy]];
  needs.sort((a, b) => b[1] - a[1]);
  const [need, v] = needs[0];
  if (need === 'energy') {
    const step = LEVELS.find((l) => f.energy < l);
    return step == null ? null : { energyBelow: step };
  }
  const step = [...LEVELS].reverse().find((l) => v >= l);
  return step == null ? null : { [`${need}From`]: step };
}

// The root that led longest over a stretch of { root, span }.
function longest(stretch) {
  const secs = {};
  for (const s of stretch) if (s.root) secs[s.root] = (secs[s.root] ?? 0) + s.span;
  let best = null;
  for (const [root, t] of Object.entries(secs)) if (!best || t > best.t) best = { root, t };
  return best?.root ?? null;
}

function changed(fagi, program, news) {
  program.seq += 1;
  fagi.brain.lastProgram = { n: (fagi.brain.lastProgram?.n ?? 0) + 1, ...news };
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
}

function retire(fagi, program, own, why) {
  program.lines = program.lines.map((l) => (l === own ? line(own.id, { ...bodyOf(own), retired: true, retiredAt: at(fagi) }) : l));
  changed(fagi, program, { kind: 'retired', id: own.id, from: own.from, over: own.over, why, source: 'crisis' });
  crisisOf(fagi).stats.retired += 1;
}

// Her crisis lines against the episode just closed.
function judge(fagi, program, ep) {
  for (const own of program.lines) {
    if (own.retired || !isCrisisLine(own) || !meets(own.if ?? {}, ep.f)) continue;
    const under = ep.led[own.from];
    if (under && under.secs >= MIN_LEAD && under.fall <= 0) {
      retire(fagi, program, own, `crisis: ${own.from} led ${r3(under.secs)} s and her distress did not fall (${r3(under.fall)})`);
    } else if (ep.culprit === own.over && !(under && under.secs >= MIN_LEAD)) {
      retire(fagi, program, own, `crisis: it came on again with ${own.over} leading; ${own.from} never took the turn`);
    }
  }
}

function write(fagi, program, ep) {
  const live = program.lines.filter((l) => !l.retired);
  if (live.filter((l) => l.source === 'self').length >= PROGRAM.maxOwn) return null;
  let best = null;
  for (const [root, s] of Object.entries(ep.led)) {
    if (root === ep.culprit || s.secs < MIN_LEAD || s.fall <= 0) continue;
    if (!best || s.fall > best.fall) best = { root, ...s };
  }
  if (!best) return null;
  const over = live.find((l) => l.id === ep.culprit && l.source === 'born');
  const from = live.find((l) => l.id === best.root && l.source === 'born');
  if (!over || !from || over.tier === 'survive') return null;
  if (live.indexOf(from) < live.indexOf(over)) return null; // already before it
  const clause = clauseOf(ep.f);
  if (!clause) return null;
  const cond = condId(clause);
  if (live.some((l) => l.source === 'self' && l.from === from.id && l.over === over.id && condId(l.if ?? {}) === cond)) return null;
  const id = `${from.id}-before-${over.id}-${cond}`.slice(0, 64);
  const why = `crisis at ${r3(ep.share0)}: distress fell ${r3(best.fall)} in ${r3(best.secs)} s under ${from.id}, came on under ${over.id}`;
  program.lines = program.lines.filter((l) => l.id !== id);
  program.lines.splice(program.lines.indexOf(over), 0, line(id, {
    tier: from.tier, if: clause, do: from.do, source: 'self',
    learnedAt: at(fagi), from: from.id, over: over.id, why: why.slice(0, 160),
  }));
  changed(fagi, program, { kind: 'written', id, from: from.id, over: over.id, where: cond, diff: r3(best.fall), why, source: 'crisis' });
  fagi.justLearnedCode = 3.0;
  crisisOf(fagi).stats.written += 1;
  return id;
}

// Every watch tick (program/watch.js): `d` her distress, `root` the root of
// the line that acted (null if none did).
export function crisis(fagi, ctx, span, d, root) {
  const c = crisisOf(fagi);
  const share = shareOf(d);
  const now = fagi.age;
  const ep = c.episode;
  if (ep) {
    if (root) {
      const s = ep.led[root] ??= { secs: 0, fall: 0 };
      s.secs = r3(s.secs + span);
      s.fall = r3(s.fall + (ep.last - share));
    }
    ep.last = share;
    if (share < PROGRAM.crisisThreshold || now - ep.at >= EPISODE_MAX) {
      c.episode = null;
      const program = programOf(fagi);
      judge(fagi, program, ep);
      write(fagi, program, ep);
    }
  } else {
    const before = c.past.find((p) => now - p.t <= LOOKBACK);
    if (before && share >= PROGRAM.crisisThreshold && share - before.share >= PROGRAM.crisisRise) {
      const culprit = longest(c.past);
      const program = programOf(fagi);
      const born = program.lines.find((l) => l.id === culprit);
      if (culprit && born && born.tier !== 'survive') {
        c.episode = { at: now, culprit, f: featuresOf(fagi, ctx), share0: r3(share), last: share, led: {} };
        c.stats.onsets += 1;
      }
    }
  }
  c.past.push({ t: now, share, root, span });
  while (c.past.length && now - c.past[0].t > LOOKBACK) c.past.shift();
}
