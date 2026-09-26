// Objetos del mapa: agua donde beber y rocas que estorban.
// Geometría pura, sin estado propio.

import { OBJECT_TYPES, FAGI, WATER } from './config.js';

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
  return waterZone(world, fagi.x, fagi.y)?.pool ?? null;
}

// Radio del hondo de un charco: todo menos la franja del vado.
export function deepRadius(o) {
  if (OBJECT_TYPES[o.type].shallow) return 0;
  return Math.max(0, radiusOf(o) - WATER.vado);
}

// Qué hay bajo (x, y): { pool, deep } si es agua (deep = no hace pie), o null.
export function waterZone(world, x, y) {
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d <= radiusOf(o)) return { pool: o, deep: d < deepRadius(o) };
  }
  return null;
}

// El charco detrás de un objetivo: el propio charco o el sitio que recuerda de
// él (memory.js guarda el objeto real en `ref`). null si no es agua.
export function poolOf(target) {
  const o = target?.ref ?? target;
  return OBJECT_TYPES[o?.type]?.kind === 'water' ? o : null;
}

// El punto de la orilla más cercano a `from`, `inset` px por dentro del borde.
// `center` es dónde cree que está el charco (el de verdad, o el recordado).
export function shorePoint(center, r, from, inset) {
  let dx = from.x - center.x;
  let dy = from.y - center.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) { dx = Math.cos(from.angle ?? 0); dy = Math.sin(from.angle ?? 0); }
  else { dx /= d; dy /= d; }
  return { x: center.x + dx * (r - inset), y: center.y + dy * (r - inset) };
}

// ¿El segmento A-B se mete en el hondo de algún charco? No corta la vista: solo
// lo usa para andar quien ya aprendió a temerlo. Un hondo que ya contiene A no
// cuenta: si está dentro, lo que le toca es salir, no quedarse sin rumbo. Y si
// A ya pisa el margen, el margen se olvida: si no, todo rumbo saldría cerrado.
export function deepBlocked(world, ax, ay, bx, by, margin = 0) {
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    const hondo = deepRadius(o);
    if (hondo <= 0) continue;
    const d = Math.hypot(o.x - ax, o.y - ay);
    if (d <= hondo) continue;
    const r = d <= hondo + margin ? hondo : hondo + margin;
    if (segmentHitsCircle(ax, ay, bx, by, o.x, o.y, r)) return true;
  }
  return false;
}

// ¿El segmento A-B cruza alguna roca? Sirve para cortar la visión.
// `margin` engorda cada roca: para saber si cabe el cuerpo de Fagi, no solo un rayo.
export function segmentBlocked(world, ax, ay, bx, by, margin = 0) {
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    if (segmentHitsCircle(ax, ay, bx, by, o.x, o.y, radiusOf(o) + margin)) return true;
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
// Con `fearDeep` también esquiva el hondo del agua, como si fuera roca.
// 0 = camino libre.
export function avoidanceTurn(fagi, world, fearDeep = false) {
  const look = FAGI.radius + 34;
  const ahead = {
    x: fagi.x + Math.cos(fagi.angle) * look,
    y: fagi.y + Math.sin(fagi.angle) * look,
  };
  for (const o of world.objects) {
    const r = isBlock(o) ? radiusOf(o) + FAGI.radius
      : fearDeep && isWater(o) && deepRadius(o) > 0 && !waterZone(world, fagi.x, fagi.y)?.deep ? deepRadius(o) + WATER.vado / 2
      : null;
    if (r === null) continue;
    const dist = Math.hypot(o.x - ahead.x, o.y - ahead.y);
    if (dist > r) continue;
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
