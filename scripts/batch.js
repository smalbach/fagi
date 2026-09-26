// Banco de pruebas: el MISMO mapa, los mismos recursos, varias Fagis.
//
// Corre la simulación sin navegador (solo instinto, sin API de decisión) y
// compara las sesiones entre sí: cuánto viven, de qué mueren, en qué gastan
// el tiempo y por dónde andan. Sirve para ver si su conducta es estable o si
// cada partida es una lotería.
//
// El azar va en tres corrientes separadas, cada una con su semilla:
//   mapa   → dónde está cada cosa (y el viento inicial). Igual en todas.
//   mundo  → viento y fruta que cae. Igual en todas salvo --world-varies.
//   Fagi   → sus decisiones con azar (rumbo inicial, giros, deriva de la
//            memoria). Distinta en cada corrida: es lo que se pone a prueba.
// Con la misma semilla de Fagi dos veces la sesión sale idéntica (--check).
//
//   node scripts/batch.js --map-seed 42 --runs 20 --duration 900
//   node scripts/batch.js --map-seed 42 --runs 20 --json out.json

import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import * as CONFIG from '../src/config.js';
import { readFileSync, writeFileSync } from 'node:fs';

const { WORLD } = CONFIG;

// --- argumentos -------------------------------------------------------------

function args(argv) {
  const o = { mapSeed: 1, runs: 10, duration: 600, dt: 0.05, seed0: 1000, worldVaries: false, check: false, json: null, cell: 80, sets: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--map-seed') o.mapSeed = Number(next());
    else if (a === '--runs') o.runs = Number(next());
    else if (a === '--duration') o.duration = Number(next());
    else if (a === '--dt') o.dt = Number(next());
    else if (a === '--seed') o.seed0 = Number(next());
    else if (a === '--world-varies') o.worldVaries = true;
    else if (a === '--check') o.check = true;
    else if (a === '--json') o.json = next();
    else if (a === '--cell') o.cell = Number(next());
    else if (a === '--profile') o.sets.push(...perfil(next()));
    else if (a === '--set') o.sets.push(asignacion(next()));
    else if (a === '-h' || a === '--help') { console.log(ayuda()); process.exit(0); }
    else { console.error(`argumento desconocido: ${a}\n\n${ayuda()}`); process.exit(1); }
  }
  return o;
}

function ayuda() {
  return `uso: node scripts/batch.js [opciones]
  --map-seed N     semilla del mapa (igual en todas las corridas)   [1]
  --runs N         cuántas Fagis                                    [10]
  --duration S     segundos simulados como máximo por corrida       [600]
  --dt S           paso de simulación                               [0.05]
  --seed N         semilla de la primera Fagi (luego +1, +2...)     [1000]
  --world-varies   el viento y la fruta también cambian por corrida
  --check          repite la primera corrida y exige que salga igual
  --cell PX        tamaño de casilla del mapa de calor              [80]
  --profile FILE   JSON con parámetros a cambiar: {"HUNGER": {"rate": 0.1}}
  --set A.b=V      cambia un parámetro suelto (se puede repetir)
  --json FILE      guarda todos los datos en un archivo`;
}

// Los parámetros se cambian sobre los objetos de config.js, que son los que
// lee toda la simulación: así se prueba un perfil sin tocar el archivo.
function perfil(file) {
  const datos = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const bajar = (ruta, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, w] of Object.entries(v)) bajar([...ruta, k], w);
    else if (!ruta.at(-1).startsWith('_')) out.push([ruta, v]);   // "_nota": comentarios
  };
  for (const [k, v] of Object.entries(datos)) if (!k.startsWith('_')) bajar([k], v);
  return out;
}

function asignacion(txt) {
  const [ruta, valor] = txt.split('=');
  return [ruta.split('.'), JSON.parse(valor)];
}

function aplicar(sets) {
  for (const [ruta, v] of sets) {
    let o = CONFIG;
    for (const k of ruta.slice(0, -1)) {
      o = o[k];
      if (o == null) throw new Error(`parámetro desconocido: ${ruta.join('.')}`);
    }
    if (!(ruta.at(-1) in o)) throw new Error(`parámetro desconocido: ${ruta.join('.')}`);
    o[ruta.at(-1)] = v;
  }
}

