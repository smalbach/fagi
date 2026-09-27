// Una corrida: una Fagi en el mapa de la semilla, y todo lo que se anota de ella.

import { createWorld, addObject, nestOf, stockCount } from '../../src/world.js';
import { isTree, isWater } from '../../src/obstacles.js';
import { pheromoneAt } from '../../src/pheromone.js';
import { generateMap } from '../../src/mapgen.js';
import { createFagi, updateFagi } from '../../src/fagi.js';
import { stepWorld } from '../../src/simulation.js';
import * as CONFIG from '../../src/config.js';
import { rng, con } from './azar.js';
import { round, media } from './estadistica.js';

const { WORLD } = CONFIG;

// --- el muro ---------------------------------------------------------------

// Tres rocas atravesadas a mitad de la recta que une el nido con cada recurso:
// el camino que ya aprendió deja de valer y tiene que rodear.
function bloquear(world, r) {
  const nido = nestOf(world);
  const puestas = [];
  for (const destino of [world.objects.find(isTree), world.objects.find(isWater)]) {
    if (!nido || !destino) continue;
    const dx = destino.x - nido.x, dy = destino.y - nido.y;
    const L = Math.hypot(dx, dy);
    const [ux, uy] = [dx / L, dy / L];
    const [mx, my] = [nido.x + dx / 2, nido.y + dy / 2];
    for (const k of [-1, 0, 1]) {
      const x = mx - uy * k * (2 * r + 2), y = my + ux * k * (2 * r + 2);
      const choca = world.objects.some((o) => o.type !== 'roca' && Math.hypot(o.x - x, o.y - y) < r + (o.r ?? 0) + 10);
      if (!choca) puestas.push(addObject(world, x, y, 'roca', r, 'user'));
    }
  }
  return puestas.length;
}

// --- una corrida ------------------------------------------------------------

export function correr(opts, fagiSeed) {
  const mapaRng = rng(opts.mapSeed);
  const mundoRng = rng(opts.worldVaries ? fagiSeed * 7919 : opts.mapSeed + 1);
  const fagiRng = rng(fagiSeed);

  const world = con(mapaRng, () => { const w = createWorld(); generateMap(w); return w; });
  const fagi = con(fagiRng, () => createFagi());
  const s = nuevoSeguimiento(opts, fagi);

  const pasos = Math.ceil(opts.duration / opts.dt);
  for (let i = 0; i < pasos && fagi.alive; i++) {
    if (opts.block != null && s.rocas === 0 && world.time >= opts.block) s.rocas = bloquear(world, opts.rock) || -1;
    con(mundoRng, () => stepWorld(world, opts.dt));
    con(fagiRng, () => updateFagi(fagi, world, opts.dt));

    const acc = fagi.thought?.action ?? '-';
    anotarAccion(s, fagi, acc, opts);
    anotarPosicion(s, fagi, opts);
    anotarSed(s, fagi);
    anotarFase(s, fagi, world, acc, opts);
    anotarHitos(s.hitos, fagi);
    anotarVisitas(s.visitados, fagi, world);
  }

  return resumenCorrida(fagiSeed, fagi, world, s);
}

// Todo lo que se va anotando paso a paso.
function nuevoSeguimiento(opts, fagi) {
  const cols = Math.ceil(WORLD.width / opts.cell);
  const rows = Math.ceil(WORLD.height / opts.cell);
  return {
    cols, rows,
    calor: new Float64Array(cols * rows),
    acciones: {},          // acción -> segundos
    secuencia: [],         // [t, acción] cada vez que cambia
    camino: [],            // posición cada segundo, para comparar trayectorias
    hitos: { firstDrink: null, firstMeal: null, firstPick: null, firstStore: null },
    visitados: [],         // ids de objetos del mapa en el orden en que los pisa
    proxCamino: 0,
    // Aprendizaje: cuánto tarda en llegar al agua desde que la sed se vuelve
    // urgente (NEEDS.critical), que es cuando se pone a buscarla de verdad.
    // Si aprende dónde está, la primera vez debería costar más que las demás.
    latencias: [],
    sedDesde: null,
    bebia: false,

    // Viajes a por más comida: desde que sale sin carga y con la despensa sin
    // llenar (según la recuerda) hasta que recoge algo. Con la despensa llena no
    // va a por comida, explora: eso no cuenta como ida. Se parten en
    // antes/después del muro (--block).
    fases: { antes: nuevaFase(), despues: nuevaFase() },
    viajeDesde: null,
    recogidas: 0,
    rocas: 0,
    prev: { x: fagi.x, y: fagi.y },
  };
}

function anotarAccion(s, fagi, acc, opts) {
  s.acciones[acc] = (s.acciones[acc] ?? 0) + opts.dt;
  if (s.secuencia.at(-1)?.[1] !== acc) s.secuencia.push([round(fagi.age), acc]);
}

function anotarPosicion(s, fagi, opts) {
  const c = Math.min(s.cols - 1, Math.max(0, Math.floor(fagi.x / opts.cell)));
  const r = Math.min(s.rows - 1, Math.max(0, Math.floor(fagi.y / opts.cell)));
  s.calor[r * s.cols + c] += opts.dt;

  if (fagi.age >= s.proxCamino) { s.camino.push([fagi.x, fagi.y]); s.proxCamino += 1; }
}

function anotarSed(s, fagi) {
  if (!fagi.drinking && s.sedDesde == null && fagi.thirst / CONFIG.THIRST.max >= CONFIG.NEEDS.critical) s.sedDesde = fagi.age;
  if (fagi.drinking && !s.bebia && s.sedDesde != null) { s.latencias.push(round(fagi.age - s.sedDesde)); s.sedDesde = null; }
  if (fagi.drinking) s.sedDesde = null;
  s.bebia = fagi.drinking;
}

