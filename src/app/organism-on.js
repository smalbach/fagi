// Imported first thing by boot.js: the game plays the whole organism. Being a
// module of its own, it runs before settings.js takes its factory values, so
// "factory" in the game means organism on.

import { enableOrganism } from '../organism.js';
import { ENERGY, SLEEP, CONCEPT, PHERO, DECIDE, CONDUCT, LIFE, SOCIAL } from '../config.js';
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

// A colony that can grow: the nest holds 60, eggs included (research keeps 16).
// With that many in the nest, two sisters exchange what they know only when
// close enough to touch, mouth to mouth, not anywhere in it: the exchanges stay
// local, as in a real nest, and the cost stops growing with every pair.
LIFE.maxPopulation = 60;
SOCIAL.touch = 24;

// Caution when eating (docs/research/caution-protocol.md): she is born with
// two lines of conduct — a kind she never ate, a trial bite first; a kind that
// harmed her as often as it fed her, never again — applied at the bite point
// over her usual judgment. The settings turn it off (CONDUCT.enabled): then
// she judges exactly as before.
DECIDE.eat = 'learned';
CONDUCT.enabled = 1;
CONDUCT.born = CAUTION_LINES;
