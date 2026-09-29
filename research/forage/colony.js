// One colony of sisters, measured (docs/research/forage-protocol.md). Nothing
// here decides anything: it runs the game's own code and watches what each
// sister decides and what happens to her.
//
// Per sister:
//   alive, lived, cause   at the end
//   eaten, stored         meals, and rations she brought home
//   perMin                (eaten + stored) per minute alive
//   plans                 how many times she chose (choice.js)
//   exploreShare          of those, the share that were "explore"
//   shareBefore, shareAfter   the same before and after SHIFT_AT
//   early                 her first EARLY resolved decisions (home excluded):
//                         explore that found food − explore that found nothing
//   laterShare            exploreShare of the plans made after her EARLY-th
//                         resolution (null if she never got there)
//   innate                her innate noise (choice.js)
//   fullGood              times she came home loaded to a nest full of good food
//   gapAfterFull          mean seconds from that to her next pick for home
//   gapAfterStore         mean seconds from storing to her next pick for home
// Per colony: spoiled (rations lost in the nest), and every sister.

import * as CONFIG from '../../src/config.js';
import { createWorld, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import { treesOf } from '../../src/trees.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { SECONDS, SISTERS, SHIFT_AT, EARLY, EPHEMERAL } from './design.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

export function set(assignments) {
  for (const [path, value] of Object.entries(assignments)) {
    if (path === 'shift') continue;
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
}

// The durable world turns ephemeral: every tree gets seasons, the ground
// sees patches often. What the sisters knew of the trees stays as it was.
function turnEphemeral(world) {
  set(EPHEMERAL);
  for (const tree of treesOf(world)) {
    tree.seasonal = true;
    tree.crop = Math.min(tree.crop ?? CONFIG.FORAGE.crop, CONFIG.FORAGE.crop);
  }
  world.patchTimer = Math.min(world.patchTimer ?? CONFIG.FORAGE.patchEvery, CONFIG.FORAGE.patchEvery);
}

function watcher(f) {
  return { f, plan: f.brain.lastPlan?.n ?? 0, choice: f.brain.lastChoice?.n ?? 0, picked: f.picked ?? 0,
    stored: f.stored ?? 0, full: f.lastNestFull?.n ?? 0, plans: [], resolved: [], picks: [], stores: [], fulls: [] };
}

function watch(w, t) {
  const f = w.f;
  if (!f.alive) return;
  const p = f.brain.lastPlan;
  if (p && p.n !== w.plan) { w.plan = p.n; w.plans.push({ t, kind: p.kind }); }
  const c = f.brain.lastChoice;
  if (c && c.n !== w.choice) { w.choice = c.n; w.resolved.push({ t, chose: c.chose, outcome: c.outcome }); }
  if ((f.picked ?? 0) !== w.picked) { w.picked = f.picked ?? 0; if (f.carrying) w.picks.push(t); }
  if ((f.stored ?? 0) !== w.stored) { w.stored = f.stored ?? 0; w.stores.push(t); }
  const n = f.lastNestFull;
  if (n && n.n !== w.full) { w.full = n.n; if (n.did !== 'cleared') w.fulls.push(t); }
}

// Mean seconds from each event to her next pick for home (none after: skipped).
function gapTo(events, picks) {
  const gaps = [];
  for (const e of events) {
    const next = picks.find((p) => p > e);
    if (next != null) gaps.push(next - e);
  }
  return mean(gaps);
}

function summary(w) {
  const f = w.f;
  const share = (plans) => (plans.length ? plans.filter((p) => p.kind === 'explore').length / plans.length : null);
  const judged = w.resolved.filter((r) => r.outcome !== 'home');
  const firsts = judged.slice(0, EARLY);
  const early = firsts.length === EARLY
    ? firsts.filter((r) => r.chose === 'explore' && r.outcome === 'found').length
      - firsts.filter((r) => r.chose === 'explore' && r.outcome === 'nothing').length
    : null;
  const after = firsts.length === EARLY ? w.plans.filter((p) => p.t > firsts[EARLY - 1].t) : [];
  const lived = f.age;
  return {
    id: f.id, alive: f.alive ? 1 : 0, lived: r3(lived), cause: f.alive ? null : f.cause ?? null,
    eaten: f.eaten ?? 0, stored: f.stored ?? 0, perMin: lived > 0 ? r3(((f.eaten ?? 0) + (f.stored ?? 0)) / lived * 60) : null,
    plans: w.plans.length, exploreShare: r3(share(w.plans)),
    shareBefore: r3(share(w.plans.filter((p) => p.t < SHIFT_AT))), shareAfter: r3(share(w.plans.filter((p) => p.t >= SHIFT_AT))),
    early, laterShare: after.length ? r3(share(after)) : null,
    innate: r3(f.brain.choice?.innate ?? null),
    fullGood: w.fulls.length, gapAfterFull: r3(gapTo(w.fulls, w.picks)), gapAfterStore: r3(gapTo(w.stores, w.picks)),
  };
}

export function runColony({ seed, mapSeed, shift = false, dt = 0.05 }) {
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const antRng = rng(seed);
  const colony = withRng(antRng, () => createColony(SISTERS));
  world.colony = colony;
  const watchers = colony.ants.map(watcher);

  const steps = Math.ceil(SECONDS / dt);
  const shiftStep = Math.round(SHIFT_AT / dt);
  for (let i = 0; i < steps && colony.ants.some((f) => f.alive); i++) {
    if (shift && i === shiftStep) turnEphemeral(world);
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(antRng, () => updateColony(world, colony, dt));
    for (const w of watchers) watch(w, world.time);
  }
  return { spoiled: nestOf(world)?.spoiled ?? 0, sisters: watchers.map(summary) };
}
