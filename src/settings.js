// Cuadro de ajustes: edita en caliente los objetos de config.js.
//
// Todo el juego lee sus números de esos objetos en cada frame, así que cambiar
// aquí un valor se nota al instante, sin reiniciar. El esquema de abajo es la
// única lista que hay que tocar para exponer un parámetro nuevo.

import {
  FAGI, HUNGER, THIRST, ENERGY, BRAIN, CARRY, NEST, EXPLORE, WIND, PLUME, PHERO, TREE, FRUIT, MEMORY,
  MAPGEN, POINT_TYPES, OBJECT_TYPES, TYPE_KEYS, FEEL, LEARN, BACKEND, RAIN, WATER,
} from './config.js';
import { startRain } from './rain.js';
import { removeAllTrees } from './trees.js';
import { wipe } from './learned/store.js';
import { t, labelOf, getLang, onLangChange } from './i18n.js';

const CLAVE_AJUSTES = 'fagi.settings';

// Cada campo lleva su texto en los dos idiomas: en, es.
const n = (obj, key, en, es, min, max, step) => ({ obj, key, label: { en, es }, min, max, step });

function camposDeAlimento(key) {
  const spec = POINT_TYPES[key];
  // Lo podrido no se pudre otra vez: su vida es la que tarda en desaparecer.
  const vidaEn = key === FRUIT.rot ? 'Life before vanishing (0 = never)' : 'Life before rotting (0 = never)';
  const vidaEs = key === FRUIT.rot ? 'Vida antes de desaparecer (0 = nunca)' : 'Vida antes de pudrirse (0 = nunca)';
  const campos = [
    n(spec, 'hunger', 'Hunger it removes (negative) or adds', 'Hambre que quita (negativo) o suma', -80, 80, 1),
    n(spec, 'aroma', 'Aroma: length of its plume', 'Aroma: largo de su estela', 0, 400, 5),
    n(spec, 'life', vidaEn, vidaEs, 0, 300, 5),
    n(spec, 'radius', 'Size of the dot', 'Tamaño del punto', 2, 20, 1),
  ];
  spec.effects.forEach((e, i) => {
    // El id lleva el número del efecto: dos efectos del mismo alimento comparten clave.
    campos.push({ ...n(e, 'mult', `Effect ${i + 1} · ${e.stat} ×`, `Efecto ${i + 1} · ${e.stat} ×`, 0.1, 4, 0.05), id: `effect${i}.mult` });
    campos.push({ ...n(e, 'sec', `Effect ${i + 1} · ${e.stat} lasts`, `Efecto ${i + 1} · ${e.stat} dura`, 0, 60, 1), id: `effect${i}.sec` });
  });
  return campos;
}

