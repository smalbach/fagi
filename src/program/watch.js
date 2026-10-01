// Watching her own program: which line of hers comes to act, which others
// would have acted in its place, and what came of it.
//
// Every PROGRAM.tick seconds, right after the walk (decision.js):
//
//   who leads   the line whose turn it is: the one that acted or, during a
//               trial, the one whose turn another took. A line counts by the
//               line it grew from (its root), so a line she wrote and the born
//               line it came from are one.
//   a moment    each time another root leads (or the same one has led for
//               PROGRAM.reconsider seconds: a choice made again), she notes
//               it: which root, the
//               roots further down that would have acted too (imagined,
//               program/imagine.js, never run), whether the leader acted or
//               which of those took its turn, the situation (program.js
//               featuresOf) and her distress then. For the next
//               PROGRAM.horizon seconds what she goes through is added to it;
//               then it is closed, and its cost is the distress she went
//               through over and above the one she started from.
//   a trial     now and then (PROGRAM.explore), with nothing pressing, never
//               for a survive line and never in the dark: a diurnal body tries
//               things by day. One of the lines further down that would act
//               takes the leader's turn. It lasts while both would still act,
//               until something presses, the light goes, or PROGRAM.trialMax.
//               (Measured in 24 colonies of the organism, ~415 sisters: 16 died
//               of cold without learning, 34 with trials at night, 28 without
//               them. Trying has a price, and the night is where it is paid.)
//   distress    her body's own measure, set before any tuning: the worst of
//               her needs, each as a share of its top raised to PROGRAM.power.
//
// The record (fagi.brain.watch.moments) is what program/learn.js judges her
// order on, every PROGRAM.every seconds. With PROGRAM.watch = 2 she also
// imagines, at every look, every line below the one that acted and counts in
// seconds which would have competed (`compete`): nothing she does depends on it.

import { PROGRAM, THERMAL, HEALTH } from '../config.js';
import { programOf, rootOf, featuresOf } from '../program.js';
import { pressing } from '../decision/common.js';
import { review } from './learn.js';

const r3 = (v) => Math.round(v * 1000) / 1000;

// Her body's own measure of how badly things are going: hunger, thirst and
// spent energy always; heat or cold and harm when the organism has them. A
// need near its top counts far more than one halfway.
export function distress(fagi, ctx) {
  let worst = Math.max(ctx.hungerU, ctx.thirstU, 1 - ctx.energyU);
  if (THERMAL.enabled) worst = Math.max(worst, (fagi.thermalStress ?? 0) / THERMAL.maxStress);
  if (HEALTH.enabled) worst = Math.max(worst, 1 - (fagi.health ?? HEALTH.max) / HEALTH.max);
  return Math.min(1, Math.max(0, worst)) ** PROGRAM.power;
}

export function watchOf(fagi) {
  return fagi.brain.watch ??= {
    tickIn: 0, since: 0, lookIn: PROGRAM.every,
    leader: null, trial: null, stream: null,
    open: [], moments: [], compete: {},
    stats: { moments: 0, trials: 0 },
  };
}

// The trial running now, if any: { root, by }, the line `by` takes root's turn.
export const trialOf = (fagi) => fagi.brain.watch?.trial ?? null;

