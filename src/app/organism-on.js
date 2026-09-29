// Imported first thing by boot.js: the game plays the whole organism. Being a
// module of its own, it runs before settings.js takes its factory values, so
// "factory" in the game means organism on.

import { enableOrganism } from '../organism.js';
import { ENERGY, SLEEP, CONCEPT } from '../config.js';

enableOrganism();

// The game's own starting numbers, over the research ones (config.js stays
// the preregistered world for batch and tests):
//   - a day's work on one charge: walking drains a full body in ~2.5 min of
//     game, longer than the ~1.6 min of daylight (CYCLE.seconds 180, dawn to dusk),
//     so she rests at night, not in the middle of the day;
//   - a diurnal body: at dark she goes home and sleeps until daylight;
//   - no things scattered at random: on the game's map what she finds comes
//     from the trees (the settings can still turn them on).
ENERGY.drain = 0.6;
SLEEP.nightly = 1;
CONCEPT.enabled = 0;
