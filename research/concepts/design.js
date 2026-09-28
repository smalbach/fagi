// The evaluation of things and concepts (docs/research/concepts-protocol.md,
// docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.8, phase 6). Frozen with the
// protocol: changing anything here after the confirmatory run means a new one.

// Every condition is the whole organism (--organism) with things on the map.
export const CONDITIONS = {
  full: {},
  noConcepts: { 'CONCEPT.generalize': 0 },     // every kind on its own: nothing predicted
  noVolatility: { 'CONCEPT.surprise': 0 },     // never doubts after a surprise
};

// Which trait may decide what things afford. 'tuned': the ones used while it
// was built. 'novel': color, never used while it was built (phase 6's exit
// criterion: a family not seen during tuning).
export const FAMILIES = { tuned: ['shape', 'texture'], novel: ['color'] };

// 'stable': things afford the same all her life. 'turn': when the late kinds
// sprout, another trait decides from then on, for the old things too.
export const WORLDS = ['stable', 'turn'];

export const SECONDS = 2400;
export const SPECIES = 6;
export const LIVES = 120;
// Seeds and maps no earlier work used (development: 1000-1047, 5000-5095,
// maps 1 + 13i and 3 + 13i; organism evaluation 9000-9511, maps 200000 + 17i;
// sex battery 14000-14119, maps 400000 + 23i).
export const LIFE_SEED = 16000;
export const mapSeed = (i) => 700000 + 29 * i;

// Chance of naming what a new kind affords: four affordances, equally often,
// among the kinds of a map.
export const CHANCE = 0.25;

// Confirmatory: one-sided paired tests of a - b > 0, Holm over the four.
// b = 'chance' compares with CHANCE.
export const HYPOTHESES = [
  { id: 'K1', family: 'novel', world: 'stable', outcome: 'lateRight', a: 'full', b: 'chance', says: 'she names rightly, at first sight, what kinds of a family never seen while tuning afford, better than chance' },
  { id: 'K2', family: 'novel', world: 'stable', outcome: 'lateStings', a: 'noConcepts', b: 'full', says: 'concepts spare her the sting of new kinds' },
  { id: 'K3', family: 'novel', world: 'stable', outcome: 'lateSapUsed', a: 'full', b: 'noConcepts', says: 'concepts let her drink from new sap kinds before examining them' },
  { id: 'K4', family: 'novel', world: 'turn', outcome: 'classify', a: 'full', b: 'noVolatility', says: 'after the world turns over, doubting after a surprise leaves her classifying better' },
];
