// Learning by traits: what a smell, a color or a shape tends to mean.
//
// memory.js remembers each species on its own. This remembers the traits they
// are made of, so a fruit she has never tasted already means something: "it
// smells sour, and sour things made me sick".
//
// It is the Rescorla-Wagner rule, the classic model of how animals learn from
// several cues at once. A fruit predicts the sum of the weights of its cues; the
// surprise (what she felt minus what she expected) is shared by every cue that
// was there. That sharing is what makes it animal-like:
//   - blocking: once "sour = bad" is learned, a sour fruit that also happens to
//     be red teaches almost nothing about red, because nothing was surprising;
//   - wrong blame: the first bad fruit blames all its traits alike, shape
//     included, until other fruit tell them apart.
//
// Cues are strings 'dimension:value' ('smell:sour'). Like memory.js, this
// only keeps the numbers; synth.js turns strong ones into rules.

import { POINT_TYPES, CUES } from '../config.js';
import { cuesOfTraits } from '../chemistry.js';

export function createCues() {
  return {};
}

const clamp = (v) => Math.max(-1, Math.min(1, v));

// The cues a fruit type is made of.
export function cuesOf(key) {
  return cuesOfTraits(POINT_TYPES[key]?.traits);
}

// The cues she can actually get from how she perceives it: smell alone only
// tells the smell; seeing it (and smelling it close by) tells everything.
export function perceivedCues(key, via) {
  const all = cuesOf(key);
  return via === 'smell' ? all.filter((c) => c.startsWith('smell:')) : all;
}

// What a set of cues predicts: `value` from -1 (harms) to +1 (helps), and how
// much she has to go on (0 = never met any of these traits).
export function predict(cues, list) {
  if (!cues || !list.length) return { value: 0, confidence: 0 };
  let value = 0;
  let confidence = 0;
  for (const c of list) {
    const e = cues[c];
    if (!e) continue;
    value += e.w;
    confidence += e.n / (e.n + CUES.evidence);
  }
  return { value: clamp(value), confidence: confidence / list.length };
}

// One experience: every cue that was there moves by the same surprise.
// `rate` defaults to CUES.rate; watching a sister learns at a fraction of it.
export function learnCues(cues, list, reward, now, rate = CUES.rate) {
  if (!cues || !list.length) return null;
  const before = predict(cues, list).value;
  const surprise = reward - before;
  for (const c of list) {
    // An innate bias (generations.js) stays marked as such: learning moves it.
    const e = cues[c] ?? (cues[c] = { w: 0, n: 0, lastAt: now });
    e.w = clamp(e.w + rate * surprise);
    e.n += 1;
    e.lastAt = now;
  }
  return { before, surprise, after: predict(cues, list).value };
}

// How wary a prediction makes her: 0 = not at all, 1 = sure it harms.
export function wariness(prediction) {
  const bad = Math.max(0, -prediction.value) * prediction.confidence;
  return Math.min(1, bad / CUES.wary);
}
