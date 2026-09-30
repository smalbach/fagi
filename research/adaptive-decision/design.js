// Adaptive decision, step 1: the reference and who decides
// (docs/research/plan-decision-adaptativa.md). Not a frozen protocol: this
// only fixes what the baseline measures, so it can be repeated.
//
// One Fagi alone, no breeding, no sisters. Two profiles over the same seeds:
//   game          the organism with the game's own numbers (app/organism-on.js)
//   experimental  the same, plus FORAGE, SITES, CHOICE (mode 1, learned) and
//                 LARDER, with the scarce world of phase 9 (forage/design.js)
//   connected     experimental with the decision point on (step 1b, DECIDE):
//                 the same learned choice, now deciding what she goes after
// The connected one is the reference the plan compares against from step 2
// on; the other two are described.

export const HORIZON = 2400;           // seconds, as phase 9
export const DT = 0.05;

// The game's numbers over the organism (app/organism-on.js). LIFE off: she
// neither ages out nor breeds within the horizon.
const GAME = {
  'LIFE.enabled': 0,
  'ENERGY.drain': 0.6, 'SLEEP.nightly': 1, 'CONCEPT.enabled': 0, 'PHERO.life': 60,
};

// Phase 9's scarce world (research/forage/design.js BASE), for one.
const FORAGE = {
  'MAPGEN.species': 6,
  'FORAGE.enabled': 1, 'FORAGE.persistence': 0.3, 'FORAGE.crop': 6, 'FORAGE.rest': 400, 'FORAGE.patchEvery': 200,
  'SITES.enabled': 1,
  'CHOICE.enabled': 1, 'CHOICE.mode': 1, 'CHOICE.policy': 0,
  'LARDER.enabled': 1, 'LARDER.capacity': 12,
};

export const PROFILES = {
  game: GAME,
  experimental: { ...GAME, ...FORAGE },
  connected: { ...GAME, ...FORAGE, 'DECIDE.enabled': 1 },
};

// The reflexes that may replace a controller's choice (decision.js with
// DECIDE on): time they take is not the controller's to lose.
export const isReflex = (rule) => rule.startsWith('survive.') || rule.startsWith('endure.') || rule === 'provide.seen';

// Seeds and maps no earlier work used (forage 26000-27039, maps 1400000 + 43i
// and 1500000 + 47i). Development only: step 4 draws its own.
export const EPISODES = 40;
export const SEED = 29000;
export const mapSeed = (i) => 1700000 + 59 * i;

// --- step 2: the battery (worlds.js) ------------------------------------------

// Every controller runs on this profile; only who answers the decision point
// changes (controllers.js). No species chemistry (worlds.js), so no poison.
export const BATTERY = {
  ...GAME,
  'FORAGE.enabled': 1, 'FORAGE.crop': 6, 'FORAGE.rest': 400, 'FORAGE.patchEvery': 300,
  'SITES.enabled': 1,
  'CHOICE.enabled': 1, 'CHOICE.mode': 1, 'CHOICE.policy': 0,
  'LARDER.enabled': 1, 'LARDER.capacity': 12,
  'DECIDE.enabled': 1,
};
export const BATTERY_HORIZON = 2400;

// Development worlds for step 2 (and step 3's development). Validation and
// confirmation (step 4) draw their own, apart from these.
export const DEV_WORLDS = 40;
export const DEV_SEED = 31000;
export const devMapSeed = (i) => 1800000 + 61 * i;

// --- revision 1: what to eat (foodworlds.js) -----------------------------------

// Step 1's experimental map (species, taste chemistry, seasons) with the
// connected choice deciding where to go; the bite point's judge is the
// controller (battery.js sets DECIDE.eat).
export const FOOD = { ...GAME, ...FORAGE, 'DECIDE.enabled': 1 };

// Step 4's worlds, apart from development and from each other. Validation:
// choosing the variant and the competitor. Confirmation: only after the
// protocol is frozen.
export const GROUPS = {
  dev: { seed: DEV_SEED, map: devMapSeed },
  val: { seed: 33000, map: (i) => 1900000 + 67 * i },
  conf: { seed: 35000, map: (i) => 2000000 + 71 * i },
  // Rules of conduct (docs/research/plan-reglas-de-conducta.md): groups of their own.
  dev2: { seed: 41000, map: (i) => 2100000 + 73 * i },
  val2: { seed: 43000, map: (i) => 2200000 + 79 * i },
  conf2: { seed: 45000, map: (i) => 2300000 + 83 * i },
  // Lineages (revision 1 of the rules of conduct): development, and confirmation apart.
  lin: { seed: 47000, map: (i) => 2400000 + 89 * i },
  lin2: { seed: 49000, map: (i) => 2500000 + 97 * i },
};

// --- integrating caution in the game (plan-reglas-de-conducta.md, option 2) ---

// The game as it plays (app/organism-on.js), one Fagi, no breeding, with its
// classic map (MAPGEN.species 0) or with the wild species the settings offer.
export const GAME_PROFILES = {
  classic: { ...GAME },
  species: { ...GAME, 'MAPGEN.species': 6 },
};
// The two lines, as the game would be born with them (conduct-grammar.md).
export const CAUTION_LINES = [
  { id: 'taste-novel', if: { novel: true, hungerBelow: 75 }, do: 'taste' },
  { id: 'leave-harmed-mostly', if: { harmedMostly: true }, do: 'leave' },
];
export const CAUTION = { 'DECIDE.eat': 'learned', 'CONDUCT.enabled': 1, 'CONDUCT.born': CAUTION_LINES };
export const GAME_GROUPS = {
  gdev: { seed: 51000, map: (i) => 2600000 + 101 * i },
  gconf: { seed: 53000, map: (i) => 2700000 + 103 * i },
};