const GRUPOS = [
  { titulo: { en: 'Fagi', es: 'Fagi' }, campos: [
    n(FAGI, 'speed', 'Speed', 'Velocidad', 10, 300, 5),
    n(FAGI, 'turnSpeed', 'Turn rate', 'Rapidez de giro', 0.5, 15, 0.1),
    n(FAGI, 'fovDeg', 'Field of view', 'Ángulo de visión', 20, 340, 5),
    n(FAGI, 'viewRange', 'Sight range', 'Alcance de la vista', 40, 700, 10),
    n(FAGI, 'smell', 'Smell sensitivity', 'Sensibilidad del olfato', 0, 4, 0.1),
    n(FAGI, 'eatRadius', 'Reach to eat', 'Alcance para comer', 6, 40, 1),
    n(FAGI, 'memorySec', 'Memory of what it loses sight of', 'Memoria de lo que pierde de vista', 0, 15, 0.5),
    n(FAGI, 'trailMemory', 'Persistence chasing a lost trail', 'Insistencia buscando un rastro', 0, 20, 0.5),
    n(FAGI, 'probe', 'Antenna spacing', 'Separación de las antenas', 5, 80, 1),
    n(FAGI, 'castTurn', 'Casting width', 'Apertura del barrido', 0.2, 2.5, 0.05),
    n(FAGI, 'castEvery', 'Side switch when casting', 'Cambio de lado al barrer', 0.2, 4, 0.1),
  ]},
  { titulo: { en: 'Hunger', es: 'Hambre' }, campos: [
    n(HUNGER, 'rate', 'Hunger per second', 'Hambre por segundo', 0, 12, 0.1),
    n(HUNGER, 'max', 'Hunger that kills', 'Hambre que mata', 20, 300, 10),
  ]},
  { titulo: { en: 'Thirst', es: 'Sed' }, campos: [
    n(THIRST, 'rate', 'Thirst per second', 'Sed por segundo', 0, 12, 0.1),
    n(THIRST, 'max', 'Thirst that kills', 'Sed que mata', 20, 300, 10),
    n(THIRST, 'drinkRate', 'Thirst removed by drinking (per second)', 'Sed que quita bebiendo (por segundo)', 1, 100, 1),
    n(THIRST, 'ignoreBelow', 'Thirst below which it ignores water', 'Sed por debajo de la cual ignora el agua', 0, 1, 0.05),
  ]},
  { titulo: { en: 'Body (what it feels)', es: 'Cuerpo (lo que siente)' }, campos: [
    n(FEEL, 'hungerScale', 'Hunger points worth a full sensation', 'Puntos de hambre que valen una sensación entera', 5, 100, 1),
    n(FEEL, 'thirstScale', 'Thirst points worth a full sensation', 'Puntos de sed que valen una sensación entera', 5, 150, 1),
    n(FEEL, 'effectWeight', 'Weight of a stat change vs hunger', 'Peso de un cambio de stat frente al hambre', 0, 2, 0.05),
    n(FEEL, 'window', 'Seconds it keeps watching after a bite', 'Segundos que vigila tras un bocado', 0, 60, 1),
    n(FEEL, 'perilWeight', 'Penalty when a need turns critical after it', 'Castigo si la necesidad se dispara después', 0, 1, 0.05),
    n(FEEL, 'deathPenalty', 'Penalty for dying with a recent bite', 'Castigo por morir con un bocado reciente', 0, 1, 0.05),
    n(FEEL, 'drinkSample', 'Seconds drinking before judging water', 'Segundos bebiendo antes de juzgar el agua', 0.2, 10, 0.1),
  ]},
  { titulo: { en: 'Learning (written rules)', es: 'Aprendizaje (reglas escritas)' }, campos: [
    n(LEARN, 'avoidFrom', 'Belief weight that writes "avoid X"', 'Peso de creencia que escribe "evitar X"', 0.02, 1, 0.02),
    n(LEARN, 'avoidUntil', 'Weight below which "avoid X" is retired', 'Peso por debajo del cual retira "evitar X"', 0, 1, 0.02),
    n(LEARN, 'preferFrom', 'Belief weight that writes "prefer X"', 'Peso de creencia que escribe "preferir X"', 0.02, 1, 0.02),
    n(LEARN, 'preferUntil', 'Weight below which "prefer X" is retired', 'Peso por debajo del cual retira "preferir X"', 0, 1, 0.02),
    n(LEARN, 'autosave', 'Keep a recoverable copy (1 = yes)', 'Guardar copia recuperable (1 = sí)', 0, 1, 1),
    n(LEARN, 'autosaveEvery', 'Seconds between copies', 'Segundos entre copias', 1, 120, 1),
  ]},
  { titulo: { en: 'External decision API', es: 'API de decisión externa' }, campos: [
    n(BACKEND, 'enabled', 'Ask the API (1 = yes)', 'Consultar la API (1 = sí)', 0, 1, 1),
    n(BACKEND, 'authority', 'Authority: 0 safe, 1 full', 'Autoridad: 0 segura, 1 plena', 0, 1, 1),
    n(BACKEND, 'minInterval', 'Seconds between queries', 'Segundos entre consultas', 0.2, 60, 0.1),
    n(BACKEND, 'timeout', 'Seconds before giving up', 'Segundos antes de rendirse', 0.2, 30, 0.1),
    n(BACKEND, 'ttl', 'Seconds a directive stays valid', 'Segundos que vale una directiva', 1, 60, 1),
    n(BACKEND, 'idleAfter', 'Seconds exploring before asking', 'Segundos explorando antes de preguntar', 1, 120, 1),
  ]},
  { titulo: { en: 'Energy and rest', es: 'Energía y descanso' }, campos: [
    n(ENERGY, 'max', 'Maximum energy', 'Energía máxima', 20, 300, 10),
    n(ENERGY, 'drain', 'Drain while walking (per second)', 'Gasto andando (por segundo)', 0, 12, 0.1),
    n(ENERGY, 'restOutside', 'Recovery resting outside', 'Recuperación parada fuera', 0, 40, 0.5),
    n(ENERGY, 'restNest', 'Recovery in the nest', 'Recuperación en el nido', 0, 60, 0.5),
    n(ENERGY, 'tired', 'Energy at which it goes to rest', 'Energía a la que va a descansar', 0, 100, 1),
    n(ENERGY, 'rested', 'Energy at which it resumes work', 'Energía con la que vuelve al trabajo', 10, 100, 1),
    n(ENERGY, 'weakSpeed', 'Speed when exhausted (fraction)', 'Velocidad sin fuerzas (fracción)', 0.1, 1, 0.05),
  ]},
  { titulo: { en: 'Brain', es: 'Cerebro' }, campos: [
    n(BRAIN, 'learnRate', 'Learning rate', 'Rapidez para aprender', 0.02, 1, 0.01),
    n(BRAIN, 'curiosityTries', 'Tries before curiosity fades', 'Pruebas antes de dejar de ser curiosa', 0, 10, 1),
    n(BRAIN, 'curiosityBonus', 'Curiosity strength', 'Fuerza de la curiosidad', 0, 3, 0.05),
    n(BRAIN, 'distanceWeight', 'Weight of distance', 'Peso de la distancia', 0, 3, 0.05),
    n(BRAIN, 'smellPenalty', 'Penalty for smelling without seeing', 'Penalización de lo que huele sin ver', 0, 2, 0.05),
    n(BRAIN, 'minScore', 'Minimum worth moving for', 'Mínimo para molestarse en ir', 0, 2, 0.02),
    n(BRAIN, 'baseInterest', 'Interest when it has no need', 'Interés cuando no lo necesita', 0, 1, 0.05),
    n(BRAIN, 'stickiness', 'How hard it is to switch target', 'Cuánto le cuesta cambiar de objetivo', 0, 2, 0.05),
  ]},
  { titulo: { en: 'Carrying and nest', es: 'Acarreo y nido' }, campos: [
    n(CARRY, 'eatBelow', 'Hunger above which it eats instead of carrying', 'Hambre a partir de la cual come en vez de cargar', 0, 100, 1),
    n(NEST, 'full', 'Stored items at which the pantry is done', 'Reservas con las que la despensa está hecha', 1, 60, 1),
    n(NEST, 'keepFactor', 'Stored food lasts × longer (then it spoils away)', 'Lo guardado dura × más (y luego se echa a perder)', 1, 50, 1),
  ]},
  { titulo: { en: 'Exploring', es: 'Exploración' }, campos: [
    n(EXPLORE, 'cell', 'Size of a cell in its mental map', 'Tamaño de casilla del mapa mental', 30, 300, 10),
    n(EXPLORE, 'fade', 'Known ground forgotten per second', 'Terreno conocido que olvida por segundo', 0, 0.2, 0.002),
    n(EXPLORE, 'distanceWeight', 'Weight of how far a cell is', 'Peso de lo lejos que queda una casilla', 0, 6, 0.1),
    n(EXPLORE, 'homeBias', 'Preference for cells away from the nest', 'Preferencia por casillas lejos del nido', 0, 3, 0.05),
    n(EXPLORE, 'giveUp', 'Seconds insisting on one cell', 'Segundos insistiendo en una casilla', 1, 60, 1),
  ]},
  { titulo: { en: 'Memory', es: 'Memoria' }, campos: [
    n(MEMORY, 'spacing', 'Gap for a repeat to count (s)', 'Hueco para que una repetición cuente (s)', 0, 120, 1),
    n(MEMORY, 'gain', 'Confidence per spaced confirmation', 'Confianza por confirmación espaciada', 0.02, 1, 0.01),
    n(MEMORY, 'massedGain', 'Worth of a back-to-back repeat', 'Cuánto vale una repetición seguida', 0, 1, 0.05),
    n(MEMORY, 'first', 'Confidence after the first time', 'Confianza tras la primera vez', 0, 1, 0.05),
    n(MEMORY, 'contradiction', 'Confidence left after a letdown', 'Confianza que queda tras un chasco', 0, 1, 0.05),
    n(MEMORY, 'toMedium', 'Confirmations for medium-term', 'Confirmaciones para memoria media', 1, 10, 1),
    n(MEMORY, 'toLong', 'Confirmations for long-term', 'Confirmaciones para memoria larga', 1, 20, 1),
    n(MEMORY, 'decayShort', 'Short-term decay per second', 'Olvido por segundo en memoria corta', 0, 0.5, 0.005),
    n(MEMORY, 'decayMedium', 'Medium-term decay per second', 'Olvido por segundo en memoria media', 0, 0.2, 0.002),
    n(MEMORY, 'decayLong', 'Long-term decay per second', 'Olvido por segundo en memoria larga', 0, 0.05, 0.0005),
    n(MEMORY, 'minConfidence', 'Confidence below which it stops trusting', 'Confianza por debajo de la cual deja de fiarse', 0, 1, 0.02),
    n(MEMORY, 'placeDrift', 'Blur gained by a place per second (px)', 'Imprecisión que gana un sitio por segundo (px)', 0, 20, 0.2),
    n(MEMORY, 'placeErrorMax', 'Maximum blur of a place (px)', 'Imprecisión máxima de un sitio (px)', 0, 800, 10),
  ]},
  { titulo: { en: 'Wind', es: 'Viento' }, campos: [
    n(WIND, 'turnRate', 'How fast it turns', 'Rapidez con la que gira', 0, 1.5, 0.01),
    n(WIND, 'swing', 'How much it changes direction', 'Cuánto cambia de dirección', 0, 3.2, 0.1),
    n(WIND, 'changeEvery.min', 'Changes at soonest every', 'Cambia como pronto cada', 1, 60, 1),
    n(WIND, 'changeEvery.max', 'Changes at latest every', 'Cambia como tarde cada', 2, 120, 1),
  ]},
  { titulo: { en: 'Scent plumes', es: 'Estelas de olor' }, campos: [
    n(PLUME, 'step', 'Length of each segment', 'Largo de cada tramo', 4, 60, 1),
    n(PLUME, 'every', 'Seconds between segments', 'Segundos entre tramos', 0.02, 1, 0.02),
    n(PLUME, 'drift', 'How much it meanders', 'Cuánto serpentea', 0, 1.5, 0.05),
    n(PLUME, 'windPull', 'How much the wind straightens it', 'Cuánto lo endereza el viento', 0, 1, 0.02),
    n(PLUME, 'radius', 'Thread width (where it can be smelled)', 'Ancho del hilo (dónde se huele)', 5, 120, 1),
    n(PLUME, 'nodesPerAroma', 'Thread length per point of aroma', 'Largo del hilo por punto de aroma', 0.1, 3, 0.05),
    n(PLUME, 'faint', 'How much it fades towards the tip', 'Cuánto se diluye hacia la punta', 0, 1, 0.05),
  ]},
  { titulo: { en: 'Own pheromone', es: 'Feromona propia' }, campos: [
    n(PHERO, 'life', 'Seconds until it evaporates', 'Segundos hasta evaporarse', 2, 300, 5),
    n(PHERO, 'every', 'Seconds between marks', 'Segundos entre marcas', 0.05, 3, 0.05),
    n(PHERO, 'sense', 'Distance at which it is detected', 'Distancia a la que la detecta', 5, 150, 1),
  ]},
  { titulo: { en: 'Water', es: 'Agua' }, campos: [
    n(WATER, 'vado', 'Shallow edge where it stands and drinks (px)', 'Vado donde hace pie y bebe (px)', 0, 40, 1),
    n(WATER, 'wadeSpeed', 'Speed in the shallows (×)', 'Velocidad en el vado (×)', 0.05, 1, 0.05),
    n(WATER, 'swimSpeed', 'Speed paddling in deep water (×)', 'Velocidad pataleando en el hondo (×)', 0.05, 1, 0.05),
    n(WATER, 'swimEffort', 'Energy spent paddling (× walking)', 'Energía al patalear (× andar)', 1, 10, 0.5),
    n(WATER, 'shock', 'Fright of losing footing (0-1)', 'Susto de perder pie (0-1)', 0, 1, 0.05),
    n(WATER, 'sample', 'Seconds in deep water for the full fright', 'Segundos en el hondo para el susto entero', 0.2, 10, 0.1),
    n(WATER, 'lesson', 'How much the fright teaches', 'Cuánto enseña el susto', 0, 1, 0.05),
    n(WATER, 'wetSpeed', 'Speed when soaked (×)', 'Velocidad empapada (×)', 0.1, 1, 0.05),
    n(WATER, 'dryTime', 'Seconds to dry off', 'Segundos en secarse', 0, 60, 1),
    n(WATER, 'probeReach', 'Antenna reach ahead (px)', 'Alcance de las antenas (px)', 0, 30, 1),
    n(WATER, 'probeSpeed', 'Speed while probing water (×)', 'Velocidad tanteando el agua (×)', 0.1, 1, 0.05),
  ]},
  { titulo: { en: 'Rain', es: 'Lluvia' }, campos: [
    n(RAIN, 'every.min', 'Min seconds between showers', 'Mín. segundos entre chaparrones', 10, 3600, 10),
    n(RAIN, 'every.max', 'Max seconds between showers', 'Máx. segundos entre chaparrones', 10, 3600, 10),
    n(RAIN, 'duration.min', 'Min shower length (s)', 'Duración mínima del chaparrón (s)', 1, 300, 1),
    n(RAIN, 'duration.max', 'Max shower length (s)', 'Duración máxima del chaparrón (s)', 1, 300, 1),
    n(RAIN, 'puddles.min', 'Min puddles per shower', 'Mín. charcos por chaparrón', 0, 20, 1),
    n(RAIN, 'puddles.max', 'Max puddles per shower', 'Máx. charcos por chaparrón', 0, 20, 1),
    n(RAIN, 'puddleRadius.0', 'Min puddle size (px)', 'Tamaño mínimo del charco (px)', 5, 80, 1),
    n(RAIN, 'puddleRadius.1', 'Max puddle size (px)', 'Tamaño máximo del charco (px)', 5, 80, 1),
    n(RAIN, 'grow', 'Puddle growth while raining (px/s)', 'Crecimiento del charco lloviendo (px/s)', 0, 2, 0.05),
    n(RAIN, 'evaporate', 'Puddle drying in the sun (px/s)', 'Secado del charco al sol (px/s)', 0, 2, 0.01),
    n(RAIN, 'washPhero', 'Rain washes pheromone (× faster)', 'La lluvia borra la feromona (× más rápido)', 1, 50, 1),
  ]},
  { titulo: { en: 'Trees', es: 'Árboles' }, campos: [
    n(TREE, 'interval', 'Fruit every (seconds)', 'Fruta cada (segundos)', 1, 120, 1),
    n(TREE, 'life', 'Tree lifespan (0 = forever)', 'Vida del árbol (0 = para siempre)', 0, 600, 10),
    n(TREE, 'maxNear', 'Uncollected fruit before it stops', 'Fruta suya sin recoger antes de parar', 1, 30, 1),
    n(TREE, 'dropRadius', 'Where fruit falls (× its radius)', 'Dónde cae la fruta (× su radio)', 1, 5, 0.1),
    n(FRUIT, 'warnFrom', 'When it starts looking overripe', 'Desde cuándo se le nota que se pasa', 0, 1, 0.05),
  ]},
  { titulo: { en: 'Map objects', es: 'Objetos del mapa' }, campos: [
    n(OBJECT_TYPES.agua, 'radius', 'Size of new water', 'Tamaño del agua nueva', 10, 200, 2),
    n(OBJECT_TYPES.agua, 'aroma', 'Water aroma', 'Aroma del agua', 0, 400, 5),
    n(OBJECT_TYPES.nido, 'radius', 'Size of new nest', 'Tamaño del nido nuevo', 10, 200, 2),
    n(OBJECT_TYPES.arbol, 'radius', 'Size of new tree', 'Tamaño del árbol nuevo', 10, 120, 2),
    n(OBJECT_TYPES.roca, 'radius', 'Size of new rock', 'Tamaño de la roca nueva', 8, 150, 2),
    n(MAPGEN, 'trees', 'Trees when generating a map', 'Árboles al generar mapa', 0, 20, 1),
    n(MAPGEN, 'treeMinNestDistance', 'Minimum tree distance from nest', 'Distancia mínima del árbol al nido', 100, 900, 10),
    n(MAPGEN, 'treeMaxNestDistance', 'Maximum tree distance from nest', 'Distancia máxima del árbol al nido', 100, 1000, 10),
    n(MAPGEN, 'rocks', 'Rocks when generating a map', 'Rocas al generar mapa', 0, 40, 1),
  ]},
  ...TYPE_KEYS.map((key) => ({
    titulo: { en: `Food · ${key}`, es: `Alimento · ${key}`, tipo: key },
    campos: camposDeAlimento(key),
  })),
];

