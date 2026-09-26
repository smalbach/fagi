// Comer y cargar. La regla es simple: con hambre se come, sin hambre se trabaja.

import { HUNGER, CARRY, POINT_TYPES } from './config.js';
import { pointTouching, removePoint, stockFull } from './world.js';
import { applyEffects } from './effects.js';
import { snapshotBody } from './interoception.js';
import { openEpisode } from './episodes.js';
import { verdict } from './learned/rules.js';

// Con hambre se lo come en el sitio. Sin hambre lo carga y se lo lleva al nido:
// es la diferencia entre comer y trabajar. Y con la despensa hecha no lo coge
// siquiera: acumular de más no sirve de nada, conocer el mapa sí.
export function tryPickOrEat(fagi, world) {
  const p = pointTouching(world, fagi);
  if (!p) return;

  // Lo tenga o no que coger, ya está encima: deja de ser un objetivo al que ir.
  // Sin esto, un punto que rechaza se queda fichado y Fagi le da vueltas eternas.
  const suelta = () => { if (fagi.target === p) { fagi.target = null; fagi.memory = 0; } };

  // No come ni recoge por accidente algo que ya aprendió que es perjudicial.
  // Solo vuelve a probarlo cuando era su objetivo deliberado (curiosidad).
  if (verdict(fagi, 'eat', p.type, { deliberate: fagi.target === p }) === 'avoid') { suelta(); return; }

  if (fagi.hunger >= CARRY.eatBelow) {
    eat(fagi, p.type);
    removePoint(world, p);
  } else if (verdict(fagi, 'store', p.type) === 'avoid') {
    // Probarlo por curiosidad es una cosa; llenar la despensa de lo que cree
    // malo es otra. Lo deja donde está y deja de tenerlo por objetivo.
    suelta();
    return;
  } else if (!fagi.carrying && !stockFull(fagi.pantry)) {
    // La fruta sigue teniendo la edad que traía: guardarla la conserva, no la
    // rejuvenece.
    fagi.carrying = { type: p.type, age: p.age ?? 0 };
    fagi.picked = (fagi.picked ?? 0) + 1;
    removePoint(world, p);
  } else {
    suelta();
    return; // ya lleva algo, o la despensa está hecha: lo deja donde está
  }

  suelta();
}

// Si ya lleva una ración encima no tiene sentido morir de hambre mientras
// busca otra. En una emergencia la prueba, igual que haría con comida del suelo.
export function eatCarried(fagi) {
  if (!fagi.carrying) return false;
  const { type } = fagi.carrying;
  if (!POINT_TYPES[type]) return false;
  fagi.carrying = null;
  eat(fagi, type);
  return true;
}

// Comer es física: el bocado hace lo que hace al cuerpo. Lo que Fagi aprende
// de él no viene de aquí ni de la ficha del alimento: viene de comparar cómo
// estaba antes con cómo se siente después (episodes.js).
export function eat(fagi, type) {
  const spec = POINT_TYPES[type];
  const before = snapshotBody(fagi);
  fagi.hunger = Math.min(HUNGER.max, Math.max(0, fagi.hunger + spec.hunger));
  applyEffects(fagi, type);
  const ep = openEpisode(fagi, { action: 'eat', key: type, before });
  fagi.eaten += 1;
  fagi.lastMeal = {
    n: fagi.eaten, type,
    beliefBefore: ep.cambio.before.value,
    beliefAfter: ep.cambio.after.value,
    kind: ep.cambio.kind,
    hungerAfter: fagi.hunger,
    reward: ep.reward,
    sensations: ep.sensations,
  };
}
