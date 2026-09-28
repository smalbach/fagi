// What she perceives of a thing, as opposed to what the thing is.
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.2, §21.3)
//
// Her memory is kept by fruit type, and that is not a leak: every type has its
// own look (a color, a shape and a smell no other type shares; chemistry.js
// never makes two alike), so telling one from another by sight is exactly
// what seeing is. What she cannot do is tell them apart by what she does not
// perceive. With PERCEPT on:
//
//   - by smell alone she knows the smell and nothing else: a fruit she only
//     smells is judged by what that smell has meant to her (learned/cues.js),
//     never by her memory of the one species, nor by rules about it, nor by a
//     question on her agenda;
//   - following a scent, she follows that smell, whatever gives it off;
//   - the decision API reads what she perceives: a fruit's traits, never the
//     names this code gives the classic ones ('toxic' would tell it all).
//
// PERCEPT.enabled = 0 leaves it as it was.

import { PERCEPT, POINT_TYPES } from './config.js';
import { speciesKey } from './chemistry.js';

export const perceptOn = () => Boolean(PERCEPT.enabled);

// A food candidate she only smells: judged by its smell and nothing more.
export const smellOnly = (c) => Boolean(PERCEPT.enabled && c.kind === 'food' && c.via === 'smell');

// The smell of a type, or null if it has none (water, the nest...).
export const smellOf = (type) => POINT_TYPES[type]?.traits?.smell ?? null;

// Do two sources smell the same to her? By type without PERCEPT.
export function sameScent(a, b) {
  if (a === b) return true;
  if (!PERCEPT.enabled) return false;
  const sa = smellOf(a);
  return sa != null && sa === smellOf(b);
}

// How a fruit type looks, as a name: its traits, 'green-round-sweet'.
// Wild species are already named that way; classic ones are not.
export function lookOf(type) {
  const traits = POINT_TYPES[type]?.traits;
  return traits ? speciesKey(traits) : type;
}

// A text or a key, with every classic fruit name replaced by its look.
const CLASSIC = () => Object.keys(POINT_TYPES).filter((k) => !POINT_TYPES[k].species && POINT_TYPES[k].traits);
export function unnamed(text) {
  if (!PERCEPT.enabled || typeof text !== 'string') return text;
  let out = text;
  for (const k of CLASSIC()) out = out.replace(new RegExp(`\\b${k}\\b`, 'g'), lookOf(k));
  return out;
}
