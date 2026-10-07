// Body temperature: what the air does to her, and what she learns about it.
//
// Innate (she is born with it, like interoception.js): feeling too cold or too
// hot, and that it hurts. Stress builds up outside the safe range and, full,
// kills. A reflex takes her home when it is about to.
//
// Learned (like weather.js learns the rain):
//   · 'cold' / 'heat': what a stretch of it costs her (THERMAL.sample seconds
//     outside the safe range is a bad experience). synth.js ends up writing
//     "avoid cold".
//   · 'refuge': whether the nest helps. Going in cold and coming out of it
//     warmer is relief; she is not born knowing it (spec §8.5).
//   · 'dusk': what the light going down announces. When the night's cold comes
//     after she noticed the dark, the dark takes on the value of the cold
//     (classical conditioning, like 'pressure'). Weighing enough, she goes home
//     at dusk, before it bites.
//
// She never reads the clock or the air: only her own temperature and the light.

import { THERMAL, CYCLE } from './config.js';
import { cycleAt } from './cycle.js';
import { learn } from './brain.js';
import { peekWeight } from './memory.js';
import { nestUnder } from './nest.js';
import { nestOf } from './world.js';
import { isTree, radiusOf } from './obstacles.js';
import { bodyOf } from './biology.js';
import { thermalOfContact, nestWarmth } from './things.js';
import { coldAt } from './habitats.js';

export const COLD_KEY = 'cold';
export const HEAT_KEY = 'heat';
export const REFUGE_KEY = 'refuge';
export const DUSK_KEY = 'dusk';

const round1 = (v) => Math.round(v * 10) / 10;

// Under a tree crown: shade, while the sun is up.
function inShade(fagi, world) {
  return world.objects.some((o) => isTree(o) && Math.hypot(o.x - fagi.x, o.y - fagi.y) <= radiusOf(o) * 1.4);
}

const isWet = (fagi, inNest) => (fagi.wet ?? 0) > 0 || fagi.swimming || (fagi.raining && !inNest);

// The temperature her body is heading to right now.
export function targetTemperature(fagi, world, sky, inNest) {
  // The air where she is: the sky's, less what her habitat takes off (HABITATS).
  const nest = inNest ? nestOf(world, fagi) : null;
  const air = sky.ambient - (nest ? coldAt(world, nest.x, nest.y) : coldAt(world, fagi.x, fagi.y));
  let target = inNest
    ? THERMAL.nestBuffer * (THERMAL.nestTemp + nestWarmth(world, nest)) + (1 - THERMAL.nestBuffer) * air
    : air;
  if (!inNest && fagi.moving) target += THERMAL.moveHeat;
  if (!inNest && sky.light > CYCLE.minLight && inShade(fagi, world)) target -= THERMAL.shade * sky.light;
  if (isWet(fagi, inNest)) target -= THERMAL.wetChill;
  // Pressed against a cool or a warm thing (things.js, CONCEPT).
  if (!inNest) target += thermalOfContact(fagi, world);
  return target;
}

// °C outside the safe range: > 0 cold or hot, 0 comfortable. `shift` moves
// her own heat limit (a bigger body suffers heat sooner, MORPH.oxygen).
export function discomfort(temp, shift = 0) {
  if (temp < THERMAL.safeMin) return { kind: COLD_KEY, deg: THERMAL.safeMin - temp };
  if (temp > THERMAL.safeMax + shift) return { kind: HEAT_KEY, deg: temp - THERMAL.safeMax - shift };
  return { kind: null, deg: 0 };
}

// What the temperature does to the rest of her body: multipliers on hunger,
// thirst and speed. All ones while comfortable (or with THERMAL off).
export function thermalFactors(fagi) {
  if (!THERMAL.enabled) return { hunger: 1, thirst: 1, speed: 1 };
  const { kind, deg } = discomfort(fagi.temperature ?? THERMAL.preferred, bodyOf(fagi).heatShift ?? 0);
  return {
    hunger: kind === COLD_KEY ? 1 + THERMAL.coldHunger * deg : 1,
    thirst: kind === HEAT_KEY ? 1 + THERMAL.heatThirst * deg : 1,
    speed: kind === COLD_KEY ? Math.max(THERMAL.minSpeed, 1 - THERMAL.coldSlow * deg) : 1,
  };
}

// How much she wants to move away from the cold (or the heat): a bit of
// instinct and what she has learned it costs.
export function thermalAversion(fagi, kind) {
  return THERMAL.instinct + Math.max(0, -peekWeight(fagi.brain, kind));
}

// How much she believes the nest helps. Nothing, until she has lived it.
export const refugeBelief = (fagi) => Math.max(0, peekWeight(fagi.brain, REFUGE_KEY));

// How much the dark makes her want to be home.
export const duskAversion = (fagi) => Math.max(0, -peekWeight(fagi.brain, DUSK_KEY));

// The body follows the air: an exponential step, stable for any dt.
function exchange(fagi, target, inNest, dt) {
  const k = THERMAL.exchange * (isWet(fagi, inNest) ? THERMAL.wetExchange : 1) / bodyOf(fagi).insulation;
  fagi.temperature += (target - fagi.temperature) * (1 - Math.exp(-k * dt));
}

