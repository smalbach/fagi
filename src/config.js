// Every tunable number in the game lives here.

// Scale and clocks. 1 px = 0.5 mm: Fagi is ~9 mm long, and the map is a
// 64 x 43 cm patch of ground. Fagi is a made-up organism, but her body
// numbers (size, speed, how she drinks, pheromone, weather sense) were
// calibrated on ants, the closest real animal of her size; the ant figures
// quoted below are that calibration, not a claim of what she is. Moving, seeing, smelling
// and pheromone run in real time. Only biology (thirst, hunger, forgetting, what
// rots) is compressed: 1 s of game = ~8 min of her life, keeping the real
// proportions between one thing and another.
export const WORLD = {
  width: 1280,
  height: 860,
  bgColor: '#222630',
};

// The ground. It's painted only once at startup, so these numbers are NOT in
// the settings panel: changing them live wouldn't repaint anything. Edit them here.
//
// *Scale = size of the blotches of each noise field, in px. Large = few, broad
// hills; small = choppy terrain.
export const TERRAIN = {
  heightScale: 300,   // relief hills
  moistureScale: 230,  // where green takes hold
  gravelScale: 150,    // where gravel shows through
  lightCell: 4,         // px per cell of the color and light computation
  relief: 4.4,        // how much slope shows. High = rugged terrain
  deep: 0.22,         // how much low ground darkens from getting less sky
  mossFrom: 0.5,     // moisture above which green appears
  gravelFrom: 0.7,     // stoniness above which gravel appears
  grain: 0.08,         // opacity of the fine clods
  patches: 0.05,       // opacity of the large earth patches
  photo: 0.62,          // presence of the photographic base
  photoScale: 0.38,    // material scale: smaller = smaller leaves and gravel
  clearings: 42,          // soft patches of light filtered through the canopy
  specks: 5200,         // grains of loose sand
  pebbles: 1400,     // pebble attempts (the gravelly ones make it)
  bushes: 3200,         // grass tuft attempts (the moist ones make it)
  litter: 700,      // dry twig attempts
  leaves: 900,          // fallen leaf attempts (they appear where there's green)
  moss: 700,          // moss tuft attempts (only in moist, low ground)
  roots: 90,          // exposed root attempts (they appear where there's green)
  cracks: 260,        // crack attempts (the dry, high ones make it)
  shore: 1.45,        // how far the wet earth reaches, in pond radii
  vignette: 0.08,        // how much the edges of the world darken
  veil: 0.015,         // veil of the background color over everything
};

// The camera. The whole map is visible at zoom 1; from there it zooms in.
//
// maxDetail is how far above its world size a sprite can be repainted.
// Raising it gives cleaner edges up close and costs memory and a
// repaint per step, so three is the reasonable deal.
export const CAMERA = {
  min: 1,
  max: 4,
  step: 1.18,        // how much each wheel notch zooms in
  maxDetail: 3,
  keysDown: 520,       // px per second when moving with the arrow keys
};

// The lake. The circle that decides where she drinks is the object's radius; these
// numbers are only looks, and are measured in lake radii.
export const LAKE = {
  shoreWidth: 0.34,  // mud and pebbles outside the water
  deepFrom: 0.62,   // where the deep water starts, darker
  waveEdge: 0.055,   // how much the shoreline meanders
  sparkles: 9,       // reflections that shimmer on the surface
  ripples: 3,           // wave circles that spread out and fade
  reeds: 16,         // reed tufts on the shore
  stones: 18,        // bottom stones, near the shore
  specks: 22,          // pollen and loose leaves floating, pushed by the wind
  ripplets: 40,          // ripple crests the wind pushes across the surface
  caustics: 34,      // web of light on the bottom of the shallows
};

export const FAGI = {
  radius: 9,
  speed: 70,          // px per second
  turnSpeed: 6.0,     // radians per second. Turning radius = speed/turnSpeed = 11.6px.
                      // Must stay BELOW eatRadius or Fagi orbits the food without touching it.
  fovDeg: 280,        // total angle of the vision cone: compound eyes
                      // see almost all around, except right behind
  viewRange: 120,     // px. Low resolution: a 3 mm drop stops being visible at ~6 cm
  eatRadius: 14,      // contact distance for eating
  memorySec: 2.0,     // seconds she remembers a target after losing sight of it
  smell: 1.0,         // sense of smell sensitivity. Multiplies each thing's aroma.
  probe: 26,          // spacing of the two "nostrils" she compares
  castTurn: 1.15,     // how wide the sweep opens when she loses the trail
  castEvery: 0.9,     // every how many seconds she switches sides while sweeping
  trailMemory: 7.0,   // seconds she keeps searching for a trail she has lost
};

export const HUNGER = {
  rate: 0.08,         // hunger points per second (~1250s = ~1 week without food,
                      // with water: 5-7 times longer than she lasts without drinking)
  max: 100,
};

// Thirst is the second need: it rises faster than hunger, but the map's water
// never runs out. Fagi has to split her time between eating and drinking.
export const THIRST = {
  rate: 0.55,         // thirst points per second (~180s = ~1 day until drying out)
  max: 100,
  drinkRate: 5,       // how much thirst is removed per second in the water (~20s to fill the crop)
  ignoreBelow: 0.10,  // with less thirst than this, water isn't even considered
};

