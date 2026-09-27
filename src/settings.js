// Settings dialog: edits the config.js objects on the fly.
//
// The whole game reads its numbers from those objects every frame, so changing
// a value here shows up instantly, without restarting. The schema below is the
// only list you need to touch to expose a new parameter.

import {
  FAGI, HUNGER, THIRST, ENERGY, BRAIN, CARRY, NEST, EXPLORE, WIND, PLUME, PHERO, TREE, FRUIT, MEMORY,
  MAPGEN, POINT_TYPES, OBJECT_TYPES, TYPE_KEYS, FEEL, LEARN, CUES, BACKEND, RAIN, WATER, INSTINCT,
} from './config.js';
import { startRain } from './rain.js';
import { removeAllTrees } from './trees.js';
import { wipe } from './learned/store.js';
import { t, labelOf, getLang, onLangChange } from './i18n.js';

const SETTINGS_KEY = 'fagi.settings';

// Each field carries its text in both languages: en, es.
const n = (obj, key, en, es, min, max, step) => ({ obj, key, label: { en, es }, min, max, step });

function foodFields(key) {
  const spec = POINT_TYPES[key];
  // What's rotten doesn't rot again: its life is how long it takes to vanish.
  const lifeAt = key === FRUIT.rot ? 'Life before vanishing (0 = never)' : 'Life before rotting (0 = never)';
  const lifeIs = key === FRUIT.rot ? 'Vida antes de desaparecer (0 = nunca)' : 'Vida antes de pudrirse (0 = nunca)';
  const fieldsOf = [
    n(spec, 'hunger', 'Hunger it removes (negative) or adds', 'Hambre que quita (negativo) o suma', -80, 80, 1),
    n(spec, 'aroma', 'Aroma: length of its plume', 'Aroma: largo de su estela', 0, 400, 5),
    n(spec, 'life', lifeAt, lifeIs, 0, 300, 5),
    n(spec, 'radius', 'Size of the dot', 'Tamaño del punto', 2, 20, 1),
  ];
  spec.effects.forEach((e, i) => {
    // The id carries the effect's number: two effects of the same food share a key.
    fieldsOf.push({ ...n(e, 'mult', `Effect ${i + 1} · ${e.stat} ×`, `Efecto ${i + 1} · ${e.stat} ×`, 0.1, 4, 0.05), id: `effect${i}.mult` });
    fieldsOf.push({ ...n(e, 'sec', `Effect ${i + 1} · ${e.stat} lasts`, `Efecto ${i + 1} · ${e.stat} dura`, 0, 60, 1), id: `effect${i}.sec` });
  });
  return fieldsOf;
}

