// Feromona: el rastro que deja la propia Fagi cuando vuelve al nido cargada.
//
// Cada marca sabe a qué distancia del nido se dejó. Para volver a la comida
// basta seguir marcas con distancia MAYOR que la suya; para volver al nido,
// menor. Se evaporan solas, así que un camino que ya no se usa desaparece.

import { PHERO } from './config.js';

export function createPheromone() {
  return [];
}

export function dropPheromone(world, x, y, dNest) {
  world.pheromone.push({ x, y, dNest, life: PHERO.life });
}

// Evapora. Se llama una vez por frame.
export function updatePheromone(world, dt) {
  const marcas = world.pheromone;
  for (let i = marcas.length - 1; i >= 0; i--) {
    marcas[i].life -= dt;
    if (marcas[i].life <= 0) marcas.splice(i, 1);
  }
}

// La marca a seguir desde donde está Fagi.
//   alejandose = true  -> hacia la comida (marcas más lejos del nido)
//   alejandose = false -> hacia el nido (marcas más cerca)
export function followPheromone(world, fagi, dNestActual, alejandose) {
  let mejor = null;
  let mejorD = alejandose ? dNestActual : Infinity;

  for (const m of world.pheromone) {
    const d = Math.hypot(m.x - fagi.x, m.y - fagi.y);
    if (d > PHERO.sense || d < 4) continue;
    if (alejandose ? m.dNest > mejorD : m.dNest < mejorD) {
      mejorD = m.dNest;
      mejor = m;
    }
  }
  return mejor;
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
