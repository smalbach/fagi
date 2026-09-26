// El nido: casa, despensa y sitio de descanso.

import { CARRY } from './config.js';
import { nestOf, storeInNest, takeFromNest } from './world.js';
import { radiusOf } from './obstacles.js';
import { eat } from './feeding.js';
import { weight } from './memory.js';
import { verdict } from './learned/rules.js';

export function nestUnder(fagi, world) {
  const nido = nestOf(world);
  if (!nido) return null;
  return Math.hypot(nido.x - fagi.x, nido.y - fagi.y) <= radiusOf(nido) ? nido : null;
}

// Lo que pasa al estar dentro del nido: suelta la carga, come de las reservas
// si le hace falta, y descansa.
export function useNest(fagi, world) {
  const nido = nestUnder(fagi, world);
  if (!nido) return null;

  if (fagi.carrying) {
    const t = fagi.carrying.type;
    const total = storeInNest(nido, t, fagi.carrying.age ?? 0);
    fagi.stored = (fagi.stored ?? 0) + 1;
    fagi.lastDeposit = { n: fagi.stored, type: t, total };
    fagi.carrying = null;
  }

  // Con hambre tira de despensa: elige lo que mejor recuerda de lo guardado,
  // pero nunca sirve algo que aprendió que le sienta mal.
  if (fagi.hunger >= CARRY.eatBelow) {
    const guardado = Object.keys(nido.stock).filter(
      (k) => nido.stock[k] > 0 && verdict(fagi, 'eat', k) !== 'avoid'
    );
    if (guardado.length) {
      const mejor = guardado.reduce((a, b) =>
        (weight(fagi.brain, b) > weight(fagi.brain, a) ? b : a));
      takeFromNest(nido, mejor);
      eat(fagi, mejor);
      fagi.lastPantry = { n: (fagi.lastPantry?.n ?? 0) + 1, type: mejor };
    }
  }

  // Está dentro: ve la despensa con sus propios ojos. Este es el único sitio
  // donde se escribe fagi.pantry, y por eso enterarse cuesta una visita.
  fagi.pantry = { ...nido.stock };
  fagi.pantryAt = fagi.age;

  return nido;
}
