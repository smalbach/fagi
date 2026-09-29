// The evaluation of social learning with a misinformed sister
// (docs/research/social-protocol.md). Frozen with the protocol.

// The informant, sister #1 of a colony of SIZE: none (as naive as the rest),
// one who lived this map's chemistry, or one who lived it upside down.
export const INFORMANTS = ['none', 'true', 'false'];

export const SIZE = 5;
export const DEV_SECONDS = 2400;   // the informant's first life, alone
export const SECONDS = 2400;       // the colony's life
export const SPECIES = 8;

// Seeds and maps no earlier work used (development 1000-1047 and 5000-5095,
// maps 1 + 13i and 3 + 13i; organism 9000-9511, maps 200000 + 17i; sex
// battery 14000-14119, maps 400000 + 23i; concepts 16000-16119, maps
// 700000 + 29i; organism follow-up 18000-18119, maps 800000 + 31i).
export const COLONIES = 120;
export const SEED = 22000;
export const mapSeed = (i) => 1100000 + 37 * i;

// Every test is one-sided on a − b > 0 (research/stats.js paired), after the
// shift: S2 is non-inferiority with a margin of 0.05, and S3 compares the
// share with 0.5.
export const HYPOTHESES = [
  { id: 'S1', outcome: 'dose', a: 'none', b: 'true', shift: 0, says: 'a sister who knows the map makes the naive sisters take less poison' },
  { id: 'S2', outcome: 'judgment', a: 'false', b: 'none', shift: 0.05, says: 'a misinformed sister does not make the naive sisters judge the map more than 0.05 worse' },
  { id: 'S3', outcome: 'falseShare', a: 0.5, b: 'false', shift: 0, says: 'of the false rules they adopt from her, fewer than half still stand at the end' },
];