// Cada campo necesita un nombre estable con el que guardarse: el del grupo más
// su clave. Los grupos de alimento usan el tipo, que no cambia con el idioma.
for (const grupo of GRUPOS) {
  const base = grupo.titulo.tipo ?? grupo.titulo.en;
  for (const campo of grupo.campos) campo.id = `${base}.${campo.id ?? campo.key}`;
}

// Los valores de fábrica, para poder volver atrás.
const ORIGINAL = GRUPOS.flatMap((g) => g.campos).map((c) => ({ c, valor: leer(c) }));
const POR_ID = new Map(GRUPOS.flatMap((g) => g.campos).map((c) => [c.id, c]));

function leer({ obj, key }) {
  return key.includes('.') ? key.split('.').reduce((o, k) => o[k], obj) : obj[key];
}

function escribir({ obj, key }, valor) {
  if (!key.includes('.')) { obj[key] = valor; return; }
  const partes = key.split('.');
  const ultima = partes.pop();
  partes.reduce((o, k) => o[k], obj)[ultima] = valor;
}

const acotar = ({ min, max }, v) => Math.min(max, Math.max(min, v));

// --- la configuración de una sesión ---
// Una sesión graba con qué números empezó y cada cambio que se hizo después:
// así al reproducirla el mundo se comporta (y se dibuja) con los de entonces.

