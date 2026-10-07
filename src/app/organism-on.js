// Imported first thing by boot.js: the game plays the whole organism. Being a
// module of its own, it runs before settings.js takes its factory values, so
// "factory" in the game means organism on.

import { enableOrganism } from '../organism.js';
import { ENERGY, SLEEP, CONCEPT, PHERO, DECIDE, CONDUCT, LIFE, SOCIAL, MORPH, SEASONS, LOAD, COLONIES, SCIENCE, DRIVE, HABITATS, TREE, PROGRAM } from '../config.js';
import { CAUTION_LINES } from '../learned/conduct.js';

enableOrganism();

// The game's own starting numbers, over the research ones (config.js stays
// the preregistered world for batch and tests):
//   - a day's work on one charge: walking drains a full body in ~2.5 min of
//     game, longer than the ~1.6 min of daylight (CYCLE.seconds 180, dawn to dusk),
//     so she rests at night, not in the middle of the day;
//   - a diurnal body: at dark she goes home and sleeps until daylight;
//   - no things scattered at random: on the game's map what she finds comes
//     from the trees (the settings can still turn them on);
//   - a pheromone mark lasts a minute: long enough to come back for more,
//     short enough that an old path clears (research measured with 600).
ENERGY.drain = 0.6;
SLEEP.nightly = 1;
CONCEPT.enabled = 0;
PHERO.life = 60;

// Colonies that can grow (research keeps one nest of 16).
// With that many in a nest, two sisters exchange what they know only when
// close enough to touch, mouth to mouth, not anywhere in it: the exchanges stay
// local, as in a real nest, and the cost stops growing with every pair.
SOCIAL.touch = 24;

// Three colonies, each a nest of up to 30 (90 in all), competing for fruit:
// the colonies that do well spread (COLONIES). Measured: with them, muscle
// evolves the same way in 7 of 8 seeds in four years.
COLONIES.count = 3;
LIFE.maxPopulation = 30;

// The evolving body (morph.js): organs inherited with what they give and cost,
// drawn on her. The settings turn it off; research keeps it off.
MORPH.enabled = 1;

// Years with a lean, cold winter (seasons.js): the pressure that decides which
// bodies get through. Every winter the same; the settings make them vary.
SEASONS.enabled = 1;

// Fruit that weighs and resists (load.js): carrying a heavy one home asks for
// muscle, a hard one for a gut up to it.
LOAD.enabled = 1;

// What decides a brood is hers (morph.js, reproduction.js): a mother lays only
// after bringing home food herself, picks the stronger male, and what she has
// lived up to each brood shapes it (maternal effects), so her first and fifth
// broods can come out different.
LIFE.provision = 1;
MORPH.maternal.share = 1;

// The scientific night (experiment.js): each night's question carries what
// she expects of the fruit, she tries first what she expects to learn most
// from and looks safest, and the answer comes back as a verdict. Measured
// (H3c): she learns no faster, but survives more (+10 %).
SCIENCE.enabled = 1;

// Learned drives (drive.js): how much a need makes food or water worth is
// learned from the relief she felt at each level of it, so a thirst she never
// felt is not revalued at once (incentive learning; LIBERA phase 2, H5a).
DRIVE.mode = 'learned';

// Caution when eating (docs/research/caution-protocol.md): she is born with
// two lines of conduct — a kind she never ate, a trial bite first; a kind that
// harmed her as often as it fed her, never again — applied at the bite point
// over her usual judgment. The settings turn it off (CONDUCT.enabled): then
// she judges exactly as before.
DECIDE.eat = 'learned';
CONDUCT.enabled = 1;
CONDUCT.born = CAUTION_LINES;

// Habitats (habitats.js): each of the three nests lives somewhere of its own —
// a cold hollow, a sun-baked slope, poison growing close by — so each colony
// learns and inherits what its own place asks of it, as populations do in
// nature: cold and heat pull bodies opposite ways, poison asks for conduct.
HABITATS.enabled = 1;

// A world that presses (scripts/game-world.js, 2026-10-07): with a fruit every
// 8 s every nest filled to its ceiling and most died of old age, so nothing
// they learned or inherited could matter. With one every 30 s food and winter
// set how many live (38-48 % of the ceiling over three years, 8 maps): more
// die of cold, caught out foraging hungry in winter, than of age; now and
// then a nest empties and another colony refounds it; no map dies out.
TREE.interval = 30;

// What a daughter inherits of what her mothers lived (scripts/game-world.js,
// 2026-10-07, 8 maps × 4 years, paired against the game without it):
//   - her body: an epigenetic mark of the organs her parents grew into
//     (MORPH.inherit 2, fading each generation): bodies follow what was lived
//     (muscle 1.14-1.17 against genes of 1.05; smaller where food is short);
//   - her conduct: she learns lines of her own with the reserves judge and
//     safe night trials, and the evidence-backed ones pass into her eggs
//     (PROGRAM, as preregistered: docs/research/prereg-lineage-inheritance.md).
//     In the game most of the lines an ant carries came from her mother.
// Populations were no smaller with it (+0.8 per nest, 5 of 8 maps).
MORPH.inherit = 2;

// Inbreeding depression (LIFE.inbreeding): an egg of close kin is less likely
// to hatch, by the median lethal equivalents of captive mammals (Ralls et al.
// 1988; a full-sib egg hatches 2 times in 3). Without it the rule that keeps
// kin from mating cost locals mates and paid nothing (scripts/transplant.js,
// 2026-10-07: newcomers out-bred them only because they were nobody's sister).
LIFE.inbreeding = 1.57;
PROGRAM.learn = 1;
PROGRAM.inherit = 1;
PROGRAM.judge = 1;
PROGRAM.darkTrials = 1;
PROGRAM.exploreByState = 1;
