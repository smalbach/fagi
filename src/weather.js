// El tiempo, visto desde Fagi: qué nota del cielo y qué aprende de él.
//
// De nacimiento (INSTINCT) trae dos cosas:
//   · nota la presión del aire. Cuando baja (llega un frente), lo siente y se
//     apresura un poco, que es lo que se ha medido en hormigas cortadoras.
//   · unas ganas pequeñas de ponerse a cubierto cuando le cae agua encima.
//
// Lo demás lo aprende:
//   · 'lluvia': lo que le cuesta estar a la intemperie mientras llueve (va
//     empapada, lenta, y cada gota le quita fuerzas). Cada RAIN.sample segundos
//     fuera es una experiencia mala. Con eso las ganas de refugiarse crecen, y
//     synth.js acaba escribiendo "evitar lluvia".
//   · 'presion': qué anuncia notar que la presión baja. Al escampar, si notó el
//     frente antes, la bajada toma el valor de lo que vino detrás (la lluvia,
//     tal como la tiene aprendida). Condicionamiento clásico: la señal se carga
//     con lo que predice. Cuando pesa bastante, al notar el frente vuelve al
//     nido ANTES de que caiga la primera gota.
//   · 'charco': si fiarse de los charcos. Beber de uno suma; ir a uno que
//     recordaba y encontrarlo seco resta (perception.js, needs.js).

import { INSTINCT, RAIN, WATER } from './config.js';
import { learn } from './brain.js';
import { peekWeight } from './memory.js';
import { hebb } from './synapses.js';
import { nestUnder } from './nest.js';

export const RAIN_KEY = 'rain';
export const PRESSURE_KEY = 'pressure';

// Cuánto quiere estar a cubierto mientras llueve: instinto + lo aprendido.
export function rainAversion(fagi) {
  return INSTINCT.rainShelter + Math.max(0, -peekWeight(fagi.brain, RAIN_KEY));
}

// Cuánto quiere volver al nido al notar que la presión baja.
export function pressureAversion(fagi) {
  return INSTINCT.pressureShelter + Math.max(0, -peekWeight(fagi.brain, PRESSURE_KEY));
}

function learnRain(fagi, ep) {
  const part = Math.min(1, ep.secs / RAIN.sample);
  const lost = Math.max(0, ep.energy - fagi.energy);
  const change = learn(fagi.brain, RAIN_KEY, -RAIN.lesson * part, fagi.age, [
    { sense: 'speed', v: WATER.wetSpeed },
    { sense: 'energy', v: -Math.round(lost * 100) / 100 },
  ]);
  fagi.rainLessons = (fagi.rainLessons ?? 0) + 1;
  fagi.lastRainLesson = {
    n: fagi.rainLessons, beliefBefore: change.before.value, beliefAfter: change.after.value,
  };
}

// La bajada de presión se carga con lo que vino después: la lluvia.
function learnPressure(fagi) {
  const rain = fagi.brain.facts[RAIN_KEY]?.value ?? 0;
  if (!rain) return;
  const change = learn(fagi.brain, PRESSURE_KEY, rain, fagi.age, [
    { sense: 'speed', v: WATER.wetSpeed },
  ]);
  fagi.lastPressureLesson = {
    n: (fagi.lastPressureLesson?.n ?? 0) + 1,
    beliefBefore: change.before.value, beliefAfter: change.after.value,
  };
}

// Una vez por frame, después de swim() (que ya dejó fagi.raining al día).
export function senseWeather(fagi, world, dt) {
  const sky = world.rain;
  const before = fagi.pressure ?? 0;
  // Lo que nota: la caída real, según su sensibilidad, y solo pasado un mínimo.
  const fall = (sky?.drop ?? 0) * INSTINCT.pressureSense;
  fagi.pressure = fall >= INSTINCT.pressureMin ? fall : 0;
  // Nota que BAJA (no que está baja): tras escampar sube, y eso no asusta.
  fagi.pressureFalling = !fagi.raining && fagi.pressure > 0 && fagi.pressure > before;
  if (fagi.pressureFalling) fagi.feltFront = true;

  const syn = fagi.brain.synapses;
  if (syn && fagi.pressure > 0) hebb(syn, 'sense:pressure', `key:${fagi.raining ? RAIN_KEY : PRESSURE_KEY}`, dt, fagi.age);

  // Una experiencia de lluvia: el rato que pasa a la intemperie mientras cae.
  const outside = fagi.raining && !nestUnder(fagi, world);
  if (outside && !fagi.rainEp) fagi.rainEp = { secs: 0, energy: fagi.energy };
  const ep = fagi.rainEp;
  if (ep) {
    if (outside) ep.secs += dt;
    if (!outside || ep.secs >= RAIN.sample) {
      learnRain(fagi, ep);
      fagi.rainEp = outside ? { secs: 0, energy: fagi.energy } : null;
    }
  }

  // Escampa: ¿había notado el frente? Entonces aprende lo que anunciaba.
  if (fagi.wasRaining && !fagi.raining) {
    if (fagi.feltFront) learnPressure(fagi);
    fagi.feltFront = false;
  }
  fagi.wasRaining = fagi.raining;
}