// Water from the inside. She doesn't swim: like an ant, she weighs so little that surface
// tension traps her and she flails almost without moving. She drinks from the shore, in the
// shallows, where her legs still touch bottom. All of this is physics, not learned. What
// she DOES learn, by sinking, is to stay out of deep water: the belief
// 'deep', just as she learns which fruit disagrees with her.
//
//   shallows   : px of water inside the shore where she can still stand and drink
//   wadeSpeed  : speed in the shallows (mud, wet legs)
//   swimSpeed  : speed in deep water, flailing
//   swimEffort : how much more energy flailing costs than walking
//   shock      : share of the scare that losing her footing gives, even if she gets out at once
//   sample     : seconds in deep water worth the whole scare
//   lesson     : what that whole scare subtracts from the belief 'deep'
//
// Coming out of deep water she's soaked: the water weighs and clings to her legs until
// she dries (wetSpeed on leaving, which returns to 1 over dryTime seconds).
//
// She notices water before stepping in it: her antennae (probeReach px ahead of her
// body) pick up the moisture and feel of the water, and she moves forward probing
// (probeSpeed) while they're over deep water.
export const WATER = {
  shallows: 10,
  wadeSpeed: 0.6,
  swimSpeed: 0.2,
  swimEffort: 3,
  shock: 0.6,
  sample: 1.5,
  lesson: 1,
  wetSpeed: 0.7,
  dryTime: 8,
  probeReach: 7,
  probeSpeed: 0.45,
  edgeGiveUp: 1,      // seconds bumping into the edge of deep water before turning around
};

// Rain (rain.js). Short showers every so often that leave shallow
// puddles; the sun shrinks them until they dry up. While it rains the
// pheromone and smells wash away and Fagi, outside the nest, gets soaked (WATER.wetSpeed).
//   every        : seconds between showers (min, max). ~1-2 of her days
//   duration     : how long each one lasts
//   puddles      : puddles each shower leaves
//   puddleRadius : size of a puddle when it forms (px)
//   grow         : px of radius a puddle gains per second while it rains
//   evaporate    : px of radius it loses per second in the sun (~4 min = ~1.5 days)
//   minRadius    : below this it's dry
//   washPhero    : how many times faster pheromone fades in the rain
//                  (100: a fresh mark disappears in ~6 s of shower)
//   washScent    : seconds it takes the rain to wash away a whole scent thread.
//                  While it rains it doesn't grow; when it clears it comes out of the source again
//   front        : seconds the pressure has been dropping before it falls
//                  (the front arrives before the water)
//   recover      : seconds it takes the pressure to recover after it clears
//   effort       : energy she spends in the rain, outside the nest (× walking):
//                  each drop weighs as much as she does
//   sample       : seconds out in the open that make up one rain experience
//   lesson       : how much that experience teaches (how bad it seems to her)
//   puddleLesson : how much a puddle teaches: finding it dry subtracts, drinking from
//                  it adds. That's how she learns whether to trust puddles
//   puddleLifeRate: how much she corrects, with each puddle she finds dry, what
//                  she believes a puddle lasts
export const RAIN = {
  every: { min: 240, max: 420 },
  duration: { min: 18, max: 35 },
  puddles: { min: 2, max: 4 },
  puddleRadius: [12, 22],
  grow: 0.15,
  evaporate: 0.05,
  minRadius: 5,
  washPhero: 100,
  washScent: 5,
  front: { min: 30, max: 60 },
  recover: 40,
  effort: 1.5,
  sample: 3,
  lesson: 0.8,
  puddleLesson: 0.5,
  puddleLifeRate: 0.3,
};

// Baselines for evaluation (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §18.1,
// scripts/evaluate.js). Nothing to do with how Fagi is: what she is compared
// against. The defaults are Fagi as she is.
//   policy : 'learner' (she decides, decision.js) or 'random' (she walks to a
//            random point, then another; she still drinks and eats what she
//            touches, as anything would)
//   learn  : 0 = nothing she lives changes a belief, a trait or a rule
//            (brain.js learn, learnSeen) nor a habit: her instinct is all she has
export const BASELINE = {
  policy: 'learner',
  learn: 1,
};

// Instincts: what she's born with, without having learned it. Everything else
// (what's good, what to avoid, what announces what) comes from experience. Setting
// one to 0 turns it off and leaves the behavior entirely up to learning.
//
// Always on (physics and reflexes, no number to tweak): flailing towards the
// shore in deep water, slowing down to probe when the antennae touch water, feeling
// the body (interoception.js) and curiosity about the unknown (BRAIN).
//
//   rainShelter   : innate urge to take cover when rain falls on her
//                   (0-1). What she learns from getting wet ('rain') adds to it; she
//                   shelters if they exceed the pull of hunger and thirst.
//   pressureSense : sensitivity to air pressure (0 = she doesn't notice it). Ants
//                   notice its drop (Sujimoto et al. 2020, Ethology).
//   pressureMin   : smallest drop (0-1) she can notice.
//   pressureHaste : she hurries when she notices it dropping (× extra speed). It's
//                   what has been measured in leafcutters: they go out earlier and carry more.
//   pressureShelter: innate urge to go back to the nest when she notices it dropping. From
//                   the factory 0: that the drop announces rain is something she LEARNS
//                   (belief 'pressure'), she doesn't know it from birth.
export const INSTINCT = {
  rainShelter: 0.2,
  pressureSense: 1,
  pressureMin: 0.2,
  pressureHaste: 0.15,
  pressureShelter: 0,
};

