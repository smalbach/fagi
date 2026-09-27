// The weather, as Fagi sees it: what she notices of the sky and what she learns from it.
//
// From birth (INSTINCT) she brings two things:
//   · she notices air pressure. When it drops (a front arrives), she feels it and
//     hurries a little, which is what has been measured in leafcutter ants.
//   · a small urge to take cover when water falls on her.
//
// The rest she learns:
//   · 'rain': what it costs her to be out in the open while it rains (she's
//     soaked, slow, and every drop saps her strength). Every RAIN.sample seconds
//     outside is a bad experience. With that the urge to shelter grows, and
//     synth.js ends up writing "avoid rain".
//   · 'pressure': what noticing the pressure drop announces. When it clears, if she noticed the
//     front beforehand, the drop takes on the value of what came after (the rain,
//     as she has learned it). Classical conditioning: the signal gets loaded
//     with what it predicts. When it weighs enough, on noticing the front she goes back to the
//     nest BEFORE the first drop falls.
//   · 'puddle': whether to trust puddles. Drinking from one adds; going to one she
//     remembered and finding it dry subtracts (perception.js, needs.js).

import { INSTINCT, RAIN, WATER } from './config.js';
import { learn } from './brain.js';
import { peekWeight } from './memory.js';
import { hebb } from './synapses.js';
import { nestUnder } from './nest.js';

export const RAIN_KEY = 'rain';
export const PRESSURE_KEY = 'pressure';

// How much she wants to be under cover while it rains: instinct + what she has learned.
export function rainAversion(fagi) {
  return INSTINCT.rainShelter + Math.max(0, -peekWeight(fagi.brain, RAIN_KEY));
}

// How much she wants to go back to the nest on noticing the pressure drop.
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

// The pressure drop gets loaded with what came after: the rain.
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

// Once per frame, after swim() (which has already brought fagi.raining up to date).
export function senseWeather(fagi, world, dt) {
  const sky = world.rain;
  const before = fagi.pressure ?? 0;
  // What she notices: the real drop, scaled by her sensitivity, and only past a minimum.
  const fall = (sky?.drop ?? 0) * INSTINCT.pressureSense;
  fagi.pressure = fall >= INSTINCT.pressureMin ? fall : 0;
  // She notices it DROPPING (not that it's low): after it clears it rises, and that isn't scary.
  fagi.pressureFalling = !fagi.raining && fagi.pressure > 0 && fagi.pressure > before;
  if (fagi.pressureFalling) fagi.feltFront = true;

  const syn = fagi.brain.synapses;
  if (syn && fagi.pressure > 0) hebb(syn, 'sense:pressure', `key:${fagi.raining ? RAIN_KEY : PRESSURE_KEY}`, dt, fagi.age);

  // A rain experience: the stretch she spends out in the open while it falls.
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

  // It clears: had she noticed the front? Then she learns what it announced.
  if (fagi.wasRaining && !fagi.raining) {
    if (fagi.feltFront) learnPressure(fagi);
    fagi.feltFront = false;
  }
  fagi.wasRaining = fagi.raining;
}
