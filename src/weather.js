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

export const RAIN_KEY = 'lluvia';
export const PRESSURE_KEY = 'presion';

// Cuánto quiere estar a cubierto mientras llueve: instinto + lo aprendido.
export function rainAversion(fagi) {
  return INSTINCT.rainShelter + Math.max(0, -peekWeight(fagi.brain, RAIN_KEY));
}

// Cuánto quiere volver al nido al notar que la presión baja.
export function pressureAversion(fagi) {
  return INSTINCT.pressureShelter + Math.max(0, -peekWeight(fagi.brain, PRESSURE_KEY));
}

function aprenderLluvia(fagi, ep) {
  const parte = Math.min(1, ep.secs / RAIN.sample);
  const perdida = Math.max(0, ep.energy - fagi.energy);
  const cambio = learn(fagi.brain, RAIN_KEY, -RAIN.lesson * parte, fagi.age, [
    { sense: 'speed', v: WATER.wetSpeed },
    { sense: 'energy', v: -Math.round(perdida * 100) / 100 },
  ]);
  fagi.rainLessons = (fagi.rainLessons ?? 0) + 1;
  fagi.lastRainLesson = {
    n: fagi.rainLessons, beliefBefore: cambio.before.value, beliefAfter: cambio.after.value,
  };
}

// La bajada de presión se carga con lo que vino después: la lluvia.
function aprenderPresion(fagi) {
  const lluvia = fagi.brain.facts[RAIN_KEY]?.value ?? 0;
  if (!lluvia) return;
  const cambio = learn(fagi.brain, PRESSURE_KEY, lluvia, fagi.age, [
    { sense: 'speed', v: WATER.wetSpeed },
  ]);
  fagi.lastPressureLesson = {
    n: (fagi.lastPressureLesson?.n ?? 0) + 1,
    beliefBefore: cambio.before.value, beliefAfter: cambio.after.value,
  };
}

// Una vez por frame, después de swim() (que ya dejó fagi.raining al día).
export function senseWeather(fagi, world, dt) {
  const cielo = world.rain;
  const antes = fagi.pressure ?? 0;
  // Lo que nota: la caída real, según su sensibilidad, y solo pasado un mínimo.
  const caida = (cielo?.drop ?? 0) * INSTINCT.pressureSense;
  fagi.pressure = caida >= INSTINCT.pressureMin ? caida : 0;
  // Nota que BAJA (no que está baja): tras escampar sube, y eso no asusta.
  fagi.pressureFalling = !fagi.raining && fagi.pressure > 0 && fagi.pressure > antes;
  if (fagi.pressureFalling) fagi.feltFront = true;

  const syn = fagi.brain.synapses;
  if (syn && fagi.pressure > 0) hebb(syn, 'sense:presion', `key:${fagi.raining ? RAIN_KEY : PRESSURE_KEY}`, dt, fagi.age);

  // Una experiencia de lluvia: el rato que pasa a la intemperie mientras cae.
  const fuera = fagi.raining && !nestUnder(fagi, world);
  if (fuera && !fagi.rainEp) fagi.rainEp = { secs: 0, energy: fagi.energy };
  const ep = fagi.rainEp;
  if (ep) {
    if (fuera) ep.secs += dt;
    if (!fuera || ep.secs >= RAIN.sample) {
      aprenderLluvia(fagi, ep);
      fagi.rainEp = fuera ? { secs: 0, energy: fagi.energy } : null;
    }
  }

  // Escampa: ¿había notado el frente? Entonces aprende lo que anunciaba.
  if (fagi.wasRaining && !fagi.raining) {
    if (fagi.feltFront) aprenderPresion(fagi);
    fagi.feltFront = false;
  }
  fagi.wasRaining = fagi.raining;
}