// The body. The only thing Fagi knows from birth is how to feel herself: if hunger
// drops she feels good, if her speed falls she feels clumsy. Which THING in the world
// produces each sensation she doesn't know: she learns that by trying.
//
//   hungerScale : hunger points worth a sensation of ±1 (35 = one nectar)
//   effectWeight: how much a stat change weighs against hunger
//   statSense   : how the body feels each stat. +1 = going up is good; -1 =
//                 going up is bad. A new stat needs its sign here (with no
//                 entry, +1 is assumed).
//   window      : seconds she keeps watching after eating, in case it disagrees with her
//                 later (crossing the critical threshold of the need she was tending)
//   perilWeight : what that delayed bad outcome subtracts
//   deathPenalty: what dying with a recent bite in her body subtracts
//   drinkSample : seconds drinking before judging how much thirst it removed
//   energyScale : lost energy points worth a sensation of -1
export const FEEL = {
  hungerScale: 35,
  thirstScale: 60,
  effectWeight: 0.5,
  statSense: { speed: 1, viewRange: 1, fovDeg: 1, smell: 1, hungerRate: -1 },
  window: 10,
  perilWeight: 0.5,
  deathPenalty: 1,
  drinkSample: 9,     // with drinkRate 5 that's ~45 thirst points: the same signal as before
  energyScale: 20,    // energy points worth a sensation of ±1
};

// Symbolic learning: when a belief becomes a written rule
// and when that rule is retired. With hysteresis, so it doesn't flicker.
export const LEARN = {
  avoidFrom: 0.2,     // (negative) weight above which she writes "avoid X"
  avoidUntil: 0.1,    // and below which she retires it
  preferFrom: 0.5,    // weight above which she writes "prefer X"
  preferUntil: 0.3,
  autosave: 1,        // keep a recoverable copy in the browser (1 = yes)
  autosaveEvery: 10,  // every how many seconds
  maxRetired: 20,     // retired rules kept as history
};

// Learning by traits (learned/cues.js): what a smell, a color or a shape
// tends to mean, so an untasted fruit already says something.
export const CUES = {
  enabled: 1,         // 0 = she only learns each species on its own
  rate: 0.3,          // how far each present trait moves toward what she felt
  evidence: 1,        // experiences with a trait until she half trusts it
  wary: 0.35,         // predicted harm (x confidence) that kills her curiosity
  ruleEvidence: 2,    // experiences with a trait before she writes a one-trait rule about it
  induce: 2,          // trait rules: 0 = one trait at a time, from its weight; 1 = induced from
                      // whole species (learned/induce.js); 2 = both
  induceMin: 2,       // species that must agree before she generalizes from them
  checkTold: 1,       // a trait rule she did not live dies when more fruit she tastes
                      // go against it than for it (synth.js checkTold)
};

// Habits (habits.js): the thresholds of her behavior she tunes from what
// happens to her. With enabled = 0 she keeps the factory values below.
export const HABITS = {
  enabled: 1,         // 0 = factory values, always
  learn: 1,           // 0 = use what was learned, but learn nothing new (for tests)
  scare: 0.85,        // hunger or thirst (fraction) that counts as a scare
  relax: 1,           // 1 = a long calm makes her a bit bolder again
  calm: 600,          // seconds without a scare before she relaxes a habit one rung
  history: 8,         // moves kept per habit, to explain it
};

// The colony (colony.js, social.js): sisters sharing a nest, a pantry and the
// trail pheromone, and what they learn from each other.
export const SOCIAL = {
  size: 1,            // individuals in the colony: 1 = Fagi alone
  share: 1,           // trophallaxis: sisters in the nest tell each other their rules
  observe: 0.4,       // watching a sister eat teaches at this fraction of the strength (0 = off)
  trust: 0.6,         // a rule told is trusted this fraction of the teller's own trust
  minTrust: 0.3,      // below this, a rule is not worth passing on
  every: 20,          // seconds before the same two sisters exchange again
  seeRange: 1,        // fraction of her view range at which she notices a sister eat
  format: 'rule',     // what is passed on (social.js): 'rule' | 'verdict' | 'evidence'
  budget: 0,          // items passed in one exchange (a rule, a verdict, a bite); 0 = no cap
  evidence: 2,        // bites behind each rule, in the 'evidence' format
  topic: 'all',       // what is passed on: 'all' rules, or only 'food' (rules about eating)
};

// Generations (generations.js, batch --generations): what a newborn inherits.
export const GEN = {
  culture: 1,         // raised by a surviving elder: her rules and habits
  cultureTrust: 0.6,  // a rule taught is trusted this fraction of the elder's trust
  habits: 1,          // habits are taught too (with culture)
  genes: 1,           // born with innate trait biases, inherited with mutation
  mutation: 0.15,     // spread of each bias's random step from parent to child
  innateN: 1,         // an innate bias is trusted as if she had met the trait this often
  storedWorth: 5,     // seconds of life a stored ration is worth, when choosing parents
  budget: 0,          // items an elder teaches a newborn (SOCIAL.format); 0 = no cap
  // Two parents instead of one (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §10).
  // 0 = the clonal lineages the preregistered study ran: one parent, mutated.
  sexual: 0,          // 1 = a mother and a father, each picked by fitness; needs SEX.enabled
  blend: 0,           // 0 = each innate bias comes whole from one parent; 1 = their average
  bodyMutation: 0.03, // spread of each body gene's step (a multiplier around 1)
  bodyRange: [0.8, 1.25], // how far a body gene can drift from 1
};

// Explanations (learned/explain.js): why she thinks what she thinks of a fruit.
export const EXPLAIN = {
  log: 80,            // experiences with fruit she keeps to point at
  examples: 4,        // bites quoted in one explanation
  wary: 0.5,          // wariness from which she won't go out of her way for it
  tempted: 0.1,       // predicted good (x confidence) from which it looks good
};

