// Estado del mundo: los puntos de comida y los objetos del mapa.

import { WORLD, FAGI, NEST, OBJECT_TYPES, POINT_TYPES, TREE } from './config.js';
import { createWind } from './wind.js';
import { createPheromone } from './pheromone.js';
import { createRain } from './rain.js';

export function createWorld() {
  return {
    width: WORLD.width, height: WORLD.height,
    points: [], objects: [],
    immersive: true,
    wind: createWind(),
    pheromone: createPheromone(),
    rain: createRain(),   // chaparrones y charcos (rain.js)
    nextId: 1,   // cada cosa del mapa lleva un id: así se puede nombrar desde fuera
    time: 0,     // reloj del mundo en segundos; sigue corriendo aunque Fagi muera
    rec: null,   // el grabador de la sesión, si se está grabando (recorder/)
  };
}

// Apunta un suceso en la grabación de la sesión, si la hay. Todo lo que cambia
// el mapa pasa por aquí: así una partida se puede reproducir sin fotos.
export function record(world, type, data) {
  world.rec?.emit(type, data);
}

// Un id nuevo por cosa. No se reutiliza nunca, ni al vaciar el mapa: una
// respuesta de la API que llegue tarde no puede confundir un fruto con otro.
function newId(world) {
  world.nextId = (world.nextId ?? 1);
  return world.nextId++;
}

// `from` es quién lo puso: el id del árbol del que cayó, o 'user'.
export function addPoint(world, x, y, type, from = null) {
  const p = { id: newId(world), x, y, type };
  world.points.push(p);
  record(world, 'point_add', { id: p.id, what: type, x, y, from });
  return p;
}

// `reason`: 'eaten', 'picked', 'rotted'...
export function removePoint(world, point, reason = 'removed') {
  const i = world.points.indexOf(point);
  if (i === -1) return;
  world.points.splice(i, 1);
  record(world, 'point_remove', { id: point.id, reason });
}

// Cada objeto lleva su propio radio: así se puede agrandar o encoger después.
// `source`: 'map' (generado), 'user' (colocado a mano) o 'sim'.
export function addObject(world, x, y, type, r = OBJECT_TYPES[type].radius, source = 'sim') {
  const obj = { id: newId(world), x, y, type, r };
  if (OBJECT_TYPES[type].kind === 'nest') {
    obj.stock = {};   // cuántas raciones hay de cada cosa
    obj.ages = {};    // y la edad de cada una, para que también se echen a perder
  }
  if (OBJECT_TYPES[type].kind === 'spawner') obj.timer = TREE.interval; // cuenta atrás del fruto
  world.objects.push(obj);
  record(world, 'obj_add', { id: obj.id, what: type, x, y, r, source });
  return obj;
}

// La fuente de agua del mapa (solo hay una). Los charcos de lluvia no cuentan.
export function waterSource(world) {
  return world.objects.find((o) => o.type === 'water') ?? null;
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
export function nestStock(nestObj) {
  return nestObj ? stockCount(nestObj.stock) : 0;
}

export function nestFull(nestObj) {
  return Boolean(nestObj) && stockFull(nestObj.stock);
}

// La despensa lleva dos libros: cuánto hay (stock) y la edad de cada ración
// (ages). Se escriben SOLO desde aquí, y sincronizar() los cuadra si alguien
// toca el stock por su cuenta, así que no pueden separarse.
function sync(nestObj) {
  nestObj.ages ??= {};
  for (const type of Object.keys(nestObj.stock)) {
    const list = (nestObj.ages[type] ??= []);
    while (list.length < nestObj.stock[type]) list.push(0);
    while (list.length > nestObj.stock[type]) list.pop();
  }
}

// Guardar una ración. Entra con la edad que traía: el nido la conserva, no la
// rejuvenece.
export function storeInNest(nestObj, type, age = 0) {
  sync(nestObj);
  nestObj.stock[type] = (nestObj.stock[type] ?? 0) + 1;
  (nestObj.ages[type] ??= []).push(age);
  return nestObj.stock[type];
}

// Servir una ración: sale la más vieja, que es la que se iba a echar a perder.
export function takeFromNest(nestObj, type) {
  sync(nestObj);
  if (!nestObj.stock[type]) return false;
  nestObj.stock[type] -= 1;
  const list = nestObj.ages[type] ?? [];
  if (list.length) {
    let worst = 0;
    for (let i = 1; i < list.length; i++) if (list[i] > list[worst]) worst = i;
    list.splice(worst, 1);
  }
  return true;
}

// Cuánto le queda a la ración más vieja de un tipo, de 0 (recién guardada) a 1
// (a punto de echarse a perder). Para el panel.
export function nestRipeness(nestObj, type) {
  const life = (POINT_TYPES[type]?.life ?? 0) * NEST.keepFactor;
  if (life <= 0) return 0;
  const list = nestObj.ages?.[type] ?? [];
  return list.length ? Math.min(1, Math.max(...list) / life) : 0;
}

// El tiempo también corre en la despensa, solo que NEST.keepFactor veces más
// despacio. Cumplida su vida, la ración se echa a perder y desaparece.
export function updateNest(world, dt) {
  const nestObj = nestOf(world);
  if (!nestObj) return;
  sync(nestObj);
  const step = dt / NEST.keepFactor;

  for (const [type, list] of Object.entries(nestObj.ages)) {
    const life = POINT_TYPES[type]?.life ?? 0;
    const remain = [];
    let losses = 0;
    for (const age of list) {
      const ageOf = age + step;
      if (life > 0 && ageOf >= life) { losses++; continue; }
      remain.push(ageOf);
    }
    nestObj.ages[type] = remain;
    if (!losses) continue;
    nestObj.stock[type] = Math.max(0, (nestObj.stock[type] ?? 0) - losses);
    nestObj.spoiled = (nestObj.spoiled ?? 0) + losses;
    nestObj.lastSpoiled = { type, n: losses, total: nestObj.spoiled };
    record(world, 'nest_spoil', { what: type, count: losses });
  }
}

export function removeObject(world, obj, source = 'sim') {
  const i = world.objects.indexOf(obj);
  if (i === -1) return;
  world.objects.splice(i, 1);
  record(world, 'obj_remove', { id: obj.id, source });
}

// Mundo nuevo para una sesión nueva: vacío, con el reloj y los ids desde cero
// y otro viento. Es el mismo objeto, así la cámara y la entrada siguen
// apuntando a él.
export function resetWorld(world) {
  clearWorld(world);
  world.nextId = 1;
  world.time = 0;
  world.rec = null;
  world.wind = createWind();
  world.rain = createRain();
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
  const scope = FAGI.eatRadius * FAGI.eatRadius;
  let best = null;
  let bestDist = Infinity;
  for (const p of world.points) {
    const dist = (p.x - fagi.x) ** 2 + (p.y - fagi.y) ** 2;
    if (dist > scope) continue;
    if (p === fagi.target) return p;
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  return best;
}
