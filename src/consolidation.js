// The night's work: sorting the day's experiences while she sleeps.
//
// Deterministic and local. It reads only what she lived (the bite log,
// learned/explain.js, and her beliefs) and writes only data: a report and a
// few confidences. No code runs from it and nothing in the world is looked at,
// so it can never tell her a truth she did not experience.
//
// The pipeline (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §11.2):
//   1. pick the day's salient episodes: by how much they hurt or helped, and
//      by how much they surprised her (how far from what she believed);
//   2. group them by trait;
//   3. keep as hypotheses the traits with enough support and a clear sign,
//      with their exceptions;
//   4. replay: beliefs the highlights agree with gain confidence;
//   5. merge redundant detail (the same fruit with the same outcome, many
//      times a day) out of the log;
//   6. interleaved replay: the fruit still in the log, rehearsed together
//      (below, `interleave`);
//   7. note contradictions and questions for tomorrow;
//   8. write it all down, auditable.
//
// SLEEP.consolidate = 0 is the ablation: she sleeps, but sorts nothing.
// SLEEP.replay = 0 keeps the rest of the night and drops only step 6.

import { SLEEP, MEMORY } from './config.js';
import { cuesOf, predict } from './learned/cues.js';
import { synthCues } from './learned/synth.js';

const r2 = (v) => Math.round(v * 100) / 100;
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// How much an episode stands out: what it did to her, plus what she did not
// expect of it. `belief` is her value for that fruit at the moment of sorting.
function salience(ep, belief) {
  return Math.abs(ep.reward) + 0.5 * Math.abs(ep.reward - belief) + (ep.late ? 0.25 : 0);
}

// Traits that predicted something, from the day's bites.
function hypotheses(episodes) {
  const byCue = new Map();
  for (const ep of episodes) {
    for (const cue of cuesOf(ep.key)) {
      const g = byCue.get(cue) ?? { rewards: [], keys: new Set() };
      g.rewards.push(ep.reward);
      g.keys.add(ep.key);
      byCue.set(cue, g);
    }
  }
  const out = [];
  for (const [cue, g] of byCue) {
    const support = g.rewards.length;
    const mean = g.rewards.reduce((a, b) => a + b, 0) / support;
    if (support < SLEEP.minSupport || Math.abs(mean) < SLEEP.minEffect) continue;
    const exceptions = g.rewards.filter((r) => sign(r) !== sign(mean)).length;
    out.push({
      when: [cue],
      predict: mean < 0 ? 'harm' : 'benefit',
      mean: r2(mean),
      support,
      exceptions,
      species: g.keys.size,
      // Laplace-smoothed agreement: two agreeing bites are not certainty.
      confidence: r2((support - exceptions + 1) / (support + 2)),
    });
  }
  return out.sort((a, b) => b.confidence - a.confidence || b.support - a.support);
}

// Fruits whose outcome changed sign during the day.
function contradictions(episodes) {
  const byKey = new Map();
  for (const ep of episodes) {
    if (ep.reward === 0) continue;
    (byKey.get(ep.key) ?? byKey.set(ep.key, new Set()).get(ep.key)).add(sign(ep.reward));
  }
  return [...byKey].filter(([, s]) => s.size > 1).map(([k]) => k);
}

// What would be worth trying tomorrow: hypotheses with little behind them or
// with exceptions, and fruits she has noticed but never tasted.
function questions(fagi, hyps) {
  const qs = [];
  for (const h of hyps) {
    if (h.exceptions > 0 || h.support < SLEEP.minSupport + 1) qs.push({ kind: 'check', cue: h.when[0] });
  }
  for (const [key, r] of Object.entries(fagi.brain.facts)) {
    if (r.tries === 0 && cuesOf(key).length) qs.push({ kind: 'taste', key });
  }
  return qs.slice(0, 6);
}

// Replay: each belief backed by a salient episode that agrees with it gains
// confidence, as a spaced confirmation would. Beliefs the day contradicted
// are left alone: the day already lowered them.
function replay(fagi, salient) {
  const done = new Set();
  for (const ep of salient) {
    if (done.has(ep.key)) continue;
    const r = fagi.brain.facts[ep.key];
    if (!r || sign(r.value) === 0 || sign(r.value) !== sign(ep.reward)) continue;
    r.confidence = Math.min(1, r.confidence + SLEEP.boost * (1 - r.confidence));
    // Sleeping on it counts as a spaced confirmation (memory.js promote).
    r.confirms += 1;
    if (r.confirms >= MEMORY.toLong) r.stage = 'long';
    else if (r.confirms >= MEMORY.toMedium) r.stage = 'medium';
    done.add(ep.key);
  }
  return [...done];
}

// Out of the log: beyond SLEEP.redundant bites of the same fruit with the same
// outcome in one day, the least salient go. The highlights always stay.
function forget(fagi, day, keep) {
  const log = fagi.brain.bites ?? [];
  const groups = new Map();
  for (const ep of day) {
    const id = `${ep.key}:${sign(ep.reward)}`;
    (groups.get(id) ?? groups.set(id, []).get(id)).push(ep);
  }
  const drop = new Set();
  for (const list of groups.values()) {
    if (list.length <= SLEEP.redundant) continue;
    const ranked = [...list].sort((a, b) => a.salience - b.salience);
    for (const ep of ranked) {
      if (list.length - drop.size <= SLEEP.redundant) break;
      if (!keep.has(ep.src)) drop.add(ep.src);
    }
  }
  if (drop.size) fagi.brain.bites = log.filter((b) => !drop.has(b));
  return drop.size;
}