// --- azar con semilla -------------------------------------------------------

function rng(seed) {
  // mulberry32: rápido y de sobra para esto
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const original = Math.random;
function con(random, fn) {
  Math.random = random;
  try { return fn(); } finally { Math.random = original; }
}

// --- una corrida ------------------------------------------------------------

function correr(opts, fagiSeed) {
  const mapaRng = rng(opts.mapSeed);
  const mundoRng = rng(opts.worldVaries ? fagiSeed * 7919 : opts.mapSeed + 1);
  const fagiRng = rng(fagiSeed);

  const world = con(mapaRng, () => { const w = createWorld(); generateMap(w); return w; });
  const fagi = con(fagiRng, () => createFagi());

  const cols = Math.ceil(WORLD.width / opts.cell);
  const rows = Math.ceil(WORLD.height / opts.cell);
  const calor = new Float64Array(cols * rows);
  const acciones = {};          // acción -> segundos
  const secuencia = [];         // [t, acción] cada vez que cambia
  const camino = [];            // posición cada segundo, para comparar trayectorias
  const hitos = { firstDrink: null, firstMeal: null, firstPick: null, firstStore: null };
  const visitados = [];         // ids de objetos del mapa en el orden en que los pisa
  let proxCamino = 0;
  // Aprendizaje: cuánto tarda en llegar al agua desde que la sed se vuelve
  // urgente (NEEDS.critical), que es cuando se pone a buscarla de verdad.
  // Si aprende dónde está, la primera vez debería costar más que las demás.
  const latencias = [];
  let sedDesde = null;
  let bebia = false;

  const pasos = Math.ceil(opts.duration / opts.dt);
  for (let i = 0; i < pasos && fagi.alive; i++) {
    con(mundoRng, () => stepWorld(world, opts.dt));
    con(fagiRng, () => updateFagi(fagi, world, opts.dt));

    const acc = fagi.thought?.action ?? '-';
    acciones[acc] = (acciones[acc] ?? 0) + opts.dt;
    if (secuencia.at(-1)?.[1] !== acc) secuencia.push([round(fagi.age), acc]);

    const c = Math.min(cols - 1, Math.max(0, Math.floor(fagi.x / opts.cell)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor(fagi.y / opts.cell)));
    calor[r * cols + c] += opts.dt;

    if (fagi.age >= proxCamino) { camino.push([fagi.x, fagi.y]); proxCamino += 1; }

    if (!fagi.drinking && sedDesde == null && fagi.thirst / CONFIG.THIRST.max >= CONFIG.NEEDS.critical) sedDesde = fagi.age;
    if (fagi.drinking && !bebia && sedDesde != null) { latencias.push(round(fagi.age - sedDesde)); sedDesde = null; }
    if (fagi.drinking) sedDesde = null;
    bebia = fagi.drinking;

    if (hitos.firstDrink == null && fagi.drunk > 0) hitos.firstDrink = round(fagi.age);
    if (hitos.firstMeal == null && fagi.eaten > 0) hitos.firstMeal = round(fagi.age);
    if (hitos.firstPick == null && (fagi.picked ?? 0) > 0) hitos.firstPick = round(fagi.age);
    if (hitos.firstStore == null && (fagi.stored ?? 0) > 0) hitos.firstStore = round(fagi.age);

    for (const o of world.objects) {
      if (visitados.includes(o.id)) continue;
      if (Math.hypot(o.x - fagi.x, o.y - fagi.y) <= (o.r ?? 0) + 4) visitados.push(o.id);
    }
  }

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
    ...hitos,
    waterFirst: latencias[0] ?? null,
    waterLater: latencias.length > 1 ? round(media(latencias.slice(1))) : null,
    waterTrips: latencias.length,
    visited: visitados.map((id) => `${world.objects.find((o) => o.id === id)?.type ?? '?'}#${id}`),
    actions: Object.fromEntries(Object.entries(acciones).map(([k, v]) => [k, round(v)])),
    sequence: secuencia,
    heat: Array.from(calor),
    path: camino,
    fingerprint: huella(fagi, world),
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

// --- comparación ------------------------------------------------------------

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const media = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const desv = (xs) => { const m = media(xs); return Math.sqrt(media(xs.map((x) => (x - m) ** 2))); };

function coseno(a, b) {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

// 1 - divergencia de Jensen-Shannon (base 2): 1 = reparten el tiempo igual.
function parecidoReparto(a, b) {
  const claves = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const ta = media(Object.values(a)) * Object.keys(a).length || 1;
  const tb = media(Object.values(b)) * Object.keys(b).length || 1;
  const p = claves.map((k) => (a[k] ?? 0) / ta);
  const q = claves.map((k) => (b[k] ?? 0) / tb);
  const kl = (x, y) => x.reduce((s, xi, i) => (xi > 0 ? s + xi * Math.log2(xi / y[i]) : s), 0);
  const m = p.map((pi, i) => (pi + q[i]) / 2);
  return 1 - (kl(p, m) + kl(q, m)) / 2;
}

// Segundo en el que dos caminos se separan más de `umbral` px por primera vez.
function divergencia(a, b, umbral = 60) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]) > umbral) return i;
  return null;
}

