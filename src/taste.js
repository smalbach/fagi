// The mouth (TASTE; docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.9).
//
// A taste is only known in the mouth, never at a distance. Biting, she likes
// or dislikes it: her innate liking for each taste (TASTE.valence), a hint she
// is born with, corrected by what she has learned those tastes lead to (the
// 'taste:*' cues, learned/cues.js). Disliking it enough, she spits it out and
// swallows only a mouthful, unless she is starving (need beats disgust) or
// already knows this very fruit does her good (an acquired taste).

import { TASTE, HUNGER, NEEDS } from './config.js';
import { POINT_TYPES } from './config.js';
import { tasteCuesOf } from './chemistry.js';
import { predict } from './learned/cues.js';
import { weight } from './memory.js';

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

// How much she likes it by birth alone (-1..1).
export function innateLiking(key) {
  const t = POINT_TYPES[key]?.taste;
  if (!t || !TASTE.innate) return 0;
  let v = 0;
  for (const [taste, amount] of Object.entries(t)) v += (TASTE.valence[taste] ?? 0) * amount;
  return clamp1(v);
}

// The taste that stands out most, to say what it tasted of.
export function dominantTaste(key) {
  const t = POINT_TYPES[key]?.taste;
  if (!t) return null;
  return Object.entries(t).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// How much she likes it now: her innate liking, overridden as she learns what
// these tastes lead to.
export function liking(fagi, key) {
  const innate = innateLiking(key);
  const cues = tasteCuesOf(key);
  if (!cues.length) return innate;
  const learned = predict(fagi.brain.cues ?? {}, cues);
  const c = Math.min(1, learned.confidence * TASTE.learnWeight);
  return clamp1(innate * (1 - c) + learned.value * c);
}

// At the mouth: how much of the bite she swallows. `portion` is what she meant
// to eat (a trial bite is already small: she swallows it).
export function atMouth(fagi, key, portion) {
  if (!TASTE.enabled || !POINT_TYPES[key]?.taste) return { portion, spat: false, innate: null };
  const innate = innateLiking(key);
  if (portion < 1) return { portion, spat: false, innate };
  const starving = fagi.hunger / HUNGER.max >= NEEDS.critical;
  const knownGood = (fagi.brain.facts[key]?.tries ?? 0) > 0 && weight(fagi.brain, key) > 0;
  if (!starving && !knownGood && liking(fagi, key) < TASTE.spitBelow) {
    return { portion: TASTE.spitPortion, spat: true, innate };
  }
  return { portion, spat: false, innate };
}