function anotarFase(s, fagi, world, acc, opts) {
  const fase = opts.block != null && world.time >= opts.block ? s.fases.despues : s.fases.antes;
  fase.t += opts.dt;
  const buscando = !fagi.carrying && stockCount(fagi.pantry) < CONFIG.NEST.full;
  if ((fagi.picked ?? 0) > s.recogidas && s.viajeDesde != null) { fase.viajes.push(fagi.age - s.viajeDesde); s.viajeDesde = null; }
  else if (!buscando) s.viajeDesde = null;
  else if (s.viajeDesde == null) s.viajeDesde = fagi.age;
  s.recogidas = fagi.picked ?? 0;
  if (s.viajeDesde != null) {
    fase.ida += opts.dt;
    const rastro = pheromoneAt(world, fagi.x, fagi.y) > 0.05;
    if (rastro) fase.idaConRastro += opts.dt;
    if (acc === 'pheromone') fase.idaFeromona += opts.dt;
    fase.idaAcciones[acc] = (fase.idaAcciones[acc] ?? 0) + opts.dt;
    if (rastro && acc !== 'pheromone') fase.rastroIgnorado += opts.dt;
    if (fagi.target && world.objects.includes(fagi.target) && isTree(fagi.target)) fase.idaMemoriaArbol += opts.dt;
  }
  const quieta = ['rest', 'drink', 'eatCarried', 'pantry'].includes(acc) || fagi.drinking;
  if (!quieta && Math.hypot(fagi.x - s.prev.x, fagi.y - s.prev.y) < 5 * opts.dt) fase.atascada += opts.dt;
  s.prev = { x: fagi.x, y: fagi.y };
  const lat = s.latencias.at(-1);
  if (fagi.drinking && s.latencias.length && lat !== fase.ultimaLat) { fase.agua.push(lat); fase.ultimaLat = lat; }
}

function anotarHitos(hitos, fagi) {
  if (hitos.firstDrink == null && fagi.drunk > 0) hitos.firstDrink = round(fagi.age);
  if (hitos.firstMeal == null && fagi.eaten > 0) hitos.firstMeal = round(fagi.age);
  if (hitos.firstPick == null && (fagi.picked ?? 0) > 0) hitos.firstPick = round(fagi.age);
  if (hitos.firstStore == null && (fagi.stored ?? 0) > 0) hitos.firstStore = round(fagi.age);
}

function anotarVisitas(visitados, fagi, world) {
  for (const o of world.objects) {
    if (visitados.includes(o.id)) continue;
    if (Math.hypot(o.x - fagi.x, o.y - fagi.y) <= (o.r ?? 0) + 4) visitados.push(o.id);
  }
}

function resumenCorrida(fagiSeed, fagi, world, s) {
  return {
    seed: fagiSeed,
    alive: fagi.alive,
    lived: round(fagi.age),
    cause: fagi.alive ? null : fagi.cause,
    eaten: fagi.eaten,
    drunk: round(fagi.drunk),
    picked: fagi.picked ?? 0,
    stored: fagi.stored ?? 0,
    exploreLegs: fagi.exploreLegs,
    rules: fagi.brain.rules?.list?.length ?? 0,
    ...s.hitos,
    waterFirst: s.latencias[0] ?? null,
    waterLater: s.latencias.length > 1 ? round(media(s.latencias.slice(1))) : null,
    waterTrips: s.latencias.length,
    rocks: s.rocas,
    phases: Object.fromEntries(Object.entries(s.fases).map(([k, f]) => [k, resumenFase(f)])),
    visited: s.visitados.map((id) => `${world.objects.find((o) => o.id === id)?.type ?? '?'}#${id}`),
    actions: Object.fromEntries(Object.entries(s.acciones).map(([k, v]) => [k, round(v)])),
    sequence: s.secuencia,
    heat: Array.from(s.calor),
    path: s.camino,
    fingerprint: huella(fagi, world),
  };
}

function nuevaFase() {
  return { t: 0, viajes: [], ida: 0, idaConRastro: 0, idaFeromona: 0, rastroIgnorado: 0, idaMemoriaArbol: 0, atascada: 0, agua: [], ultimaLat: null, idaAcciones: {} };
}

function resumenFase(f) {
  const pct = (x) => (f.ida ? round((x / f.ida) * 100) : null);
  return {
    seconds: round(f.t),
    foodTrips: f.viajes.length,
    foodTrip: f.viajes.length ? round(media(f.viajes)) : null,
    onTrail: pct(f.idaConRastro),         // % de la ida con feromona bajo las patas
    followsTrail: pct(f.idaFeromona),     // % de la ida en acción 'pheromone'
    ignoresTrail: pct(f.rastroIgnorado),  // % de la ida con rastro pero haciendo otra cosa
    byMemory: pct(f.idaMemoriaArbol),     // % de la ida yendo al árbol que recuerda
    stuck: round(f.atascada),
    waterTrip: f.agua.length ? round(media(f.agua)) : null,
    tripActions: Object.fromEntries(Object.entries(f.idaAcciones).map(([k, v]) => [k, pct(v)])),
  };
}

// Resumen del estado final: si dos corridas con la misma semilla dan distinta
// huella, hay azar que se escapa de las semillas (Date.now, estado global...).
function huella(fagi, world) {
  const s = JSON.stringify([fagi.x, fagi.y, fagi.age, fagi.hunger, fagi.thirst, fagi.energy, world.points.length, world.objects.length, world.nextId]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
