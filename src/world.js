// Estado del mundo: los puntos de comida y los objetos del mapa.

import { WORLD, FAGI, NEST, OBJECT_TYPES, POINT_TYPES, TREE } from './config.js';
import { createWind } from './wind.js';
import { createPheromone } from './pheromone.js';

export function createWorld() {
  return {
    width: WORLD.width, height: WORLD.height,
    points: [], objects: [],
    immersive: true,
    wind: createWind(),
    pheromone: createPheromone(),
  };
}

export function addPoint(world, x, y, type) {
  world.points.push({ x, y, type });
}

export function removePoint(world, point) {
  const i = world.points.indexOf(point);
  if (i !== -1) world.points.splice(i, 1);
}

// Cada objeto lleva su propio radio: así se puede agrandar o encoger después.
export function addObject(world, x, y, type, r = OBJECT_TYPES[type].radius) {
  const obj = { x, y, type, r };
  if (OBJECT_TYPES[type].kind === 'nest') {
    obj.stock = {};   // cuántas raciones hay de cada cosa
    obj.ages = {};    // y la edad de cada una, para que también se echen a perder
  }
  if (OBJECT_TYPES[type].kind === 'spawner') obj.timer = TREE.interval; // cuenta atrás del fruto
  world.objects.push(obj);
  return obj;
}

// La fuente de agua del mapa (solo hay una).
export function waterSource(world) {
  return world.objects.find((o) => OBJECT_TYPES[o.type].kind === 'water') ?? null;
}

// El nido: casa, despensa y sitio donde mejor se descansa.
export function nestOf(world) {
  return world.objects.find((o) => OBJECT_TYPES[o.type].kind === 'nest') ?? null;
}

// Las dos cuentas de abajo valen para CUALQUIER despensa: la real del nido y
// la que Fagi recuerda (fagi.pantry). Por eso trabajan sobre un stock suelto y
// no sobre el nido: quien decide mira su recuerdo, no el mundo.
export function stockCount(stock) {
  return stock ? Object.values(stock).reduce((a, b) => a + b, 0) : 0;
}

// Con la despensa así de llena, seguir recogiendo no aporta nada: mejor
// dedicarse a conocer el mapa.
export function stockFull(stock) {
  return stockCount(stock) >= NEST.full;
}

// Cuánto hay guardado de verdad en el nido. Esto es el mundo, no lo que Fagi
// sabe: para el panel y para lo que pasa al estar dentro del nido.
export function nestStock(nido) {
  return nido ? stockCount(nido.stock) : 0;
}

export function nestFull(nido) {
  return Boolean(nido) && stockFull(nido.stock);
}

// La despensa lleva dos libros: cuánto hay (stock) y la edad de cada ración
// (ages). Se escriben SOLO desde aquí, y sincronizar() los cuadra si alguien
// toca el stock por su cuenta, así que no pueden separarse.
function sincronizar(nido) {
  nido.ages ??= {};
  for (const type of Object.keys(nido.stock)) {
    const lista = (nido.ages[type] ??= []);
    while (lista.length < nido.stock[type]) lista.push(0);
    while (lista.length > nido.stock[type]) lista.pop();
  }
}

// Guardar una ración. Entra con la edad que traía: el nido la conserva, no la
// rejuvenece.
export function storeInNest(nido, type, age = 0) {
  sincronizar(nido);
  nido.stock[type] = (nido.stock[type] ?? 0) + 1;
  (nido.ages[type] ??= []).push(age);
  return nido.stock[type];
}

// Servir una ración: sale la más vieja, que es la que se iba a echar a perder.
export function takeFromNest(nido, type) {
  sincronizar(nido);
  if (!nido.stock[type]) return false;
  nido.stock[type] -= 1;
  const lista = nido.ages[type] ?? [];
  if (lista.length) {
    let peor = 0;
    for (let i = 1; i < lista.length; i++) if (lista[i] > lista[peor]) peor = i;
    lista.splice(peor, 1);
  }
  return true;
}

// Cuánto le queda a la ración más vieja de un tipo, de 0 (recién guardada) a 1
// (a punto de echarse a perder). Para el panel.
export function nestRipeness(nido, type) {
  const vida = (POINT_TYPES[type]?.life ?? 0) * NEST.keepFactor;
  if (vida <= 0) return 0;
  const lista = nido.ages?.[type] ?? [];
  return lista.length ? Math.min(1, Math.max(...lista) / vida) : 0;
}

// El tiempo también corre en la despensa, solo que NEST.keepFactor veces más
// despacio. Cumplida su vida, la ración se echa a perder y desaparece.
export function updateNest(world, dt) {
  const nido = nestOf(world);
  if (!nido) return;
  sincronizar(nido);
  const paso = dt / NEST.keepFactor;

  for (const [type, lista] of Object.entries(nido.ages)) {
    const vida = POINT_TYPES[type]?.life ?? 0;
    const quedan = [];
    let perdidas = 0;
    for (const age of lista) {
      const edad = age + paso;
      if (vida > 0 && edad >= vida) { perdidas++; continue; }
      quedan.push(edad);
    }
    nido.ages[type] = quedan;
    if (!perdidas) continue;
    nido.stock[type] = Math.max(0, (nido.stock[type] ?? 0) - perdidas);
    nido.spoiled = (nido.spoiled ?? 0) + perdidas;
    nido.lastSpoiled = { type, n: perdidas, total: nido.spoiled };
  }
}

export function removeObject(world, obj) {
  const i = world.objects.indexOf(obj);
  if (i !== -1) world.objects.splice(i, 1);
}

export function clearWorld(world) {
  world.points.length = 0;
  world.objects.length = 0;
  world.pheromone.length = 0;
  // Mundo nuevo, terreno nuevo: la semilla es lo único que lo decide.
  world.seed = null;
}

// El punto que Fagi está tocando, o null. Si está tocando el que perseguía,
// manda ese: si no, dos puntos pegados se tapan el uno al otro y el suyo no le
// llega nunca a las manos. Entre los demás, el más cercano.
export function pointTouching(world, fagi) {
  const alcance = FAGI.eatRadius * FAGI.eatRadius;
  let best = null;
  let bestDist = Infinity;
  for (const p of world.points) {
    const dist = (p.x - fagi.x) ** 2 + (p.y - fagi.y) ** 2;
    if (dist > alcance) continue;
    if (p === fagi.target) return p;
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  return best;
}
