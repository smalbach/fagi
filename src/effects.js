// Temporary buffs. Each one multiplies a stat for a few seconds.
// Eating the same type again refreshes the duration, it doesn't stack it.

import { POINT_TYPES } from './config.js';

export function createEffects() {
  return {}; // stat -> { mult, time, sec, color, stat }
}

// `portion` below 1 (a trial bite): the multiplier that much closer to 1, for
// that share of the time.
// `effects`: what this very fruit carries, when it is not what its kind usually
// does (a look-alike, TASTE).
export function applyEffects(fagi, typeKey, portion = 1, effects = null) {
  const spec = POINT_TYPES[typeKey];
  for (const e of effects ?? spec.effects) {
    const mult = portion === 1 ? e.mult : Math.round(e.mult ** portion * 1000) / 1000;
    fagi.effects[e.stat] = {
      mult,
      time: e.sec * portion,
      sec: e.sec * portion,
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

