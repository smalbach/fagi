// Imported first thing by boot.js: the game plays the whole organism. Being a
// module of its own, it runs before settings.js takes its factory values, so
// "factory" in the game means organism on.

import { enableOrganism } from '../organism.js';

enableOrganism();
