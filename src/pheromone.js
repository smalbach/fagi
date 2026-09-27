// Feromona: el rastro que deja la propia Fagi cuando vuelve al nido cargada.
//
// Cada marca sabe a qué distancia del nido se dejó. Para volver a la comida
// basta seguir marcas con distancia MAYOR que la suya; para volver al nido,
// menor. Se evaporan solas, así que un camino que ya no se usa desaparece.

import { PHERO, RAIN } from './config.js';
import { record } from './world.js';
import { segmentBlocked } from './obstacles.js';

export function createPheromone() {
  return [];
}

export function dropPheromone(world, x, y, dNest) {
  world.pheromone.push({ x, y, dNest, life: PHERO.life });
  record(world, 'phero_drop', { x, y, dNest });
}

// Evapora. Se llama una vez por frame.
export function updatePheromone(world, dt) {
  const marksOf = world.pheromone;
  // La lluvia lava el rastro: se borra RAIN.washPhero veces más rápido.
  const step = dt * (world.rain?.on ? RAIN.washPhero : 1);
  for (let i = marksOf.length - 1; i >= 0; i--) {
    marksOf[i].life -= step;
    if (marksOf[i].life <= 0) marksOf.splice(i, 1);
  }
}

// La marca a seguir desde donde está Fagi.
//   alejandose = true  -> hacia la comida (marcas más lejos del nido)
//   alejandose = false -> hacia el nido (marcas más cerca)
export function followPheromone(world, fagi, dNestNow, movingAway) {
  let best = null;
  let bestD = movingAway ? dNestNow : Infinity;

  for (const m of world.pheromone) {
    const d = Math.hypot(m.x - fagi.x, m.y - fagi.y);
    if (d > PHERO.sense || d < 4) continue;
    if (movingAway ? m.dNest > bestD : m.dNest < bestD) {
      // Las antenas tocan el suelo: una marca al otro lado de una roca no llega.
      if (segmentBlocked(world, fagi.x, fagi.y, m.x, m.y)) continue;
      bestD = m.dNest;
      best = m;
    }
  }
  return best;
}

// Fuerza de la feromona bajo los pies, para el HUD y la consola.
export function pheromoneAt(world, x, y) {
  let max = 0;
  for (const m of world.pheromone) {
    if (Math.hypot(m.x - x, m.y - y) > PHERO.sense) continue;
    max = Math.max(max, m.life / PHERO.life);
  }
  return max;
}
