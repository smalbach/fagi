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
//   a trial     now and then (PROGRAM.explore; less the worse she is with
//               PROGRAM.exploreByState), with nothing pressing, in the dark
//               only toward a line that keeps her safe (PROGRAM.darkTrials; off,
//               none in the dark: a diurnal body tries things by day), never
//               for a survive line. One of the lines further down that would act
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

import { PROGRAM, THERMAL, HEALTH, HUNGER, POINT_TYPES } from '../config.js';
import { programOf, rootOf, featuresOf } from '../program.js';
import { pressing } from '../decision/common.js';
import { review } from './learn.js';
import { crisis } from './crisis.js';

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

// What one item of food is worth to her, as a share of her hunger: what it
// takes off when eaten. Spoiled or harmful food is worth nothing here.
function worth(type) {
  const h = POINT_TYPES[type]?.hunger ?? 0;
  return h < 0 ? -h / HUNGER.max : 0;
}

// Her reserves (PROGRAM.judge 1): every need counts, added up, not
// only the worst; food on her back or in the pantry she knows counts as food
// to come. Distress (above) is how bad things feel now; reserves are how
// long she can go on. Measured with one fruit every 575 s
// (docs/research/world-calibration.md): judged by distress over 15 s, every
// lineage wrote the same "go back to what I remember before chasing what I
// see" lines and learning cost about 10 points of survival — chasing costs
// energy at once, while the fruit it brings counts for nothing in distress.
export function reserves(fagi, ctx) {
  let deficit = ctx.hungerU + ctx.thirstU + (1 - ctx.energyU);
  if (THERMAL.enabled) deficit += Math.min(1, (fagi.thermalStress ?? 0) / THERMAL.maxStress);
  if (HEALTH.enabled) deficit += 1 - (fagi.health ?? HEALTH.max) / HEALTH.max;
  let food = fagi.carrying ? worth(fagi.carrying.type) : 0;
  for (const [type, n] of Object.entries(fagi.pantry ?? {})) food += n * worth(type);
  return food - deficit;
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

// How likely a trial is now. With PROGRAM.exploreByState she tries less the
// worse she is (the chance times (1 - distress)², distress as a share of the
// top): a hungry animal exploits what it has, a sated one can afford to look
// around. Measured with one fruit every 575 s (docs/research/world-calibration.md):
// at a fixed chance her trials alone took survival from 75 % to 58 %, most of
// them leaving a fruit in sight for a remembered place.
export function exploreNow(d) {
  if (!PROGRAM.exploreByState) return PROGRAM.explore;
  return PROGRAM.explore * (1 - d ** (1 / PROGRAM.power)) ** 2;
}

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

// The open moments go on; the ones past the horizon are closed. Its cost is
// the distress she went through over the one she started from or, judged by
// reserves, how much of her reserves she lost.
function advance(w, d, r, span) {
  for (const m of w.open) { m.sum += d * span; m.secs += span; }
  while (w.open.length && w.open[0].secs >= PROGRAM.horizon) {
    const { sum, secs, r0, ...m } = w.open.shift();
    const cost = r0 != null ? r0 - r : sum / secs - m.d0;
    keep(w, { ...m, cost: r3(cost) });
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
  const byReserves = PROGRAM.judge === 1;
  const r = byReserves ? reserves(fagi, ctx) : null;
  advance(w, d, r, span);
  if (PROGRAM.learn) {
    w.lookIn -= span;
    if (w.lookIn <= 0) { w.lookIn = PROGRAM.every; review(fagi); }
    if (PROGRAM.crisis) crisis(fagi, ctx, span, d, walk.kind === 'line' && walk.line ? rootOf(walk.line) : null);
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
  if (t && (t.root !== root || lead.by !== t.by || pressing(ctx) || (fagi.dark && !t.safe) || fagi.age >= t.until)) w.trial = null;
  // The same line leading for long is a choice made again and again: every
  // PROGRAM.reconsider seconds, with no trial running, it is a new moment.
  w.ledFor = (w.ledFor ?? 0) + span;
  const again = root !== null && root === w.leader && !w.trial && w.ledFor >= PROGRAM.reconsider;
  if (root === w.leader && !again) return;
  w.leader = root;
  w.ledFor = 0;
  if (!lead) return;

  const others = below(lines, lead.index, root, ask);
  // In the dark only a line that keeps her safe may take a turn
  // (PROGRAM.darkTrials): trying something risky at night is what killed,
  // but without any trial at night she can never find out that going home
  // as the light goes ('dusk', which answers only once it is dark) beats
  // what she was doing.
  const tierOf = (id) => lines.find((l) => l.id === id)?.tier;
  const candidates = fagi.dark ? (PROGRAM.darkTrials ? others.filter((id) => tierOf(id) === 'endure') : []) : others;
  let by = null;
  if (PROGRAM.learn && candidates.length && lead.line.tier !== 'survive' && !pressing(ctx) && draw(w, fagi) < exploreNow(d)) {
    by = candidates[Math.floor(draw(w, fagi) * candidates.length)];
    w.trial = { root, by, until: fagi.age + PROGRAM.trialMax, ...(fagi.dark ? { safe: true } : {}) };
    w.stats.trials += 1;
  }
  w.open.push({
    who: fagi.id ?? 1, root, below: others, by, at: Math.round(fagi.age * 10) / 10,
    f: featuresOf(fagi, ctx), d0: r3(d), ...(byReserves ? { r0: r } : {}), sum: 0, secs: 0,
  });
  w.stats.moments += 1;
}
