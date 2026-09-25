// Genera el mapa: charcos y rocas repartidos al azar, sin pisarse entre sí
// y dejando libre el sitio donde nace Fagi.

import { WORLD, MAPGEN, OBJECT_TYPES } from './config.js';
import { addObject } from './world.js';
import { radiusOf } from './obstacles.js';

function fits(world, x, y, r) {
  for (const o of world.objects) {
    // El radio REAL del que ya está puesto: hay rocas más gordas que su tipo.
    const or = radiusOf(o);
    if (Math.hypot(o.x - x, o.y - y) < r + or + MAPGEN.minGap) return false;
  }
  return true;
}

// escala = [min, max] sobre el radio del tipo. Sin ella, todos del mismo tamaño.
function place(world, type, count, escala = null) {
  const base = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;

  for (let n = 0; n < count; n++) {
    // Reintenta unas cuantas veces; si el mapa está lleno, se salta este.
    for (let intento = 0; intento < 40; intento++) {
      // El tamaño se sortea en cada intento: si no cabe la grande, entra otra.
      // Al cuadrado, para que salgan muchas pequeñas y pocos pedruscos: si la
      // mitad fueran enormes, taparían el mapa y Fagi no encontraría el agua.
      const t = Math.random() ** 2;
      const r = escala
        ? Math.round(base * (escala[0] + t * (escala[1] - escala[0])))
        : base;
      const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
      const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
      if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue; // sitio de Fagi
      if (!fits(world, x, y, r)) continue;
      addObject(world, x, y, type, r);
      break;
    }
  }
}

// Los recursos esenciales nacen en una corona alrededor de Fagi: no debajo de
// ella, pero sí lo bastante cerca para poder descubrirlos antes de morir.
function placeNearSpawn(world, type, count, minDistance, maxDistance) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let intento = 0; intento < count * 80 && placed < count; intento++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    if (x < MAPGEN.margin + r || x > WORLD.width - MAPGEN.margin - r) continue;
    if (y < MAPGEN.margin + r || y > WORLD.height - MAPGEN.margin - r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type);
    placed++;
  }
  if (placed < count) place(world, type, count - placed);
}

function placeFarFrom(world, type, count, origin, minDistance, maxDistance, preferredAngle) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let attempt = 0; attempt < count * 240 && placed < count; attempt++) {
    // Prioriza el lado opuesto al nido respecto al lugar de nacimiento: coincide
    // con la exploración que se aleja de casa, sin revelar la posición exacta.
    const angle = preferredAngle + (Math.random() - 0.5) * 1.2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = origin.x + Math.cos(angle) * distance;
    const y = origin.y + Math.sin(angle) * distance;
    if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type);
    placed++;
  }
}

export function generateMap(world) {
  // El nido va primero y cerca de donde nace Fagi: es su punto de partida.
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  const ang = Math.random() * Math.PI * 2;
  const nest = addObject(world, cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90, 'nido');

  placeNearSpawn(world, 'agua', MAPGEN.pools, 175, 240);
  placeFarFrom(
    world, 'arbol', MAPGEN.trees, nest,
    MAPGEN.treeMinNestDistance, MAPGEN.treeMaxNestDistance, ang + Math.PI,
  );
  place(world, 'roca', MAPGEN.rocks, MAPGEN.rockScale);
}
