// Objetos del mapa: agua donde beber y rocas que estorban.
// Geometría pura, sin estado propio.

import { OBJECT_TYPES, FAGI } from './config.js';

export function isWater(obj) {
  return OBJECT_TYPES[obj.type].kind === 'water';
}

export function isBlock(obj) {
  return OBJECT_TYPES[obj.type].kind === 'block';
}

export function isNest(obj) {
  return OBJECT_TYPES[obj.type].kind === 'nest';
}

export function isTree(obj) {
  return OBJECT_TYPES[obj.type].kind === 'spawner';
}

export function radiusOf(obj) {
  return obj.r ?? OBJECT_TYPES[obj.type].radius;
}

// ¿Fagi está dentro de algún charco? Devuelve el charco o null.
export function waterUnder(world, fagi) {
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    if (Math.hypot(o.x - fagi.x, o.y - fagi.y) <= radiusOf(o)) return o;
  }
  return null;
}

// ¿El segmento A-B cruza alguna roca? Sirve para cortar la visión.
export function segmentBlocked(world, ax, ay, bx, by) {
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    if (segmentHitsCircle(ax, ay, bx, by, o.x, o.y, radiusOf(o))) return true;
  }
  return false;
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  // Punto del segmento más cercano al centro del círculo.
  let t = len2 === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const py = ay + dy * t;
  return Math.hypot(cx - px, cy - py) <= r;
}

// Si Fagi se metió en una roca, lo empuja fuera por el camino más corto.
// Devuelve true si hubo choque, para que pueda cambiar de rumbo.
export function pushOutOfBlocks(fagi, world) {
  let hit = false;
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    const min = radiusOf(o) + FAGI.radius;
    let dx = fagi.x - o.x;
    let dy = fagi.y - o.y;
    let dist = Math.hypot(dx, dy);
    if (dist >= min) continue;
    if (dist === 0) { dx = 1; dy = 0; dist = 1; } // justo en el centro
    fagi.x = o.x + (dx / dist) * min;
    fagi.y = o.y + (dy / dist) * min;
    hit = true;
  }
  return hit;
}

// Mira un poco por delante: si hay roca, devuelve hacia qué lado esquivarla.
// 0 = camino libre.
export function avoidanceTurn(fagi, world) {
  const look = FAGI.radius + 34;
  const ahead = {
    x: fagi.x + Math.cos(fagi.angle) * look,
    y: fagi.y + Math.sin(fagi.angle) * look,
  };
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    const dist = Math.hypot(o.x - ahead.x, o.y - ahead.y);
    if (dist > radiusOf(o) + FAGI.radius) continue;
    // Producto cruzado: dice si la roca queda a la izquierda o a la derecha.
    const side = Math.sign(
      Math.cos(fagi.angle) * (o.y - fagi.y) - Math.sin(fagi.angle) * (o.x - fagi.x)
    ) || 1;
    return -side; // gira hacia el lado contrario
  }
  return 0;
}

// Objeto del mapa bajo un punto (para borrar con clic derecho).
export function objectAt(world, x, y) {
  for (let i = world.objects.length - 1; i >= 0; i--) {
    const o = world.objects[i];
    if (Math.hypot(o.x - x, o.y - y) <= radiusOf(o)) return o;
  }
  return null;
}