// Todos los ajustes, id -> valor.
export function configSnapshot() {
  const datos = {};
  for (const [id, campo] of POR_ID) datos[id] = leer(campo);
  return datos;
}

// Aplica un id -> valor (entero o parcial). Lo que no reconoce lo ignora.
export function applyConfig(datos) {
  for (const [id, valor] of Object.entries(datos ?? {})) {
    const campo = POR_ID.get(id);
    if (campo && Number.isFinite(valor)) escribir(campo, acotar(campo, valor));
  }
  refrescar?.();
}

// El id de ajuste de un número de config.js, o null si no se expone.
export function configIdOf(obj, key) {
  for (const [id, campo] of POR_ID) if (campo.obj === obj && campo.key === key) return id;
  return null;
}

// Quien quiera enterarse de cada cambio hecho a mano (el grabador).
let alCambiar = null;
export function onConfigChange(fn) { alCambiar = fn; }

// Repinta las casillas con los valores actuales; lo pone createSettings.
let refrescar = null;

// --- guardar los ajustes entre partidas ---
// Solo se guarda lo que se tocó: así un valor de fábrica nuevo le llega a quien
// nunca cambió ese campo, en vez de quedarse congelado el de la vez anterior.
function saveSettings() {
  const datos = {};
  for (const { c, valor } of ORIGINAL) {
    const ahora = leer(c);
    if (ahora !== valor) datos[c.id] = ahora;
  }
  try {
    if (Object.keys(datos).length) localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(datos));
    else localStorage.removeItem(CLAVE_AJUSTES);
  } catch { /* sin localStorage no se guarda nada y ya está */ }
}