// Her own stream of draws for trials, so trying never moves the draws that
// move her: seeded once from her heading, nothing drawn from Math.random.
function draw(w, fagi) {
  w.stream ??= (Math.floor(Math.abs(fagi.angle ?? 0) * 1e9) ^ 0x9e3779b9) >>> 0;
  w.stream = (w.stream + 0x6D2B79F5) >>> 0;
  let t = Math.imul(w.stream ^ (w.stream >>> 15), w.stream | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// A moment is known by where it was lived: the sister and her age then.
export const momentKey = (m) => `${m.who}@${m.at}`;

// The keys of what she holds (program/share.js asks), made the first time.
export function keysOf(w) {
  if (!w.keys) w.keys = new Set(w.moments.map(momentKey));
  return w.keys;
}

// A closed moment goes into her record, and out of it the oldest past her room.
export function keep(w, m) {
  const keys = keysOf(w);
  w.moments.push(m);
  keys.add(momentKey(m));
  while (w.moments.length > PROGRAM.record) keys.delete(momentKey(w.moments.shift()));
}

// The open moments go on; the ones past the horizon are closed.
function advance(w, d, span) {
  for (const m of w.open) { m.sum += d * span; m.secs += span; }
  while (w.open.length && w.open[0].secs >= PROGRAM.horizon) {
    const { sum, secs, ...m } = w.open.shift();
    keep(w, { ...m, cost: r3(sum / secs - m.d0) });
  }
}

// Whose turn it is: the line another took it from, if it would still act;
// else the one that acted.
function leaderOf(walk, ask) {
  if (walk.over && ask(walk.over)) return { line: walk.over, index: walk.index, by: rootOf(walk.line) };
  return walk.line ? { line: walk.line, index: walk.index, by: null } : null;
}

// The roots, further down than `index`, whose lines would act now (one each).
function below(lines, index, top, ask) {
  const out = [];
  for (let i = index + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.retired) continue;
    const root = rootOf(l);
    if (root === top || out.includes(root) || !ask(l)) continue;
    out.push(root);
  }
  return out;
}

// After the walk. `walk` is what decision.js found (kind 'line': a line acted;
// 'none': none did; anything else: the decision point or the random baseline
// decided, not her lines). `ask(l)` imagines a line's behavior now.
export function watch(fagi, ctx, dt, walk, ask) {
  const w = watchOf(fagi);
  w.since += dt;
  w.tickIn -= dt;
  if (w.tickIn > 0) return;
  const span = w.since;
  w.since = 0;
  w.tickIn = PROGRAM.tick;

  const d = distress(fagi, ctx);
  advance(w, d, span);
  if (PROGRAM.learn) {
    w.lookIn -= span;
    if (w.lookIn <= 0) { w.lookIn = PROGRAM.every; review(fagi); }
  }
  if (walk.kind !== 'line' && walk.kind !== 'none') { w.leader = null; w.trial = null; return; }
  const lines = programOf(fagi).lines;
  if (PROGRAM.watch >= 2 && walk.line) {
    const top = rootOf(walk.line);
    for (const root of below(lines, walk.index, top, ask)) {
      const k = `${top}>${root}`;
      w.compete[k] = r3((w.compete[k] ?? 0) + span);
    }
  }

  const lead = leaderOf(walk, ask);
  const root = lead ? rootOf(lead.line) : null;
  const t = w.trial;
  // A trial ends when its leader no longer leads, the line that took its turn
  // no longer would, something presses, or its time is up.
  if (t && (t.root !== root || lead.by !== t.by || pressing(ctx) || fagi.dark || fagi.age >= t.until)) w.trial = null;
  // The same line leading for long is a choice made again and again: every
  // PROGRAM.reconsider seconds, with no trial running, it is a new moment.
  w.ledFor = (w.ledFor ?? 0) + span;
  const again = root !== null && root === w.leader && !w.trial && w.ledFor >= PROGRAM.reconsider;
  if (root === w.leader && !again) return;
  w.leader = root;
  w.ledFor = 0;
  if (!lead) return;

  const others = below(lines, lead.index, root, ask);
  let by = null;
  if (PROGRAM.learn && others.length && lead.line.tier !== 'survive' && !pressing(ctx) && !fagi.dark && draw(w, fagi) < PROGRAM.explore) {
    by = others[Math.floor(draw(w, fagi) * others.length)];
    w.trial = { root, by, until: fagi.age + PROGRAM.trialMax };
    w.stats.trials += 1;
  }
  w.open.push({
    who: fagi.id ?? 1, root, below: others, by, at: Math.round(fagi.age * 10) / 10,
    f: featuresOf(fagi, ctx), d0: r3(d), sum: 0, secs: 0,
  });
  w.stats.moments += 1;
}
