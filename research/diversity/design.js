// The evaluation of adaptation and diversity across a change of world
// (docs/research/diversity-protocol.md). Frozen with the protocol.

// Every condition is the whole organism with in-world breeding (LIFE), 4
// founders, left alone for SECONDS. At SHIFT_AT the chemistry turns upside
// down, except in `stable`. `clonal` has no genetic diversity: no mutation of
// innate biases nor of the body, so every genome is the founders' blank one.
export const CONDITIONS = {
  stable: { invert: 0, set: {} },
  shift: { invert: 1, set: {} },
  clonal: { invert: 1, set: { 'GEN.mutation': 0, 'GEN.bodyMutation': 0 } },
};

export const SECONDS = 10800;
export const SHIFT_AT = 5400;
export const SPECIES = 8;

// Seeds and maps no earlier work used (see research/social/design.js, and
// social 22000-22119, maps 1100000 + 37i).
export const POPULATIONS = 40;
export const SEED = 24000;
export const mapSeed = (i) => 1300000 + 41 * i;

// One-sided paired tests of (a + shift) - b > 0, over populations. Each side is
// [condition, outcome].
export const HYPOTHESES = [
  { id: 'D1', a: ['shift', 'judgmentEnd'], b: ['shift', 'judgmentHit'], shift: 0, says: 'after the change the population comes to judge the new world better than the change left it' },
  { id: 'D2', a: ['shift', 'judgmentEnd'], b: ['stable', 'judgmentEnd'], shift: 0.1, says: 'and ends within 0.1 of a population that never saw the change (non-inferiority)' },
  { id: 'D3', a: ['shift', 'diversityEnd'], b: ['shift', 'diversityBefore'], shift: 0, says: 'the population comes out of the change with more genetic diversity than it went in with' },
  { id: 'D4', a: ['clonal', 'poisonAfter'], b: ['shift', 'poisonAfter'], shift: 0, says: 'without genetic diversity, more of them die of poison after the change' },
];