const GROUPS = [
  { title: { en: 'Fagi', es: 'Fagi' }, fieldsOf: [
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
  { title: { en: 'Hunger', es: 'Hambre' }, fieldsOf: [
    n(HUNGER, 'rate', 'Hunger per second', 'Hambre por segundo', 0, 12, 0.1),
    n(HUNGER, 'max', 'Hunger that kills', 'Hambre que mata', 20, 300, 10),
  ]},
  { title: { en: 'Thirst', es: 'Sed' }, fieldsOf: [
    n(THIRST, 'rate', 'Thirst per second', 'Sed por segundo', 0, 12, 0.1),
    n(THIRST, 'max', 'Thirst that kills', 'Sed que mata', 20, 300, 10),
    n(THIRST, 'drinkRate', 'Thirst removed by drinking (per second)', 'Sed que quita bebiendo (por segundo)', 1, 100, 1),
    n(THIRST, 'ignoreBelow', 'Thirst below which it ignores water', 'Sed por debajo de la cual ignora el agua', 0, 1, 0.05),
  ]},
  { title: { en: 'Body (what it feels)', es: 'Cuerpo (lo que siente)' }, fieldsOf: [
    n(FEEL, 'hungerScale', 'Hunger points worth a full sensation', 'Puntos de hambre que valen una sensación entera', 5, 100, 1),
    n(FEEL, 'thirstScale', 'Thirst points worth a full sensation', 'Puntos de sed que valen una sensación entera', 5, 150, 1),
    n(FEEL, 'effectWeight', 'Weight of a stat change vs hunger', 'Peso de un cambio de stat frente al hambre', 0, 2, 0.05),
    n(FEEL, 'window', 'Seconds it keeps watching after a bite', 'Segundos que vigila tras un bocado', 0, 60, 1),
    n(FEEL, 'perilWeight', 'Penalty when a need turns critical after it', 'Castigo si la necesidad se dispara después', 0, 1, 0.05),
    n(FEEL, 'deathPenalty', 'Penalty for dying with a recent bite', 'Castigo por morir con un bocado reciente', 0, 1, 0.05),
    n(FEEL, 'drinkSample', 'Seconds drinking before judging water', 'Segundos bebiendo antes de juzgar el agua', 0.2, 10, 0.1),
  ]},
  { title: { en: 'Learning (written rules)', es: 'Aprendizaje (reglas escritas)' }, fieldsOf: [
    n(LEARN, 'avoidFrom', 'Belief weight that writes "avoid X"', 'Peso de creencia que escribe "evitar X"', 0.02, 1, 0.02),
    n(LEARN, 'avoidUntil', 'Weight below which "avoid X" is retired', 'Peso por debajo del cual retira "evitar X"', 0, 1, 0.02),
    n(LEARN, 'preferFrom', 'Belief weight that writes "prefer X"', 'Peso de creencia que escribe "preferir X"', 0.02, 1, 0.02),
    n(LEARN, 'preferUntil', 'Weight below which "prefer X" is retired', 'Peso por debajo del cual retira "preferir X"', 0, 1, 0.02),
    n(CUES, 'enabled', 'Learn from traits (1 = yes)', 'Aprender de los rasgos (1 = sí)', 0, 1, 1),
    n(CUES, 'rate', 'How fast a trait learns', 'Qué tan rápido aprende un rasgo', 0.02, 1, 0.02),
    n(CUES, 'wary', 'Predicted harm that kills curiosity', 'Daño previsto que apaga la curiosidad', 0.05, 1, 0.05),
    n(CUES, 'induce', 'Trait rules: 0 by weight, 1 induced, 2 both', 'Reglas de rasgos: 0 por peso, 1 inducidas, 2 ambas', 0, 2, 1),
    n(CUES, 'induceMin', 'Species that must agree to generalize', 'Especies que deben coincidir para generalizar', 2, 6, 1),
    n(CUES, 'ruleEvidence', 'Experiences before a one-trait rule', 'Experiencias antes de una regla de un rasgo', 1, 10, 1),
    n(LEARN, 'autosave', 'Keep a recoverable copy (1 = yes)', 'Guardar copia recuperable (1 = sí)', 0, 1, 1),
    n(LEARN, 'autosaveEvery', 'Seconds between copies', 'Segundos entre copias', 1, 120, 1),
  ]},
  { title: { en: 'External decision API', es: 'API de decisión externa' }, fieldsOf: [
    n(BACKEND, 'enabled', 'Ask the API (1 = yes)', 'Consultar la API (1 = sí)', 0, 1, 1),
    n(BACKEND, 'authority', 'Authority: 0 safe, 1 full', 'Autoridad: 0 segura, 1 plena', 0, 1, 1),
    n(BACKEND, 'minInterval', 'Seconds between queries', 'Segundos entre consultas', 0.2, 60, 0.1),
    n(BACKEND, 'timeout', 'Seconds before giving up', 'Segundos antes de rendirse', 0.2, 30, 0.1),
    n(BACKEND, 'ttl', 'Seconds a directive stays valid', 'Segundos que vale una directiva', 1, 60, 1),
    n(BACKEND, 'idleAfter', 'Seconds exploring before asking', 'Segundos explorando antes de preguntar', 1, 120, 1),
  ]},
  { title: { en: 'Energy and rest', es: 'Energía y descanso' }, fieldsOf: [
    n(ENERGY, 'max', 'Maximum energy', 'Energía máxima', 20, 300, 10),
    n(ENERGY, 'drain', 'Drain while walking (per second)', 'Gasto andando (por segundo)', 0, 12, 0.1),
    n(ENERGY, 'restOutside', 'Recovery resting outside', 'Recuperación parada fuera', 0, 40, 0.5),
    n(ENERGY, 'restNest', 'Recovery in the nest', 'Recuperación en el nido', 0, 60, 0.5),
    n(ENERGY, 'tired', 'Energy at which it goes to rest', 'Energía a la que va a descansar', 0, 100, 1),
    n(ENERGY, 'rested', 'Energy at which it resumes work', 'Energía con la que vuelve al trabajo', 10, 100, 1),
    n(ENERGY, 'weakSpeed', 'Speed when exhausted (fraction)', 'Velocidad sin fuerzas (fracción)', 0.1, 1, 0.05),
  ]},
  { title: { en: 'Brain', es: 'Cerebro' }, fieldsOf: [
    n(BRAIN, 'learnRate', 'Learning rate', 'Rapidez para aprender', 0.02, 1, 0.01),
    n(BRAIN, 'curiosityTries', 'Tries before curiosity fades', 'Pruebas antes de dejar de ser curiosa', 0, 10, 1),
    n(BRAIN, 'curiosityBonus', 'Curiosity strength', 'Fuerza de la curiosidad', 0, 3, 0.05),
    n(BRAIN, 'distanceWeight', 'Weight of distance', 'Peso de la distancia', 0, 3, 0.05),
    n(BRAIN, 'smellPenalty', 'Penalty for smelling without seeing', 'Penalización de lo que huele sin ver', 0, 2, 0.05),
    n(BRAIN, 'minScore', 'Minimum worth moving for', 'Mínimo para molestarse en ir', 0, 2, 0.02),
    n(BRAIN, 'baseInterest', 'Interest when it has no need', 'Interés cuando no lo necesita', 0, 1, 0.05),
    n(BRAIN, 'stickiness', 'How hard it is to switch target', 'Cuánto le cuesta cambiar de objetivo', 0, 2, 0.05),
  ]},
  { title: { en: 'Carrying and nest', es: 'Acarreo y nido' }, fieldsOf: [
    n(CARRY, 'eatBelow', 'Hunger above which it eats instead of carrying', 'Hambre a partir de la cual come en vez de cargar', 0, 100, 1),
    n(NEST, 'full', 'Stored items at which the pantry is done', 'Reservas con las que la despensa está hecha', 1, 60, 1),
    n(NEST, 'keepFactor', 'Stored food lasts × longer (then it spoils away)', 'Lo guardado dura × más (y luego se echa a perder)', 1, 50, 1),
    n(NEST, 'restHunger', 'Hunger while sleeping in the nest (×)', 'Hambre durmiendo en el nido (×)', 0, 1, 0.05),
    n(NEST, 'restThirst', 'Thirst while sleeping in the nest (×)', 'Sed durmiendo en el nido (×)', 0, 1, 0.05),
  ]},
  { title: { en: 'Exploring', es: 'Exploración' }, fieldsOf: [
    n(EXPLORE, 'cell', 'Size of a cell in its mental map', 'Tamaño de casilla del mapa mental', 30, 300, 10),
    n(EXPLORE, 'fade', 'Known ground forgotten per second', 'Terreno conocido que olvida por segundo', 0, 0.2, 0.002),
    n(EXPLORE, 'distanceWeight', 'Weight of how far a cell is', 'Peso de lo lejos que queda una casilla', 0, 6, 0.1),
    n(EXPLORE, 'homeBias', 'Preference for cells away from the nest', 'Preferencia por casillas lejos del nido', 0, 3, 0.05),
    n(EXPLORE, 'giveUp', 'Seconds insisting on one cell', 'Segundos insistiendo en una casilla', 1, 60, 1),
  ]},
  { title: { en: 'Memory', es: 'Memoria' }, fieldsOf: [
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
  { title: { en: 'Wind', es: 'Viento' }, fieldsOf: [
    n(WIND, 'turnRate', 'How fast it turns', 'Rapidez con la que gira', 0, 1.5, 0.01),
    n(WIND, 'swing', 'How much it changes direction', 'Cuánto cambia de dirección', 0, 3.2, 0.1),
    n(WIND, 'changeEvery.min', 'Changes at soonest every', 'Cambia como pronto cada', 1, 60, 1),
    n(WIND, 'changeEvery.max', 'Changes at latest every', 'Cambia como tarde cada', 2, 120, 1),
  ]},
  { title: { en: 'Scent plumes', es: 'Estelas de olor' }, fieldsOf: [
    n(PLUME, 'step', 'Length of each segment', 'Largo de cada tramo', 4, 60, 1),
    n(PLUME, 'every', 'Seconds between segments', 'Segundos entre tramos', 0.02, 1, 0.02),
    n(PLUME, 'drift', 'How much it meanders', 'Cuánto serpentea', 0, 1.5, 0.05),
    n(PLUME, 'windPull', 'How much the wind straightens it', 'Cuánto lo endereza el viento', 0, 1, 0.02),
    n(PLUME, 'radius', 'Thread width (where it can be smelled)', 'Ancho del hilo (dónde se huele)', 5, 120, 1),
    n(PLUME, 'nodesPerAroma', 'Thread length per point of aroma', 'Largo del hilo por punto de aroma', 0.1, 3, 0.05),
    n(PLUME, 'faint', 'How much it fades towards the tip', 'Cuánto se diluye hacia la punta', 0, 1, 0.05),
  ]},
  { title: { en: 'Own pheromone', es: 'Feromona propia' }, fieldsOf: [
    n(PHERO, 'life', 'Seconds until it evaporates', 'Segundos hasta evaporarse', 2, 300, 5),
    n(PHERO, 'every', 'Seconds between marks', 'Segundos entre marcas', 0.05, 3, 0.05),
    n(PHERO, 'sense', 'Distance at which it is detected', 'Distancia a la que la detecta', 5, 150, 1),
  ]},
  { title: { en: 'Water', es: 'Agua' }, fieldsOf: [
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
  { title: { en: 'Rain', es: 'Lluvia' }, fieldsOf: [
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
    n(RAIN, 'washPhero', 'Rain washes pheromone (× faster)', 'La lluvia borra la feromona (× más rápido)', 1, 200, 1),
    n(RAIN, 'washScent', 'Rain washes a scent trail (s)', 'La lluvia lava un rastro de olor (s)', 1, 60, 1),
    n(RAIN, 'front.min', 'Min seconds the pressure drops before rain', 'Mín. segundos que baja la presión antes de llover', 0, 300, 5),
    n(RAIN, 'front.max', 'Max seconds the pressure drops before rain', 'Máx. segundos que baja la presión antes de llover', 0, 300, 5),
    n(RAIN, 'recover', 'Seconds for the pressure to recover', 'Segundos en recuperarse la presión', 1, 300, 5),
    n(RAIN, 'effort', 'Energy spent out in the rain (× walking)', 'Energía a la intemperie bajo la lluvia (× andar)', 1, 5, 0.1),
    n(RAIN, 'sample', 'Seconds out in the rain per lesson', 'Segundos bajo la lluvia por lección', 0.5, 30, 0.5),
    n(RAIN, 'lesson', 'How much getting rained on teaches', 'Cuánto enseña mojarse', 0, 1, 0.05),
    n(RAIN, 'puddleLesson', 'How much a puddle teaches (dry or not)', 'Cuánto enseña un charco (seco o no)', 0, 1, 0.05),
  ]},
  { title: { en: 'Instincts', es: 'Instintos' }, fieldsOf: [
    n(INSTINCT, 'rainShelter', 'Innate urge to shelter from rain', 'Ganas innatas de refugiarse de la lluvia', 0, 1, 0.05),
    n(INSTINCT, 'pressureSense', 'Sensitivity to air pressure (0 = none)', 'Sensibilidad a la presión del aire (0 = ninguna)', 0, 2, 0.1),
    n(INSTINCT, 'pressureMin', 'Smallest pressure drop it notices', 'Bajada de presión mínima que nota', 0, 1, 0.05),
    n(INSTINCT, 'pressureHaste', 'Hurry when pressure drops (× speed)', 'Prisa al bajar la presión (× velocidad)', 0, 1, 0.05),
    n(INSTINCT, 'pressureShelter', 'Innate urge to go home when pressure drops', 'Ganas innatas de volver al nido si baja la presión', 0, 1, 0.05),
  ]},
  { title: { en: 'Trees', es: 'Árboles' }, fieldsOf: [
    n(TREE, 'interval', 'Fruit every (seconds)', 'Fruta cada (segundos)', 1, 120, 1),
    n(TREE, 'life', 'Tree lifespan (0 = forever)', 'Vida del árbol (0 = para siempre)', 0, 600, 10),
    n(TREE, 'maxNear', 'Uncollected fruit before it stops', 'Fruta suya sin recoger antes de parar', 1, 30, 1),
    n(TREE, 'dropRadius', 'Where fruit falls (× its radius)', 'Dónde cae la fruta (× su radio)', 1, 5, 0.1),
    n(FRUIT, 'warnFrom', 'When it starts looking overripe', 'Desde cuándo se le nota que se pasa', 0, 1, 0.05),
  ]},
  { title: { en: 'Map objects', es: 'Objetos del mapa' }, fieldsOf: [
    n(OBJECT_TYPES.water, 'radius', 'Size of new water', 'Tamaño del agua nueva', 10, 200, 2),
    n(OBJECT_TYPES.water, 'aroma', 'Water aroma', 'Aroma del agua', 0, 400, 5),
    n(OBJECT_TYPES.nest, 'radius', 'Size of new nest', 'Tamaño del nido nuevo', 10, 200, 2),
    n(OBJECT_TYPES.tree, 'radius', 'Size of new tree', 'Tamaño del árbol nuevo', 10, 120, 2),
    n(OBJECT_TYPES.rock, 'radius', 'Size of new rock', 'Tamaño de la roca nueva', 8, 150, 2),
    n(MAPGEN, 'trees', 'Trees when generating a map', 'Árboles al generar mapa', 0, 20, 1),
    n(MAPGEN, 'species', 'Wild species with hidden chemistry (0 = classic map)', 'Especies silvestres con química oculta (0 = mapa clásico)', 0, 12, 1),
    n(MAPGEN, 'treeMinNestDistance', 'Minimum tree distance from nest', 'Distancia mínima del árbol al nido', 100, 900, 10),
    n(MAPGEN, 'treeMaxNestDistance', 'Maximum tree distance from nest', 'Distancia máxima del árbol al nido', 100, 1000, 10),
    n(MAPGEN, 'rocks', 'Rocks when generating a map', 'Rocas al generar mapa', 0, 40, 1),
  ]},
  ...TYPE_KEYS.map((key) => ({
    title: { en: `Food · ${key}`, es: `Alimento · ${key}`, type: key },
    fieldsOf: foodFields(key),
  })),
];

// Each field needs a stable name to be saved under: the group's plus its
// key. Food groups use the type, which doesn't change with the language.
for (const group of GROUPS) {
  const base = group.title.type ?? group.title.en;
  for (const field of group.fieldsOf) field.id = `${base}.${field.id ?? field.key}`;
}

// The factory values, to be able to go back.
const ORIGINAL = GROUPS.flatMap((g) => g.fieldsOf).map((c) => ({ c, value: read(c) }));
const BY_ID = new Map(GROUPS.flatMap((g) => g.fieldsOf).map((c) => [c.id, c]));

function read({ obj, key }) {
  return key.includes('.') ? key.split('.').reduce((o, k) => o[k], obj) : obj[key];
}

function write({ obj, key }, value) {
  if (!key.includes('.')) { obj[key] = value; return; }
  const parts = key.split('.');
  const lastOne = parts.pop();
  parts.reduce((o, k) => o[k], obj)[lastOne] = value;
}

const bound = ({ min, max }, v) => Math.min(max, Math.max(min, v));

// --- a session's configuration ---
// A session records which numbers it started with and every change made after:
// that way, when replayed, the world behaves (and draws) with the ones from then.

// All the settings, id -> value.
export function configSnapshot() {
  const data = {};
  for (const [id, field] of BY_ID) data[id] = read(field);
  return data;
}

// Applies an id -> value map (full or partial). Whatever it doesn't recognize it ignores.
export function applyConfig(data) {
  for (const [id, value] of Object.entries(data ?? {})) {
    const field = BY_ID.get(id);
    if (field && Number.isFinite(value)) write(field, bound(field, value));
  }
  refresh?.();
}

// The setting id of a config.js number, or null if it isn't exposed.
export function configIdOf(obj, key) {
  for (const [id, field] of BY_ID) if (field.obj === obj && field.key === key) return id;
  return null;
}

// Whoever wants to hear about every change made by hand (the recorder).
let onChange = null;
export function onConfigChange(fn) { onChange = fn; }

// Repaints the fields with the current values; set by createSettings.
let refresh = null;

// --- saving the settings between games ---
// Only what was touched is saved: that way a new factory value reaches whoever
// never changed that field, instead of the previous one staying frozen.
function saveSettings() {
  const data = {};
  for (const { c, value } of ORIGINAL) {
    const now = read(c);
    if (now !== value) data[c.id] = now;
  }
  try {
    if (Object.keys(data).length) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    else localStorage.removeItem(SETTINGS_KEY);
  } catch { /* without localStorage nothing is saved and that's it */ }
}

// Typing in a field triggers a save per digit: better to wait until it stops.
let savedPending = 0;
function saveSoon() {
  clearTimeout(savedPending);
  savedPending = setTimeout(saveSettings, 400);
}

// Runs before creating the world and Fagi: some numbers (max energy, nest
// size, map rocks) are only read at birth, not every frame.
export function loadSettings() {
  try {
    const rawValue = localStorage.getItem(SETTINGS_KEY);
    if (!rawValue) return;
    for (const [id, value] of Object.entries(JSON.parse(rawValue))) {
      const field = BY_ID.get(id);
      if (field && Number.isFinite(value)) write(field, bound(field, value));
    }
  } catch { /* unreadable save: keeps the factory values */ }
}

// A group's title: food groups carry the type's translated name.
function titleOf(group) {
  const base = group.title[getLang()] ?? group.title.en;
  return group.title.type ? base.replace(group.title.type, labelOf(group.title.type)) : base;
}

export function createSettings(world, getFagi) {
  const box = document.getElementById('settings-body');
  const overlay = document.getElementById('settings-overlay');
  let inputs = [];

  function build() {
    box.innerHTML = '';
    inputs = [];
    for (const group of GROUPS) {
      const det = document.createElement('details');
      det.innerHTML = `<summary>${titleOf(group)}</summary>`;
      for (const field of group.fieldsOf) {
        const row = document.createElement('label');
        row.className = 'field';
        row.innerHTML = `<span>${field.label[getLang()] ?? field.label.en}</span>`;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = field.min; input.max = field.max; input.step = field.step;
        input.value = read(field);
        input.inputMode = 'decimal';
        input.addEventListener('input', () => {
          // Empty field (being cleared to type another number): it's not 0.
          if (input.value.trim() === '') return;
          const v = bound(field, Number(input.value));
          if (!Number.isFinite(v)) return;
          const before = read(field);
          write(field, v);
          if (before !== v) onChange?.(field.id, before, v, 'user');
          saveSoon();
        });
        // On leaving the field it shows what really stuck (clamped, or the
        // previous one if left empty).
        input.addEventListener('change', () => { input.value = read(field); });
        row.append(input);
        det.append(row);
        inputs.push({ field, input });
      }
      box.append(det);
    }
    }

  build();
  onLangChange(build);
  refresh = () => { for (const { field, input } of inputs) input.value = read(field); };

  document.getElementById('btn-settings').addEventListener('click', () => { overlay.hidden = false; });
  document.getElementById('btn-settings-close').addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });

  document.getElementById('btn-settings-reset').addEventListener('click', () => {
    for (const { c, value } of ORIGINAL) {
      const before = read(c);
      write(c, value);
      if (before !== value) onChange?.(c.id, before, value, 'reset');
    }
    for (const { field, input } of inputs) input.value = read(field);
    saveSettings();   // all factory: deletes the save
  });

  document.getElementById('btn-clear-trees').addEventListener('click', () => removeAllTrees(world));
  document.getElementById('btn-rain-now').addEventListener('click', () => startRain(world));
  document.getElementById('btn-wipe-memory').addEventListener('click', () => wipe(getFagi()));
}