// External decision: an API that receives what Fagi perceives and returns what
// to do. Instinct stays in charge when the API is silent, slow or wrong.
//
//   authority: 0 = safe (instinct handles emergencies first);
//              1 = full (the API goes first, except for an emergency it doesn't handle)
export const BACKEND = {
  enabled: 0,
  authority: 0,
  minInterval: 2,     // minimum seconds between queries
  timeout: 2,         // seconds to wait before giving up
  ttl: 6,             // seconds a directive is valid if the API doesn't say otherwise
  maxTtl: 20,
  idleAfter: 8,       // seconds of just exploring before asking
};

export const BRAIN = {
  learnRate: 0.45,    // how fast she updates her belief
  curiosityTries: 2,  // tries per type before she stops being curious
  curiosityBonus: 1.2,
  distanceWeight: 0.6,
  stickiness: 0.2,    // advantage a rival needs to steal the current target
  smellPenalty: 0.15,  // what chasing something she smells but can't see subtracts: she knows
                      // it's close, not exactly where.
  minScore: 0.12,     // below this it's not worth moving
  baseInterest: 0.25, // how much something she knows is good pulls her when she does NOT need it.
                      // Without this she'd go to the water with zero thirst, just because she likes it.
};

// The five points the player can place.
//
//   hunger  : how much it adds (+) to or subtracts (-) from hunger when eaten.
//   effects : temporary buffs. stat = what it multiplies, mult = factor, sec = duration.
//   traits  : what it looks and smells like (chemistry.js). Fagi can learn from
//             them what an untasted fruit is likely to do (learned/cues.js).
//
// There's only PHYSICS here: what the bite does to the body. Whether it's good or bad
// isn't written anywhere: Fagi feels it when she eats it (FEEL) and
// learns it. A new food, or a new danger, is added with its physics and nothing
// else.
export const POINT_TYPES = {
  nectar: {
    color: '#5bd97e',
    radius: 6,
    aroma: 175,       // smells strong: detected from afar even when not seen
    life: 180,        // seconds until it rots and turns toxic (0 = never). ~1 day
    hunger: -35,
    effects: [],
    traits: { color: 'green', shape: 'round', smell: 'sweet' },
  },
  spark: {
    color: '#4cc9f0',
    radius: 5,
    aroma: 85,
    life: 240,
    hunger: -5,
    effects: [{ stat: 'speed', mult: 1.8, sec: 8 }],
    traits: { color: 'blue', shape: 'crystal', smell: 'sharp' },
  },
  eye: {
    color: '#b57bff',
    radius: 5,
    aroma: 85,
    life: 240,
    hunger: -5,
    effects: [
      { stat: 'viewRange', mult: 1.6, sec: 10 },
      { stat: 'fovDeg', mult: 1.4, sec: 10 },
    ],
    traits: { color: 'purple', shape: 'orb', smell: 'musky' },
  },
  resin: {
    color: '#e8a33d',
    radius: 6,
    aroma: 145,
    life: 320,
    hunger: -10,
    effects: [{ stat: 'hungerRate', mult: 0.5, sec: 14 }],
    traits: { color: 'orange', shape: 'drop', smell: 'musky' },
  },
  toxic: {
    color: '#d95b7e',
    radius: 6,
    aroma: 130,       // poison smells too, and it smells similar
    life: 180,        // rot doesn't rot further: when its time is up it disappears
    hunger: 25,
    effects: [{ stat: 'speed', mult: 0.6, sec: 5 }],
    traits: { color: 'red', shape: 'round', smell: 'rotten' },
  },
};

export const TYPE_KEYS = Object.keys(POINT_TYPES);

// Map objects. They aren't eaten: they stay put.
//
//   water : Fagi drinks in the shallows, inside the edge (WATER). Deep water traps her.
//           A puddle (shallow) has no deep water: all of it is shallows.
//   block : rock. Blocks the way and also the line of sight.
export const OBJECT_TYPES = {
  water: { color: '#3d8fd9', radius: 44, kind: 'water', aroma: 150 },
  // Rain puddle (rain.js): shallow water that dries up. It barely smells.
  puddle: { color: '#6f9fbf', radius: 16, kind: 'water', aroma: 0, shallow: true },
  nest: { color: '#c9a227', radius: 42, kind: 'nest', aroma: 60 },
  tree: { color: '#4f9552', radius: 44, kind: 'spawner', aroma: 70 },
  rock: { color: '#565c6b', radius: 28, kind: 'block', aroma: 0 },
  // A thing (things.js, CONCEPT): no inborn category, only how it looks.
  // Only the map places them (never the palette).
  thing: { color: '#9aa0a8', radius: 10, kind: 'thing', aroma: 0, palette: false },
};

export const OBJECT_KEYS = Object.keys(OBJECT_TYPES);

// What things she has a learned belief about: the foods and the water.
// Water is learned the same as food: it starts at 0 and has to be tried.
// Smell doesn't spread in a circle: the wind carries it and forms a plume.
// Fagi only smells something if she's INSIDE that plume, that is, downwind.
export const WIND = {
  turnRate: 0.09,     // radians per second: turns slowly, visible on screen
  changeEvery: { min: 8, max: 18 }, // how often it considers a new direction
  swing: 1.5,         // how far it can deviate when picking the new direction
};

