// Settings dialog: edits the config.js objects on the fly.
//
// The whole game reads its numbers from those objects every frame, so changing
// a value here shows up instantly, without restarting. The schema below is the
// only list you need to touch to expose a new parameter.

import {
  FAGI, HUNGER, THIRST, ENERGY, BRAIN, CARRY, NEST, EXPLORE, WIND, PLUME, PHERO, TREE, FRUIT, MEMORY,
  MAPGEN, POINT_TYPES, OBJECT_TYPES, TYPE_KEYS, FEEL, LEARN, CUES, BACKEND, RAIN, WATER, INSTINCT, SOCIAL,
  CYCLE, THERMAL, SEX, SLEEP, EXPERIMENT, APPETITE, PERCEPT, NIGHTAI, CONCEPT,
  LIFE, HEALTH, TASTE, SOURCES, GEN, HABITS, NEEDS, FORAGE, SITES,
} from './config.js';
import { ORGANISM } from './organism.js';
import { startRain } from './rain.js';
import { removeAllTrees } from './trees.js';
import { wipe } from './learned/store.js';
import { t, labelOf, getLang, onLangChange } from './i18n.js';
import { makeSlider, makeChoice } from './controls.js';

const SETTINGS_KEY = 'fagi.settings';

// Each field carries its text in both languages: en, es.
const n = (obj, key, en, es, min, max, step) => ({ obj, key, label: { en, es }, min, max, step });
// An on/off setting: kept as 1 / 0 like the rest, shown as a switch.
const b = (obj, key, en, es) => ({ ...n(obj, key, en, es, 0, 1, 1), toggle: true });
// A setting with a few named values 0, 1, 2...: shown as a segmented choice.
// `options`: [[en, es], ...] in value order.
const c = (obj, key, en, es, options) => ({
  ...n(obj, key, en, es, 0, options.length - 1, 1),
  choices: options.map(([oen, oes]) => ({ en: oen, es: oes })),
});

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
  { title: { en: 'Fagi', es: 'Fagi', show: { en: 'Senses and movement', es: 'Sentidos y movimiento' } }, cat: 'body', fieldsOf: [
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
  // The organism (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md). One group per
  // block: their ids ('Day and night.enabled'...) are what a recording keeps.
  { title: { en: 'Day and night', es: 'Día y noche' }, cat: 'world', fieldsOf: [
    b(CYCLE, 'enabled', 'Day and night', 'Día y noche'),
    n(CYCLE, 'seconds', 'Seconds in a day', 'Segundos que dura un día', 30, 1800, 10),
    n(CYCLE, 'start', 'Hour the session starts (0 midnight, 0.5 noon)', 'Hora a la que empieza (0 medianoche, 0.5 mediodía)', 0, 0.99, 0.01),
    n(CYCLE, 'minLight', 'Light at night', 'Luz de noche', 0, 1, 0.02),
    n(CYCLE, 'nightSight', 'Sight left at night (fraction)', 'Vista que le queda de noche (fracción)', 0.1, 1, 0.05),
    n(CYCLE, 'dawn', 'Dawn (phase of the day, 0-1)', 'Amanecer (fase del día, 0-1)', 0.05, 0.45, 0.01),
    n(CYCLE, 'dusk', 'Dusk (phase of the day, 0-1)', 'Anochecer (fase del día, 0-1)', 0.55, 0.95, 0.01),
    n(CYCLE, 'mean', 'Average air temperature (°C)', 'Temperatura media del aire (°C)', -10, 45, 1),
    n(CYCLE, 'swing', 'Swing between day and night (± °C)', 'Oscilación entre día y noche (± °C)', 0, 30, 1),
  ]},
  { title: { en: 'Body temperature', es: 'Temperatura corporal' }, cat: 'body', fieldsOf: [
    b(THERMAL, 'enabled', 'Body temperature', 'Temperatura corporal'),
    n(THERMAL, 'safeMin', 'Cold below (°C)', 'Frío por debajo de (°C)', -10, 30, 1),
    n(THERMAL, 'safeMax', 'Heat above (°C)', 'Calor por encima de (°C)', 20, 50, 1),
    n(THERMAL, 'exchange', 'How fast the body follows the air', 'Rapidez con que el cuerpo sigue al aire', 0.005, 0.5, 0.005),
    n(THERMAL, 'stressRate', 'Stress per second per °C out of range', 'Estrés por segundo y °C fuera de rango', 0, 5, 0.05),
    n(THERMAL, 'recover', 'Stress recovered per second in range', 'Estrés que recupera por segundo en rango', 0, 20, 0.5),
    n(THERMAL, 'nestTemp', 'Temperature deep in the nest (°C)', 'Temperatura dentro del nido (°C)', 0, 40, 1),
    n(THERMAL, 'shade', 'Cooler under a tree crown (°C)', 'Más fresco bajo la copa de un árbol (°C)', 0, 15, 0.5),
    n(THERMAL, 'voluntaryMax', 'Body °C from which she runs from the heat', '°C del cuerpo desde los que huye del calor', 30, 45, 0.5),
    n(THERMAL, 'voluntaryMin', 'Body °C under which she runs from the cold', '°C del cuerpo bajo los que huye del frío', 0, 20, 0.5),
    n(THERMAL, 'reflex', 'Stress (fraction) that sends her home no matter what', 'Estrés (fracción) que la manda al nido pase lo que pase', 0.1, 1, 0.05),
    b(THERMAL, 'behave', 'Acts on the cold and heat', 'Actúa frente al frío y el calor'),
  ]},
  { title: { en: 'Sex', es: 'Sexo' }, cat: 'body', fieldsOf: [
    b(SEX, 'enabled', 'Sexes with different bodies (new sessions)', 'Sexos con cuerpos distintos (sesiones nuevas)'),
  ]},
  { title: { en: 'Sleep', es: 'Sueño' }, cat: 'body', fieldsOf: [
    b(SLEEP, 'enabled', 'Sleep', 'Sueño'),
    b(SLEEP, 'nightly', 'Diurnal: sleeps the whole night', 'Diurna: duerme toda la noche'),
    n(SLEEP, 'rise', 'Sleepiness per second awake', 'Sueño que acumula por segundo despierta', 0, 0.1, 0.001),
    n(SLEEP, 'nightRise', 'Sleepiness builds × faster in the dark', 'El sueño sube × más rápido a oscuras', 1, 5, 0.1),
    n(SLEEP, 'fall', 'Sleepiness lost per second asleep in the nest', 'Sueño que pierde por segundo dormida en el nido', 0, 0.2, 0.005),
    n(SLEEP, 'fallOutside', 'Sleepiness lost per second asleep outside', 'Sueño que pierde por segundo dormida fuera', 0, 0.2, 0.002),
    n(SLEEP, 'drowsy', 'Sleepiness at which she goes to sleep at night', 'Sueño con el que se va a dormir de noche', 0.05, 1, 0.05),
    n(SLEEP, 'exhausted', 'Sleepiness at which she sleeps anywhere, day or night', 'Sueño con el que duerme donde sea, de día o de noche', 0.1, 1, 0.05),
    n(SLEEP, 'wake', 'Sleepiness under which she wakes (not diurnal)', 'Sueño bajo el cual despierta (no diurna)', 0, 0.5, 0.01),
    n(SLEEP, 'minSleep', 'Seconds asleep before sorting the day', 'Segundos dormida antes de ordenar el día', 0, 120, 1),
    b(SLEEP, 'consolidate', 'Sort the day while asleep', 'Ordenar el día al dormir'),
    n(SLEEP, 'boost', 'Confidence a replayed belief gains', 'Confianza que gana una creencia repasada', 0, 1, 0.05),
    n(SLEEP, 'replay', 'Rounds of replay of the remembered fruit', 'Rondas de repaso de la fruta recordada', 0, 20, 1),
  ]},
  { title: { en: 'Night mind', es: 'Mente nocturna' }, cat: 'mind', fieldsOf: [
    b(NIGHTAI, 'enabled', 'A model proposes hypotheses at night', 'Un modelo propone hipótesis de noche'),
    n(NIGHTAI, 'minSupport', 'Fruit she tasted that must back a proposal', 'Frutas probadas que deben respaldar una propuesta', 1, 6, 1),
    n(NIGHTAI, 'trust', 'Trust in a kept proposal', 'Confianza en una propuesta aceptada', 0.1, 1, 0.05),
  ]},
  { title: { en: 'Perception', es: 'Percepción' }, cat: 'mind', fieldsOf: [
    b(PERCEPT, 'enabled', 'By smell alone she knows only the smell', 'Por el olor solo conoce el olor'),
  ]},
  { title: { en: 'Things and concepts', es: 'Cosas y conceptos' }, cat: 'mind', fieldsOf: [
    b(CONCEPT, 'enabled', 'Things with no inborn category on the map (new sessions)', 'Cosas sin categoría innata en el mapa (sesiones nuevas)'),
    b(CONCEPT, 'generalize', 'Groups what she learns into concepts', 'Agrupa lo que aprende en conceptos'),
    n(CONCEPT, 'things', 'Things on the map (new sessions)', 'Cosas en el mapa (sesiones nuevas)', 0, 60, 1),
    n(CONCEPT, 'kinds', 'Different looks (new sessions)', 'Aspectos distintos (sesiones nuevas)', 1, 30, 1),
    n(CONCEPT, 'sap', 'Thirst a nibble of sap takes away', 'Sed que quita un mordisco de savia', 0, 100, 1),
    n(CONCEPT, 'sapRegrow', 'Seconds for sap to come back', 'Segundos en volver la savia', 0, 300, 5),
    n(CONCEPT, 'sting', 'Energy a sting costs', 'Energía que cuesta un pinchazo', 0, 60, 1),
  ]},
  { title: { en: 'Appetite', es: 'Apetito' }, cat: 'body', fieldsOf: [
    b(APPETITE, 'enabled', 'Bites take time and a bad one puts her off food', 'Comer lleva tiempo y un mal bocado le quita el apetito'),
    n(APPETITE, 'handling', 'Seconds between bites', 'Segundos entre bocados', 0, 20, 0.5),
    n(APPETITE, 'malaise', 'Seconds of malaise after a bad bite', 'Segundos de malestar tras un mal bocado', 0, 300, 5),
    n(APPETITE, 'searchWater', 'Thirst from which she looks for unknown water', 'Sed desde la que busca agua que no conoce', 0, 1, 0.05),
  ]},
  { title: { en: 'Experiments', es: 'Experimentos' }, cat: 'mind', fieldsOf: [
    b(EXPERIMENT, 'enabled', 'Tries what the night asked', 'Prueba lo que se preguntó de noche'),
    n(EXPERIMENT, 'portion', 'Size of a trial bite (share of a fruit)', 'Tamaño del mordisco de prueba (fracción de fruta)', 0.05, 1, 0.05),
    n(EXPERIMENT, 'maxWary', 'Wariness above which she does not try', 'Cautela por encima de la cual no prueba', 0, 1, 0.05),
  ]},
  { title: { en: 'Hunger', es: 'Hambre' }, cat: 'body', fieldsOf: [
    n(HUNGER, 'rate', 'Hunger per second', 'Hambre por segundo', 0, 12, 0.1),
    n(HUNGER, 'max', 'Hunger that kills', 'Hambre que mata', 20, 300, 10),
  ]},
  { title: { en: 'Thirst', es: 'Sed' }, cat: 'body', fieldsOf: [
    n(THIRST, 'rate', 'Thirst per second', 'Sed por segundo', 0, 12, 0.1),
    n(THIRST, 'max', 'Thirst that kills', 'Sed que mata', 20, 300, 10),
    n(THIRST, 'drinkRate', 'Thirst removed by drinking (per second)', 'Sed que quita bebiendo (por segundo)', 1, 100, 1),
    n(THIRST, 'ignoreBelow', 'Thirst below which it ignores water', 'Sed por debajo de la cual ignora el agua', 0, 1, 0.05),
  ]},
  { title: { en: 'Body (what it feels)', es: 'Cuerpo (lo que siente)' }, cat: 'mind', fieldsOf: [
    n(FEEL, 'hungerScale', 'Hunger points worth a full sensation', 'Puntos de hambre que valen una sensación entera', 5, 100, 1),
    n(FEEL, 'thirstScale', 'Thirst points worth a full sensation', 'Puntos de sed que valen una sensación entera', 5, 150, 1),
    n(FEEL, 'effectWeight', 'Weight of a stat change vs hunger', 'Peso de un cambio de stat frente al hambre', 0, 2, 0.05),
    n(FEEL, 'window', 'Seconds it keeps watching after a bite', 'Segundos que vigila tras un bocado', 0, 60, 1),
    n(FEEL, 'perilWeight', 'Penalty when a need turns critical after it', 'Castigo si la necesidad se dispara después', 0, 1, 0.05),
    n(FEEL, 'deathPenalty', 'Penalty for dying with a recent bite', 'Castigo por morir con un bocado reciente', 0, 1, 0.05),
    n(FEEL, 'drinkSample', 'Seconds drinking before judging water', 'Segundos bebiendo antes de juzgar el agua', 0.2, 10, 0.1),
  ]},
  { title: { en: 'Learning (written rules)', es: 'Aprendizaje (reglas escritas)' }, cat: 'mind', fieldsOf: [
    n(LEARN, 'avoidFrom', 'Belief weight that writes "avoid X"', 'Peso de creencia que escribe "evitar X"', 0.02, 1, 0.02),
    n(LEARN, 'avoidUntil', 'Weight below which "avoid X" is retired', 'Peso por debajo del cual retira "evitar X"', 0, 1, 0.02),
    n(LEARN, 'preferFrom', 'Belief weight that writes "prefer X"', 'Peso de creencia que escribe "preferir X"', 0.02, 1, 0.02),
    n(LEARN, 'preferUntil', 'Weight below which "prefer X" is retired', 'Peso por debajo del cual retira "preferir X"', 0, 1, 0.02),
    b(CUES, 'enabled', 'Learn from traits', 'Aprender de los rasgos'),
    n(CUES, 'rate', 'How fast a trait learns', 'Qué tan rápido aprende un rasgo', 0.02, 1, 0.02),
    n(CUES, 'wary', 'Predicted harm that kills curiosity', 'Daño previsto que apaga la curiosidad', 0.05, 1, 0.05),
    c(CUES, 'induce', 'Trait rules', 'Reglas de rasgos', [['By weight', 'Por peso'], ['Induced', 'Inducidas'], ['Both', 'Ambas']]),
    n(CUES, 'induceMin', 'Species that must agree to generalize', 'Especies que deben coincidir para generalizar', 2, 6, 1),
    n(CUES, 'ruleEvidence', 'Experiences before a one-trait rule', 'Experiencias antes de una regla de un rasgo', 1, 10, 1),
    b(LEARN, 'autosave', 'Keep a recoverable copy', 'Guardar copia recuperable'),
    n(LEARN, 'autosaveEvery', 'Seconds between copies', 'Segundos entre copias', 1, 120, 1),
  ]},
  { title: { en: 'Colony (new sessions)', es: 'Colonia (sesiones nuevas)' }, cat: 'colony', fieldsOf: [
    n(SOCIAL, 'size', 'Individuals in the colony (1 = Fagi alone)', 'Individuos en la colonia (1 = Fagi sola)', 1, 8, 1),
    b(SOCIAL, 'share', 'Tell each other rules in the nest', 'Contarse reglas en el nido'),
    n(SOCIAL, 'observe', 'Learning from watching a sister eat', 'Aprender de ver comer a una hermana', 0, 1, 0.05),
    n(SOCIAL, 'trust', 'Trust in a rule told', 'Confianza en una regla contada', 0.1, 1, 0.05),
  ]},
  { title: { en: 'External decision API', es: 'API de decisión externa' }, cat: 'system', fieldsOf: [
    b(BACKEND, 'enabled', 'Ask the API', 'Consultar la API'),
    c(BACKEND, 'authority', 'Authority', 'Autoridad', [['Safe', 'Segura'], ['Full', 'Plena']]),
    n(BACKEND, 'minInterval', 'Seconds between queries', 'Segundos entre consultas', 0.2, 60, 0.1),
    n(BACKEND, 'timeout', 'Seconds before giving up', 'Segundos antes de rendirse', 0.2, 30, 0.1),
    n(BACKEND, 'ttl', 'Seconds a directive stays valid', 'Segundos que vale una directiva', 1, 60, 1),
    n(BACKEND, 'idleAfter', 'Seconds exploring before asking', 'Segundos explorando antes de preguntar', 1, 120, 1),
  ]},
  { title: { en: 'Energy and rest', es: 'Energía y descanso' }, cat: 'body', fieldsOf: [
    n(ENERGY, 'max', 'Maximum energy', 'Energía máxima', 20, 300, 10),
    n(ENERGY, 'drain', 'Drain while walking (per second)', 'Gasto andando (por segundo)', 0, 12, 0.1),
    n(ENERGY, 'restOutside', 'Recovery resting outside', 'Recuperación parada fuera', 0, 40, 0.5),
    n(ENERGY, 'restNest', 'Recovery in the nest', 'Recuperación en el nido', 0, 60, 0.5),
    n(ENERGY, 'tired', 'Energy at which it goes to rest', 'Energía a la que va a descansar', 0, 100, 1),
    n(ENERGY, 'rested', 'Energy at which it resumes work', 'Energía con la que vuelve al trabajo', 10, 100, 1),
    n(ENERGY, 'weakSpeed', 'Speed when exhausted (fraction)', 'Velocidad sin fuerzas (fracción)', 0.1, 1, 0.05),
  ]},
  { title: { en: 'Brain', es: 'Cerebro' }, cat: 'mind', fieldsOf: [
    n(BRAIN, 'learnRate', 'Learning rate', 'Rapidez para aprender', 0.02, 1, 0.01),
    n(BRAIN, 'curiosityTries', 'Tries before curiosity fades', 'Pruebas antes de dejar de ser curiosa', 0, 10, 1),
    n(BRAIN, 'curiosityBonus', 'Curiosity strength', 'Fuerza de la curiosidad', 0, 3, 0.05),
    n(BRAIN, 'distanceWeight', 'Weight of distance', 'Peso de la distancia', 0, 3, 0.05),
    n(BRAIN, 'smellPenalty', 'Penalty for smelling without seeing', 'Penalización de lo que huele sin ver', 0, 2, 0.05),
    n(BRAIN, 'minScore', 'Minimum worth moving for', 'Mínimo para molestarse en ir', 0, 2, 0.02),
    n(BRAIN, 'baseInterest', 'Interest when it has no need', 'Interés cuando no lo necesita', 0, 1, 0.05),
    n(BRAIN, 'stickiness', 'How hard it is to switch target', 'Cuánto le cuesta cambiar de objetivo', 0, 2, 0.05),
  ]},
  { title: { en: 'Carrying and nest', es: 'Acarreo y nido' }, cat: 'colony', fieldsOf: [
    n(CARRY, 'eatBelow', 'Hunger above which it eats instead of carrying', 'Hambre a partir de la cual come en vez de cargar', 0, 100, 1),
    n(NEST, 'full', 'Stored items at which the pantry is done', 'Reservas con las que la despensa está hecha', 1, 60, 1),
    n(NEST, 'keepFactor', 'Stored food lasts × longer (then it spoils away)', 'Lo guardado dura × más (y luego se echa a perder)', 1, 50, 1),
    n(NEST, 'restHunger', 'Hunger while sleeping in the nest (×)', 'Hambre durmiendo en el nido (×)', 0, 1, 0.05),
    n(NEST, 'restThirst', 'Thirst while sleeping in the nest (×)', 'Sed durmiendo en el nido (×)', 0, 1, 0.05),
  ]},
  { title: { en: 'Exploring', es: 'Exploración' }, cat: 'mind', fieldsOf: [
    n(EXPLORE, 'cell', 'Size of a cell in its mental map', 'Tamaño de casilla del mapa mental', 30, 300, 10),
    n(EXPLORE, 'fade', 'Known ground forgotten per second', 'Terreno conocido que olvida por segundo', 0, 0.2, 0.002),
    n(EXPLORE, 'distanceWeight', 'Weight of how far a cell is', 'Peso de lo lejos que queda una casilla', 0, 6, 0.1),
    n(EXPLORE, 'homeBias', 'Preference for cells away from the nest', 'Preferencia por casillas lejos del nido', 0, 3, 0.05),
    n(EXPLORE, 'giveUp', 'Seconds insisting on one cell', 'Segundos insistiendo en una casilla', 1, 60, 1),
  ]},
  { title: { en: 'Memory', es: 'Memoria' }, cat: 'mind', fieldsOf: [
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
  { title: { en: 'Wind', es: 'Viento' }, cat: 'world', fieldsOf: [
    n(WIND, 'turnRate', 'How fast it turns', 'Rapidez con la que gira', 0, 1.5, 0.01),
    n(WIND, 'swing', 'How much it changes direction', 'Cuánto cambia de dirección', 0, 3.2, 0.1),
    n(WIND, 'changeEvery.min', 'Changes at soonest every', 'Cambia como pronto cada', 1, 60, 1),
    n(WIND, 'changeEvery.max', 'Changes at latest every', 'Cambia como tarde cada', 2, 120, 1),
  ]},
  { title: { en: 'Scent plumes', es: 'Estelas de olor' }, cat: 'world', fieldsOf: [
    b(PLUME, 'show', 'Show every scent trail (off: only the ones a Fagi is smelling)', 'Mostrar todas las estelas (apagado: solo las que huele una Fagi)'),
    n(PLUME, 'step', 'Length of each segment', 'Largo de cada tramo', 4, 60, 1),
    n(PLUME, 'every', 'Seconds between segments', 'Segundos entre tramos', 0.02, 1, 0.02),
    n(PLUME, 'drift', 'How much it meanders', 'Cuánto serpentea', 0, 1.5, 0.05),
    n(PLUME, 'windPull', 'How much the wind straightens it', 'Cuánto lo endereza el viento', 0, 1, 0.02),
    n(PLUME, 'radius', 'Thread width (where it can be smelled)', 'Ancho del hilo (dónde se huele)', 5, 120, 1),
    n(PLUME, 'nodesPerAroma', 'Thread length per point of aroma', 'Largo del hilo por punto de aroma', 0.1, 3, 0.05),
    n(PLUME, 'faint', 'How much it fades towards the tip', 'Cuánto se diluye hacia la punta', 0, 1, 0.05),
  ]},
  { title: { en: 'Own pheromone', es: 'Feromona propia' }, cat: 'colony', fieldsOf: [
    n(PHERO, 'life', 'Seconds until it evaporates', 'Segundos hasta evaporarse', 2, 300, 5),
    n(PHERO, 'every', 'Seconds between marks', 'Segundos entre marcas', 0.05, 3, 0.05),
    n(PHERO, 'sense', 'Distance at which it is detected', 'Distancia a la que la detecta', 5, 150, 1),
  ]},
  { title: { en: 'Water', es: 'Agua' }, cat: 'world', fieldsOf: [
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
  { title: { en: 'Rain', es: 'Lluvia' }, cat: 'world', fieldsOf: [
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
  { title: { en: 'Instincts', es: 'Instintos' }, cat: 'mind', fieldsOf: [
    n(INSTINCT, 'rainShelter', 'Innate urge to shelter from rain', 'Ganas innatas de refugiarse de la lluvia', 0, 1, 0.05),
    n(INSTINCT, 'pressureSense', 'Sensitivity to air pressure (0 = none)', 'Sensibilidad a la presión del aire (0 = ninguna)', 0, 2, 0.1),
    n(INSTINCT, 'pressureMin', 'Smallest pressure drop it notices', 'Bajada de presión mínima que nota', 0, 1, 0.05),
    n(INSTINCT, 'pressureHaste', 'Hurry when pressure drops (× speed)', 'Prisa al bajar la presión (× velocidad)', 0, 1, 0.05),
    n(INSTINCT, 'pressureShelter', 'Innate urge to go home when pressure drops', 'Ganas innatas de volver al nido si baja la presión', 0, 1, 0.05),
  ]},
  { title: { en: 'Trees', es: 'Árboles' }, cat: 'world', fieldsOf: [
    n(TREE, 'interval', 'Fruit every (seconds)', 'Fruta cada (segundos)', 1, 120, 1),
    n(TREE, 'life', 'Tree lifespan (0 = forever)', 'Vida del árbol (0 = para siempre)', 0, 600, 10),
    n(TREE, 'maxNear', 'Uncollected fruit before it stops', 'Fruta suya sin recoger antes de parar', 1, 30, 1),
    n(TREE, 'dropRadius', 'Where fruit falls (× its radius)', 'Dónde cae la fruta (× su radio)', 1, 5, 0.1),
    n(FRUIT, 'warnFrom', 'When it starts looking overripe', 'Desde cuándo se le nota que se pasa', 0, 1, 0.05),
  ]},
  { title: { en: 'Explore or come back', es: 'Explorar o volver' }, cat: 'world', fieldsOf: [
    b(FORAGE, 'enabled', 'Seasonal trees and ground patches', 'Árboles de temporada y manchas en el suelo'),
    n(FORAGE, 'persistence', 'Share of trees that bear all year', 'Parte de los árboles que dan todo el año', 0, 1, 0.05),
    n(FORAGE, 'crop', 'Fruit a seasonal tree drops before going bare', 'Frutos de un árbol de temporada antes de quedar pelado', 1, 60, 1),
    n(FORAGE, 'rest', 'Seconds a bare tree rests', 'Segundos que descansa un árbol pelado', 10, 1200, 10),
    n(FORAGE, 'patchEvery', 'A ground patch every (seconds, 0 = none)', 'Una mancha en el suelo cada (segundos, 0 = ninguna)', 0, 1200, 10),
    n(FORAGE, 'patchSize', 'Fruit in a patch', 'Frutos en una mancha', 1, 30, 1),
  ]},
  { title: { en: 'Food sites', es: 'Sitios de comida' }, cat: 'world', fieldsOf: [
    b(SITES, 'enabled', 'Remembers several food sites and learns what each gives', 'Recuerda varios sitios con comida y aprende qué da cada uno'),
    n(SITES, 'max', 'Sites she can remember', 'Sitios que puede recordar', 1, 8, 1),
    n(SITES, 'rate', 'How much one visit changes what she expects', 'Cuánto cambia una visita lo que espera', 0.05, 1, 0.05),
  ]},
  { title: { en: 'Map objects', es: 'Objetos del mapa' }, cat: 'world', fieldsOf: [
    // Four radii in one group: all but the rock's (the one recordings already
    // name 'Map objects.radius') carry their type in the id, or they would share it.
    { ...n(OBJECT_TYPES.water, 'radius', 'Size of new water', 'Tamaño del agua nueva', 10, 200, 2), id: 'water.radius' },
    n(OBJECT_TYPES.water, 'aroma', 'Water aroma', 'Aroma del agua', 0, 400, 5),
    { ...n(OBJECT_TYPES.nest, 'radius', 'Size of new nest', 'Tamaño del nido nuevo', 10, 200, 2), id: 'nest.radius' },
    { ...n(OBJECT_TYPES.tree, 'radius', 'Size of new tree', 'Tamaño del árbol nuevo', 10, 120, 2), id: 'tree.radius' },
    n(OBJECT_TYPES.rock, 'radius', 'Size of new rock', 'Tamaño de la roca nueva', 8, 150, 2),
    n(MAPGEN, 'trees', 'Trees when generating a map', 'Árboles al generar mapa', 0, 20, 1),
    n(MAPGEN, 'size', 'Map size (× each side, new maps)', 'Tamaño del mapa (× cada lado, mapas nuevos)', 1, 4, 0.5),
    n(MAPGEN, 'pools', 'Ponds when generating a map', 'Estanques al generar mapa', 1, 30, 1),
    n(MAPGEN, 'species', 'Wild species with hidden chemistry (0 = classic map)', 'Especies silvestres con química oculta (0 = mapa clásico)', 0, 12, 1),
    n(MAPGEN, 'treeMinNestDistance', 'Minimum tree distance from nest', 'Distancia mínima del árbol al nido', 100, 900, 10),
    n(MAPGEN, 'treeMaxNestDistance', 'Maximum tree distance from nest', 'Distancia máxima del árbol al nido', 100, 1000, 10),
    n(MAPGEN, 'rocks', 'Rocks when generating a map', 'Rocas al generar mapa', 0, 40, 1),
  ]},
  // Blocks added after the first recordings: new titles, so new ids.
  { title: { en: 'Urgency', es: 'Urgencia' }, cat: 'body', fieldsOf: [
    n(NEEDS, 'critical', 'Hunger or thirst (fraction) that overrides everything', 'Hambre o sed (fracción) que pasa por delante de todo', 0.2, 0.95, 0.05),
    n(NEEDS, 'shelterMargin', 'Seconds of cushion leaving shelter for water', 'Segundos de margen al salir del refugio a por agua', 0, 60, 1),
  ]},
  { title: { en: 'Health', es: 'Salud' }, cat: 'body', fieldsOf: [
    b(HEALTH, 'enabled', 'Health and wounds', 'Salud y heridas'),
    n(HEALTH, 'sting', 'Health a sting takes', 'Salud que quita un pinchazo', 0, 100, 1),
    n(HEALTH, 'poison', 'Health a poisonous fruit takes', 'Salud que quita un fruto venenoso', 0, 100, 1),
    n(HEALTH, 'thermalFrom', 'Thermal stress (fraction) from which it harms', 'Estrés térmico (fracción) desde el que hace daño', 0, 1, 0.05),
    n(HEALTH, 'thermal', 'Health per second lost to heat or cold', 'Salud por segundo que quita el calor o el frío', 0, 10, 0.1),
    n(HEALTH, 'heal', 'Health mended per second', 'Salud que se repara por segundo', 0, 2, 0.01),
    n(HEALTH, 'restHeal', 'Mends × faster resting', 'Se repara × más rápido descansando', 1, 10, 0.5),
    n(HEALTH, 'slowFrom', 'Health (fraction) under which she walks slower', 'Salud (fracción) bajo la cual camina más lento', 0, 1, 0.05),
    n(HEALTH, 'slowest', 'Speed with no health left (fraction)', 'Velocidad sin salud (fracción)', 0.1, 1, 0.05),
    n(HEALTH, 'breed', 'Health (fraction) needed to breed', 'Salud (fracción) necesaria para criar', 0, 1, 0.05),
  ]},
  { title: { en: 'Habits', es: 'Hábitos' }, cat: 'mind', fieldsOf: [
    b(HABITS, 'enabled', 'Tunes her thresholds from experience', 'Ajusta sus umbrales por experiencia'),
    n(HABITS, 'scare', 'Hunger or thirst (fraction) that counts as a scare', 'Hambre o sed (fracción) que cuenta como susto', 0.3, 1, 0.05),
    b(HABITS, 'relax', 'A long calm makes her bolder', 'Una calma larga la hace más atrevida'),
    n(HABITS, 'calm', 'Seconds of calm before relaxing a habit', 'Segundos de calma antes de relajar un hábito', 30, 3600, 30),
  ]},
  { title: { en: 'Life and breeding', es: 'Vida y crianza' }, cat: 'colony', fieldsOf: [
    b(LIFE, 'enabled', 'Life cycle and breeding', 'Ciclo de vida y crianza'),
    n(LIFE, 'founders', 'Founders (new sessions)', 'Fundadores (sesiones nuevas)', 2, 16, 1),
    n(LIFE, 'maxPopulation', 'Nest capacity, eggs included', 'Capacidad del nido, huevos incluidos', 2, 60, 1),
    n(LIFE, 'adultAt', 'Age at which a juvenile becomes adult (s)', 'Edad a la que una juvenil se hace adulta (s)', 30, 3600, 10),
    n(LIFE, 'lifespan', 'Mean lifespan (s)', 'Esperanza de vida media (s)', 300, 36000, 60),
    n(LIFE, 'lifespanSpread', 'Lifespan spread (± fraction)', 'Dispersión de la esperanza de vida (± fracción)', 0, 0.5, 0.01),
    n(LIFE, 'senescentAt', 'Old age from (fraction of her life)', 'Vejez desde (fracción de su vida)', 0.3, 1, 0.05),
    n(LIFE, 'juvenileSpeed', 'Juvenile speed (×)', 'Velocidad de una juvenil (×)', 0.2, 1.5, 0.05),
    n(LIFE, 'oldSpeed', 'Speed at the end of her life (×)', 'Velocidad al final de su vida (×)', 0.1, 1, 0.05),
    n(LIFE, 'mateEnergy', 'Energy (fraction) both need to mate', 'Energía (fracción) que ambos necesitan para aparearse', 0, 1, 0.05),
    n(LIFE, 'mateNeed', 'Hunger and thirst (fraction) both must be under', 'Hambre y sed (fracción) por debajo de las que deben estar', 0.05, 1, 0.05),
    n(LIFE, 'mateStock', 'Rations the pantry must hold to breed', 'Raciones que debe tener la despensa para criar', 0, 30, 1),
    n(LIFE, 'mateCost', 'Energy mating costs each', 'Energía que cuesta aparearse a cada uno', 0, 80, 1),
    n(LIFE, 'eggCost', 'Hunger laying an egg costs her', 'Hambre que le cuesta poner un huevo', 0, 60, 1),
    n(LIFE, 'femaleRecover', 'Seconds before a female mates again', 'Segundos antes de que una hembra vuelva a aparearse', 0, 3600, 10),
    n(LIFE, 'maleRecover', 'Seconds before a male mates again', 'Segundos antes de que un macho vuelva a aparearse', 0, 3600, 10),
    n(LIFE, 'incubation', 'Seconds an egg takes to hatch (warm)', 'Segundos que tarda un huevo en eclosionar (con calor)', 10, 3600, 10),
    n(LIFE, 'eggCold', 'Nest °C under which an egg stops developing', '°C del nido bajo los que el huevo no se desarrolla', -10, 30, 1),
    n(LIFE, 'eggWarm', 'Nest °C at which it develops at full pace', '°C del nido con los que se desarrolla a pleno ritmo', 0, 40, 1),
    n(LIFE, 'eggStarve', 'Seconds a ready egg waits for food before dying', 'Segundos que un huevo listo espera comida antes de morir', 10, 1800, 10),
    n(LIFE, 'kinLimit', 'Relatedness from which two do not mate', 'Parentesco desde el que dos no se aparean', 0, 1, 0.05),
    b(LIFE, 'gradual', 'Fertility fades with age and crowding', 'La fertilidad baja con la edad y el hacinamiento'),
  ]},
  { title: { en: 'Inheritance', es: 'Herencia' }, cat: 'colony', fieldsOf: [
    b(GEN, 'culture', 'Mother teaches her rules to the newborn', 'La madre enseña sus reglas a la cría'),
    n(GEN, 'cultureTrust', 'Trust in a rule taught', 'Confianza en una regla enseñada', 0.1, 1, 0.05),
    b(GEN, 'habits', 'Habits are taught too', 'También se enseñan los hábitos'),
    b(GEN, 'genes', 'Born with inherited trait biases', 'Nace con sesgos heredados'),
    n(GEN, 'mutation', 'Mutation of each bias', 'Mutación de cada sesgo', 0, 1, 0.01),
    b(GEN, 'blend', 'Biases averaged from both parents', 'Sesgos promediados de ambos padres'),
    n(GEN, 'bodyMutation', 'Mutation of each body gene', 'Mutación de cada gen del cuerpo', 0, 0.3, 0.005),
  ]},
  { title: { en: 'Tastes', es: 'Sabores' }, cat: 'food', fieldsOf: [
    b(TASTE, 'enabled', 'Tastes and hidden chemistry', 'Sabores y química oculta'),
    n(TASTE, 'hedonic', 'Weight of how a bite tastes', 'Peso de cómo sabe un bocado', 0, 2, 0.05),
    n(TASTE, 'spitBelow', 'Liking under which she spits it out', 'Gusto bajo el cual lo escupe', -1, 1, 0.05),
    n(TASTE, 'spitPortion', 'Share she swallows of what she spits', 'Parte que traga de lo que escupe', 0, 1, 0.05),
    n(TASTE, 'learnWeight', 'How fast learning overrides innate liking', 'Rapidez con que lo aprendido pisa el gusto innato', 0, 5, 0.1),
    n(TASTE, 'burn', 'Health a very spicy bite takes', 'Salud que quita un bocado muy picante', 0, 30, 0.5),
    n(TASTE, 'salience', 'Blame a taste takes vs a look (×)', 'Culpa que se lleva un sabor frente a un aspecto (×)', 0.5, 5, 0.1),
    b(TASTE, 'innate', 'Born liking and disliking tastes', 'Nace con gustos y aversiones'),
    b(TASTE, 'learn', 'Tastes teach', 'Los sabores enseñan'),
    b(TASTE, 'salt', 'Sodium is a need', 'El sodio es una necesidad'),
    n(TASTE, 'saltLoss', 'Sodium lost per second (1 = full)', 'Sodio que pierde por segundo (1 = lleno)', 0, 0.01, 0.0001),
    n(TASTE, 'saltGain', 'Sodium a salty bite restores (×)', 'Sodio que repone un bocado salado (×)', 0, 2, 0.05),
    n(TASTE, 'saltCraving', 'Extra liking for salt when lacking it', 'Gusto extra por la sal cuando le falta', 0, 2, 0.05),
    n(TASTE, 'saltWeak', 'Sodium under which she walks slower', 'Sodio bajo el cual camina más lento', 0, 1, 0.05),
    n(TASTE, 'mimics', 'Species with a poisonous look-alike (new maps)', 'Especies con un doble venenoso (mapas nuevos)', 0, 12, 1),
    n(TASTE, 'twinShare', 'Share of their fruit that is the look-alike', 'Parte de sus frutos que es el doble', 0, 1, 0.05),
  ]},
  { title: { en: 'Food sources', es: 'Fuentes de comida' }, cat: 'food', fieldsOf: [
    b(SOURCES, 'enabled', 'Learns which tree feeds her', 'Aprende qué árbol la alimenta'),
    n(SOURCES, 'near', 'Fruit within × a tree\'s radius is its fruit', 'La fruta a × el radio de un árbol es suya', 1, 5, 0.1),
  ]},
  ...TYPE_KEYS.map((key) => ({
    title: { en: `Food · ${key}`, es: `Alimento · ${key}`, type: key },
    cat: 'food',
    fieldsOf: foodFields(key),
  })),
];

// Each field needs a stable name to be saved under: the group's plus its
// key. Food groups use the type, which doesn't change with the language.
for (const group of GROUPS) {
  const base = group.title.type ?? group.title.en;
  for (const field of group.fieldsOf) field.id = `${base}.${field.id ?? field.key}`;
}

// Two fields under one id would save and replay as one: refuse it at load.
{
  const ids = GROUPS.flatMap((g) => g.fieldsOf).map((f) => f.id);
  const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (twice.length) throw new Error(`settings: repeated ids ${twice.join(', ')}`);
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

// A session recorded before the organism existed says nothing about it: it
// was played without it. Laid under a recorded config, this keeps it that way.
export function organismOffConfig() {
  const off = {};
  for (const block of Object.values(ORGANISM)) {
    const id = configIdOf(block, 'enabled');
    if (id) off[id] = 0;
  }
  return off;
}

// The setting id of a config.js number, or null if it isn't exposed.
export function configIdOf(obj, key) {
  for (const [id, field] of BY_ID) if (field.obj === obj && field.key === key) return id;
  return null;
}

// A setting changed from outside the dialog (the setup panel's map size):
// written, told, saved and repainted as if typed in its field.
export function setSetting(obj, key, value) {
  const id = configIdOf(obj, key);
  const field = id ? BY_ID.get(id) : null;
  if (!field || !Number.isFinite(value)) return;
  const before = read(field);
  const v = bound(field, value);
  write(field, v);
  if (before !== v) onChange?.(id, before, v, 'user');
  saveSoon();
  refresh?.();
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

// A group's title: food groups carry the type's translated name. `show` is a
// display name for a group whose id-giving title no longer fits.
function titleOf(group) {
  const lang = getLang();
  const base = group.title.show?.[lang] ?? group.title[lang] ?? group.title.en;
  return group.title.type ? base.replace(group.title.type, labelOf(group.title.type)) : base;
}

// The categories the groups are sorted into, in this order.
const CATEGORIES = [
  { id: 'world', icon: '🌍', en: 'World', es: 'Mundo', hint: { en: 'Day, weather, water, trees and the map', es: 'Día, clima, agua, árboles y el mapa' } },
  { id: 'food', icon: '🍎', en: 'Food', es: 'Alimentos', hint: { en: 'Each fruit, tastes and food sources', es: 'Cada fruto, sabores y fuentes de comida' } },
  { id: 'body', icon: '🫀', en: 'Body', es: 'Cuerpo', hint: { en: 'Senses, needs, energy, sleep, temperature, health', es: 'Sentidos, necesidades, energía, sueño, temperatura, salud' } },
  { id: 'mind', icon: '🧠', en: 'Mind', es: 'Mente', hint: { en: 'Learning, memory, exploring, instincts, habits', es: 'Aprendizaje, memoria, exploración, instintos, hábitos' } },
  { id: 'colony', icon: '🐜', en: 'Colony & life', es: 'Colonia y vida', hint: { en: 'Sisters, breeding, inheritance, nest and trail', es: 'Hermanas, crianza, herencia, nido y rastro' } },
  { id: 'system', icon: '⚙', en: 'System', es: 'Sistema', hint: { en: 'External decision API', es: 'API de decisión externa' } },
];
const CAT_KEY = 'fagi.settings.cat';
const FACTORY = new Map(ORIGINAL.map(({ c, value }) => [c, value]));
const changed = (field) => read(field) !== FACTORY.get(field);
const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function createSettings(world, getFagi) {
  const box = document.getElementById('settings-body');
  const overlay = document.getElementById('settings-overlay');
  let inputs = [];
  let cat = (() => { try { return localStorage.getItem(CAT_KEY) ?? 'world'; } catch { return 'world'; } })();
  if (!CATEGORIES.some((c) => c.id === cat)) cat = 'world';
  let query = '';

  // Two panes: the categories (with how many settings of each are off
  // factory) and the groups of the chosen one. A search looks through all.
  box.innerHTML = `
    <nav class="set-nav" role="tablist"></nav>
    <div class="set-main">
      <div class="set-tools">
        <input class="set-search" type="search" autocomplete="off">
        <button class="set-expand" type="button"></button>
      </div>
      <p class="set-hint"></p>
      <div class="set-groups"></div>
    </div>`;
  const nav = box.querySelector('.set-nav');
  const search = box.querySelector('.set-search');
  const expand = box.querySelector('.set-expand');
  const hint = box.querySelector('.set-hint');
  const list = box.querySelector('.set-groups');
  const L = (en, es) => (getLang() === 'es' ? es : en);

  search.addEventListener('input', () => { query = search.value.trim(); buildGroups(); });
  expand.addEventListener('click', () => {
    const all = [...list.querySelectorAll('details')];
    const open = !all.every((d) => d.open);
    for (const d of all) d.open = open;
    paintExpand();
  });
  function paintExpand() {
    const all = [...list.querySelectorAll('details')];
    expand.textContent = all.length && all.every((d) => d.open) ? L('▸ Collapse all', '▸ Plegar todo') : L('▾ Expand all', '▾ Desplegar todo');
  }

  function buildNav() {
    nav.innerHTML = '';
    for (const c of CATEGORIES) {
      const groups = GROUPS.filter((g) => g.cat === c.id);
      const off = groups.flatMap((g) => g.fieldsOf).filter(changed).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      btn.className = 'set-cat';
      btn.classList.toggle('active', !query && c.id === cat);
      btn.innerHTML = `<span class="set-icon">${c.icon}</span><span class="set-name">${c[getLang()] ?? c.en}</span>`
        + `<span class="set-count" title="${L('groups', 'grupos')}">${groups.length}</span>`
        + (off ? `<span class="set-off" title="${L('changed from factory', 'cambiados de fábrica')}">${off}</span>` : '');
      btn.addEventListener('click', () => {
        cat = c.id;
        try { localStorage.setItem(CAT_KEY, cat); } catch { /* not remembered */ }
        query = '';
        search.value = '';
        buildNav();
        buildGroups();
      });
      nav.append(btn);
    }
  }

  // One setting: its name, a ↺ back to factory when changed, and its control
  // (a switch, a segmented choice, or a slider with a box to type in).
  function row(field) {
    const lang = getLang();
    const el = document.createElement(field.toggle ? 'label' : 'div');
    el.className = `field ${field.toggle ? 'toggle' : field.choices ? 'choice' : 'slider'}`;
    const top = document.createElement('div');
    top.className = 'field-top';
    const name = document.createElement('span');
    name.className = 'field-name';
    name.textContent = field.label[lang] ?? field.label.en;
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'field-reset';
    reset.textContent = '↺';
    top.append(name, reset);
    el.append(top);

    const mark = () => {
      const off = changed(field);
      el.classList.toggle('changed', off);
      reset.hidden = !off;
      const factory = FACTORY.get(field);
      const shown = field.toggle ? L(factory ? 'on' : 'off', factory ? 'encendido' : 'apagado')
        : field.choices ? field.choices[factory]?.[lang] ?? factory : factory;
      reset.title = L(`Back to factory (${shown})`, `Volver al de fábrica (${shown})`);
    };
    // `settled`: the change is done (not mid-drag), the counts catch up.
    const set = (v, settled) => {
      const before = read(field);
      write(field, v);
      if (before !== v) onChange?.(field.id, before, v, 'user');
      mark();
      saveSoon();
      if (settled) buildNav();
    };

    let paint;
    if (field.toggle) {
      const input = document.createElement('input');
      input.type = 'checkbox';
      // Named, or a click on the text would press the ↺ (the label's first control).
      input.id = `set-${field.id.replace(/\W+/g, '-')}`;
      el.htmlFor = input.id;
      input.addEventListener('change', () => set(input.checked ? 1 : 0, true));
      top.append(input);
      paint = (v) => { input.checked = v === 1; };
    } else if (field.choices) {
      const choice = makeChoice({
        options: field.choices.map((o, i) => ({ value: field.min + i, label: o[lang] ?? o.en })),
        value: read(field),
        onInput: (v) => set(v, true),
      });
      el.append(choice.el);
      paint = choice.set;
    } else {
      const s = makeSlider({
        min: field.min, max: field.max, step: field.step, value: read(field),
        onInput: (v) => set(bound(field, v), false),
        onCommit: () => buildNav(),
      });
      top.append(s.box);
      el.append(s.range);
      paint = s.set;
    }
    reset.addEventListener('click', (e) => {
      e.preventDefault();
      const v = FACTORY.get(field);
      set(v, true);
      paint(v);
    });
    paint(read(field));
    mark();
    inputs.push({ field, paint, mark });
    return el;
  }

  function buildGroups() {
    list.innerHTML = '';
    inputs = [];
    const q = fold(query);
    const shown = q
      ? GROUPS.map((g) => {
        const inTitle = fold(titleOf(g)).includes(q);
        const fields = g.fieldsOf.filter((f) => inTitle || fold(f.label[getLang()] ?? f.label.en).includes(q) || fold(f.key).includes(q));
        return fields.length ? { g, fields } : null;
      }).filter(Boolean)
      : GROUPS.filter((g) => g.cat === cat).map((g) => ({ g, fields: g.fieldsOf }));
    const here = CATEGORIES.find((c) => c.id === cat);
    hint.textContent = q
      ? L(`${shown.reduce((a, s) => a + s.fields.length, 0)} settings found`, `${shown.reduce((a, s) => a + s.fields.length, 0)} ajustes encontrados`)
      : here.hint[getLang()] ?? here.hint.en;
    shown.forEach(({ g, fields }, i) => {
      const det = document.createElement('details');
      // Searching opens every match; browsing opens the first group.
      det.open = Boolean(q) || i === 0;
      const off = g.fieldsOf.filter(changed).length;
      const where = q ? CATEGORIES.find((c) => c.id === g.cat) : null;
      det.innerHTML = `<summary><span>${titleOf(g)}</span>`
        + (where ? `<span class="set-where">${where.icon} ${where[getLang()] ?? where.en}</span>` : '')
        + (off ? `<span class="set-off">${off}</span>` : '')
        + `<span class="set-n">${fields.length}</span></summary>`;
      for (const field of fields) det.append(row(field));
      det.addEventListener('toggle', paintExpand);
      list.append(det);
    });
    if (!shown.length) list.innerHTML = `<p class="set-none">${L('Nothing matches.', 'Nada coincide.')}</p>`;
    paintExpand();
  }

  function build() {
    search.placeholder = L('Search a setting…', 'Buscar un ajuste…');
    buildNav();
    buildGroups();
  }

  build();
  onLangChange(build);
  refresh = () => {
    for (const { field, paint, mark } of inputs) {
      paint(read(field));
      mark();
    }
    buildNav();
  };

  document.getElementById('btn-settings').addEventListener('click', () => { overlay.hidden = false; });
  document.getElementById('btn-settings-close').addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });

  document.getElementById('btn-settings-reset').addEventListener('click', () => {
    for (const { c, value } of ORIGINAL) {
      const before = read(c);
      write(c, value);
      if (before !== value) onChange?.(c.id, before, value, 'reset');
    }
    refresh();
    saveSettings();   // all factory: deletes the save
  });

  document.getElementById('btn-clear-trees').addEventListener('click', () => removeAllTrees(world));
  document.getElementById('btn-rain-now').addEventListener('click', () => startRain(world));
  document.getElementById('btn-wipe-memory').addEventListener('click', () => wipe(getFagi()));
}
