// The organism, on or off (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md).
//
// config.js starts every organism block off, so batch runs and tests are the
// preregistered world unless they ask. The game asks at boot
// (app/organism-on.js), and batch with --organism. A session records the
// flags with the rest of its settings, so a replay knows which world it was.

import { CYCLE, THERMAL, SEX, SLEEP, EXPERIMENT, APPETITE, PERCEPT, NIGHTAI, LIFE, CONCEPT, HEALTH, TASTE, SOURCES } from './config.js';

export const ORGANISM = { CYCLE, THERMAL, SEX, SLEEP, EXPERIMENT, APPETITE, PERCEPT, NIGHTAI, LIFE, CONCEPT, HEALTH, TASTE, SOURCES };

export function enableOrganism(on = true) {
  for (const block of Object.values(ORGANISM)) block.enabled = on ? 1 : 0;
}

export const organismOn = () => Object.values(ORGANISM).some((b) => b.enabled);