// Interleaved replay (McClelland, McNaughton & O'Reilly 1995: a slow system
// that learns from a fast one by rehearsing old and new together, offline).
//
// By day each bite moves every trait it had by the same surprise, one bite
// after another (learned/cues.js). That is how the wrong blame happens: the
// first bad fruit blames its shape as much as its smell, and whichever fruit
// came last weighs most. At night nothing new is learned: the fruit she still
// remembers (her own bites in the log, after the redundant ones went) are
// rehearsed together, a few rounds, each toward the average of what it did to
// her, so each trait ends up pulled toward what it predicts across all of
// them, not toward whichever fruit came last.
//
// With SLEEP.downscale > 0, before each round every rehearsed weight is also
// scaled down a little, and the rehearsal restores only what the fruit,
// together, still ask for. The pair works like a ridge regression: a trait
// shared by several fruit that did the same (the smell that poisoned twice)
// keeps its weight; a trait seen on a single fruit (the color of that one bad fruit) gives most of its blame
// back. It guesses untasted fruit better, but it also leaves her less wary of
// poison, so it is off by default (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §25.2).
//
// Only weights move: `n` (how much she has met a trait) stays, because a
// rehearsal is not a new meeting. Nothing she did not live enters, and the
// order is fixed (by key, rotated each round), so the same log sorts the same.
function interleave(fagi, now) {
  const cues = fagi.brain.cues;
  const kinds = new Map();
  for (const b of fagi.brain.bites ?? []) {
    if (b.saw != null || !cuesOf(b.key).length) continue;
    const k = kinds.get(b.key) ?? { bites: 0, sum: 0 };
    if (!b.late) k.bites += 1;
    k.sum += b.reward;
    kinds.set(b.key, k);
  }
  const fruit = [...kinds].filter(([, k]) => k.bites > 0)
    .map(([key, k]) => ({ key, target: k.sum / k.bites }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  if (fruit.length < 2 || !SLEEP.replay) return { fruit: fruit.length, moved: [] };

  const before = new Map();
  for (const { key } of fruit) for (const c of cuesOf(key)) if (cues[c] && !before.has(c)) before.set(c, cues[c].w);
  const error = () => fruit.reduce((a, f) => a + (f.target - predict(cues, cuesOf(f.key)).value) ** 2, 0) / fruit.length;
  const errorBefore = error();

  for (let round = 0; round < SLEEP.replay; round++) {
    // Downscaling first (Tononi & Cirelli's synaptic homeostasis).
    for (const c of before.keys()) cues[c].w *= 1 - SLEEP.downscale;
    for (let i = 0; i < fruit.length; i++) {
      const { key, target } = fruit[(i + round) % fruit.length];
      const list = cuesOf(key).filter((c) => cues[c]);
      const surprise = target - predict(cues, list).value;
      for (const c of list) cues[c].w = Math.max(-1, Math.min(1, cues[c].w + SLEEP.replayRate * surprise));
    }
  }

  const moved = [];
  for (const [c, w0] of before) {
    const d = cues[c].w - w0;
    if (Math.abs(d) >= 0.02) moved.push({ cue: c, from: r2(w0), to: r2(cues[c].w) });
  }
  moved.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
  // Weights that crossed a threshold write, revise or retire their rule now,
  // saying it was sleep that moved them.
  if (moved.length) synthCues(fagi.brain, moved.map((m) => m.cue), [{ sense: 'sleep', v: fruit.length }], now);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  return { fruit: fruit.length, moved, error: { before: r3(errorBefore), after: r3(error()) } };
}

// One night. `since` is when the last one was sorted: only what came after is
// the day being slept on.
export function consolidate(fagi, { night, now, since = -Infinity }) {
  const log = fagi.brain.bites ?? [];
  const day = log
    .filter((b) => b.at > since && b.saw == null)   // her own bites; what she watched is not hers to replay
    .map((b) => {
      const belief = fagi.brain.facts[b.key]?.value ?? 0;
      return { key: b.key, at: b.at, reward: b.reward, late: Boolean(b.late), src: b, salience: salience(b, belief) };
    });
  const salient = [...day].sort((a, b) => b.salience - a.salience).slice(0, SLEEP.salient);
  const hyps = hypotheses(day);
  const sorting = SLEEP.consolidate && day.length > 0;
  const strengthened = sorting ? replay(fagi, salient) : [];
  const forgotten = sorting ? forget(fagi, day, new Set(salient.map((e) => e.src))) : 0;
  const replayed = sorting ? interleave(fagi, now) : { fruit: 0, moved: [] };

  return {
    night,
    at: r2(now),
    episodes: day.length,
    important: salient.map((e) => ({ key: e.key, at: e.at, reward: e.reward })),
    hypotheses: sorting ? hyps : [],
    strengthened,
    forgotten,
    replayed,
    contradictions: sorting ? contradictions(day) : [],
    questions: sorting ? questions(fagi, hyps) : [],
    sorted: Boolean(sorting),
  };
}
