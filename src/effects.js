// Buffs temporales. Cada uno multiplica una característica durante unos segundos.
// Volver a comer el mismo tipo refresca la duración, no la acumula.

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

// Factor actual de una característica: 1 si no hay buff activo.
export function statMult(fagi, stat) {
  return fagi.effects[stat] ? fagi.effects[stat].mult : 1;
}

export function activeEffects(fagi) {
  return Object.values(fagi.effects);
}

