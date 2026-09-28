// The follow-up evaluation of the organism (docs/research/organism2-protocol.md):
// what the first one (research/organism/, §25.9) left as exploratory, now
// predicted. Frozen with the protocol.

// Every condition is the whole organism as it is today (--organism: every piece
// on, things and concepts included), with one part changed.
export const INDIVIDUAL = {
  full: {},
  noReplay: { 'SLEEP.replay': 0 },
  noConsolidation: { 'SLEEP.consolidate': 0 },
  noEpisodic: { 'EXPLAIN.log': 0 },
};

export const ENVIRONMENTS = ['stable', 'shift'];

export const LIFE_SECONDS = 2400;
export const SHIFT_AT = 1200;
export const SPECIES = 6;

// Seeds and maps no earlier work used (development 1000-1047 and 5000-5095,
// maps 1 + 13i and 3 + 13i; organism evaluation 9000-9511, maps 200000 + 17i;
// sex battery 14000-14119, maps 400000 + 23i; concepts 16000-16119, maps
// 700000 + 29i).
export const LIVES = 120;
export const LIFE_SEED = 18000;
export const mapSeed = (i) => 800000 + 31 * i;

export const HYPOTHESES = [
  { id: 'F1', env: 'stable', outcome: 'judgment', a: 'noReplay', b: 'full', says: 'rehearsing the remembered fruit at night makes her judge untasted fruit worse' },
  { id: 'F2', env: 'shift', outcome: 'judgment', a: 'noReplay', b: 'full', says: 'and worse again after the world turns over' },
  { id: 'F3', env: 'shift', outcome: 'judgment', a: 'noConsolidation', b: 'full', says: 'sorting the day at night makes her slower to judge by a world that turned over' },
  { id: 'F4', env: 'stable', outcome: 'helpful', a: 'noEpisodic', b: 'noConsolidation', says: 'without episodic memory the night still asks what to try, and she finds more of the good fruit than without the night at all' },
];
