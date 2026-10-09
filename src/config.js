// Every tunable number in the game lives here.

// Scale and clocks. 1 px = 0.5 mm: Fagi is ~9 mm long, and the map is a
// 64 x 43 cm patch of ground. Fagi is a made-up organism, but her body
// numbers (size, speed, how she drinks, pheromone, weather sense) were
// calibrated on ants, the closest real animal of her size; the ant figures
// quoted below are that calibration, not a claim of what she is. Moving, seeing, smelling
// and pheromone run in real time. Only biology (thirst, hunger, forgetting, what
// rots) is compressed: 1 s of game = ~8 min of her life, keeping the real
// proportions between one thing and another.
//
// width/height are the map now; baseWidth/baseHeight the original patch. A
// bigger map (MAPGEN.size) multiplies both sides: the view stays the same
// size and zooms out to fit it (camera.js).
export const WORLD = {
  width: 1280,
  height: 860,
  baseWidth: 1280,
  baseHeight: 860,
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
  min: 1,             // on a bigger map it goes lower, down to what fits it whole (camera.js)
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

// Her gait (gait.js): how the ground and her situation change her pace.
// Off here, so batch runs and tests stay the preregistered world; the game
// turns it on (app/organism-on.js).
//   - uphill she slows and spends more, downhill she goes a little faster;
//   - on ground she barely knows, and with nothing pressing, she crawls;
//   - racing home from rain, a front or the heat, or to what ends a critical
//     need, she sprints, and pays for it in energy.
export const MOVEMENT = {
  enabled: 0,             // 0 = one pace everywhere, as before
  crawlSpeed: 0.5,        // fraction of speed while cautious
  sprintMult: 1.35,       // speed (and energy per second) while sprinting
  zigzagFreq: 2.2,        // sweep oscillation frequency (rad/s) when searching for trails
  zigzagAmp: 0.35,        // sweep angle amplitude (radians)
  terrainAdapt: 1,        // slopes slow her uphill and speed her downhill
  slope: 1,               // how much a slope weighs (0 = flat world)
  cautiousThreshold: 0.6, // how unknown the ground must be (0-1) for her to crawl
  sprintEnergy: 0.15,     // energy fraction under which she no longer sprints
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
  touch: 0,           // px two sisters in the nest must be within to exchange; 0 = anywhere in the nest (the game uses 24, app/organism-on.js)
  seeRange: 1,        // fraction of her view range at which she notices a sister eat
  format: 'rule',     // what is passed on (social.js): 'rule' | 'verdict' | 'evidence'
  budget: 0,          // items passed in one exchange (a rule, a verdict, a bite); 0 = no cap
  cost: 'items',      // what the budget counts: 'items', or 'coverage' (species an item speaks about; social.js)
  evidence: 2,        // bites behind each rule, in the 'evidence' format
  topic: 'all',       // what is passed on: 'all' rules, or only 'food' (rules about eating)
};

// Polyethism & Emergent Castes (castes.js): adaptive division of labor
// based on task response thresholds (Theraulaz, Bonabeau & Deneubourg).
// Ants reinforce affinities as they execute survival tasks:
// foragers (pantry/food), scouts (exploration/plumes), nurses (nest/rest), patrollers (borders/mud).
export const CASTES = {
  enabled: 0,         // 1 = emergent behavioral division of labor enabled
  reinforceRate: 0.1, // threshold reinforcement per successful task turn
  decayRate: 0.02,    // threshold decay per idle/unrelated second
  thresholdMin: 0.1,  // highest sensitivity / specialization
  thresholdMax: 0.9,  // lowest sensitivity
};

// Generations (generations.js, batch --generations): what a newborn inherits.
export const GEN = {
  culture: 1,         // raised by a surviving elder: her rules and habits
  cultureTrust: 0.6,  // a rule taught is trusted this fraction of the elder's trust
  cultureProgram: 0,  // 1 = elder passes custom non-retired program lines to juvenile (source: 'told')
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

// Individual variation (variation.js): no two Fagis are born the same. Each
// carries, in her genome, a multiplier around 1 per trait below: one is
// born faster, another with more reserves, a thirstier one... drawn on a
// log scale, so ×1.1 and ×0.91 are equally likely. Off here (batch and
// tests are the preregistered world, everyone alike); the game turns it on
// (app/organism-on.js).
//   founders     : the first generation is born varied
//   births       : every newborn is born varied too (off: newborns are standard)
//   spread       : how much individuals differ: the typical gap from the
//                  species' value (0.1 ≈ ±10 %)
//   limit        : the furthest any trait may go from 1 (0.4 = ×0.6 … ×1.4)
//   heritability : how much of a newborn's trait comes from her parents'
//                  (their average), the rest a fresh draw. 0: every birth a
//                  new lottery; near 1: the colony's traits drift where who
//                  survives and breeds takes them (selection)
//   weight       : how much each trait varies, × spread (0 = not at all)
export const VARY = {
  founders: 0,
  births: 0,
  spread: 0.1,
  limit: 0.4,
  heritability: 0.5,
  weight: {
    speed: 1,       // how fast she walks
    energyMax: 1,   // her energy reserves
    metabolism: 1,  // how fast she burns food (hunger and walking cost)
    thirst: 1,      // how fast she gets thirsty
    insulation: 1,  // how slowly heat and cold reach her body
    view: 1,        // how far she sees
    smell: 1,       // how keen her smell is
    memory: 1,      // how slowly she forgets
    tolerance: 1,   // how well she stands poison
    life: 1,        // how long she lives (with LIFE)
  },
};

// The evolving body (morph.js; docs/research/libera/cuerpo-evolutivo.md):
// organs she inherits, each a multiplier around 1 (1 = today's Fagi), with
// what it gives and what it costs. Off, nobody carries them and nothing
// changes. Needs a breeding population (LIFE) to evolve at all.
//   traits      : brain, gut, muscle, eyes, antennae, size
//   range       : how far a gene may go; past ~1.5 the cost makes it unviable
//   mutation    : spread of each gene's step, as a factor (log-normal)
//   founders    : spread of the founders' genes, so selection has something to choose
//   tissue      : share of her resting burn each organ takes at 1; the rest is
//                 the body itself. Brain per gram ~18× muscle (Elia 1992), eyes up
//                 to 15% of the resting burn (Moran et al. 2015)
//   costPower   : how much faster than linear an organ costs as it grows: past a
//                 point a bigger one is not worth it
//   kleiber     : total burn ∝ size^kleiber (Kleiber 1932): a bigger body burns
//                 more, but less per gram, and holds more reserves
//   gain        : how much each benefit grows with its organ (< 1: diminishing
//                 returns; Niven et al. 2007, Chittka & Niven 2009)
//   brainLife / brainBrood: a bigger brain shortens life and slows breeding
//                 (Kotrschal et al. 2013, 2019); elasticities, gentler than the guppies'
//   fecundity   : a bigger mother breeds faster: her rest between broods ∝ size^-this
//                 (insect fecundity grows about in proportion to body mass, Honěk 1993)
//   choice      : a female picks, among the males who can, the one who looks best ×
//                 his strength (muscle × size^⅔) to this power: females of many
//                 insects prefer bigger, stronger males (0 = condition only)
//   maternal    : maternal effects. What the mother lived up to the moment she lays
//                 an egg (her organs' use, against typical) and how well fed she is
//                 then shape where her daughter's organs start and settle, to the
//                 power `share` (0 = off), within ±max; `fed` is how much her
//                 hunger sets the egg's provisioning, hence the daughter's size. Not
//                 passed on further: each brood gets what its mother lives then, so
//                 her first and fifth broods can come out different
//   sizeSpeed   : a heavier body is slower per unit of muscle
//   oxygen      : °C her heat limit (THERMAL.safeMax) drops per unit of size over 1:
//                 a bigger body's tracheae fall short of oxygen first when it is hot
//                 (the temperature-size rule, Atkinson 1994; Harrison et al. 2010).
//                 Bergmann's side, a bigger body keeping its warmth, is insulation
//   plastic     : what she lives moves the organs she carries (morph.js,
//                 updatePlasticity), never her genes:
//     enabled   : 0 = she carries exactly what she inherited
//     enough    : how far from typical a use must be, as a fraction, before her
//                 organ moves at all: a life like most lives leaves the body as it
//                 was born, and only what goes past that changes it
//     max       : how far from her gene an organ can move, as a fraction
//     window    : seconds over which she averages how much she uses each organ
//     tau       : seconds an organ takes to move most of the way to what its use asks
//                 (days: a gut remodels in about a week, Dekinga et al. 2001)
//     build     : hunger growing tissue costs, per unit of its share of her burn
//     ref       : the use at which an organ stays as inherited (measured on the
//                 game's colony): moving, work (moving, × 1 + her load), out of the nest, out in daylight,
//                 smelling something, bites a day, and a juvenile's nourishment
//     amp       : how strongly each organ follows its use. Muscle grows with
//                 walking; the gut with eating, shrinking in a fast (Piersma &
//                 Lindström 1997); the brain with foraging experience, not age
//                 (Withers et al. 1993); eyes with daylight, antennae with
//                 scents, wasting when unused (Moran et al. 2015); size is set by
//                 how well she was fed while young, then fixed
//     warm / warmth / enoughWarm: the temperature-size rule (Atkinson 1994): a
//                 juvenile raised warmer than `warm` °C grows into a smaller adult,
//                 `warmth` per °C (~2.5 % in arthropods), colder a bigger one; within
//                 enoughWarm °C of it, her size is not moved
//   inherit     : what a daughter inherits of what her parents lived:
//                 0 darwin     only their genes; what they lived dies with them
//                 1 baldwin    how much she can change is a gene of its own
//                              (genome.plastic), inherited and selected; keeping
//                              that capacity costs (Hinton & Nowlan 1987; Paenke
//                              et al. 2007)
//                 2 epigenetic a mark of what her parents lived moves where her
//                              organs start and settle, fading each generation
//                              (C. elegans keeps a learned avoidance ~4
//                              generations: Moore et al. 2019)
//   baldwin     : mutation and founders' spread of the plasticity gene, its
//                 range, and what each unit of it above 1 costs in resting burn
//   epigenetic  : share of what a parent lived that reaches the mark, and
//                 how much of a parent's own mark is kept (0.7^4 ≈ a quarter
//                 left after four generations)
export const MORPH = {
  enabled: 0,
  range: [0.5, 2],
  mutation: 0.05,
  founders: 0.08,
  tissue: { brain: 0.2, gut: 0.15, muscle: 0.3, eyes: 0.08, antennae: 0.04 },
  costPower: 1.5,
  kleiber: 0.75,
  gain: { memory: 0.7, digest: 0.5, tolerance: 0.7, speed: 0.5, view: 0.5, smell: 0.5 },
  brainLife: 1,
  brainBrood: 1,
  fecundity: 1,
  choice: 1,
  maternal: { share: 0, max: 0.25, fed: 0.6 },
  sizeSpeed: 0.15,
  oxygen: 30,
  plastic: {
    enabled: 1,
    enough: 0.15,
    max: 0.25,
    window: 540,
    tau: 900,
    build: 1,
    ref: { move: 0.53, work: 0.5, out: 0.59, light: 0.52, smell: 0.11, eat: 0.27, fed: 0.7 },
    amp: { muscle: 0.5, gut: 0.4, brain: 0.4, eyes: 0.5, antennae: 0.5, size: 0.6 },
    warm: 25,
    warmth: 0.025,
    enoughWarm: 1,
  },
  inherit: 0,
  baldwin: { mutation: 0.08, founders: 0.15, range: [0, 2.5], cost: 0.05 },
  epigenetic: { share: 0.5, keep: 0.7 },
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

// The stomach in two stages (stomach.js; LIBERA phase 4, H6): a bite fills
// the stomach, which empties into her body at `rate`; she feels the full
// stomach at once (anticipatory satiety).
//   capacity : hunger points a full stomach holds (× her gut with MORPH)
//   rate     : hunger points it digests per second
//   satiety  : how much of what is in it she feels as fed (0 = none: she feels
//              only what has reached her body)
export const STOMACH = {
  enabled: 0,
  capacity: 50,
  rate: 1,
  satiety: 1,
};

// Free-flow selection (decision/select.js; LIBERA phase 3): past the survival
// reflexes, her lines vote instead of the first one winning.
//   mode      : 'program' = the first line that answers wins (as always);
//               'freeflow' = the lines vote, each by the need it serves × what
//               that need is worth (κ); 'freeflow+central' = and the act she is
//               on gets `hold` more, so a near tie does not flip her
//   every     : seconds between votes; in between, the winner acts on its own
//   hold      : what the act she is on gets on top, with a central selector
//   floor     : a vote's least, so a line with nothing pressing still speaks
//   curiosity : how loud curiosity is (experiments, probing)
//   consume   : a proposal whose target is within `reach` px (the act that
//               consumes, not the one that looks for it) votes × 1 + this
//               (Tyrrell's 4–5: consummatory over appetitive)
//   reach     : px from her at which a target is within reach
//   veto      : 1 = a need past its critical threshold is not voted on: only
//               the lines that serve it may win while it lasts (H2c)
//   sequence  : seconds a won act keeps the floor, unvoted, until what it was
//               after is done or the line stops answering (0 = off; H2d)
export const SELECT = {
  mode: 'program',
  every: 0.5,
  hold: 0.15,
  floor: 0.05,
  curiosity: 0.15,
  consume: 0,
  reach: 40,
  veto: 0,
  sequence: 0,
};

// Drives (drive.js; LIBERA phase 2): how much a need makes what relieves it
// worth, W = κ·V.
//   mode  : 'innate' = κ a fixed curve of the need (as always); 'learned' = κ
//           learned from how good relief felt at each level of need
//   bins  : levels of need κ is kept at
//   rate  : how fast κ follows what she felt
//   prior : κ before she has felt anything (flat: she does not know yet)
export const DRIVE = {
  mode: 'innate',
  bins: 5,
  rate: 0.2,
  prior: 0.5,
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

// The classic fruit: nectar, and what any fruit becomes when it rots. The
// rest are made by the person, per session (custom-fruits.js), and the wild
// species by each map's chemistry (chemistry.js); all of them land here.
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
    taste: { sweet: 0.9 },   // what the tongue says of it (TASTE only)
  },
  toxic: {
    color: '#d95b7e',
    radius: 6,
    aroma: 130,       // poison smells too, and it smells similar
    life: 180,        // rot doesn't rot further: when its time is up it disappears
    hunger: 25,
    effects: [{ stat: 'speed', mult: 0.6, sec: 5 }],
    traits: { color: 'red', shape: 'round', smell: 'rotten' },
    taste: { sour: 0.7, bitter: 0.5 },   // what the tongue says of it (TASTE only)
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
  // Drawing only: 1 = every trail on the map is drawn; 0 = a trail shows only
  // while a Fagi is smelling it, and fades away when none does. With many trees
  // and fruit, drawing them all buries the map under threads.
  show: 0,
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
  life: 600,          // seconds for a mark to evaporate (Lasius niger: ~47 min half-life). The game uses 60 (app/organism-on.js)
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

// More than one colony (reproduction.js, mapgen.js): nests that each raise
// their own brood from their own pantry, competing for the same fruit. A
// colony that thrives sends out a pair to refound an emptied nest, so the
// colonies that do well spread: selection between colonies, the way ants
// evolve (each colony's pantry is shared inside it, not across).
//   count    : nests on the map (1 = one colony, as always)
//   founders : founders of each further nest
//   spacing  : px at least between two nests
//   foundAt  : a colony this full (share of LIFE.maxPopulation, per nest) may
//              send a pair to an empty nest
//   every    : seconds between looks for an empty nest to refound
//   party    : adults that go to refound it: a fertile pair (2, as measured
//              until 2026-10-08), or the pair and more of the colony's adults
//   from     : which colony refounds it, among those full enough: 'fullest'
//              (as measured until 2026-10-07) or 'nearest' (the neighbours,
//              as colonies spread in nature: less mixing between far habitats)
export const COLONIES = {
  count: 1,
  founders: 4,
  spacing: 380,
  foundAt: 0.5,
  every: 60,
  party: 2,
  from: 'fullest',
};

// The weight and hardness of fruit (load.js): what carrying and eating ask of
// her body. Off, every fruit weighs and gives the same.
//   range     : a fruit's weight, × a typical one, drawn when it falls (log-uniform)
//   hardRange : how hard it is, likewise
//   sizePower : strength ∝ muscle × size^this (muscle cross-section, 2/3)
//   slow      : speed lost per unit of load over strength: 1 / (1 + slow × load)
//   effort    : extra energy per second walking, per unit of load over strength
//   hardGain  : a fruit harder than her gut gives × (gut / hardness)^this
export const LOAD = {
  enabled: 0,
  range: [0.5, 2],
  hardRange: [0.5, 2],
  sizePower: 0.67,
  slow: 0.35,
  effort: 0.8,
  hardGain: 1,
};

// Seasons (seasons.js): years with a lean, cold winter and a generous summer,
// the selection pressure an evolving body needs (docs/research/libera/
// cuerpo-evolutivo.md). Off, every day of the year is the same.
//   year        : seconds in a year (3600 = 20 days of 180 s)
//   winter      : share of the year the winter takes, at its centre (winterAt)
//   winterFruit : what trees bear at the depth of winter (× their rate)
//   summerFruit : what they bear in the heart of summer (× their rate)
//   winterCold  : °C the depth of winter takes off the air (with CYCLE)
//   unpredictable: 0 = every winter the same; 1 = each year draws how hard,
//                  how long and when its winter comes, within ± spread
//   spread      : how much one year's winter may differ from another's
//   hotYears    : share of years that come hot instead: a mild winter (no cold,
//                 still lean) and a summer summerHeat °C hotter at its heart. A
//                 cold year favours a big body, a hot one a small one
//   persist     : chance a year is the same kind as the one before. High, a
//                 mother's year foretells her daughter's (predictable); 0, each
//                 year is a fresh draw (de Bruin et al. 2026)
//   farYears    : share of years whose fruit is far: the trees farther from the nest
//                 than the middle one bear, the nearer ones only reachLow of their
//                 rate; the other years, the opposite. A far year pays the walker
//                 (muscle), a near one the one who keeps no more muscle than she needs
export const SEASONS = {
  enabled: 0,
  year: 3600,         // 20 days: a winter longer than she can fast (~7 days), so it tells
  winter: 0.45,
  winterAt: 0.75,
  winterFruit: 0.02,
  summerFruit: 1.6,
  winterCold: 8,
  unpredictable: 0,
  spread: 0.5,
  hotYears: 0,       // share of years that come hot: a mild winter, a scorching summer (0 = none)
  summerHeat: 12,    // °C the heart of a hot year's summer adds to the air
  persist: 0,        // chance a year is the same kind as the one before (predictable runs when high)
  farYears: 0,       // share of years whose fruit is far from the nest (the rest, near; 0 = off)
  reachLow: 0.1,     // what the trees on the wrong side bear in such a year (× their rate)
};

// Habitats (habitats.js): each nest's surroundings are a place of their own,
// so each colony adapts to where it lives. Dealt one per nest, shuffled per
// map, when a map is made. Off, every nest lives in the same world.
//   kinds : the habitats dealt (cycled if there are more nests)
//   cold, hot : `air` °C added to the air around the nest and to its soil, so
//           the nest and the brood in it feel it too: cold favours a big body
//           (raised cold she grows bigger, and keeps her warmth), hot a small
//           one (raised warm she grows smaller, and her tracheae keep up)
//   lean  : what the trees of a 'lean' nest bear (× their rate)
//   toxic : poisonous trees growing close to a 'toxic' nest, and how close (px):
//           what is at hand is not what feeds, a matter of conduct, not body
export const HABITATS = {
  enabled: 0,
  kinds: ['cold', 'hot', 'toxic'],
  cold: { air: -3 },
  hot: { air: 6 },
  lean: { fruit: 0.4 },
  toxic: { trees: 1, near: [150, 260] },
};

// Explore or come back (phase 9, spec §12.11): a world where going back to
// the last good place is not always right. With it off, every tree bears
// forever and no fruit shows up on its own, as before.
//   - some trees bear all year; the rest have seasons: they drop a crop, go
//     bare and rest before bearing again. She can't tell which is which
//     until she has been back;
//   - now and then a patch of fruit shows up on the ground somewhere (a
//     branch that broke, a windfall) and is never renewed.
export const FORAGE = {
  enabled: 0,
  persistence: 0.5,   // share of trees that bear all year (1 = all, as before)
  crop: 12,           // fruit a seasonal tree drops before it goes bare
  rest: 240,          // seconds a bare tree rests before bearing again
  patchEvery: 150,    // seconds between ground patches (0 = none)
  patchSize: 6,       // fruit in a patch
  patchSpread: 30,    // px around its centre
  patchMinNest: 200,  // px from the nest: not on her doorstep
};

// Food sites (phase 9 B, spec §12.11, sites.js): the places where she has
// found food, each with what she expects to find there, learned from what
// she does find when she goes back. Off, she remembers one tree, as before.
export const SITES = {
  enabled: 0,
  max: 4,             // sites she can hold at once: the least trusted makes way
  radius: 45,         // px: a find on open ground and what lies around it are one site
  full: 3,            // edible fruit in sight that make a site as good as it gets
  rate: 0.35,         // how far one visit moves what she expects (× the surprise)
  first: 0.5,         // how much she trusts a site she has just found
  gain: 0.3,          // trust gained on each visit
  decay: 0.0008,      // trust lost per second away (~20 min: a few days)
  minValue: 0.15,     // below this she no longer counts on a site
  leave: 2,           // × its radius: how far she must go for coming back to count as a visit
};

// Explore or come back, the choice (phase 9 C, spec §12.11, choice.js). When
// she needs food and sees none she weighs going back to a site she knows
// against looking somewhere new, from what each has given her, and chooses
// with a noise of her own. Needs SITES. Off, the fixed hierarchy decides.
export const CHOICE = {
  enabled: 0,
  mode: 1,            // 1 = from her own uncertainty: guesses drawn from her evidence, food per second (choice.js); 0 = values, a set softmax noise (as first measured, spec §25.22)
  policy: 0,          // 0 = learned; the fixed ones to compare with: 1 = always back to her best site, 2 = always explore
  genes: 1,           // mode 1: her starting beliefs, her memory's pace and her patience are inherited (generations.js FORAGE_GENES); founders carry 0, the values above
  explorePrior: 0.4,  // what she expects of exploring before she has tried it
  rate: 0.25,         // how far one search moves what she expects of exploring (× the surprise)
  cost: 0.3,          // value a site loses per MEMORY.travelRange of walk
  doubt: 0.3,         // how much her estimate of a site wobbles when she doesn't trust it at all
  trustDiscount: 0,   // 1 = trust multiplies a site's worth (as first measured, spec §25.22); 0 = it only loosens it
  temper: 0.15,       // her noise when choosing: how much chance the worse option keeps
  temperSpread: 0.5,  // how much that noise differs between individuals from birth (0 = all alike)
  surpriseHeat: 1,    // how much her recent surprises raise her noise
  surpriseMemory: 0.2,// how fast those recent surprises follow the last ones
  exploreWindow: 90,  // seconds exploring without finding food before it counts as nothing
  planMax: 180,       // seconds a plan to go back holds before she reconsiders
};

// The decision point (docs/research/plan-decision-adaptativa.md step 1b,
// decision/point.js): after the reflexes, a controller says what she goes
// after, and that is what she does. Off, the fixed hierarchy decides as
// always and nothing changes.
export const DECIDE = {
  enabled: 0,
  controller: 'choice', // who answers: 'choice' = the learned choice (choice.js) connected here
  ownStream: 1,         // 1 = the controller's draws come from a stream of its own, not the one that moves her
  eat: null,            // the bite point (decision/bite.js): who judges a fruit; null = as always, 'current' = the same judgment through it
};

// Rules of conduct (docs/research/plan-reglas-de-conducta.md,
// learned/conduct.js): lines of her own code about how to act with a fruit.
// With it on she records every bite for them and the 'learned' judge of the
// bite point (DECIDE.eat) applies her live ones over her usual judgment.
export const CONDUCT = {
  enabled: 0,
  born: [],             // lines she is born with ({ id, if, do }), for research
  learn: 0,             // 1 = she writes her own lines from her bites (learned/conduct-learn.js)
  power: 3,             // how much more a hunger near the top weighs: danger = (hunger/max)^power
  minSupport: 2,        // harmful bites a line must have spared before she keeps it
  gate: 1,              // 0 = ablation: she keeps whatever she proposes
  retire: 1,            // 0 = ablation: a line she wrote is never retired
  valuation: 'trajectory', // how the gate weighs a line: 'trajectory' (v2) or 'static' (v1, discarded)
  inherit: 0,           // 1 = lines she was born with keep being judged, on what her line gathered plus this life
  declined: 0,          // 1 = fruit she wanted and left because of a line count against it (lineages v2)
  explore: 0,           // chance she breaks a line that bans a fruit she wants, with a trial bite (revision 2)
  exploreBelow: 75,     // ...only while her hunger is below this
  kindFirst: 0,         // 1 = among near ties, a line about the kind wins over one about her hunger or a look
};

// A judge in code (docs/research/plan-codigo-cultural.md, step 1;
// learned/code-judge.js, Node only): the source text of a function
// ground(obs, look, diary) that answers 'eat' | 'taste' | 'carry' | 'leave'
// when she touches a fruit, run apart from everything else. With it on she
// also keeps a diary of her bites as plain data (learned/diary.js).
//   source    : the function's text; null = the innate answer
//   maxChars  : longer texts are refused (every bite then goes to the innate answer)
//   timeoutMs : a call that runs longer fails, and that bite goes to the innate answer
//   diary     : bites the diary keeps (the oldest go first)
export const CODE = {
  enabled: 0,
  source: null,
  maxChars: 4000,
  timeoutMs: 50,
  diary: 60,
};

// Her program (program.js) and how she rewrites it from what she lives
// (program/watch.js, program/learn.js). All off: the program is the one she
// was born with and nothing watches it.
//   watch      : 1 = she notes each moment a line of hers comes to act, and what
//                came of it, without changing anything she does; 2 = besides,
//                she imagines every line below the one that acted (the
//                competition between her lines, and the proof that imagining
//                changes nothing). learn needs 1 at least, and turns it on
//   learn      : 1 = now and then, where one of her lines leads and another
//                would act too, she lets the other take its turn; when her
//                record says the other does better there, she writes it in
//                front, for that situation (a line of her own)
//   tick       : seconds between her looks at which line would act
//   every      : seconds between her looks at her record, to write or retire
//   explore    : chance, each time a line comes to lead while others would act
//                too, that one of those takes its turn this once
//   reconsider : seconds the same line leads before it counts as chosen again
//   trialMax   : seconds a trial lasts at most
//   horizon    : seconds after a moment over which what came of it is judged
//   power      : how much more a need near its top weighs: distress = need^power
//   minSupport : moments on each side (it acted / she did without) before she weighs
//   alpha      : chance that, over all she weighs at one look, noise alone gets a
//                line rewritten (the gate's z grows with how much she asks)
//   margin     : and the difference must be at least this much distress
//   record     : moments she keeps
//   maxOwn     : lines of her own at most
//   share      : 1 = sisters in the nest tell each other their moments (what each
//                line cost them), lived or told, and each weighs them like her
//                own (program/share.js); nobody passes on a line
//   shareBudget: moments a sister passes to another at one exchange
export const PROGRAM = {
  watch: 0,
  learn: 0,
  inherit: 0,         // copy the maternal base and evidence-backed revisions into each egg
  tick: 0.25,
  every: 20,           // seconds between reviewing her program (was 60)
  explore: 0.35,       // exploration probability for trials (was 0.3)
  exploreByState: 0,   // 1 = the worse she is, the less she tries (program/watch.js exploreNow)
  darkTrials: 0,       // 1 = in the dark, trials only toward endure lines (program/watch.js); 0 = no trials in the dark
  judge: 0,            // what a moment costs her: 0 = distress (felt, worst need), 1 = reserves (all needs + food to come; program/watch.js)
  reconsider: 15,      // reconsider interval (was 20)
  trialMax: 20,        // trial duration cap (was 30)
  horizon: 15,         // consequence measurement window (was 60: tight credit assignment)
  power: 3,
  minSupport: 3,       // trials needed on each side to weigh (was 10: responsive learning)
  alpha: 0.05,
  strictness: 1.0,     // scaling factor on doubt
  margin: 0.005,
  record: 4000,
  maxOwn: 8,           // lines she can write (was 6)
  compound: 1,         // enable conjunctive condition synthesis (e.g. need + flag)
  chaining: 1,         // enable macro-action and behavior routine chaining in self-programming
  crisis: 0,           // one acute crisis lived can write one line (program/crisis.js); off by default
  crisisThreshold: 0.6, // distress, as a share of the top, at which a crisis begins (0.35 caught ordinary tiredness)
  crisisRise: 0.15,    // how much it must have risen over the last 20 s: acute, not a need that crept up
  share: 0,
  shareBudget: 100,
  // H5 (docs/research/prereg-inheritance-3.md): learning that leaves alone what works.
  troubleTrials: 0,    // 1 = she tries other lines only after trouble: the chance times how recent her last bad moment was
  troubleAt: 0.6,      // distress, as a share of the top, that counts as trouble
  troubleHalf: 900,    // seconds for the memory of trouble to halve
  confirm: 0,          // 1 = a line she writes is on probation: it reaches the egg only once new moments, lived after it was written, back it
  confirmFor: 1800,    // seconds of probation; unconfirmed by then, it is retired
};

// The larder (phase 9 D, spec §12.11, larder.js): a nest that fills up, and
// a pantry she predicts between visits. Off, the nest takes all she brings and
// she remembers the pantry as she last saw it.
export const LARDER = {
  enabled: 0,
  capacity: 20,       // rations the nest holds; loaded to a full nest, she has to decide
  eatIfHunger: 0.3,   // hunger (fraction) from which she eats the load she can't store; below, she leaves it at the door
  learn: 1,           // 1 = she predicts the pantry and learns from the surprise; 0 = the last look, as before
  prior: 0.005,       // rations per second she expects it to lose before she has seen it change
  rate: 0.3,          // how far one visit moves that rate (× the surprise)
  maxRate: 0.1,       // cap either way (rations per second)
  minGap: 5,          // seconds between looks for the second to teach anything
};

// What happens to fruit nobody collects.
// Rot doesn't stay forever either: when ITS life runs out
// (POINT_TYPES.toxic.life) it falls apart and disappears from the map, plume included.
export const FRUIT = {
  rot: 'toxic',      // what it turns into when it rots
  warnFrom: 0.6,      // from what fraction of its life it starts to look overripe
};

export const MAPGEN = {
  size: 1,            // × the base map on each side (1 = 64 x 43 cm). Read when a map is made
  pools: 1,           // water sources: the first near the spawn, the rest anywhere
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
  inside: 0,          // 1 = the trees and water placed around a nest stay wholly inside
                      // the map. 0 = as the preregistered maps were drawn: about one
                      // map in six with species has a tree off the edge. The game sets 1
  density: 1.0,       // multiplier on rock and tree generation density
  hazards: 0,         // enable mud patches and treacherous terrain (0 = off by default)
  mudPatches: 3,      // number of mud patches that slow movement
  shelters: 2,        // rock clusters that provide natural rain/thermal overhang
  foodVariety: 1.0,   // multiplier on food variety and tree spacing
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
  nightly: 0,         // 1 = a diurnal body: the dark sends her to sleep whatever her pressure,
                      // and she sleeps until daylight (only a pressing need gets her up).
                      // 0 = only pressure does, as measured in docs/research/
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

// The scientific night (experiment.js; LIBERA phase 1, docs/research/libera/
// README.md): every question of the night carries what her traits predict of
// the fruit, the agenda is ordered by how much she expects to learn from each
// times how safe it looks (Oudeyer, Kaplan & Hafner 2007), and each answer
// comes back the next night as a verdict on that prediction.
//   enabled : 0 = the agenda as before (most asked first, no predictions)
//   order   : 'asked' keeps today's order and only adds predictions and
//             verdicts; 'lp' orders by expected learning progress × safety
//   window  : errors kept per trait, to tell progress from noise
//   noisy   : a trait whose recent error stays above this, with no progress,
//             is noise for now: questions that rest on it go last
//   novelty : the progress she expects of a trait she never tested
//   reach   : px of walking that halve what a question in sight is worth to her
//             now ('lp': she goes for the question most worth it, not the nearest)
export const SCIENCE = {
  enabled: 0,
  order: 'lp',
  window: 6,
  noisy: 0.35,
  novelty: 0.5,
  reach: 200,
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
//   provision      : fruit (in typical weights) a mother must have brought home herself
//                    since her last brood before she lays again: she provisions her own
//                    brood, as solitary and primitively social insects do (0 = off: the
//                    common pantry is enough)
//   mateCost       : energy mating costs each
//   eggCost        : hunger the female pays to lay (the egg is made of her)
//   femaleRecover / maleRecover: seconds before each may mate again
//   incubation     : seconds an egg takes at a good temperature
//   eggCold / eggWarm: nest temperature (°C) from which an egg does not develop /
//                    develops at full pace (only with THERMAL on)
//   eggStarve      : seconds a ready egg waits for a ration to hatch before it dies
//   kinLimit       : relatedness (0-1) from which two do not mate (0.5 = parent
//                    and child, full siblings)
//   inbreeding     : lethal equivalents per gamete for an egg's viability: an
//                    egg with inbreeding coefficient F hatches with chance
//                    exp(−inbreeding × F). 1.57 is the median of 40 captive
//                    mammal populations (2B = 3.14 per zygote; Ralls, Ballou &
//                    Templeton 1988); 0 = inbred eggs are as viable as any (as
//                    measured until 2026-10-07), so avoiding kin pays nothing
//   maxPopulation  : a nest holds this many, eggs included
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
  provision: 0,
  mateCost: 15,
  eggCost: 12,
  femaleRecover: 360,
  maleRecover: 120,
  incubation: 240,
  eggCold: 12,
  eggWarm: 22,
  eggStarve: 180,
  kinLimit: 0.5,
  inbreeding: 0,
  maxPopulation: 16,  // per nest; the game uses 60 (app/organism-on.js)
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
//   lookAgain  : seconds she waits, before she has learned how long sap takes to come
//                back, to go and look again at a sap thing she left dry; 0 = she never
//                goes back on purpose (as measured up to §25.14)
//   lining     : things she lines the nest with, at most (a warm one warms it, a cool one
//                cools it, by liningHeat °C each); 0 = she never does (as up to §25.14)
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
  lookAgain: 60,
  lining: 3,
  liningHeat: 2.5,
  social: 1,
  seen: 0.6,
  generalize: 1,
};

// Health (health.js; spec §25.15): the harm her body has taken and not yet
// mended. Part of the organism, off by default.
//   sting       : health a sting takes (things.js)
//   poison      : health a whole poisonous fruit takes (a trial bite, its share)
//   thermalFrom : thermal stress (fraction of the lethal) from which heat or cold harm
//   thermal     : health per second that harms
//   heal        : health mended per second while nothing presses; restHeal × in the nest
//   slowFrom    : below this share of health she walks slower, down to `slowest` at none
//   breed       : share of health she needs to breed (§10.1)
export const HEALTH = {
  enabled: 0,
  max: 100,
  sting: 12,
  poison: 10,
  thermalFrom: 0.5,
  thermal: 1.5,
  heal: 0.05,
  restHeal: 3,
  slowFrom: 0.5,
  slowest: 0.6,
  breed: 0.5,
};

// Tastes and nutritional chemistry (chemistry.js, feeding.js; spec §12.9). A
// wild species is a hidden mix of compounds the tongue reads as tastes. Only
// in the mouth: never at a distance. Part of the organism, off by default.
//   valence      : how much she likes each taste from birth (-1..1): a hint, not the truth
//   toxicBitter  : chance a bitter species of a map is poisonous (the rest: harmless alkaloids)
//   hiddenToxin  : chance a species that is not bitter is poisonous all the same
//   hedonic      : weight of how it tastes in what a bite feels like, right away
//   spitBelow    : liking under which she spits it out (unless starving, or she knows it is good)
//   spitPortion  : what she swallows of what she spits
//   learnWeight  : how fast what she learned of tastes overrides her innate liking
//   burn         : health a fully spicy bite takes (with HEALTH)
//   salt         : 1 = sodium is a need of its own: it runs out (saltLoss per second, 1 = full),
//                a salty bite restores it (saltGain × how salty), and the less she has the
//                more she likes salt (up to saltCraving) and the more a salty bite relieves
//                her (Richter's salt appetite). Under saltWeak she walks slower
//   mimics       : nourishing species of a map that have a poisonous look-alike: the
//                same look, another mix inside (mostly bitter); twinShare of their fruit
//                is the look-alike. Only the tongue tells them apart
//   salience     : how much more readily a taste takes the blame for a bite than a look
//                does (Garcia and Koelling, 1966); 1 = the same
//   innate       : 0 = born liking nothing and disliking nothing (an ablation)
//   learn        : 0 = tastes teach nothing: only her innate liking, at the mouth (an ablation)
export const TASTE = {
  enabled: 0,
  valence: { sweet: 0.6, umami: 0.5, salty: 0.2, sour: -0.25, astringent: -0.4, spicy: -0.5, bitter: -0.7 },
  toxicBitter: 0.7,
  hiddenToxin: 0.1,
  hedonic: 0.3,
  spitBelow: -0.3,
  spitPortion: 0.2,
  learnWeight: 1.5,
  burn: 4,
  salt: 1,
  saltLoss: 1 / 900,
  saltGain: 0.6,
  saltCraving: 0.9,
  saltWeak: 0.2,
  mimics: 2,
  twinShare: 0.35,
  salience: 2,
  innate: 1,
  learn: 1,
};

// Food sources are learned, not recognized (perception.js; spec §12.10). A tree
// is a big object like any other; that fruit falls around it, and which fruit,
// she learns by seeing fruit lying there. Part of the organism, off by default
// (off: every tree is a food source to her from birth, and she knows its fruit).
//   near : fruit within the tree's radius × this is taken as that tree's
export const SOURCES = {
  enabled: 0,
  near: 2.1,
};