// Each source's smell is ONE thread that keeps growing across the map. It heads
// downwind, but meanders on its own, so it takes different directions
// as it advances. The older the point, the farther its trail has reached.
export const PLUME = {
  step: 18,           // px of each new segment
  every: 0.10,        // seconds between segments (growth speed)
  drift: 0.45,        // how much each segment can bend (radians)
  windPull: 0.22,     // how much the wind straightens it towards its direction
  radius: 34,         // how far from the thread the smell is perceived
  nodesPerAroma: 0.7, // max segments of the thread = aroma × this
  faint: 0.85,        // how much it dilutes from the source to the tip
};

// Memory. A memory isn't a number: it's a value PLUS the confidence she has
// in it. Confidence rises when confirmed, drops on its own over time, and only
// holds if the confirmations come spaced out, as in real insects.
// Synapses (synapses.js): the trace of learning as a network of connections.
export const SYNAPSE = {
  hebbRate: 0.6,      // how much sense→concept strengthens per second while perceiving it
  hebbDecay: 0.01,    // what it loses per second unused (~1.5 min from strong to pruned)
  learnRate: 0.45,    // how close concept→sensation gets to what she felt each time
  feelDecay: 0.0008,  // what's learned through consequences is forgotten much more slowly
  prune: 0.03,        // below this the connection is pruned
};

export const MEMORY = {
  spacing: 12,         // minimum seconds between confirmations for them to "count"
  massedGain: 0.4,     // what a back-to-back confirmation is worth vs. a spaced one
  gain: 0.45,          // how much confidence a spaced confirmation gives
  first: 0.5,          // confidence left by the first experience
  floor: 0.45,         // how much of what's learned still weighs even if she doesn't trust it:
                       // doubting lowers a memory, it doesn't erase it
  contradiction: 0.45, // what confidence is multiplied by on a letdown
  toMedium: 2,         // spaced confirmations to move to medium memory
  toLong: 4,           // and to consolidate it as long memory
  // Forgetting is biology: it runs on the compressed clock, like thirst and hunger.
  decayShort: 0.003,   // confidence lost per second at each stage (~3 min = ~1 day)
  decayMedium: 0.0008, // ~10 min = a few days
  decayLong: 0.0003,   // ~1 h = weeks: almost permanent
  minConfidence: 0.18, // below this curiosity returns: she no longer trusts it
  placeDrift: 0.2,     // px of imprecision a place gains per second without seeing it.
                       // Little: path integration fails while walking, not while waiting
  placeErrorMax: 260,  // cap on that imprecision
  travelRange: 700,    // how far she finds it reasonable to travel to a place she
                       // remembers. Without this, everything she can't see is "miles away"
  save: true,          // keep long memory between games
};

export const BELIEF_KEYS = [...TYPE_KEYS, 'water'];

// Spec of anything chaseable, whether food or map object.
export function specOf(key) {
  return POINT_TYPES[key] ?? OBJECT_TYPES[key];
}

// Random map at startup and on reset.
// Energy: the third gauge. Running low doesn't kill, but it leaves Fagi without strength
// until she stops to rest. The nest is where she recovers best.
export const ENERGY = {
  max: 100,
  drain: 1.6,         // per second walking (scales with actual speed)
  restOutside: 6,     // recovery per second stopped in the field
  restNest: 16,       // recovery per second inside the nest
  tired: 22,          // below this she looks for rest
  rested: 85,         // she stops resting when she gets here
  weakSpeed: 0.55,    // if she hits zero, she drags herself at this fraction of speed
};

// From this fraction on, a need is urgent: eating or drinking goes ahead of
// resting and carrying. Nobody naps while dying of thirst.
// critical     : from here on the need overrides everything else
// shelterMargin: seconds of cushion she leaves when coming out of shelter so that
//                thirst doesn't turn critical on the way to the water
export const NEEDS = { critical: 0.55, shelterMargin: 10 };

// Carrying: she can take ONE point at a time to the nest.
export const CARRY = {
  eatBelow: 45,       // with more hunger than this she eats it on the spot
  nestFeed: 30,       // hunger removed by eating from the nest's stores
};

// The pantry has a cap. Storing is having reserves for later, not hoarding:
// with the nest this full she stops gathering and turns to exploring.
//
// Inside the nest time passes keepFactor times slower: a ration
// lasts that much longer than lying in the sun. But lasting isn't lasting forever —
// once that long life is up it spoils and disappears from the stores. Storing
// postpones the hunger problem, it doesn't remove it.
//
// forageDrive: how much the empty pantry pulls a worker. She goes out for food
// because of what the colony lacks, not just because of her own hunger.
//   restHunger / restThirst: how much hunger and thirst she gets sleeping inside the
//   nest, compared to being outside (×). Lying still she spends much less (an ant's resting
//   metabolism is a fraction of its walking one) and the nest air
//   is almost saturated with moisture, so she barely loses water.
export const NEST = { full: 12, keepFactor: 10, forageDrive: 0.5, restHunger: 0.35, restThirst: 0.1 };

// Exploring. It isn't wandering: Fagi keeps a coarse grid of where she has
// been and heads for the cell she knows least.
export const EXPLORE = {
  cell: 90,           // px per side of each cell of the mental map
  visitGain: 1.0,     // how much a cell becomes known per second while in it
  visitMax: 3,        // cap on how well a cell is known
  fade: 0.001,        // how much is forgotten per second: a cell becomes new
                      // ground again after ~15 min (days, for her) without stepping on it
  distanceWeight: 1.4, // how much a cell's distance weighs when choosing it
  homeBias: 0,        // how much she prefers cells far from the nest. 0: workers
                      // aren't born in a hurry to get away, they widen their range with experience
  reach: 55,          // at what distance she counts the cell she was heading to as visited
  giveUp: 12,         // seconds insisting on a cell before choosing another
  // Exploring in legs: each leg goes to a point she SEES, inside her cone.
  // On arriving she looks again and picks the next one from what's in front of her.
  rays: 9,            // directions she tries within the cone
  depths: [0.45, 0.7, 0.92],  // at what fraction of her view each point is placed
  compassWeight: 1.2, // how much the heading pulls towards the least known area of the map
  farWeight: 0.3,     // preference for reaching the far end of what she sees
  turnWeight: 0.4,    // cost of a leg that forces her to turn all the way around
  waypointReach: 18,  // at what distance she counts the leg's point as reached
};

