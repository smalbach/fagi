// The lab's parameters: one lineage of colonies is fully described by these
// and a seed. A design (research/designs/*.json) varies some of them.
//
// The lab is Fagi without the map: no walking, no water, no nest. An ant
// meets one fruit at a time and decides whether to eat it with the same brain
// the game uses (memory, trait cues, induced rules, verdicts), feels it with
// the same body (interoception, episodes) and passes on what she knows with
// the same social code (social.js pass). What it drops is space, so it runs
// thousands of lineages where the game runs a handful; the game (scripts/batch)
// is where lab results are checked.

export const DEFAULTS = {
  // The world.
  family: 'one',        // chemistry family (chemistry.js): 'one' | 'conj'
  dim: 'smell',         // the dimension that matters, for 'one'
  catalogue: 12,        // species that exist in a lineage
  perMap: 6,            // of them, on the map of one generation (a new draw each generation)
  noise: 0,             // chance a bite does what another class of fruit would (0-1)
  change: 'invert',     // how the world changes: 'none' | 'invert' | 'rotate' | 'shift'
  switchAt: 6,          // generation of the (first) change
  period: 0,            // > 0: it changes again every `period` generations after that

  // Lives.
  generations: 12,
  colony: 5,
  life: 1800,           // seconds each generation lives, at most
  dt: 1,                // seconds per step
  encounter: 1 / 30,    // chance per second of meeting a fruit

  // Knowledge.
  agent: 'fagi',        // 'fagi' | 'ideal' | 'random' | 'oracle' (agents.js)
  theory: 'none',       // what the founders are taught (theory.js):
                        // 'none' | 'correct' | 'partial' | 'false' | 'irrelevant'
  format: 'rule',       // SOCIAL.format: 'rule' | 'verdict' | 'evidence'; 'none' = nothing is
                        // told or taught (the control: every generation starts from scratch)
  budget: 4,            // items per exchange and per teaching (SOCIAL.budget, GEN.budget)
  meetEvery: 60,        // seconds between exchanges: each ant tells one random sister
  observe: 0.3,         // chance a sister sees a meal (and learns from it)
  culture: 1,           // newborns are taught by a surviving elder

  // Anything else in src/config.js, as { 'SOCIAL.trust': 0.5 }.
  sets: {},
};

const CHOICES = {
  family: ['one', 'conj'],
  dim: ['color', 'shape', 'smell'],
  change: ['none', 'invert', 'rotate', 'shift'],
  agent: ['fagi', 'ideal', 'random', 'oracle'],
  theory: ['none', 'correct', 'partial', 'false', 'irrelevant'],
  format: ['none', 'rule', 'verdict', 'evidence'],
};

export function params(over = {}) {
  const p = { ...DEFAULTS, ...over, sets: { ...DEFAULTS.sets, ...(over.sets ?? {}) } };
  for (const k of Object.keys(over)) if (!(k in DEFAULTS)) throw new Error(`unknown lab parameter: ${k}`);
  for (const [k, list] of Object.entries(CHOICES)) {
    if (!list.includes(p[k])) throw new Error(`${k} must be one of ${list.join('|')}, not ${p[k]}`);
  }
  if (p.perMap > p.catalogue) throw new Error('perMap cannot exceed catalogue');
  return p;
}

// The generation's chemistry index: 0 before the first change, then +1 at
// every change.
export function epochOf(p, g) {
  if (p.change === 'none' || g < p.switchAt) return 0;
  return p.period > 0 ? 1 + Math.floor((g - p.switchAt) / p.period) : 1;
}
