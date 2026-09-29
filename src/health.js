// Health (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §9, the `health` of the
// contract; §10.1, §10.2): the harm her body has taken and not yet mended.
//
// Hunger, thirst and the cold kill on their own; health is what stays after
// the harm passes. A sting, a poisonous bite, a stretch of heat or cold
// beyond half of what kills: each takes some of it. It mends slowly while
// nothing presses (faster resting in the nest). Hurt, she walks slower; with
// little of it she does not breed, and it shows (mate choice). At zero she
// dies of what hurt her last. With HEALTH off nothing here does anything.

import { HEALTH, HUNGER, THIRST, NEEDS, THERMAL } from './config.js';

const healthOf = (fagi) => fagi.health ?? HEALTH.max;

// Share of her health left (0-1); 1 with HEALTH off.
export const healthU = (fagi) => (HEALTH.enabled ? healthOf(fagi) / HEALTH.max : 1);

// Harm: `kind` is what did it ('sting', 'poison', 'heat', 'cold').
export function hurt(fagi, amount, kind) {
  if (!HEALTH.enabled || amount <= 0) return;
  fagi.health = Math.max(0, healthOf(fagi) - amount);
  fagi.hurtBy = kind;
  fagi.lastHurt = { n: (fagi.lastHurt?.n ?? 0) + 1, kind, health: fagi.health };
}

// Once per frame: thermal harm, and mending.
export function updateHealth(fagi, dt, resting) {
  if (!HEALTH.enabled) return;
  fagi.health = healthOf(fagi);
  if (THERMAL.enabled && fagi.thermalStress > HEALTH.thermalFrom * THERMAL.maxStress) {
    hurt(fagi, HEALTH.thermal * dt, fagi.thermalKind === 'heat' ? 'heat' : 'cold');
  }
  const critical = fagi.hunger / HUNGER.max >= NEEDS.critical || fagi.thirst / THIRST.max >= NEEDS.critical;
  if (!critical && !(fagi.thermalStress > 0)) {
    fagi.health = Math.min(HEALTH.max, fagi.health + HEALTH.heal * (resting ? HEALTH.restHeal : 1) * dt);
  }
}

// Hurt, she walks slower: full speed above HEALTH.slowFrom of her health,
// down to HEALTH.slowest at none.
export function healthSpeed(fagi) {
  if (!HEALTH.enabled) return 1;
  return HEALTH.slowest + (1 - HEALTH.slowest) * Math.min(1, healthU(fagi) / HEALTH.slowFrom);
}

// Has the harm killed her? What of, if so.
export function woundsCause(fagi) {
  if (!HEALTH.enabled || healthOf(fagi) > 0) return null;
  return fagi.hurtBy === 'sting' || fagi.hurtBy === 'burn' ? 'wounds' : fagi.hurtBy ?? 'wounds';
}