// Attention: what has just entered what she perceives. Something she hasn't perceived
// for `forget` seconds counts as new and makes her rethink the plan.
export const ATTENTION = {
  forget: 3,
  opportunisticThirst: 0.35,  // with this much thirst, seeing water nearby diverts her even when loaded
};

// Her own pheromone: the path she marks when returning loaded to the nest.
export const PHERO = {
  life: 600,          // seconds for a mark to evaporate (Lasius niger: ~47 min half-life)
  every: 0.1,         // how often she leaves a mark while carrying: ~7 px, a continuous trail
  sense: 12,          // at what distance she detects a mark: what the antennae reach (~6 mm)
  // Following the trail is learned like anything else: if within learnWindow
  // seconds it leads her to food, the belief about the pheromone rises (found); if
  // not, it drops (miss). She's born not knowing the trail is good for anything.
  learnWindow: 20,
  found: 0.8,
  miss: -0.5,
};

// Tree: drops fruit around itself every so often. The interval is
// set from the panel and applies to every tree on the map.
export const TREE = {
  interval: 8,        // seconds between fruits
  fruit: 'nectar',    // what it drops
  dropRadius: 1.9,    // where it falls: tree radius × this
  maxNear: 5,         // if this much of its fruit is already lying uncollected, it stops dropping
  life: 0,            // seconds a tree lives (0 = forever)
};

// What happens to fruit nobody collects.
// Rot doesn't stay forever either: when ITS life runs out
// (POINT_TYPES.toxic.life) it falls apart and disappears from the map, plume included.
export const FRUIT = {
  rot: 'toxic',      // what it turns into when it rots
  warnFrom: 0.6,      // from what fraction of its life it starts to look overripe
};

export const MAPGEN = {
  pools: 1,           // a single water source on the whole map
  nests: 1,           // one nest
  trees: 1,           // a single renewable source forces her to locate its trail
  treeMinNestDistance: 430, // the tree spawns far from the nest
  treeMaxNestDistance: 460, // a distant crown but reachable before going hungry
  rocks: 9,           // rocks
  rockScale: [0.45, 1.85], // and not all the same size: factor on their radius
  margin: 40,         // don't stick anything to the edge
  minGap: 34,         // minimum gap between objects (Fagi has to be able to get through)
  spawnClear: 130,    // clear radius around the point where Fagi spawns
  family: 'smell',    // how that chemistry is built (chemistry.js): 'smell' (the smell decides),
                      // 'one' or 'conj' (poison needs a color AND a smell)
  species: 0,         // > 0: a map with its own hidden chemistry and this many
                      // wild species, one tree each (chemistry.js). 0 = classic
  speciesMinDistance: 200, // how far from the nest the species trees grow
  speciesMaxDistance: 480,
};

// ── The organism (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md) ───────────────────
//
// Day and night, body temperature, sex and sleep. Every block starts OFF: with
// them off the simulation is, number for number and random draw for random
// draw, the one the preregistered studies ran (docs/research/). The game turns
// them on at boot (organism.js, enableOrganism); batch with --organism.
//
// These numbers belong to a fictional species. They are calibrated by running
// the simulation, not taken from zoology.

// The day (cycle.js). A pure function of the world clock: nothing to save,
// and a replay at second t sees the same sky as the game did.
export const CYCLE = {
  enabled: 0,         // 0 = an endless day at THERMAL.preferred
  seconds: 180,       // one day. At 1 s ≈ 8 min of the organism (see WORLD), ≈ 24 h;
                      // THIRST.rate already kills in about one day
  start: 0.3,         // phase at which a session starts (0 = midnight, 0.5 = noon)
  dawn: 0.22,         // phase at which light is halfway up
  dusk: 0.78,         // and halfway down
  twilight: 0.05,     // phase it takes light to rise or fall at each end
  minLight: 0.12,     // light at night (0-1)
  mean: 22,           // °C, the day's average
  swing: 12,          // °C above and below the mean: 10 at dawn, 34 mid-afternoon
  warmest: 0.6,       // phase of the hottest moment
  nightSight: 0.45,   // fraction of sight range left at minLight
};

