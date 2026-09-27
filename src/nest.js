// El nido: casa, despensa y sitio de descanso.

import { CARRY } from './config.js';
import { nestOf, storeInNest, takeFromNest, record } from './world.js';
import { radiusOf } from './obstacles.js';
import { eat } from './feeding.js';
import { weight } from './memory.js';
import { verdict } from './learned/rules.js';

export function nestUnder(fagi, world) {
  const nestObj = nestOf(world);
  if (!nestObj) return null;
  return Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y) <= radiusOf(nestObj) ? nestObj : null;
}

// Lo que pasa al estar dentro del nido: suelta la carga, come de las reservas
// si le hace falta, y descansa.
export function useNest(fagi, world) {
  const nestObj = nestUnder(fagi, world);
  if (!nestObj) return null;

  if (fagi.carrying) {
    const t = fagi.carrying.type;
    const total = storeInNest(nestObj, t, fagi.carrying.age ?? 0);
    record(world, 'nest_store', { what: t, age: fagi.carrying.age ?? 0 });
    fagi.stored = (fagi.stored ?? 0) + 1;
    fagi.lastDeposit = { n: fagi.stored, type: t, total };
    fagi.carrying = null;
  }

  // Con hambre tira de despensa: elige lo que mejor recuerda de lo guardado,
  // pero nunca sirve algo que aprendió que le sienta mal.
  if (fagi.hunger >= CARRY.eatBelow) {
    const saved = Object.keys(nestObj.stock).filter(
      (k) => nestObj.stock[k] > 0 && verdict(fagi, 'eat', k) !== 'avoid'
    );
    if (saved.length) {
      const best = saved.reduce((a, b) =>
        (weight(fagi.brain, b) > weight(fagi.brain, a) ? b : a));
      takeFromNest(nestObj, best);
      record(world, 'nest_take', { what: best });
      eat(fagi, best);
      fagi.lastPantry = { n: (fagi.lastPantry?.n ?? 0) + 1, type: best };
    }
  }

  // Está dentro: ve la despensa con sus propios ojos. Este es el único sitio
  // donde se escribe fagi.pantry, y por eso enterarse cuesta una visita.
  fagi.pantry = { ...nestObj.stock };
  fagi.pantryAt = fagi.age;

  return nestObj;
}
