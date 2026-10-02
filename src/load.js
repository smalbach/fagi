// What a fruit weighs and how hard it is, and what that asks of her body
// (LOAD; docs/research/libera/cuerpo-evolutivo.md).
//
//   weight    carrying it home slows her and costs energy, the more the
//             heavier it is for her strength: muscle × size^(2/3) (strength
//             goes with the cross-section of the muscle, not its volume)
//   hardness  a hard fruit gives less of itself unless her gut is up to it:
//             what she takes is × min(1, gut / hardness)^LOAD.hardGain
//
// Both are drawn when the fruit falls from a tree, log-uniform in LOAD.range
// and LOAD.hardRange around 1 (a typical fruit), and kept while she carries
// it. Stored in the pantry a fruit becomes a ration like any other: what it
// weighed is behind her. With LOAD off nothing is drawn and every factor is 1.

import { LOAD } from './config.js';

const round2 = (v) => Math.round(v * 100) / 100;
const logUniform = ([lo, hi], rnd) => lo * (hi / lo) ** rnd();

export const loadOn = () => Boolean(LOAD.enabled);

// A fruit just fallen: its weight and hardness.
export function weighFruit(p, rnd = Math.random) {
  if (!loadOn() || !p) return p;
  p.weight = round2(logUniform(LOAD.range, rnd));
  p.hardness = round2(logUniform(LOAD.hardRange, rnd));
  return p;
}

// What she lifts with: her muscle, and her size to the two-thirds.
export function strengthOf(fagi) {
  const m = fagi.morph ?? {};
  return (m.muscle ?? 1) * (m.size ?? 1) ** LOAD.sizePower;
}

// How heavy what she carries is for her (0 carrying nothing).
export function burden(fagi) {
  if (!loadOn() || !fagi.carrying) return 0;
  return (fagi.carrying.weight ?? 1) / strengthOf(fagi);
}

// Her pace and her burn while loaded: 1 carrying nothing, or with LOAD off.
export const loadSpeed = (fagi) => 1 / (1 + LOAD.slow * burden(fagi));
export const loadEffort = (fagi) => 1 + LOAD.effort * burden(fagi);

// How much of a fruit of this hardness her gut takes: 1 up to her gut's
// match, less past it.
export function hardTake(fagi, hardness = 1) {
  if (!loadOn() || hardness <= 0) return 1;
  const gut = fagi.morph?.gut ?? 1;
  return Math.min(1, gut / hardness) ** LOAD.hardGain;
}

// What she takes with her when she picks a fruit up.
export const heft = (p) => (loadOn() ? { weight: p.weight ?? 1, hardness: p.hardness ?? 1 } : {});