// Teclear en una casilla dispara un guardado por cifra: mejor esperar a que pare.
let guardadoPendiente = 0;
function guardarPronto() {
  clearTimeout(guardadoPendiente);
  guardadoPendiente = setTimeout(saveSettings, 400);
}

// Va antes de crear el mundo y a Fagi: hay números (energía máxima, tamaño del
// nido, rocas del mapa) que solo se leen al nacer, no en cada frame.
export function loadSettings() {
  try {
    const crudo = localStorage.getItem(CLAVE_AJUSTES);
    if (!crudo) return;
    for (const [id, valor] of Object.entries(JSON.parse(crudo))) {
      const campo = POR_ID.get(id);
      if (campo && Number.isFinite(valor)) escribir(campo, acotar(campo, valor));
    }
  } catch { /* guardado ilegible: se queda con los valores de fábrica */ }
}

// El título de un grupo: los de alimento llevan el nombre traducido del tipo.
function tituloDe(grupo) {
  const base = grupo.titulo[getLang()] ?? grupo.titulo.en;
  return grupo.titulo.tipo ? base.replace(grupo.titulo.tipo, labelOf(grupo.titulo.tipo)) : base;
}

export function createSettings(world, getFagi) {
  const caja = document.getElementById('settings-body');
  const overlay = document.getElementById('settings-overlay');
  let inputs = [];

  function construir() {
    caja.innerHTML = '';
    inputs = [];
    for (const grupo of GRUPOS) {
      const det = document.createElement('details');
      det.innerHTML = `<summary>${tituloDe(grupo)}</summary>`;
      for (const campo of grupo.campos) {
        const fila = document.createElement('label');
        fila.className = 'campo';
        fila.innerHTML = `<span>${campo.label[getLang()] ?? campo.label.en}</span>`;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = campo.min; input.max = campo.max; input.step = campo.step;
        input.value = leer(campo);
        input.addEventListener('input', () => {
          const v = Number(input.value);
          if (!Number.isFinite(v)) return;
          const antes = leer(campo);
          escribir(campo, v);
          if (antes !== v) alCambiar?.(campo.id, antes, v, 'user');
          guardarPronto();
        });
        fila.append(input);
        det.append(fila);
        inputs.push({ campo, input });
      }
      caja.append(det);
    }
    }

  construir();
  onLangChange(construir);
  refrescar = () => { for (const { campo, input } of inputs) input.value = leer(campo); };

  document.getElementById('btn-settings').addEventListener('click', () => { overlay.hidden = false; });
  document.getElementById('btn-settings-close').addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });

  document.getElementById('btn-settings-reset').addEventListener('click', () => {
    for (const { c, valor } of ORIGINAL) {
      const antes = leer(c);
      escribir(c, valor);
      if (antes !== valor) alCambiar?.(c.id, antes, valor, 'reset');
    }
    for (const { campo, input } of inputs) input.value = leer(campo);
    saveSettings();   // todo de fábrica: borra el guardado
  });

  document.getElementById('btn-clear-trees').addEventListener('click', () => removeAllTrees(world));
  document.getElementById('btn-rain-now').addEventListener('click', () => startRain(world));
  document.getElementById('btn-wipe-memory').addEventListener('click', () => wipe(getFagi()));
}