function pares(runs, f) {
  const xs = [];
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) xs.push(f(runs[i], runs[j]));
  return xs;
}

// --- informe ----------------------------------------------------------------

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

function informe(opts, runs) {
  const L = [];
  L.push(`mapa ${opts.mapSeed} · ${runs.length} corridas · máx ${opts.duration}s · dt ${opts.dt} · mundo ${opts.worldVaries ? 'varía' : 'fijo'}`);
  if (opts.sets.length) L.push('cambios: ' + opts.sets.map(([r, v]) => `${r.join('.')}=${JSON.stringify(v)}`).join(' '));
  L.push('');
  L.push(pad('semilla', 9) + pad('vivió', 8) + pad('causa', 8) + pad('comió', 7) + pad('bebió', 7) + pad('guardó', 8) + pad('1ªagua', 8) + pad('1ªcomida', 10) + 'huella');
  for (const r of runs) {
    L.push(pad(r.seed, 9) + pad(r.lived, 8) + pad(r.cause ?? 'vive', 8) + pad(r.eaten, 7) + pad(r.drunk, 7) + pad(r.stored, 8) + pad(r.firstDrink ?? '-', 8) + pad(r.firstMeal ?? '-', 10) + r.fingerprint);
  }
  L.push('');

  const num = (k) => runs.map((r) => r[k]).filter((x) => x != null);
  const linea = (nombre, xs) => {
    if (!xs.length) return `${pad(nombre, 14)}sin datos`;
    const m = media(xs);
    return `${pad(nombre, 14)}media ${pad(round(m), 8)} desv ${pad(round(desv(xs)), 8)} cv ${pad(m ? round(desv(xs) / m * 100, 0) + '%' : '-', 6)} min ${pad(round(Math.min(...xs)), 7)} max ${round(Math.max(...xs))}`;
  };
  L.push('dispersión');
  for (const k of ['lived', 'eaten', 'drunk', 'stored', 'firstDrink', 'firstMeal', 'exploreLegs', 'waterFirst', 'waterLater']) L.push('  ' + linea(k, num(k)));

  const causas = {};
  for (const r of runs) causas[r.cause ?? 'vive'] = (causas[r.cause ?? 'vive'] ?? 0) + 1;
  L.push('  ' + pad('desenlace', 14) + Object.entries(causas).map(([k, v]) => `${k} ${v}/${runs.length}`).join(' · '));
  L.push('');

  // Reparto medio del tiempo por acción.
  const total = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.actions)) total[k] = (total[k] ?? 0) + v / r.lived;
  L.push('tiempo por acción (media de % por corrida, ± desv)');
  for (const [k] of Object.entries(total).sort((a, b) => b[1] - a[1])) {
    const xs = runs.map((r) => ((r.actions[k] ?? 0) / r.lived) * 100);
    L.push(`  ${pad(k, 20)} ${pad(round(media(xs)) + '%', 8)} ± ${round(desv(xs))}`);
  }
  L.push('');

  // Qué recurso encuentra primero.
  const primeros = {};
  for (const r of runs) {
    const agua = r.visited.find((v) => v.startsWith('agua')) ?? 'ninguna';
    const arbol = r.visited.find((v) => v.startsWith('arbol')) ?? 'ninguno';
    primeros[`agua ${agua}`] = (primeros[`agua ${agua}`] ?? 0) + 1;
    primeros[`árbol ${arbol}`] = (primeros[`árbol ${arbol}`] ?? 0) + 1;
  }
  L.push('primer recurso que pisa');
  for (const [k, v] of Object.entries(primeros).sort()) L.push(`  ${pad(k, 20)} ${v}/${runs.length}`);
  L.push('');

  if (runs.length > 1) {
    const reparto = pares(runs, (a, b) => parecidoReparto(a.actions, b.actions));
    const calor = pares(runs, (a, b) => coseno(a.heat, b.heat));
    const div = pares(runs, (a, b) => divergencia(a.path, b.path)).filter((x) => x != null);
    L.push('parecido entre pares de corridas (1 = iguales)');
    L.push(`  reparto de acciones   media ${round(media(reparto), 3)}  min ${round(Math.min(...reparto), 3)}`);
    L.push(`  mapa de calor         media ${round(media(calor), 3)}  min ${round(Math.min(...calor), 3)}`);
    L.push(`  caminos se separan    a los ${div.length ? round(media(div)) + 's de media' : 'nunca (>60px)'}`);
    const unicas = new Set(runs.map((r) => r.fingerprint)).size;
    L.push(`  sesiones distintas    ${unicas}/${runs.length}`);
    L.push('');
    L.push(veredicto(runs, reparto, calor));
  }
  return L.join('\n');
}