// Body temperature (thermal.js). An ectotherm that regulates by behaviour:
// her temperature follows the air unless she moves somewhere else.
export const THERMAL = {
  enabled: 0,
  preferred: 25,      // °C where nothing costs extra
  safeMin: 15,        // °C: below this, cold stress builds up
  safeMax: 33,        // °C: above this, heat stress
  lethalMin: 4,       // °C: stress fills at once
  lethalMax: 44,
  exchange: 0.05,     // fraction of the body-air gap closed per second (~20 s to settle)
  wetExchange: 2,     // soaked, the exchange is this many times faster
  wetChill: 4,        // °C of evaporative cooling while soaked
  moveHeat: 1.5,      // °C over the air while she walks
  nestTemp: 24,       // °C deep in the nest
  nestBuffer: 0.8,    // inside, how much of the nest temperature she feels (the rest is the air)
  shade: 5,           // °C cooler under a tree crown, at full daylight
  stressRate: 0.5,    // stress per second per °C outside the safe range
  recover: 2,         // stress recovered per second back inside it
  maxStress: 100,     // at this, she dies of cold or heat
  coldHunger: 0.06,   // hunger rate +6% per °C under safeMin (burning reserves)
  heatThirst: 0.06,   // thirst rate +6% per °C over safeMax
  coldSlow: 0.03,     // speed −3% per °C under safeMin
  minSpeed: 0.5,      // cold never slows her below this fraction
  sample: 4,          // seconds of a thermal experience before it is judged (like RAIN.sample)
  lesson: 0.6,        // how bad a full sample of stress feels
  refugeSample: 4,    // seconds inside the nest before judging whether it helped
  instinct: 0.15,     // innate urge to move when too cold or too hot (she does not know where)
  reflex: 0.7,        // stress fraction at which she heads home whatever pulls her out
  voluntary: 1,       // 1 = her body's temperature also sets the reflex off, before any harm:
                      // the voluntary thermal maximum and minimum of real ectotherms
                      // (0 = only the harm already done, as measured up to §25.11)
  voluntaryMax: 38,   // °C of her body from which she heads for cover
  voluntaryMin: 9,    // °C of her body under which she does
  duskSense: 0.6,     // light under which she notices it falling
  behave: 1,          // 0 = she feels and learns it but never acts on it (the ablation)
};

// Sex (biology.js). It changes the body, never the rules she follows: no
// "the female tends, the male explores". Two ways of spending the same budget.
export const SEX = {
  enabled: 0,         // 0 = no sex: every body is the plain one
  female: { speed: 0.94, energyMax: 1.12, metabolism: 0.92, insulation: 1.08 },
  male: { speed: 1.08, energyMax: 0.92, metabolism: 1.08, insulation: 0.94 },
};

// Sleep (sleep.js, consolidation.js). Resting recovers energy; sleeping at
// night, safe in the nest, is also when the day's experiences are sorted.
export const SLEEP = {
  enabled: 0,
  rise: 0.008,        // sleep pressure per second awake (0-1): ~2 min of activity fills it
  nightRise: 2,       // × while it is dark
  fall: 0.03,         // pressure lost per second asleep in the nest
  fallOutside: 0.012, // asleep outside she sleeps worse
  drowsy: 0.6,        // at night, with this much pressure she goes to sleep
  exhausted: 1,       // with this much she sleeps wherever, day or night
  wake: 0.08,         // she wakes when it drops below this (or at dawn, under drowsy/2)
  minSleep: 15,       // seconds asleep in the nest before the night is consolidated
  consolidate: 1,     // 0 = she sleeps but sorts nothing (the ablation)
  salient: 6,         // episodes kept as the night's highlights
  boost: 0.25,        // confidence a replayed belief gains (of what it lacks)
  redundant: 3,       // same fruit, same outcome: more than this many in a day are merged
  minSupport: 2,      // bites behind a hypothesis
  minEffect: 0.15,    // average reward (±) for a trait to predict something
  reports: 12,        // night reports kept
  replay: 0,          // rounds of interleaved replay of the remembered fruit (consolidation.js); 0 = none.
                      // Off since the follow-up evaluation (§25.13): with 4 rounds she judged untasted
                      // fruit worse, and worse again after the world turned over. Measured up to §25.12 with 4
  replayRate: 0.15,   // how far each rehearsal moves the traits (a day bite moves them CUES.rate)
  downscale: 0,       // share of weight every rehearsed trait loses before each round. 0 = pure
                      // replay; 0.1 guesses untasted fruit better but is less wary of poison (§25.2)
  askAlways: 1,       // 1 = the night asks about fruit she saw and never tasted even when the day
                      // left no bite of hers to sort: that question is semantic memory, not
                      // episodic (0 = only after a day with bites, as measured up to §25.12)
};

// Experiments (experiment.js, decision/experiment.js): last night's questions
// become the next day's agenda, and she answers them with a small bite.
//   portion : share of a whole fruit a trial bite is (the body pays that much;
//             she learns what a whole one would do)
//   maxWary : she does not try a fruit whose traits make her this wary (0-1)
//   agenda  : questions carried into the day
export const EXPERIMENT = {
  enabled: 0,
  portion: 0.25,
  maxWary: 0.3,
  agenda: 6,
};

// Appetite (appetite.js): what the body lets her eat, and when; and thirst
// that sends her looking for water before it is critical.
//   handling    : seconds a bite takes before the next one
//   malaise     : seconds after a bite that felt bad in which she eats only what
//                 she knows is good
//   searchWater : thirst (fraction) from which, not knowing where water is, she
//                 stops gathering and goes looking for it
//   averse, desperate: below
export const APPETITE = {
  enabled: 0,
  handling: 3,
  malaise: 40,
  searchWater: 0.3,
  smellAversion: 0.15, // a smell whose learned weight is this bad or worse puts her off any untasted
                      // fruit that has it (one bad bite does it: CUES.rate × a harmful reward)
  averse: 0.5,        // wariness (learned/cues.js) from which she won't eat a fruit she never tasted
  desperate: 0.85,    // hunger (fraction) from which she eats it anyway
  poisonWindow: 120,  // seconds a harmful bite counts toward "died of poisoning"
};

// Perception (percept.js): she tells things apart only by what she perceives.
// By smell alone, only the smell.
export const PERCEPT = {
  enabled: 0,
};

