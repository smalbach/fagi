// Comer y cargar. La regla es simple: con hambre se come, sin hambre se trabaja.

import { HUNGER, CARRY, POINT_TYPES } from './config.js';
import { pointTouching, removePoint, stockFull } from './world.js';
import { applyEffects } from './effects.js';
import { learn } from './brain.js';
import { weight } from './memory.js';

// Con hambre se lo come en el sitio. Sin hambre lo carga y se lo lleva al nido:
// es la diferencia entre comer y trabajar. Y con la despensa hecha no lo coge
// siquiera: acumular de más no sirve de nada, conocer el mapa sí.
export function tryPickOrEat(fagi, world) {
  const p = pointTouching(world, fagi);
  if (!p) return;
  const spec = POINT_TYPES[p.type];

  // Lo tenga o no que coger, ya está encima: deja de ser un objetivo al que ir.
  // Sin esto, un punto que rechaza se queda fichado y Fagi le da vueltas eternas.
  const suelta = () => { if (fagi.target === p) { fagi.target = null; fagi.memory = 0; } };

  // No come ni recoge por accidente algo que ya aprendió que es perjudicial.
  // Solo vuelve a probarlo cuando era su objetivo deliberado (curiosidad).
  if (weight(fagi.brain, p.type) < 0 && fagi.target !== p) { suelta(); return; }

  if (fagi.hunger >= CARRY.eatBelow) {
    eat(fagi, p.type, spec.reward);
    removePoint(world, p);
  } else if (weight(fagi.brain, p.type) < 0) {
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
  const spec = POINT_TYPES[type];
  if (!spec) return false;
  fagi.carrying = null;
  eat(fagi, type, spec.reward);
  return true;
}

export function eat(fagi, type, reward) {
  const spec = POINT_TYPES[type];
  fagi.hunger = Math.min(HUNGER.max, Math.max(0, fagi.hunger + spec.hunger));
  applyEffects(fagi, type);
  // Aprende del valor real del bocado, no del cambio recortado por los topes.
  const cambio = learn(fagi.brain, type, reward, fagi.age);
  fagi.eaten += 1;
  fagi.lastMeal = {
    n: fagi.eaten, type,
    beliefBefore: cambio.before.value,
    beliefAfter: cambio.after.value,
    kind: cambio.kind,
    hungerAfter: fagi.hunger,
  };
}
