// Her life, from hatching to old age (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §10.5).
//
//   juvenile   she moves slower (LIFE.juvenileSpeed) and cannot breed; she eats,
//              explores and learns like anyone
//   adult      from LIFE.adultAt: everything, breeding included
//   senescent  from LIFE.senescentAt of her own lifespan: slower and slower,
//              down to LIFE.oldSpeed; still a teller of what she knows
//   death      at the end of her lifespan: old age is a cause like any other
//
// The egg is not her: it lives in the nest (reproduction.js) and becomes her
// when it hatches. Her life age is `age` plus `startAge` (the founders start
// grown). Each one draws her own lifespan at birth. Nothing here changes a
// thing with LIFE off: stage 'adult', every factor 1, no death of old age.

import { LIFE } from './config.js';

export const lifeAge = (fagi) => (fagi.age ?? 0) + (fagi.startAge ?? 0);

// Her own lifespan, drawn once at birth: LIFE.lifespan ± LIFE.lifespanSpread.
// Draws a random number only with LIFE on.
export function drawLifespan(rnd = Math.random) {
  if (!LIFE.enabled) return null;
  return Math.round(LIFE.lifespan * (1 + (rnd() * 2 - 1) * LIFE.lifespanSpread));
}

// Only one who belongs to a breeding population has a life cycle: she carries
// a lifespan (the founders and everyone hatched, reproduction.js). A Fagi on
// her own, as in the single-life runs, is the adult she always was.
export function stageOf(fagi) {
  if (!LIFE.enabled || fagi.lifespan == null) return 'adult';
  const age = lifeAge(fagi);
  if (age < LIFE.adultAt) return 'juvenile';
  if (fagi.lifespan && age >= fagi.lifespan * LIFE.senescentAt) return 'senescent';
  return 'adult';
}

// Once per frame: which stage she is in now.
export function updateStage(fagi) {
  const stage = stageOf(fagi);
  if (stage !== fagi.lifeStage) {
    fagi.lifeStage = stage;
    fagi.stageAt = fagi.age;
  }
}

// How her stage moves her: slower young, slower and slower old.
export function lifeSpeed(fagi) {
  if (!LIFE.enabled) return 1;
  if (fagi.lifeStage === 'juvenile') return LIFE.juvenileSpeed;
  if (fagi.lifeStage !== 'senescent' || !fagi.lifespan) return 1;
  const from = fagi.lifespan * LIFE.senescentAt;
  const t = Math.min(1, (lifeAge(fagi) - from) / (fagi.lifespan - from));
  return 1 - (1 - LIFE.oldSpeed) * t;
}

// Has her time come?
export const oldAge = (fagi) => Boolean(LIFE.enabled && fagi.lifespan && lifeAge(fagi) >= fagi.lifespan);