function stress(fagi, dt) {
  const { kind, deg } = discomfort(fagi.temperature, bodyOf(fagi).heatShift ?? 0);
  if (fagi.temperature <= THERMAL.lethalMin || fagi.temperature >= THERMAL.lethalMax) {
    fagi.thermalStress = THERMAL.maxStress;
  } else if (deg > 0) {
    fagi.thermalStress = Math.min(THERMAL.maxStress, fagi.thermalStress + THERMAL.stressRate * deg * dt);
  } else {
    fagi.thermalStress = Math.max(0, fagi.thermalStress - THERMAL.recover * dt);
  }
  fagi.thermalFeel = kind;
  if (kind) fagi.thermalKind = kind;   // what she was last suffering: the cause, if it kills her
}

// --- learning ---------------------------------------------------------------

function learnThermal(fagi, ep) {
  const part = Math.min(1, ep.secs / THERMAL.sample);
  const gained = Math.max(0, fagi.thermalStress - ep.stress);
  const change = learn(fagi.brain, ep.kind, -THERMAL.lesson * part, fagi.age, [
    { sense: 'temperature', v: round1(fagi.temperature) },
    { sense: 'thermalStress', v: round1(gained) },
  ]);
  fagi.thermalLessons = (fagi.thermalLessons ?? 0) + 1;
  fagi.lastThermalLesson = {
    n: fagi.thermalLessons, kind: ep.kind, temperature: round1(fagi.temperature),
    beliefBefore: change.before.value, beliefAfter: change.after.value,
  };
  // It got cold after she noticed the dark: the dark takes on what came after.
  if (ep.kind === COLD_KEY && fagi.feltDusk) {
    const cold = fagi.brain.facts[COLD_KEY]?.value ?? 0;
    const dusk = learn(fagi.brain, DUSK_KEY, cold, fagi.age, [{ sense: 'temperature', v: round1(fagi.temperature) }]);
    fagi.lastDuskLesson = {
      n: (fagi.lastDuskLesson?.n ?? 0) + 1, beliefBefore: dusk.before.value, beliefAfter: dusk.after.value,
    };
    fagi.feltDusk = false;   // once per night
  }
}

// A stretch of discomfort, judged every THERMAL.sample seconds.
function thermalEpisode(fagi, dt) {
  const kind = fagi.thermalFeel;
  const ep = fagi.thermalEp;
  if (ep && ep.kind !== kind) { if (ep.secs > 0.5) learnThermal(fagi, ep); fagi.thermalEp = null; }
  if (!kind) return;
  if (!fagi.thermalEp) fagi.thermalEp = { kind, secs: 0, stress: fagi.thermalStress };
  fagi.thermalEp.secs += dt;
  if (fagi.thermalEp.secs >= THERMAL.sample) {
    learnThermal(fagi, fagi.thermalEp);
    fagi.thermalEp = { kind, secs: 0, stress: fagi.thermalStress };
  }
}

// She goes into the nest uncomfortable: after a while inside, did it help?
// Judged once per visit.
function refugeEpisode(fagi, inNest, dt) {
  if (!inNest) { fagi.refugeEp = null; fagi.refugeJudged = false; return; }
  if (fagi.refugeJudged) return;
  const off = Math.abs(fagi.temperature - THERMAL.preferred);
  if (!fagi.refugeEp) {
    if (!fagi.thermalFeel && fagi.thermalStress <= 0) return;
    fagi.refugeEp = { secs: 0, off, stress: fagi.thermalStress, temperature: fagi.temperature };
    return;
  }
  const ep = fagi.refugeEp;
  ep.secs += dt;
  if (ep.secs < THERMAL.refugeSample) return;
  const band = THERMAL.safeMax - THERMAL.preferred;
  const relief = (ep.off - off) / band + (ep.stress - fagi.thermalStress) / THERMAL.maxStress;
  fagi.refugeJudged = true;
  fagi.refugeEp = null;
  if (Math.abs(relief) < 0.05) return;
  const change = learn(fagi.brain, REFUGE_KEY, Math.max(-1, Math.min(1, relief)), fagi.age, [
    { sense: 'temperature', v: round1(fagi.temperature - ep.temperature) },
  ]);
  fagi.lastRefugeLesson = {
    n: (fagi.lastRefugeLesson?.n ?? 0) + 1, beliefBefore: change.before.value, beliefAfter: change.after.value,
  };
}

// What she notices of the light: that it is dark, and that it is falling.
function senseLight(fagi, sky) {
  const before = fagi.light ?? 1;
  fagi.light = sky.light;
  fagi.dark = sky.light < THERMAL.duskSense;
  fagi.dimming = fagi.dark && sky.light < before;
  if (fagi.dimming) fagi.feltDusk = true;
  if (!fagi.dark) fagi.feltDusk = false;
}

// Once per frame, after senseWeather (which knows whether it is raining on her).
export function senseBody(fagi, world, dt) {
  if (!CYCLE.enabled && !THERMAL.enabled) return;
  const sky = cycleAt(world.time);
  if (CYCLE.enabled) senseLight(fagi, sky);
  if (!THERMAL.enabled) return;
  const inNest = Boolean(nestUnder(fagi, world));
  exchange(fagi, targetTemperature(fagi, world, sky, inNest), inNest, dt);
  stress(fagi, dt);
  thermalEpisode(fagi, dt);
  refugeEpisode(fagi, inNest, dt);
}

// Full stress kills: of cold or of heat, whichever she was suffering.
export function thermalDeath(fagi) {
  if (!THERMAL.enabled || fagi.thermalStress < THERMAL.maxStress) return null;
  return fagi.thermalKind === HEAT_KEY ? 'heat' : 'cold';
}
