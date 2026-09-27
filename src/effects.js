// Temporary buffs. Each one multiplies a stat for a few seconds.
// Eating the same type again refreshes the duration, it doesn't stack it.

import { POINT_TYPES } from './config.js';

export function createEffects() {
  return {}; // stat -> { mult, time, sec, color, stat }
}

export function applyEffects(fagi, typeKey) {
  const spec = POINT_TYPES[typeKey];
  for (const e of spec.effects) {
    fagi.effects[e.stat] = {
      mult: e.mult,
      time: e.sec,
      sec: e.sec,
      color: spec.color,
      stat: e.stat,
    };
  }
}

export function updateEffects(fagi, dt) {
  for (const stat of Object.keys(fagi.effects)) {
    fagi.effects[stat].time -= dt;
    if (fagi.effects[stat].time <= 0) delete fagi.effects[stat];
  }
}

// Current factor of a stat: 1 if there's no active buff.
export function statMult(fagi, stat) {
  return fagi.effects[stat] ? fagi.effects[stat].mult : 1;
}

export function activeEffects(fagi) {
  return Object.values(fagi.effects);
}

