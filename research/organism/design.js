// The evaluation of the organism (docs/research/organism-protocol.md,
// docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §18): what is compared, on which
// worlds, and what is predicted. Frozen with the protocol: changing anything
// here after the confirmatory run means a new protocol.

// Every condition is the whole organism (--organism) with some settings
// changed. `full` is Fagi as she is.
export const INDIVIDUAL = {
  full: {},
  // Baselines (§18.1).
  random: { 'BASELINE.policy': 'random', 'BASELINE.learn': 0 },
  fixed: { 'BASELINE.learn': 0 },
  // Ablations (§18.2): one part off at a time.
  noSleep: { 'SLEEP.enabled': 0 },
  noConsolidation: { 'SLEEP.consolidate': 0 },
  noReplay: { 'SLEEP.replay': 0 },
  noNightMind: { 'NIGHTAI.enabled': 0 },
  noCuriosity: { 'BRAIN.curiosityBonus': 0, 'EXPERIMENT.enabled': 0 },
  noForgetting: { 'MEMORY.decayShort': 0, 'MEMORY.decayMedium': 0, 'MEMORY.decayLong': 0 },
  noEpisodic: { 'EXPLAIN.log': 0 },
  noTraits: { 'CUES.enabled': 0 },
  noAppetite: { 'APPETITE.enabled': 0 },
  noPercept: { 'PERCEPT.enabled': 0 },
  noThermalSwing: { 'CYCLE.swing': 0 },
};

// Two worlds: steady, and one whose chemistry turns upside down halfway
// through her life (what poisoned now feeds and the other way round).
export const ENVIRONMENTS = ['stable', 'shift'];

// Population conditions (§18.4): founders left alone, whole organism.
export const POPULATION = {
  full: {},
  noCulture: { 'GEN.culture': 0 },
  noSocial: { 'SOCIAL.share': 0, 'SOCIAL.observe': 0 },
  fixed: { 'BASELINE.learn': 0 },
};

export const LIFE_SECONDS = 2400;
export const SHIFT_AT = 1200;
export const POPULATION_SECONDS = 5400;
export const SPECIES = 6;

// Seeds and maps never used while the organism was built (development used
// seeds 1000-1047 and 5000-5047, maps 1 + 13i).
export const LIVES = 120;
export const LIFE_SEED = 9000;           // life i: Fagi's stream LIFE_SEED + i
export const mapSeed = (i) => 200000 + 17 * i;   // and her map
export const POPULATIONS = 12;
export const POPULATION_SEED = 9500;

// Confirmatory hypotheses: one-sided paired tests of a - b > 0, per life,
// same seeds in both conditions. Holm over all of them, alpha .05.
export const HYPOTHESES = [
  { id: 'H1', env: 'stable', outcome: 'lifetime', a: 'full', b: 'random', says: 'she lives longer than a random walker' },
  { id: 'H2', env: 'stable', outcome: 'judgment', a: 'full', b: 'random', says: 'she judges fruit she never tasted better than a random walker' },
  { id: 'H3', env: 'stable', outcome: 'dose', a: 'fixed', b: 'full', says: 'learning lowers the poison she takes, against her own instinct alone' },
  { id: 'H4', env: 'stable', outcome: 'judgment', a: 'full', b: 'fixed', says: 'learning improves how she judges fruit she never tasted' },
  { id: 'H5', env: 'stable', outcome: 'judgment', a: 'full', b: 'noConsolidation', says: 'sorting the day at night improves that judgment' },
  { id: 'H6', env: 'stable', outcome: 'dose', a: 'noAppetite', b: 'full', says: 'appetite (malaise, aversion) lowers the poison she takes' },
  { id: 'H7', env: 'shift', outcome: 'judgment', a: 'full', b: 'fixed', says: 'after the world turns over, she judges by the new world better than her instinct alone' },
];
