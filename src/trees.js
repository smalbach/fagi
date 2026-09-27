// Árboles: sueltan fruta cada cierto tiempo alrededor de su copa.
// Es la única forma de que aparezca comida sin que la coloque el jugador.

import { TREE } from './config.js';
import { addPoint, removeObject } from './world.js';
import { isTree, radiusOf, waterZone } from './obstacles.js';

export function treesOf(world) {
  return world.objects.filter(isTree);
}

// Cuánta fruta suya sigue en el suelo, para no llenar el mapa.
function fruitNear(world, tree) {
  const scope = radiusOf(tree) * TREE.dropRadius + 20;
  let n = 0;
  for (const p of world.points) {
    if (p.type !== TREE.fruit) continue;
    if (Math.hypot(p.x - tree.x, p.y - tree.y) <= scope) n++;
  }
  return n;
}

export function updateTrees(world, dt) {
  for (const tree of treesOf(world)) {
    // Los árboles también tienen su tiempo: si TREE.life > 0, se secan y caen.
    tree.age = (tree.age ?? 0) + dt;
    if (TREE.life > 0 && tree.age >= TREE.life) {
      removeObject(world, tree, 'died');
      continue;
    }

    tree.timer -= dt;
    if (tree.timer > 0) continue;
    tree.timer = TREE.interval;

    if (fruitNear(world, tree) >= TREE.maxNear) continue;

    // Cae en un punto al azar de la copa, nunca en el centro del tronco.
    const r = radiusOf(tree);
    const ang = Math.random() * Math.PI * 2;
    const dist = r * 0.55 + Math.random() * (r * TREE.dropRadius - r * 0.55);
    const x = Math.min(world.width - 10, Math.max(10, tree.x + Math.cos(ang) * dist));
    const y = Math.min(world.height - 10, Math.max(10, tree.y + Math.sin(ang) * dist));
    // La que cae al agua se la lleva el agua: nadie la puede recoger.
    if (waterZone(world, x, y)) continue;
    addPoint(world, x, y, TREE.fruit, tree.id);
    tree.lastDrop = (tree.lastDrop ?? 0) + 1;
  }
}

// Cambiar el intervalo desde el panel afecta también a los que ya están puestos.
export function setFruitInterval(world, seconds) {
  TREE.interval = seconds;
  for (const tree of treesOf(world)) tree.timer = Math.min(tree.timer, seconds);
}

// Cuánto le queda de vida a un árbol, de 0 (recién plantado) a 1 (seco).
export function treeAge(tree) {
  if (TREE.life <= 0) return 0;
  return Math.min(1, (tree.age ?? 0) / TREE.life);
}

// Quitar de golpe todos los árboles del mapa.
export function removeAllTrees(world) {
  for (const tree of treesOf(world)) removeObject(world, tree, 'user');
}
