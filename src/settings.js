// Settings dialog: edits the config.js objects on the fly.
//
// The whole game reads its numbers from those objects every frame, so changing
// a value here shows up instantly, without restarting. The schema below is the
// only list you need to touch to expose a new parameter.

import {
  FAGI, HUNGER, THIRST, ENERGY, BRAIN, CARRY, NEST, EXPLORE, WIND, PLUME, PHERO, TREE, FRUIT, MEMORY,
  MAPGEN, POINT_TYPES, OBJECT_TYPES, TYPE_KEYS, FEEL, LEARN, CUES, BACKEND, RAIN, WATER, INSTINCT, SOCIAL,
  CYCLE, THERMAL, SEX, SLEEP, EXPERIMENT, APPETITE, PERCEPT, NIGHTAI, CONCEPT,
  LIFE, HEALTH, TASTE, SOURCES, GEN, HABITS, NEEDS, FORAGE, SITES, CHOICE, LARDER, CONDUCT,
  PROGRAM, MOVEMENT, CASTES, MORPH, SEASONS, LOAD, COLONIES, STOMACH, SELECT, DRIVE, SCIENCE,
  CAMERA, ATTENTION, SYNAPSE, EXPLAIN, VARY,
} from './config.js';
import { ORGANISM } from './organism.js';
import { startRain } from './rain.js';
import { removeAllTrees } from './trees.js';
import { wipe } from './learned/store.js';
import { t, labelOf, getLang, onLangChange } from './i18n.js';
import { makeSlider, makeChoice } from './controls.js';
import { fieldHelp, groupHelp } from './settings-help.js';

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
// The same for a setting whose values are words ('program', 'freeflow'...):
// `options`: [[value, en, es], ...]. It is kept and recorded as the option's
// number, like the rest, and written to config.js as its word.
const w = (obj, key, en, es, options) => ({
  ...c(obj, key, en, es, options.map(([, oen, oes]) => [oen, oes])),
  values: options.map(([v]) => v),
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
  { title: { en: 'Camera', es: 'Cámara' }, cat: 'system', fieldsOf: [
    n(CAMERA, 'max', 'Maximum zoom', 'Zoom máximo', 1, 8, 0.5),
    n(CAMERA, 'step', 'Zoom per wheel step', 'Zoom por paso de rueda', 1.02, 1.5, 0.02),
    n(CAMERA, 'keysDown', 'Keyboard pan speed', 'Velocidad de desplazamiento con teclado', 100, 1200, 20),
  ]},
  { title: { en: 'Attention', es: 'Atención' }, cat: 'mind', fieldsOf: [
    n(ATTENTION, 'forget', 'Seconds before a sight counts as new', 'Segundos para considerar nueva una percepción', 0.5, 30, 0.5),
    n(ATTENTION, 'opportunisticThirst', 'Thirst that diverts her toward nearby water', 'Sed que la desvía hacia agua cercana', 0, 1, 0.05),
  ]},
  { title: { en: 'Neural connections', es: 'Conexiones neuronales' }, cat: 'mind', fieldsOf: [
    n(SYNAPSE, 'hebbRate', 'Perception strengthens connections per second', 'Refuerzo de conexiones por segundo de percepción', 0, 2, 0.05),
    n(SYNAPSE, 'hebbDecay', 'Unused connections fade per second', 'Pérdida por segundo de conexiones sin uso', 0, 0.1, 0.001),
    n(SYNAPSE, 'learnRate', 'Learning from each consequence', 'Aprendizaje por consecuencia', 0, 1, 0.05),
    n(SYNAPSE, 'feelDecay', 'Consequence memory fades per second', 'Pérdida por segundo de memoria de consecuencias', 0, 0.01, 0.0001),
    n(SYNAPSE, 'prune', 'Connection strength below which it disappears', 'Fuerza por debajo de la cual desaparece una conexión', 0, 0.5, 0.01),
  ]},
  { title: { en: 'Explanations', es: 'Explicaciones' }, cat: 'mind', fieldsOf: [
    n(EXPLAIN, 'log', 'Experiences kept to explain decisions', 'Experiencias conservadas para explicar decisiones', 10, 300, 10),
    n(EXPLAIN, 'examples', 'Examples per explanation', 'Ejemplos por explicación', 1, 12, 1),
    n(EXPLAIN, 'wary', 'Wariness that discourages pursuing food', 'Cautela que desalienta perseguir alimento', 0, 1, 0.05),
    n(EXPLAIN, 'tempted', 'Expected benefit that makes food attractive', 'Beneficio esperado que vuelve atractivo un alimento', 0, 1, 0.05),
  ]},
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
    { ...b(MOVEMENT, 'enabled', 'Adaptive gait: slopes, caution and sprints', 'Marcha adaptativa: pendientes, cautela y carreras'), id: 'gait' },
    b(MOVEMENT, 'terrainAdapt', 'Adapt movement to terrain', 'Adaptar el movimiento al terreno'),
    n(MOVEMENT, 'slope', 'How much slopes weigh', 'Cuánto pesan las pendientes', 0, 3, 0.1),
    n(MOVEMENT, 'cautiousThreshold', 'How unknown the ground must be to move cautiously', 'Qué tan desconocido debe ser el terreno para avanzar con cautela', 0, 1, 0.05),
    n(MOVEMENT, 'crawlSpeed', 'Cautious crawl speed (fraction)', 'Velocidad de avance cauto (fracción)', 0.1, 1, 0.05),
    n(MOVEMENT, 'sprintMult', 'Sprint / escape speed multiplier', 'Multiplicador de velocidad de huida/sprint', 1, 2.5, 0.05),
    n(MOVEMENT, 'sprintEnergy', 'Energy (fraction) under which she no longer sprints', 'Energía (fracción) bajo la cual ya no corre', 0, 0.8, 0.05),
    n(MOVEMENT, 'zigzagFreq', 'Search sweep frequency', 'Frecuencia de barrido de búsqueda', 0.5, 6, 0.1),
    n(MOVEMENT, 'zigzagAmp', 'Search sweep amplitude (radians)', 'Amplitud de barrido de búsqueda (radianes)', 0.1, 1.2, 0.05),
  ]},
  // The organism (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md). One group per
  // block: their ids ('Day and night.enabled'...) are what a recording keeps.
  { title: { en: 'Day and night', es: 'Día y noche' }, cat: 'climate', fieldsOf: [
    b(CYCLE, 'enabled', 'Day and night', 'Día y noche'),
    n(CYCLE, 'seconds', 'Seconds in a day', 'Segundos que dura un día', 30, 1800, 10),
    n(CYCLE, 'start', 'Hour the session starts (0 midnight, 0.5 noon)', 'Hora a la que empieza (0 medianoche, 0.5 mediodía)', 0, 0.99, 0.01),
    n(CYCLE, 'dawn', 'Dawn (phase of the day, 0-1)', 'Amanecer (fase del día, 0-1)', 0.05, 0.45, 0.01),
    n(CYCLE, 'dusk', 'Dusk (phase of the day, 0-1)', 'Anochecer (fase del día, 0-1)', 0.55, 0.95, 0.01),
    n(CYCLE, 'twilight', 'Length of dawn and dusk (phase of the day)', 'Duración del amanecer y del ocaso (fase del día)', 0.01, 0.2, 0.01),
    n(CYCLE, 'minLight', 'Light at night', 'Luz de noche', 0, 1, 0.02),
    n(CYCLE, 'nightSight', 'Sight left at night (fraction)', 'Vista que le queda de noche (fracción)', 0.1, 1, 0.05),
  ]},
  // Split out of 'Day and night': `fullId` keeps the ids recordings already carry.
  { title: { en: 'Temperature', es: 'Temperatura' }, cat: 'climate', fieldsOf: [
    { ...n(CYCLE, 'mean', 'Average air temperature (°C)', 'Temperatura media del aire (°C)', -10, 45, 1), fullId: 'Day and night.mean' },
    { ...n(CYCLE, 'swing', 'Swing between day and night (± °C)', 'Oscilación entre día y noche (± °C)', 0, 30, 1), fullId: 'Day and night.swing' },
    n(CYCLE, 'warmest', 'Hottest moment of the day (phase, 0-1)', 'Momento más caluroso del día (fase, 0-1)', 0.3, 0.9, 0.01),
  ]},
  { title: { en: 'Seasons', es: 'Estaciones' }, cat: 'climate', fieldsOf: [
    ...[
      b(SEASONS, 'enabled', 'Seasons: lean, cold winters', 'Estaciones: inviernos escasos y fríos'),
      n(SEASONS, 'year', 'Seconds in a year', 'Segundos que dura un año', 600, 14400, 60),
      n(SEASONS, 'winter', 'Share of the year that is winter', 'Parte del año que es invierno', 0, 0.9, 0.05),
      n(SEASONS, 'winterFruit', 'What trees bear in deep winter (×)', 'Lo que dan los árboles en pleno invierno (×)', 0, 1, 0.01),
      n(SEASONS, 'summerFruit', 'What trees bear in summer (×)', 'Lo que dan los árboles en verano (×)', 0.5, 3, 0.05),
      n(SEASONS, 'winterCold', 'Degrees winter takes off', 'Grados que quita el invierno', 0, 25, 1),
      b(SEASONS, 'unpredictable', 'Every winter different', 'Cada invierno distinto'),
      n(SEASONS, 'hotYears', 'Share of hot years', 'Parte de años calurosos', 0, 1, 0.05),
      n(SEASONS, 'summerHeat', 'Degrees a hot summer adds', 'Grados que suma un verano caluroso', 0, 20, 1),
      n(SEASONS, 'persist', 'Chance a year repeats the last kind', 'Probabilidad de que un año repita el tipo del anterior', 0, 1, 0.05),
      n(SEASONS, 'spread', 'How much one winter may differ from another', 'Cuánto puede diferir un invierno de otro', 0, 1, 0.05),
      n(SEASONS, 'farYears', 'Share of years whose fruit is far from the nest', 'Parte de años con la fruta lejos del nido', 0, 1, 0.05),
      n(SEASONS, 'reachLow', 'What trees on the wrong side bear those years (×)', 'Lo que dan esos años los árboles del lado equivocado (×)', 0, 1, 0.05),
    ].map((f) => ({ ...f, fullId: `Day and night.seasons.${f.key}` })),
    n(SEASONS, 'winterAt', 'When in the year winter is deepest (0-1)', 'Momento del año en que el invierno es más crudo (0-1)', 0, 0.99, 0.01),
  ]},
  { title: { en: 'Body temperature', es: 'Temperatura corporal' }, cat: 'body', fieldsOf: [
    b(THERMAL, 'voluntary', 'Seek shelter before thermal harm', 'Buscar refugio antes del daño térmico'),
    b(THERMAL, 'enabled', 'Body temperature', 'Temperatura corporal'),
    n(THERMAL, 'safeMin', 'Cold below (°C)', 'Frío por debajo de (°C)', -10, 30, 1),
    n(THERMAL, 'safeMax', 'Heat above (°C)', 'Calor por encima de (°C)', 20, 50, 1),
    n(THERMAL, 'preferred', 'Body °C where nothing costs extra', '°C del cuerpo en los que nada cuesta de más', 10, 40, 1),
    n(THERMAL, 'lethalMin', 'Body °C that kills by cold at once', '°C del cuerpo que matan de frío al instante', -10, 20, 1),
    n(THERMAL, 'lethalMax', 'Body °C that kills by heat at once', '°C del cuerpo que matan de calor al instante', 30, 60, 1),
    n(THERMAL, 'exchange', 'How fast the body follows the air', 'Rapidez con que el cuerpo sigue al aire', 0.005, 0.5, 0.005),
    n(THERMAL, 'stressRate', 'Stress per second per °C out of range', 'Estrés por segundo y °C fuera de rango', 0, 5, 0.05),
    n(THERMAL, 'recover', 'Stress recovered per second in range', 'Estrés que recupera por segundo en rango', 0, 20, 0.5),
    n(THERMAL, 'nestTemp', 'Temperature deep in the nest (°C)', 'Temperatura dentro del nido (°C)', 0, 40, 1),
    n(THERMAL, 'shade', 'Cooler under a tree crown (°C)', 'Más fresco bajo la copa de un árbol (°C)', 0, 15, 0.5),
    n(THERMAL, 'nestBuffer', 'How much the nest shields from the outside air', 'Cuánto aísla el nido del aire de fuera', 0, 1, 0.05),
    n(THERMAL, 'wetChill', 'Cooling while soaked (°C)', 'Enfriamiento al estar empapada (°C)', 0, 15, 0.5),
    n(THERMAL, 'moveHeat', 'Warmth from walking (°C over the air)', 'Calor por caminar (°C sobre el aire)', 0, 8, 0.5),
    n(THERMAL, 'coldHunger', 'Extra hunger per °C of cold', 'Hambre extra por cada °C de frío', 0, 0.3, 0.01),
    n(THERMAL, 'heatThirst', 'Extra thirst per °C of heat', 'Sed extra por cada °C de calor', 0, 0.3, 0.01),
    n(THERMAL, 'coldSlow', 'Speed lost per °C of cold', 'Velocidad que pierde por cada °C de frío', 0, 0.2, 0.01),
    n(THERMAL, 'minSpeed', 'Slowest the cold makes her (fraction)', 'Lo más lenta que la vuelve el frío (fracción)', 0.1, 1, 0.05),
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
    b(SLEEP, 'askAlways', 'Ask about unseen consequences even without bites', 'Preguntarse por consecuencias desconocidas incluso sin bocados'),
    n(SLEEP, 'replayRate', 'Learning per memory rehearsal', 'Aprendizaje por repaso de memoria', 0, 1, 0.05),
    n(SLEEP, 'downscale', 'Trait weight lost before rehearsal', 'Peso de rasgos perdido antes del repaso', 0, 1, 0.05),
    b(SLEEP, 'consolidate', 'Sort the day while asleep', 'Ordenar el día al dormir'),
    n(SLEEP, 'boost', 'Confidence a replayed belief gains', 'Confianza que gana una creencia repasada', 0, 1, 0.05),
    n(SLEEP, 'replay', 'Rounds of replay of the remembered fruit', 'Rondas de repaso de la fruta recordada', 0, 20, 1),
  ]},
  { title: { en: 'Night mind', es: 'Mente nocturna' }, cat: 'mind', fieldsOf: [
    n(NIGHTAI, 'timeout', 'Remote night mind timeout (seconds)', 'Tiempo de espera de la mente nocturna remota (segundos)', 0.5, 30, 0.5),
    n(NIGHTAI, 'log', 'Night mind reports kept', 'Informes conservados de la mente nocturna', 5, 200, 5),
    b(NIGHTAI, 'enabled', 'A model proposes hypotheses at night', 'Un modelo propone hipótesis de noche'),
    n(NIGHTAI, 'minSupport', 'Fruit she tasted that must back a proposal', 'Frutas probadas que deben respaldar una propuesta', 1, 6, 1),
    n(NIGHTAI, 'trust', 'Trust in a kept proposal', 'Confianza en una propuesta aceptada', 0.1, 1, 0.05),
    n(NIGHTAI, 'maxProposals', 'Proposals weighed per night', 'Propuestas que sopesa por noche', 1, 10, 1),
  ]},
  { title: { en: 'Scientific night', es: 'Noche científica' }, cat: 'mind', fieldsOf: [
    b(SCIENCE, 'enabled', 'Each question carries a prediction, answered as a verdict', 'Cada pregunta lleva una predicción, que vuelve como veredicto'),
    w(SCIENCE, 'order', 'Which question she tries first', 'Qué pregunta prueba primero', [
      ['asked', 'Most asked', 'La más preguntada'],
      ['lp', 'Most to learn × safest', 'La que más enseña × más segura'],
    ]),
    n(SCIENCE, 'window', 'Errors kept per trait', 'Errores que guarda por rasgo', 2, 20, 1),
    n(SCIENCE, 'noisy', 'Error above which a trait is noise for now', 'Error por encima del cual un rasgo es ruido por ahora', 0.05, 1, 0.05),
    n(SCIENCE, 'novelty', 'Progress she expects of an untested trait', 'Progreso que espera de un rasgo sin probar', 0, 1, 0.05),
    n(SCIENCE, 'reach', 'Walk that halves a question\'s worth (px)', 'Camino que reduce a la mitad lo que vale una pregunta (px)', 20, 1000, 10),
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
  { title: { en: 'Caution', es: 'Cautela' }, cat: 'mind', fieldsOf: [
    b(CONDUCT, 'enabled', 'Tries a new kind with a small bite, never again what harmed her', 'Prueba lo nuevo con un bocado pequeño y no vuelve a lo que la dañó'),
    b(CONDUCT, 'learn', 'Writes her own lines of conduct from her bites', 'Escribe sus propias líneas de conducta a partir de sus bocados'),
    n(CONDUCT, 'minSupport', 'Harmful bites a line must have spared to be kept', 'Bocados dañinos que una línea debe haber evitado para quedarse', 1, 10, 1),
    n(CONDUCT, 'power', 'How much more a hunger near the top weighs', 'Cuánto más pesa un hambre cerca del tope', 1, 6, 0.5),
    n(CONDUCT, 'explore', 'Chance she breaks a ban with a trial bite', 'Probabilidad de saltarse una prohibición con un bocado de prueba', 0, 0.5, 0.01),
    n(CONDUCT, 'exploreBelow', '...only while her hunger is below', '...solo mientras su hambre esté por debajo de', 0, 300, 5),
    b(CONDUCT, 'kindFirst', 'Among near ties, a line about the kind wins', 'En casi empates gana la línea sobre la especie'),
    b(CONDUCT, 'declined', 'Fruit she wanted and left counts against a line', 'La fruta que quería y dejó cuenta contra la línea'),
    b(CONDUCT, 'inherit', 'Inherited lines keep being judged in her life', 'Las líneas heredadas se siguen juzgando en su vida'),
  ]},
  { title: { en: 'Experiments', es: 'Experimentos' }, cat: 'mind', fieldsOf: [
    b(EXPERIMENT, 'enabled', 'Tries what the night asked', 'Prueba lo que se preguntó de noche'),
    n(EXPERIMENT, 'portion', 'Size of a trial bite (share of a fruit)', 'Tamaño del mordisco de prueba (fracción de fruta)', 0.05, 1, 0.05),
    n(EXPERIMENT, 'maxWary', 'Wariness above which she does not try', 'Cautela por encima de la cual no prueba', 0, 1, 0.05),
    n(EXPERIMENT, 'agenda', 'Questions carried into the day', 'Preguntas que lleva al día', 1, 20, 1),
  ]},
  { title: { en: 'Choosing what to do', es: 'Elegir qué hacer' }, cat: 'mind', fieldsOf: [
    w(SELECT, 'mode', 'How her program decides', 'Cómo decide su programa', [
      ['program', 'First line that answers', 'Primera línea que contesta'],
      ['freeflow', 'Her lines vote', 'Sus líneas votan'],
      ['freeflow+central', 'They vote, and she holds on', 'Votan, y ella persiste'],
    ]),
    n(SELECT, 'every', 'Seconds between votes', 'Segundos entre votaciones', 0.1, 5, 0.1),
    n(SELECT, 'hold', 'Extra vote for what she is doing', 'Voto extra para lo que está haciendo', 0, 1, 0.05),
    n(SELECT, 'floor', 'Least vote of a line', 'Voto mínimo de una línea', 0, 0.5, 0.01),
    n(SELECT, 'curiosity', 'How loud curiosity votes', 'Cuánto vota la curiosidad', 0, 1, 0.05),
    n(SELECT, 'consume', 'Bonus for consuming what is within reach', 'Bonificación por consumir lo que está al alcance', 0, 3, 0.1),
    n(SELECT, 'reach', 'Within reach (px)', 'Al alcance (px)', 5, 200, 5),
    b(SELECT, 'veto', 'A critical need is not put to the vote', 'Una necesidad crítica no se somete a votación'),
    n(SELECT, 'sequence', 'Seconds a won act keeps the floor (0 = off)', 'Segundos que un acto ganador conserva el turno (0 = no)', 0, 60, 1),
  ]},
  { title: { en: 'Drives', es: 'Impulsos' }, cat: 'mind', fieldsOf: [
    w(DRIVE, 'mode', 'How much a need makes its relief worth', 'Cuánto vale lo que alivia una necesidad', [
      ['innate', 'Innate curve', 'Curva innata'],
      ['learned', 'Learned from the relief she felt', 'Aprendido del alivio que sintió'],
    ]),
    n(DRIVE, 'bins', 'Levels of need it is learned at', 'Niveles de necesidad en los que se aprende', 2, 10, 1),
    n(DRIVE, 'rate', 'How fast it follows what she felt', 'Rapidez con que sigue lo que sintió', 0.02, 1, 0.02),
    n(DRIVE, 'prior', 'Worth before she has felt anything', 'Valor antes de haber sentido nada', 0, 1, 0.05),
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
  { title: { en: 'Adaptive program', es: 'Programa adaptativo' }, cat: 'mind', fieldsOf: [
    n(PROGRAM, 'tick', 'Observation interval (seconds)', 'Intervalo de observación (segundos)', 0.1, 2, 0.05),
    n(PROGRAM, 'record', 'Maximum recorded moments', 'Máximo de momentos registrados', 100, 10000, 100),
    b(PROGRAM, 'learn', 'Rewrites own program from experience', 'Reescribe su programa por experiencia'),
    b(PROGRAM, 'inherit', 'Inherit experience-backed program revisions', 'Hereda las revisiones del programa respaldadas por experiencia'),
    c(PROGRAM, 'watch', 'Introspection & watch depth', 'Introspección y profundidad de observación', [
      ['Off', 'Apagada'],
      ['Watch moments', 'Observa momentos'],
      ['Watch + compete', 'Observa + competencia'],
    ]),
    c(PROGRAM, 'judge', 'What a choice is judged by', 'Por qué se juzga una elección', [['Distress', 'Malestar'], ['Reserves', 'Reservas']]),
    n(PROGRAM, 'horizon', 'Consequence horizon (seconds to judge distress)', 'Horizonte de consecuencias (segundos para juzgar)', 5, 120, 5),
    n(PROGRAM, 'power', 'How much more a need near its top weighs', 'Cuánto más pesa una necesidad cerca de su tope', 1, 6, 0.5),
    n(PROGRAM, 'minSupport', 'Minimum trial evidence needed to weigh a rule', 'Evidencia mínima de pruebas para sopesar una regla', 1, 20, 1),
    n(PROGRAM, 'alpha', 'Chance noise alone gets a line written', 'Probabilidad de que el ruido solo escriba una línea', 0.005, 0.3, 0.005),
    n(PROGRAM, 'margin', 'Least difference in distress that counts', 'Diferencia mínima de malestar que cuenta', 0, 0.1, 0.001),
    n(PROGRAM, 'strictness', 'Statistical strictness (1 = conservative, 0.5 = plastic)', 'Rigor estadístico (1 = conservador, 0.5 = plástico)', 0.2, 2.0, 0.1),
    n(PROGRAM, 'explore', 'Trial exploration rate (chance of trying alternative)', 'Tasa de prueba (probabilidad de probar la alternativa)', 0.05, 0.8, 0.05),
    b(PROGRAM, 'exploreByState', 'Explore less when distressed', 'Prueba menos cuanto peor está'),
    b(PROGRAM, 'darkTrials', 'Night trials toward safety only', 'De noche, solo pruebas hacia la seguridad'),
    n(PROGRAM, 'reconsider', 'Seconds a line leads before it counts as chosen again', 'Segundos que manda una línea antes de contar como elegida otra vez', 2, 60, 1),
    n(PROGRAM, 'trialMax', 'Seconds a trial lasts at most', 'Segundos que dura como mucho una prueba', 2, 60, 1),
    n(PROGRAM, 'every', 'Program review interval (seconds)', 'Intervalo de revisión del programa (segundos)', 5, 180, 5),
    n(PROGRAM, 'maxOwn', 'Maximum learned program lines', 'Máximo de líneas aprendidas', 1, 20, 1),
    b(PROGRAM, 'compound', 'Compound inductive conditions', 'Condiciones compuestas (necesidad + señal)'),
    b(PROGRAM, 'chaining', 'First-available behavior chains', 'Cadenas de conductas (la primera disponible)'),
    b(PROGRAM, 'crisis', 'One-trial learning from an acute crisis', 'Aprende de una sola crisis aguda'),
    n(PROGRAM, 'crisisThreshold', 'Crisis distress threshold', 'Umbral de malestar de una crisis', 0.1, 0.9, 0.05),
    n(PROGRAM, 'crisisRise', 'Crisis: rise over 20 s', 'Crisis: subida en 20 s', 0.05, 0.5, 0.05),
    b(PROGRAM, 'share', 'Share moments with sisters in nest', 'Comparte momentos con sus hermanas en el nido'),
    n(PROGRAM, 'shareBudget', 'Moments passed at one exchange', 'Momentos que pasa en un intercambio', 1, 500, 1),
  ]},
  { title: { en: 'Colony (new sessions)', es: 'Colonia (sesiones nuevas)' }, cat: 'colony', fieldsOf: [
    n(SOCIAL, 'size', 'Individuals in the colony (1 = Fagi alone)', 'Individuos en la colonia (1 = Fagi sola)', 1, 8, 1),
    b(SOCIAL, 'share', 'Tell each other rules in the nest', 'Contarse reglas en el nido'),
    n(SOCIAL, 'touch', 'Distance to exchange in the nest (0 = anywhere)', 'Distancia para intercambiar en el nido (0 = en cualquier parte)', 0, 90, 2),
    b(CASTES, 'enabled', 'Emergent division of labor (castes)', 'División emergente del trabajo (castas)'),
    b(GEN, 'cultureProgram', 'Elders teach self-written code to juveniles', 'Veteranas enseñan código propio a juveniles'),
    n(SOCIAL, 'observe', 'Learning from watching a sister eat', 'Aprender de ver comer a una hermana', 0, 1, 0.05),
    n(SOCIAL, 'trust', 'Trust in a rule told', 'Confianza en una regla contada', 0.1, 1, 0.05),
    w(SOCIAL, 'format', 'What sisters pass on', 'Qué se pasan las hermanas', [
      ['rule', 'Rules', 'Reglas'], ['verdict', 'Verdicts', 'Veredictos'], ['evidence', 'Bites (evidence)', 'Bocados (evidencia)'],
    ]),
    w(SOCIAL, 'topic', 'About what', 'Sobre qué', [['all', 'Everything', 'Todo'], ['food', 'Only food', 'Solo comida']]),
    n(SOCIAL, 'budget', 'Items passed in one exchange (0 = no cap)', 'Cosas que se pasan en un intercambio (0 = sin tope)', 0, 50, 1),
    n(CASTES, 'reinforceRate', 'Castes: how fast a task becomes hers', 'Castas: rapidez con que una tarea se vuelve suya', 0, 1, 0.01),
    n(CASTES, 'decayRate', 'Castes: how fast an unused task fades', 'Castas: rapidez con que se olvida una tarea sin usar', 0, 0.2, 0.005),
  ]},
  { title: { en: 'Colonies', es: 'Colonias' }, cat: 'colony', fieldsOf: [
    { ...n(COLONIES, 'count', 'Colonies (nests) on a new map', 'Colonias (nidos) en un mapa nuevo', 1, 6, 1), fullId: 'Day and night.colonies.count' },
    n(COLONIES, 'founders', 'Founders of each further nest', 'Fundadoras de cada nido adicional', 1, 16, 1),
    n(COLONIES, 'spacing', 'Least distance between two nests (px)', 'Distancia mínima entre dos nidos (px)', 100, 1200, 10),
    n(COLONIES, 'foundAt', 'Fullness from which a colony refounds an empty nest', 'Llenado desde el que una colonia refunda un nido vacío', 0.1, 1, 0.05),
    n(COLONIES, 'every', 'Seconds between looks for an empty nest', 'Segundos entre búsquedas de un nido vacío', 10, 600, 10),
  ]},
  { title: { en: 'External decision API', es: 'API de decisión externa' }, cat: 'system', fieldsOf: [
    b(BACKEND, 'enabled', 'Ask the API', 'Consultar la API'),
    c(BACKEND, 'authority', 'Authority', 'Autoridad', [['Safe', 'Segura'], ['Full', 'Plena']]),
    n(BACKEND, 'minInterval', 'Seconds between queries', 'Segundos entre consultas', 0.2, 60, 0.1),
    n(BACKEND, 'timeout', 'Seconds before giving up', 'Segundos antes de rendirse', 0.2, 30, 0.1),
    n(BACKEND, 'maxTtl', 'Maximum lifetime of an API directive (seconds)', 'Duración máxima de una directiva de la API (segundos)', 1, 120, 1),
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
  { title: { en: 'Stomach', es: 'Estómago' }, cat: 'body', fieldsOf: [
    b(STOMACH, 'enabled', 'A bite fills the stomach and digests slowly', 'Un bocado llena el estómago y se digiere despacio'),
    n(STOMACH, 'capacity', 'Hunger points a full stomach holds', 'Puntos de hambre que caben en el estómago', 5, 200, 5),
    n(STOMACH, 'rate', 'Hunger points digested per second', 'Puntos de hambre que digiere por segundo', 0.1, 10, 0.1),
    n(STOMACH, 'satiety', 'How much of a full stomach she feels as fed', 'Cuánto del estómago lleno siente como saciedad', 0, 1, 0.05),
  ]},
  { title: { en: 'Weight of fruit', es: 'Peso de la fruta' }, cat: 'food', fieldsOf: [
    { ...b(LOAD, 'enabled', 'Fruit weighs and resists (carrying and chewing cost)', 'La fruta pesa y resiste (cargar y masticar cuesta)'), fullId: 'Day and night.load.enabled' },
    n(LOAD, 'range.0', 'Lightest fruit (× a typical one)', 'Fruta más ligera (× una típica)', 0.1, 1, 0.05),
    n(LOAD, 'range.1', 'Heaviest fruit (× a typical one)', 'Fruta más pesada (× una típica)', 1, 5, 0.1),
    n(LOAD, 'hardRange.0', 'Softest fruit (×)', 'Fruta más blanda (×)', 0.1, 1, 0.05),
    n(LOAD, 'hardRange.1', 'Hardest fruit (×)', 'Fruta más dura (×)', 1, 5, 0.1),
    n(LOAD, 'slow', 'Speed lost per unit of load over her strength', 'Velocidad que pierde por unidad de carga sobre su fuerza', 0, 2, 0.05),
    n(LOAD, 'effort', 'Extra energy carrying, per unit over her strength', 'Energía extra al cargar, por unidad sobre su fuerza', 0, 3, 0.05),
    n(LOAD, 'hardGain', 'What a fruit too hard for her gut loses', 'Lo que pierde una fruta demasiado dura para su estómago', 0, 3, 0.1),
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
  { title: { en: 'Wind', es: 'Viento' }, cat: 'climate', fieldsOf: [
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
    n(PHERO, 'life', 'Seconds until it evaporates', 'Segundos hasta evaporarse', 2, 1200, 5),
    n(PHERO, 'every', 'Seconds between marks', 'Segundos entre marcas', 0.05, 3, 0.05),
    n(PHERO, 'sense', 'Distance at which it is detected', 'Distancia a la que la detecta', 5, 150, 1),
  ]},
  { title: { en: 'Water', es: 'Agua' }, cat: 'world', fieldsOf: [
    // Was bound to a 'vado' key config.js never had: the slider moved nothing. Same id, real key.
    { ...n(WATER, 'shallows', 'Shallow edge where it stands and drinks (px)', 'Vado donde hace pie y bebe (px)', 0, 40, 1), id: 'vado' },
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
  // One group in the first recordings ('Rain.*'): split by what each part decides.
  { title: { en: 'Rain', es: 'Lluvia' }, cat: 'climate', fieldsOf: [
    { ...n(RAIN, 'every.min', 'Min seconds between showers', 'Mín. segundos entre chaparrones', 10, 3600, 10), fullId: 'Rain.every.min' },
    { ...n(RAIN, 'every.max', 'Max seconds between showers', 'Máx. segundos entre chaparrones', 10, 3600, 10), fullId: 'Rain.every.max' },
    { ...n(RAIN, 'duration.min', 'Min shower length (s)', 'Duración mínima del chaparrón (s)', 1, 300, 1), fullId: 'Rain.duration.min' },
    { ...n(RAIN, 'duration.max', 'Max shower length (s)', 'Duración máxima del chaparrón (s)', 1, 300, 1), fullId: 'Rain.duration.max' },
    { ...n(RAIN, 'front.min', 'Min seconds the pressure drops before rain', 'Mín. segundos que baja la presión antes de llover', 0, 300, 5), fullId: 'Rain.front.min' },
    { ...n(RAIN, 'front.max', 'Max seconds the pressure drops before rain', 'Máx. segundos que baja la presión antes de llover', 0, 300, 5), fullId: 'Rain.front.max' },
    { ...n(RAIN, 'recover', 'Seconds for the pressure to recover', 'Segundos en recuperarse la presión', 1, 300, 5), fullId: 'Rain.recover' },
  ]},
  { title: { en: 'Rain: puddles and wash', es: 'Lluvia: charcos y lavado' }, cat: 'climate', fieldsOf: [
    { ...n(RAIN, 'puddles.min', 'Min puddles per shower', 'Mín. charcos por chaparrón', 0, 20, 1), fullId: 'Rain.puddles.min' },
    { ...n(RAIN, 'puddles.max', 'Max puddles per shower', 'Máx. charcos por chaparrón', 0, 20, 1), fullId: 'Rain.puddles.max' },
    { ...n(RAIN, 'puddleRadius.0', 'Min puddle size (px)', 'Tamaño mínimo del charco (px)', 5, 80, 1), fullId: 'Rain.puddleRadius.0' },
    { ...n(RAIN, 'puddleRadius.1', 'Max puddle size (px)', 'Tamaño máximo del charco (px)', 5, 80, 1), fullId: 'Rain.puddleRadius.1' },
    { ...n(RAIN, 'grow', 'Puddle growth while raining (px/s)', 'Crecimiento del charco lloviendo (px/s)', 0, 2, 0.05), fullId: 'Rain.grow' },
    { ...n(RAIN, 'evaporate', 'Puddle drying in the sun (px/s)', 'Secado del charco al sol (px/s)', 0, 2, 0.01), fullId: 'Rain.evaporate' },
    { ...n(RAIN, 'washPhero', 'Rain washes pheromone (× faster)', 'La lluvia borra la feromona (× más rápido)', 1, 200, 1), fullId: 'Rain.washPhero' },
    { ...n(RAIN, 'washScent', 'Rain washes a scent trail (s)', 'La lluvia lava un rastro de olor (s)', 1, 60, 1), fullId: 'Rain.washScent' },
  ]},
  { title: { en: 'Rain: what it costs and teaches', es: 'Lluvia: lo que cuesta y enseña' }, cat: 'climate', fieldsOf: [
    { ...n(RAIN, 'effort', 'Energy spent out in the rain (× walking)', 'Energía a la intemperie bajo la lluvia (× andar)', 1, 5, 0.1), fullId: 'Rain.effort' },
    { ...n(RAIN, 'sample', 'Seconds out in the rain per lesson', 'Segundos bajo la lluvia por lección', 0.5, 30, 0.5), fullId: 'Rain.sample' },
    { ...n(RAIN, 'lesson', 'How much getting rained on teaches', 'Cuánto enseña mojarse', 0, 1, 0.05), fullId: 'Rain.lesson' },
    { ...n(RAIN, 'puddleLesson', 'How much a puddle teaches (dry or not)', 'Cuánto enseña un charco (seco o no)', 0, 1, 0.05), fullId: 'Rain.puddleLesson' },
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
  { title: { en: 'Explore or come back: the choice', es: 'Explorar o volver: la elección' }, cat: 'world', fieldsOf: [
    b(CHOICE, 'enabled', 'She learns whether to go back or explore (needs food sites)', 'Aprende si volver o explorar (necesita sitios de comida)'),
    c(CHOICE, 'policy', 'How she chooses', 'Cómo elige', [['learned', 'aprendido'], ['always go back', 'siempre volver'], ['always explore', 'siempre explorar']]),
    c(CHOICE, 'mode', 'What the learned choice weighs', 'Qué pesa la elección aprendida', [['Values, fixed noise', 'Valores, ruido fijo'], ['Her own uncertainty', 'Su propia incertidumbre']]),
    b(CHOICE, 'genes', 'Her starting beliefs and patience are inherited', 'Sus creencias iniciales y su paciencia se heredan'),
    n(CHOICE, 'temper', 'Noise when choosing', 'Ruido al elegir', 0.01, 1, 0.01),
    n(CHOICE, 'temperSpread', 'How much that noise differs between individuals', 'Cuánto difiere ese ruido entre individuos', 0, 1.5, 0.05),
  ]},
  { title: { en: 'Larder', es: 'Despensa' }, cat: 'colony', fieldsOf: [
    b(LARDER, 'enabled', 'The nest fills up, and she predicts the pantry between visits', 'El nido se llena, y ella predice la despensa entre visitas'),
    n(LARDER, 'capacity', 'Rations the nest holds', 'Raciones que caben en el nido', 4, 60, 1),
    n(LARDER, 'eatIfHunger', 'Hunger from which she eats a load that does not fit', 'Hambre desde la que se come la carga que no cabe', 0, 1, 0.05),
    b(LARDER, 'learn', 'She learns how fast the pantry empties', 'Aprende a qué ritmo se vacía la despensa'),
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
    n(MAPGEN, 'density', 'Obstacle density factor (new maps)', 'Factor de densidad de objetos (mapas nuevos)', 0.2, 3, 0.1),
    b(MAPGEN, 'hazards', 'Hazard terrain and mud patches (new maps)', 'Terreno peligroso y zonas de barro (mapas nuevos)'),
    n(MAPGEN, 'mudPatches', 'Number of mud traps (new maps)', 'Número de trampas de barro (mapas nuevos)', 0, 15, 1),
    n(MAPGEN, 'foodVariety', 'Food variety factor (new maps)', 'Factor de variedad de comida (mapas nuevos)', 0.2, 3, 0.1),
  ]},
  // Blocks added after the first recordings: new titles, so new ids.
  { title: { en: 'Urgency', es: 'Urgencia' }, cat: 'body', fieldsOf: [
    n(NEEDS, 'critical', 'Hunger or thirst (fraction) that overrides everything', 'Hambre o sed (fracción) que pasa por delante de todo', 0.2, 0.95, 0.05),
    n(NEEDS, 'shelterMargin', 'Seconds of cushion leaving shelter for water', 'Segundos de margen al salir del refugio a por agua', 0, 60, 1),
  ]},
  { title: { en: 'Health', es: 'Salud' }, cat: 'body', fieldsOf: [
    b(HEALTH, 'enabled', 'Health and wounds', 'Salud y heridas'),
    n(HEALTH, 'max', 'Full health (points)', 'Salud completa (puntos)', 20, 300, 10),
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
    b(HABITS, 'learn', 'Keep learning new habits', 'Seguir aprendiendo hábitos nuevos'),
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
    n(LIFE, 'provision', 'Fruit a mother must bring home herself before each brood', 'Fruta que una madre debe traer ella misma antes de cada cría', 0, 10, 1),
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
    b(GEN, 'sexual', 'A mother and a father, each picked by fitness (needs sexes)', 'Una madre y un padre, elegidos por aptitud (necesita sexos)'),
  ]},
  { title: { en: 'Individual variation', es: 'Variación individual' }, cat: 'colony', fieldsOf: [
    b(VARY, 'founders', 'The first generation is born varied', 'La primera generación nace variada'),
    b(VARY, 'births', 'Every newborn is born varied', 'Cada recién nacida nace variada'),
    n(VARY, 'spread', 'How much individuals differ (typical gap, 0.1 ≈ ±10 %)', 'Cuánto difieren los individuos (diferencia típica, 0.1 ≈ ±10 %)', 0, 0.5, 0.01),
    n(VARY, 'limit', 'Furthest a trait may go (0.4 = ×0.6 … ×1.4)', 'Lo más lejos que puede llegar un rasgo (0.4 = ×0.6 … ×1.4)', 0.05, 0.9, 0.05),
    n(VARY, 'heritability', 'Heritability: share a newborn takes from her parents', 'Heredabilidad: parte que la cría toma de sus padres', 0, 1, 0.05),
    ...[
      ['speed', 'Speed', 'Velocidad'],
      ['energyMax', 'Energy reserves', 'Reservas de energía'],
      ['metabolism', 'Metabolism (hunger and walking cost)', 'Metabolismo (hambre y gasto al caminar)'],
      ['thirst', 'Thirst', 'Sed'],
      ['insulation', 'Insulation from heat and cold', 'Aislamiento del calor y el frío'],
      ['view', 'Sight range', 'Alcance de la vista'],
      ['smell', 'Smell', 'Olfato'],
      ['memory', 'Memory (how slowly she forgets)', 'Memoria (qué tan despacio olvida)'],
      ['tolerance', 'Poison tolerance', 'Tolerancia al veneno'],
      ['life', 'Lifespan', 'Esperanza de vida'],
    ].map(([k, en, es]) => n(VARY, `weight.${k}`, `How much it varies: ${en} (× spread)`, `Cuánto varía: ${es} (× la diferencia típica)`, 0, 3, 0.1)),
  ]},
  { title: { en: 'Evolving body', es: 'Cuerpo evolutivo' }, cat: 'colony', fieldsOf: [
    b(MORPH, 'enabled', 'Inherited organs: brain, gut, muscle, eyes, antennae, size', 'Órganos heredados: cerebro, estómago, músculo, ojos, antenas, tamaño'),
    n(MORPH, 'mutation', 'Mutation of each organ (factor)', 'Mutación de cada órgano (factor)', 0, 0.3, 0.005),
    n(MORPH, 'founders', 'Spread of the founders\' organs', 'Variación de los órganos de las fundadoras', 0, 0.3, 0.005),
    n(MORPH, 'costPower', 'How fast a bigger organ costs more', 'Qué tan rápido cuesta más un órgano mayor', 1, 3, 0.05),
    n(MORPH, 'brainLife', 'Life a bigger brain costs', 'Vida que cuesta un cerebro mayor', 0, 3, 0.1),
    n(MORPH, 'brainBrood', 'Breeding a bigger brain slows', 'Cuánto frena la cría un cerebro mayor', 0, 3, 0.1),
    n(MORPH, 'fecundity', 'A bigger mother breeds faster', 'Una madre mayor cría más rápido', 0, 3, 0.1),
    n(MORPH, 'choice', 'How much a female prefers the stronger male', 'Cuánto prefiere la hembra al macho más fuerte', 0, 3, 0.1),
    n(MORPH, 'sizeSpeed', 'A heavier body is slower', 'Un cuerpo más pesado es más lento', 0, 1, 0.05),
    n(MORPH, 'oxygen', '°C her heat limit drops per unit of size', '°C que baja su límite de calor por unidad de tamaño', 0, 60, 1),
    { ...n(MORPH.maternal, 'share', 'What the mother lived shapes each brood', 'Lo que vivió la madre moldea cada cría', 0, 1, 0.05), id: 'maternal.share' },
    { ...n(MORPH.maternal, 'fed', 'How much her hunger sets the egg\'s provisioning', 'Cuánto fija su hambre lo que lleva el huevo', 0, 1, 0.05), id: 'maternal.fed' },
    { ...b(MORPH.plastic, 'enabled', 'What she lives changes her organs', 'Lo que vive cambia sus órganos'), id: 'plastic.enabled' },
    c(MORPH, 'inherit', 'What daughters inherit of what was lived', 'Qué heredan las hijas de lo vivido',
      [['Only genes (Darwin)', 'Solo genes (Darwin)'], ['How much she can change (Baldwin)', 'Cuánto puede cambiar (Baldwin)'], ['A fading mark (epigenetic)', 'Una marca que se diluye (epigenética)']]),
    { ...n(MORPH.epigenetic, 'share', 'Share of what was lived in the mark', 'Parte de lo vivido en la marca', 0, 1, 0.05), id: 'epigenetic.share' },
    { ...n(MORPH.epigenetic, 'keep', 'Share of a mark kept each generation', 'Parte de la marca que se conserva por generación', 0, 1, 0.05), id: 'epigenetic.keep' },
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

// Organize the adaptive program by task without changing saved/replayed IDs.
const adaptiveIndex = GROUPS.findIndex((g) => g.title.en === 'Adaptive program');
const adaptive = GROUPS[adaptiveIndex];
const adaptiveSections = [
  ['Adaptive program', 'Programa adaptativo', ['learn', 'inherit', 'watch', 'every', 'maxOwn', 'compound', 'chaining']],
  ['Trials and observation', 'Pruebas y observación', ['tick', 'record', 'explore', 'exploreByState', 'darkTrials', 'reconsider', 'trialMax']],
  ['Evidence and evaluation', 'Evidencia y evaluación', ['judge', 'horizon', 'power', 'minSupport', 'alpha', 'margin', 'strictness']],
  ['Crisis learning', 'Aprendizaje en crisis', ['crisis', 'crisisThreshold', 'crisisRise']],
  ['Sharing experience', 'Compartir experiencias', ['share', 'shareBudget']],
];
GROUPS.splice(adaptiveIndex, 1, ...adaptiveSections.map(([en, es, keys]) => ({
  title: { en, es }, cat: 'mind',
  fieldsOf: keys.map((key) => ({ ...adaptive.fieldsOf.find((f) => f.key === key), fullId: `Adaptive program.${key}` })),
})));

// Each field needs a stable name to be saved under: the group's plus its
// key. Food groups use the type, which doesn't change with the language.
for (const group of GROUPS) {
  const base = group.title.type ?? group.title.en;
  // `fullId`: a field that moved to another group keeps the id it was recorded under.
  for (const field of group.fieldsOf) field.id = field.fullId ?? `${base}.${field.id ?? field.key}`;
}

// Two fields under one id would save and replay as one: refuse it at load.
{
  const ids = GROUPS.flatMap((g) => g.fieldsOf).map((f) => f.id);
  const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (twice.length) throw new Error(`settings: repeated ids ${twice.join(', ')}`);
}

// The schema as it stands (groups, their fields), for checks and tools.
export const settingsGroups = () => GROUPS;

// The factory values, to be able to go back.
const ORIGINAL = GROUPS.flatMap((g) => g.fieldsOf).map((c) => ({ c, value: read(c) }));
const BY_ID = new Map(GROUPS.flatMap((g) => g.fieldsOf).map((c) => [c.id, c]));

function read({ obj, key, values }) {
  const v = key.includes('.') ? key.split('.').reduce((o, k) => o[k], obj) : obj[key];
  return values ? Math.max(0, values.indexOf(v)) : v;
}

function write({ obj, key, values }, value) {
  if (values) value = values[value] ?? values[0];
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
  { id: 'climate', icon: '🌦', en: 'Climate', es: 'Clima', hint: { en: 'Day and night, temperature, seasons, rain and wind', es: 'Día y noche, temperatura, estaciones, lluvia y viento' } },
  { id: 'world', icon: '🌍', en: 'World', es: 'Mundo', hint: { en: 'Water, trees, scent and the map', es: 'Agua, árboles, olores y el mapa' } },
  { id: 'food', icon: '🍎', en: 'Food', es: 'Alimentos', hint: { en: 'Each fruit, tastes and food sources', es: 'Cada fruto, sabores y fuentes de comida' } },
  { id: 'body', icon: '🫀', en: 'Body', es: 'Cuerpo', hint: { en: 'Senses, needs, energy, sleep, temperature, health', es: 'Sentidos, necesidades, energía, sueño, temperatura, salud' } },
  { id: 'mind', icon: '🧠', en: 'Mind', es: 'Mente', hint: { en: 'Learning, memory, exploring, instincts, habits', es: 'Aprendizaje, memoria, exploración, instintos, hábitos' } },
  { id: 'colony', icon: '🐜', en: 'Colony & life', es: 'Colonia y vida', hint: { en: 'Sisters, breeding, inheritance, nest and trail', es: 'Hermanas, crianza, herencia, nido y rastro' } },
  { id: 'system', icon: '⚙', en: 'System', es: 'Sistema', hint: { en: 'Camera and external decision API', es: 'Cámara y API de decisión externa' } },
];
// What each tab is for, shown under the tools while it is open.
const ABOUT = {
  climate: {
    en: 'The weather of the world: how long a day and a year last, how warm the air is, when winter comes and how often and how long it rains. Rain and the average temperature always apply; the daily light and warmth need “Day and night” on, and winters need “Seasons” on.',
    es: 'El tiempo del mundo: cuánto duran un día y un año, qué tan cálido es el aire, cuándo llega el invierno y cada cuánto y cuánto tiempo llueve. La lluvia y la temperatura media siempre se aplican; la luz y el calor del día necesitan “Día y noche” encendido, y los inviernos, “Estaciones”.',
  },
  world: {
    en: 'The ground she lives on: water, trees and how they bear, scent trails and how new maps are drawn.',
    es: 'El terreno en el que vive: agua, árboles y cómo dan fruta, rastros de olor y cómo se generan los mapas nuevos.',
  },
  food: {
    en: 'What each fruit does when eaten, how tastes work and how much fruit weighs.',
    es: 'Lo que hace cada fruta al comerla, cómo funcionan los sabores y cuánto pesa la fruta.',
  },
  body: {
    en: 'Her body: senses, speed, hunger, thirst, energy, sleep, temperature and health. These decide how hard it is to stay alive.',
    es: 'Su cuerpo: sentidos, velocidad, hambre, sed, energía, sueño, temperatura y salud. Deciden qué tan difícil es seguir viva.',
  },
  mind: {
    en: 'How she learns and decides: memory, beliefs, the program she writes herself, caution, curiosity and what she does at night.',
    es: 'Cómo aprende y decide: memoria, creencias, el programa que escribe ella misma, cautela, curiosidad y lo que hace de noche.',
  },
  colony: {
    en: 'Life beyond one Fagi: sisters, breeding, what is inherited, the nest and the pheromone trail.',
    es: 'La vida más allá de una Fagi: hermanas, crianza, lo que se hereda, el nido y el rastro de feromona.',
  },
  system: {
    en: 'The camera and the optional external decision API. They don’t change the simulated world.',
    es: 'La cámara y la API externa de decisión opcional. No cambian el mundo simulado.',
  },
};
const CAT_KEY = 'fagi.settings.cat';
const HELP_KEY = 'fagi.settings.help';
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
  let modifiedOnly = false;
  // Every explanation open at once, or only the ones asked for with ⓘ.
  let allHelp = (() => { try { return localStorage.getItem(HELP_KEY) === '1'; } catch { return false; } })();
  const opened = new Map();

  // Two panes: the categories (with how many settings of each are off
  // factory) and the groups of the chosen one. A search looks through all.
  box.innerHTML = `
    <nav class="set-nav"></nav>
    <div class="set-main">
      <div class="set-tools">
        <input class="set-search" type="search" autocomplete="off">
        <button class="set-modified" type="button" aria-pressed="false"></button>
        <button class="set-expand" type="button"></button>
        <button class="set-help-all" type="button" aria-pressed="false"></button>
      </div>
      <p class="set-hint" role="status"></p>
      <div class="set-groups"></div>
    </div>`;
  const nav = box.querySelector('.set-nav');
  const search = box.querySelector('.set-search');
  const expand = box.querySelector('.set-expand');
  const modified = box.querySelector('.set-modified');
  modified.addEventListener('click', () => {
    modifiedOnly = !modifiedOnly;
    modified.setAttribute('aria-pressed', String(modifiedOnly));
    buildNav();
    buildGroups();
  });
  const helpAll = box.querySelector('.set-help-all');
  helpAll.addEventListener('click', () => {
    allHelp = !allHelp;
    try { localStorage.setItem(HELP_KEY, allHelp ? '1' : '0'); } catch { /* not remembered */ }
    paintHelpAll();
    for (const el of list.querySelectorAll('.field-help')) el.hidden = !allHelp;
    for (const el of list.querySelectorAll('.field-info')) el.setAttribute('aria-expanded', String(allHelp));
  });
  function paintHelpAll() {
    helpAll.setAttribute('aria-pressed', String(allHelp));
    helpAll.textContent = allHelp ? L('ⓘ Hide explanations', 'ⓘ Ocultar explicaciones') : L('ⓘ Show explanations', 'ⓘ Ver explicaciones');
    helpAll.title = L('Shows under every setting what it means and what changing it does', 'Muestra bajo cada ajuste qué significa y qué implica cambiarlo');
  }
  const hint = box.querySelector('.set-hint');
  const list = box.querySelector('.set-groups');
  const L = (en, es) => (getLang() === 'es' ? es : en);

  search.addEventListener('input', () => { query = search.value.trim(); buildNav(); buildGroups(); });
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
      btn.setAttribute('aria-pressed', String(!query && c.id === cat));
      btn.className = 'set-cat';
      btn.title = c.hint[getLang()] ?? c.hint.en;
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
  // The range a slider allows, its step and its factory value, in words.
  function limits(field) {
    const factory = FACTORY.get(field);
    if (field.toggle) return L(`Factory: ${factory ? 'on' : 'off'}`, `De fábrica: ${factory ? 'encendido' : 'apagado'}`);
    if (field.choices) return L(`Factory: ${field.choices[factory]?.en ?? factory}`, `De fábrica: ${field.choices[factory]?.es ?? factory}`);
    return L(`Allowed: ${field.min} to ${field.max}, in steps of ${field.step} · Factory: ${factory}`,
      `Permitido: de ${field.min} a ${field.max}, en pasos de ${field.step} · De fábrica: ${factory}`);
  }

  function row(field, group) {
    const lang = getLang();
    const el = document.createElement(field.toggle ? 'label' : 'div');
    el.className = `field ${field.toggle ? 'toggle' : field.choices ? 'choice' : 'slider'}`;
    const top = document.createElement('div');
    top.className = 'field-top';
    const name = document.createElement('span');
    name.className = 'field-name';
    name.textContent = field.label[lang] ?? field.label.en;
    name.id = `label-${field.id.replace(/\W+/g, '-')}`;
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'field-reset';
    reset.textContent = '↺';
    // ⓘ opens what the setting means and what changing it does.
    const info = document.createElement('button');
    info.type = 'button';
    info.className = 'field-info';
    info.textContent = 'ⓘ';
    info.title = L('What is this?', '¿Qué es esto?');
    info.setAttribute('aria-label', `${name.textContent}: ${info.title}`);
    info.setAttribute('aria-expanded', String(allHelp));
    const help = document.createElement('div');
    help.className = 'field-help';
    help.id = `help-${field.id.replace(/\W+/g, '-')}`;
    help.hidden = !allHelp;
    const text = fieldHelp(field, group, lang);
    help.innerHTML = (text ? `<p></p>` : '') + '<p class="field-limits"></p>';
    if (text) help.firstChild.textContent = text;
    help.querySelector('.field-limits').textContent = limits(field);
    info.setAttribute('aria-controls', help.id);
    info.addEventListener('click', (e) => {
      // Inside a switch's <label>: don't flip the switch.
      e.preventDefault();
      e.stopPropagation();
      help.hidden = !help.hidden;
      info.setAttribute('aria-expanded', String(!help.hidden));
    });
    top.append(name, info, reset);
    el.append(top);

    const mark = () => {
      const off = changed(field);
      el.classList.toggle('changed', off);
      reset.hidden = !off;
      const factory = FACTORY.get(field);
      const shown = field.toggle ? L(factory ? 'on' : 'off', factory ? 'encendido' : 'apagado')
        : field.choices ? field.choices[factory]?.[lang] ?? factory : factory;
      reset.title = L(`Back to factory (${shown})`, `Volver al de fábrica (${shown})`);
      reset.setAttribute('aria-label', `${name.textContent}: ${reset.title}`);
    };
    // `settled`: the change is done (not mid-drag), the counts catch up.
    const set = (v, settled) => {
      const before = read(field);
      write(field, v);
      if (before !== v) onChange?.(field.id, before, v, 'user');
      mark();
      saveSoon();
      if (settled) {
        buildNav();
        for (const summary of list.querySelectorAll('summary')) {
          const group = GROUPS.find((g) => g.title.en === summary.dataset.group);
          const count = group?.fieldsOf.filter(changed).length ?? 0;
          const badge = summary.querySelector('.set-off');
          if (badge) { badge.textContent = count; badge.hidden = !count; }
        }
      }
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
      choice.el.setAttribute('aria-labelledby', name.id);
      el.append(choice.el);
      paint = choice.set;
    } else {
      const s = makeSlider({
        min: field.min, max: field.max, step: field.step, value: read(field),
        onInput: (v) => set(bound(field, v), false),
        onCommit: () => buildNav(),
      });
      for (const control of [s.box, s.range]) control.setAttribute('aria-labelledby', name.id);
      top.append(s.box);
      el.append(s.range);
      paint = s.set;
    }
    reset.addEventListener('click', (e) => {
      e.preventDefault();
      const v = FACTORY.get(field);
      set(v, true);
      paint(v);
      if (modifiedOnly) buildGroups();
    });
    el.append(help);
    paint(read(field));
    mark();
    inputs.push({ field, paint, mark });
    return el;
  }

  function buildGroups() {
    list.innerHTML = '';
    inputs = [];
    const q = fold(query);
    const matches = q
      ? GROUPS.map((g) => {
        const inTitle = fold(titleOf(g)).includes(q);
        const fields = g.fieldsOf.filter((f) => inTitle || fold(f.label[getLang()] ?? f.label.en).includes(q) || fold(f.key).includes(q)
          || fold(fieldHelp(f, g, getLang())).includes(q));
        return fields.length ? { g, fields } : null;
      }).filter(Boolean)
      : GROUPS.filter((g) => g.cat === cat).map((g) => ({ g, fields: g.fieldsOf }));
    const shown = matches.map(({ g, fields }) => ({ g, fields: modifiedOnly ? fields.filter(changed) : fields })).filter(({ fields }) => fields.length);
    const here = CATEGORIES.find((c) => c.id === cat);
    hint.textContent = q || modifiedOnly
      ? L(`${shown.reduce((a, s) => a + s.fields.length, 0)} settings found`, `${shown.reduce((a, s) => a + s.fields.length, 0)} ajustes encontrados`)
      : ABOUT[here.id]?.[getLang()] ?? here.hint[getLang()] ?? here.hint.en;
    shown.forEach(({ g, fields }, i) => {
      const det = document.createElement('details');
      // Searching opens every match; browsing opens the first group.
      det.open = Boolean(q) || modifiedOnly || (opened.get(g.title.en) ?? i === 0);
      const off = g.fieldsOf.filter(changed).length;
      const where = q ? CATEGORIES.find((c) => c.id === g.cat) : null;
      det.innerHTML = `<summary><span>${titleOf(g)}</span>`
        + (where ? `<span class="set-where">${where.icon} ${where[getLang()] ?? where.en}</span>` : '')
        + `<span class="set-off" ${off ? '' : 'hidden'}>${off}</span>`
        + `<span class="set-n">${fields.length}</span></summary>`;
      det.querySelector('summary').dataset.group = g.title.en;
      const about = groupHelp(g, getLang());
      if (about) {
        const p = document.createElement('p');
        p.className = 'group-help';
        p.textContent = about;
        det.append(p);
      }
      for (const field of fields) det.append(row(field, g));
      det.addEventListener('toggle', () => {
        if (!query && !modifiedOnly) opened.set(g.title.en, det.open);
        paintExpand();
      });
      list.append(det);
    });
    if (!shown.length) list.innerHTML = `<p class="set-none">${L('Nothing matches.', 'Nada coincide.')}</p>`;
    paintExpand();
  }

  function build() {
    search.placeholder = L('Search a setting…', 'Buscar un ajuste…');
    search.setAttribute('aria-label', search.placeholder);
    modified.textContent = L('Modified only', 'Solo modificados');
    modified.title = L('Shows only the settings that differ from their factory value', 'Muestra solo los ajustes distintos de su valor de fábrica');
    expand.title = L('Opens or folds every group of this tab', 'Abre o pliega todos los grupos de esta pestaña');
    paintHelpAll();
    nav.setAttribute('aria-label', L('Setting categories', 'Categorías de ajustes'));
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

  // The same settings surface is inline during setup and a dialog in play.
  const dialog = document.getElementById('settings');
  let modal = false;
  let returnFocus = null;
  function syncDialog() {
    const next = !overlay.hidden && !document.body.classList.contains('mode-setup');
    if (next === modal) return;
    modal = next;
    document.body.classList.toggle('settings-modal-open', modal);
    if (modal) {
      returnFocus = document.activeElement;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', t('set.title'));
      search.focus({ preventScroll: true });
    } else {
      dialog.removeAttribute('role');
      dialog.removeAttribute('aria-modal');
      dialog.removeAttribute('aria-label');
      returnFocus?.focus({ preventScroll: true });
    }
  }
  new MutationObserver(syncDialog).observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', (event) => {
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      overlay.hidden = true;
    } else if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button, input, select, summary')]
        .filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    }
  });
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
    buildGroups();
    saveSettings();   // all factory: deletes the save
  });

  document.getElementById('btn-clear-trees').addEventListener('click', () => removeAllTrees(world));
  document.getElementById('btn-rain-now').addEventListener('click', () => startRain(world));
  document.getElementById('btn-wipe-memory').addEventListener('click', () => wipe(getFagi()));
}