// The night mind (night/): a model that proposes hypotheses while she sleeps,
// and the gate that decides which she keeps.
//   backend     : 'local' (deterministic, no network) or 'http' (a server at `url`)
//   trust       : what a kept proposal is trusted, as a share of what backs it
//   minSupport  : fruit she tasted that must back a proposed rule
//   maxProposals: proposals weighed per night
//   timeout     : seconds a remote mind has to answer
//   log         : entries kept in her night log
export const NIGHTAI = {
  enabled: 0,
  backend: 'local',
  url: '',
  trust: 0.5,
  sure: 0.75,
  minSupport: 2,
  maxProposals: 4,
  timeout: 4,
  log: 40,
};

// Life (lifecycle.js, reproduction.js): egg → juvenile → adult → senescent →
// death, and a population that breeds inside the world
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §10). Times in seconds of game, the
// same compressed clock as hunger and thirst (180 s ≈ one day).
//   founders       : how many the population starts with, as adults (both sexes)
//   adultAt        : age at which a juvenile becomes an adult (and may breed)
//   lifespan       : mean age at which she dies of old age; each one draws her
//                    own, ± lifespanSpread (a fraction)
//   senescentAt    : fraction of her lifespan from which she ages
//   juvenileSpeed  : a juvenile's speed (×); oldSpeed: the speed she ends at
//   mateEnergy     : energy (fraction of her maximum) both need to mate
//   mateNeed       : hunger and thirst (fraction) both must be under
//   mateStock      : edible rations the nest must hold: no brood in a lean time
//   mateCost       : energy mating costs each
//   eggCost        : hunger the female pays to lay (the egg is made of her)
//   femaleRecover / maleRecover: seconds before each may mate again
//   incubation     : seconds an egg takes at a good temperature
//   eggCold / eggWarm: nest temperature (°C) from which an egg does not develop /
//                    develops at full pace (only with THERMAL on)
//   eggStarve      : seconds a ready egg waits for a ration to hatch before it dies
//   kinLimit       : relatedness (0-1) from which two do not mate (0.5 = parent
//                    and child, full siblings)
//   maxPopulation  : the nest holds this many, eggs included
//   gradual        : 1 = fertility fades through old age, and a crowded nest slows
//                    every brood before the ceiling (0 = senescents never breed and
//                    the ceiling is the only brake, as measured up to §25.12)
export const LIFE = {
  enabled: 0,
  founders: 4,
  adultAt: 360,
  lifespan: 5400,
  lifespanSpread: 0.15,
  senescentAt: 0.75,
  juvenileSpeed: 0.85,
  oldSpeed: 0.6,
  mateEnergy: 0.6,
  mateNeed: 0.45,
  mateStock: 2,
  mateCost: 15,
  eggCost: 12,
  femaleRecover: 360,
  maleRecover: 120,
  incubation: 240,
  eggCold: 12,
  eggWarm: 22,
  eggStarve: 180,
  kinLimit: 0.5,
  maxPopulation: 16,
  gradual: 1,
};

// Things and concepts (things.js, concepts.js, decision/things.js; spec §12.8).
// Small objects with no inborn category: she only sees how they look (color,
// shape, texture). What each is good for hangs, per map, on one of those
// traits; she finds out by touching and nibbling, groups what she found into
// concepts and uses them. Off, no thing is ever placed.
//   dims       : the traits the map may hang what things do on (one drawn per
//                map); the evaluation adds 'color', never used while tuning
//   kinds      : distinct looks on a map, spread over the deciding trait's
//                values so each affordance has several kinds
//   things     : things on the map (every kind at least once)
//   lateAt     : seconds into the world when new kinds sprout: lateKinds looks never on
//                the map before, lateThings things of them (0 kinds = none)
//   reach      : px beyond both radii at which she is touching it
//   sap        : thirst a nibble of sap takes away; then it is dry for sapRegrow s
//   sting      : energy a sting costs; stingPain how bad it feels (0-1)
//   thermal    : °C a cool or warm thing moves her body's target while pressed to it
//   minKinds   : kinds behind a concept
//   testMin    : new kinds a concept must have predicted before it can be retired
//   keep       : share of those it must get right to stay
//   trust      : confidence (0-1) a belief needs to change a decision
//   sure       : a kind she predicts this surely she does not examine (§12.5: curiosity
//                follows uncertainty); she finds out when she uses it. 1 = examine all
//   sipAt      : thirst share from which a sap thing tempts her
//   surprise   : how much a belief about things that fails makes the world seem changeable
//                (0-1); 0 = she never doubts nor looks again (the ablation)
//   calm       : seconds for that to fade to half
//   social     : 1 = seeing a sister stung by a thing, or drinking its sap, teaches that
//                kind without touching it (social.js); watched, not lived: trusted `seen`
//   seen       : confidence (0-1) of what she only saw happen to a sister
//   generalize : 0 = every kind on its own, concepts never predict (the ablation)
export const CONCEPT = {
  enabled: 0,
  dims: ['shape', 'texture'],
  kinds: 12,
  things: 18,
  lateAt: 1200,
  lateKinds: 8,
  lateThings: 12,
  reach: 6,
  sap: 30,
  sapRegrow: 45,
  sting: 10,
  stingPain: 0.7,
  thermal: 9,
  minKinds: 2,
  testMin: 3,
  keep: 0.5,
  trust: 0.5,
  sure: 0.75,
  sipAt: 0.25,
  surprise: 0.6,
  calm: 240,
  social: 1,
  seen: 0.6,
  generalize: 1,
};
