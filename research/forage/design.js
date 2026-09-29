// The evaluation of phase 9, explore or come back
// (docs/research/forage-protocol.md). Frozen with the protocol.
//
// Every condition is a colony of SISTERS sisters, the whole organism with the
// game's own numbers, in a scarce world (spec §25.23): most trees have
// seasons, crops are short and rests long, a ground patch now and then, and a
// nest that holds NEST_CAPACITY rations. No breeding: the runner measures the
// same five from birth to SECONDS.

export const SECONDS = 2400;
export const SISTERS = 5;
export const SPECIES = 6;
export const SHIFT_AT = 1200;          // the `shift` world turns ephemeral here
export const EARLY = 5;                // her first resolved decisions (F3)
export const NEST_CAPACITY = 12;

// What every condition shares, over enableOrganism().
export const BASE = {
  'LIFE.enabled': 0,
  'ENERGY.drain': 0.6, 'SLEEP.nightly': 1, 'CONCEPT.enabled': 0, 'PHERO.life': 60,   // the game's numbers (app/organism-on.js)
  'MAPGEN.species': SPECIES,
  'FORAGE.enabled': 1, 'FORAGE.persistence': 0.3, 'FORAGE.crop': 6, 'FORAGE.rest': 400, 'FORAGE.patchEvery': 200,
  'SITES.enabled': 1,
  'CHOICE.enabled': 1, 'CHOICE.policy': 0,
  'LARDER.enabled': 1, 'LARDER.capacity': NEST_CAPACITY,
};

const DURABLE = { 'FORAGE.persistence': 1, 'FORAGE.patchEvery': 0 };
export const EPHEMERAL = { 'FORAGE.persistence': 0, 'FORAGE.crop': 4, 'FORAGE.rest': 900, 'FORAGE.patchEvery': 60 };

export const CONDITIONS = {
  learn: {},                                   // the learned choice
  back: { 'CHOICE.policy': 1 },                // fixed: always back to her best site
  explore: { 'CHOICE.policy': 2 },             // fixed: always explore
  same: { 'CHOICE.temperSpread': 0 },          // no innate difference in noise (F3)
  durable: DURABLE,                            // F2
  ephemeral: EPHEMERAL,                        // F2
  shift: { ...DURABLE, shift: 1 },             // durable, ephemeral from SHIFT_AT (F2)
  nosites: { 'SITES.enabled': 0, 'CHOICE.enabled': 0 },   // ablation: one remembered tree, the fixed hierarchy
  noprediction: { 'LARDER.learn': 0 },         // ablation: the pantry as last seen
  nopheromone: { 'PHERO.every': 1e9 },         // ablation: no trail
};

// Seeds and maps no earlier work used (diversity 24000-24039, maps 1300000 + 41i).
export const COLONIES = 120;
export const SEED = 26000;
export const mapSeed = (i) => 1400000 + 43 * i;

// The confirmatory hypotheses, written after the pilot (see the protocol) and
// before any confirmatory run. Paired ones: one-sided (a + shift) - b > 0 over
// colonies, each side [condition, outcome]. `within`: the correlation of x and
// y across the sisters of each colony, centered on their colony.
export const HYPOTHESES = [
  { id: 'F1a', a: ['learn', 'eaten'], b: ['back', 'eaten'], shift: 0, says: 'learning when to go back or explore, a sister eats more than always going back to her best site' },
  { id: 'F1b', a: ['learn', 'eaten'], b: ['explore', 'eaten'], shift: 0, says: 'and more than always exploring' },
  { id: 'F2a', a: ['ephemeral', 'exploreShare'], b: ['durable', 'exploreShare'], shift: 0, says: 'where food sources are ephemeral she explores more than where they last' },
  { id: 'F2b', a: ['shift', 'shareAfter'], b: ['durable', 'shareAfter'], shift: 0, says: 'when a lasting world turns ephemeral, she then explores more than in a world that stayed lasting' },
  { id: 'F3', kind: 'within', condition: 'same', x: 'early', y: 'laterShare', says: 'sisters born with the same noise, on the same map: the one whose first searches paid explores more afterwards' },
  { id: 'F4', a: ['learn', 'gapAfterFull'], b: ['learn', 'gapAfterStore'], shift: 0, says: 'after finding the nest full of good food she takes longer to fetch for home again than after storing' },
];