function veredicto(runs, reparto, calor) {
  const vidas = runs.map((r) => r.lived);
  const cv = desv(vidas) / (media(vidas) || 1);
  const r = media(reparto), c = media(calor);
  const partes = [];
  partes.push(r > 0.9 ? 'reparte el tiempo casi igual' : r > 0.75 ? 'reparte el tiempo parecido' : 'reparte el tiempo muy distinto');
  partes.push(c > 0.8 ? 'recorre las mismas zonas' : c > 0.5 ? 'recorre zonas parecidas' : 'recorre zonas distintas');
  partes.push(cv < 0.15 ? 'supervivencia estable' : cv < 0.4 ? 'supervivencia algo variable' : 'supervivencia muy variable');
  return `veredicto: ${partes.join(', ')} (cv vida ${round(cv * 100, 0)}%).`;
}

// --- main -------------------------------------------------------------------

const opts = args(process.argv.slice(2));
aplicar(opts.sets);
const runs = [];
const t0 = Date.now();
for (let i = 0; i < opts.runs; i++) {
  const r = correr(opts, opts.seed0 + i);
  runs.push(r);
  process.stderr.write(`\rcorrida ${i + 1}/${opts.runs}`);
}
process.stderr.write(`\r${' '.repeat(30)}\r`);

console.log(informe(opts, runs));
console.log(`\n(${round((Date.now() - t0) / 1000)}s reales)`);

if (opts.check) {
  const otra = correr(opts, opts.seed0);
  const ok = otra.fingerprint === runs[0].fingerprint && JSON.stringify(otra.sequence) === JSON.stringify(runs[0].sequence);
  console.log(ok
    ? `check: semilla ${opts.seed0} repetida da la misma sesión ✓`
    : `check: semilla ${opts.seed0} repetida da OTRA sesión ✗ — hay azar fuera de las semillas`);
  if (!ok) process.exitCode = 1;
}

if (opts.json) {
  writeFileSync(opts.json, JSON.stringify({ opts, runs }, null, 1));
  console.log(`datos en ${opts.json}`);
}
