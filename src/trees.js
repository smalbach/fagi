// Árboles: sueltan fruta cada cierto tiempo alrededor de su copa.
// Es la única forma de que aparezca comida sin que la coloque el jugador.

import { TREE } from './config.js';
import { addPoint, removeObject } from './world.js';
import { isTree, radiusOf, waterZone } from './obstacles.js';

export function treesOf(world) {
  return world.objects.filter(isTree);
}

// Cuánta fruta suya sigue en el suelo, para no llenar el mapa.
function fruitNear(world, arbol) {
  const alcance = radiusOf(arbol) * TREE.dropRadius + 20;
  let n = 0;
  for (const p of world.points) {
    if (p.type !== TREE.fruit) continue;
    if (Math.hypot(p.x - arbol.x, p.y - arbol.y) <= alcance) n++;
  }
  return n;
}

export function updateTrees(world, dt) {
  for (const arbol of treesOf(world)) {
    // Los árboles también tienen su tiempo: si TREE.life > 0, se secan y caen.
    arbol.age = (arbol.age ?? 0) + dt;
    if (TREE.life > 0 && arbol.age >= TREE.life) {
      removeObject(world, arbol, 'died');
      continue;
    }

    arbol.timer -= dt;
    if (arbol.timer > 0) continue;
    arbol.timer = TREE.interval;

    if (fruitNear(world, arbol) >= TREE.maxNear) continue;

    // Cae en un punto al azar de la copa, nunca en el centro del tronco.
    const r = radiusOf(arbol);
    const ang = Math.random() * Math.PI * 2;
    const dist = r * 0.55 + Math.random() * (r * TREE.dropRadius - r * 0.55);
    const x = Math.min(world.width - 10, Math.max(10, arbol.x + Math.cos(ang) * dist));
    const y = Math.min(world.height - 10, Math.max(10, arbol.y + Math.sin(ang) * dist));
    // La que cae al agua se la lleva el agua: nadie la puede recoger.
    if (waterZone(world, x, y)) continue;
    addPoint(world, x, y, TREE.fruit, arbol.id);
    arbol.lastDrop = (arbol.lastDrop ?? 0) + 1;
  }
}

// Cambiar el intervalo desde el panel afecta también a los que ya están puestos.
export function setFruitInterval(world, segundos) {
  TREE.interval = segundos;
  for (const arbol of treesOf(world)) arbol.timer = Math.min(arbol.timer, segundos);
}

// Cuánto le queda de vida a un árbol, de 0 (recién plantado) a 1 (seco).
export function treeAge(arbol) {
  if (TREE.life <= 0) return 0;
  return Math.min(1, (arbol.age ?? 0) / TREE.life);
}

// Quitar de golpe todos los árboles del mapa.
export function removeAllTrees(world) {
  for (const arbol of treesOf(world)) removeObject(world, arbol, 'user');
}
