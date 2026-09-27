// Pistas de algo que ya percibió y perdió, de la más fresca a la más vieja.

import { labelOf } from '../i18n.js';
import { reasonOf, pantryDone, stillInWorld } from './common.js';

// Perdió el olor que seguía: no lo abandona de golpe, lo busca barriendo.
export function persistOnScent(fagi, world, ctx, dt) {
  if (!fagi.trailKey || fagi.trailMemory <= 0) return null;
  // El agua siempre merece el rastro; un olor a comida, no si no hay dónde
  // ponerla: trackScent revive trailMemory dentro de la estela, así que sin
  // esta salida se quedaría rastreando el mismo fruto para siempre.
  if (fagi.trailKey !== 'water' && pantryDone(fagi, ctx)) return null;
  return {
    action: 'track',
    reason: reasonOf('reason.lostTrail', {
      what: labelOf(fagi.trailKey),
      sec: { dur: fagi.trailMemory, precise: true },
    }),
    targetKind: 'scent',
    trailKey: fagi.trailKey,
  };
}

// Lo tenía fichado y lo perdió de vista (pasó de largo, quedó tras una roca).
export function persistFromMemory(fagi, world, ctx, dt) {
  const stillThere = fagi.target && stillInWorld(world, fagi.target);
  if (!stillThere || fagi.memory <= 0) return null;
  fagi.memory -= dt;
  return {
    action: 'memory',
    reason: reasonOf('reason.memory', { sec: { dur: fagi.memory, precise: true } }),
    target: fagi.target,
    targetKind: fagi.targetKind,
  };
}
