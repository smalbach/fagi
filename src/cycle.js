// The day: light and air temperature, as a pure function of the world clock.
//
// Nothing here is state. The same second always gives the same sky, so a
// replay, a batch run and the game agree without saving anything, and a reset
// restores the cycle by resetting world.time.
//
// Fagi is never told the hour (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §7.4):
// she feels the light and the cold (thermal.js). What they announce she learns.

import { CYCLE, THERMAL } from './config.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// Smooth 0→1 between a and b, flat outside.
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// The phase of the day at world time t: 0 midnight, 0.5 noon.
export function phaseAt(time) {
  const p = (time ?? 0) / CYCLE.seconds + CYCLE.start;
  return p - Math.floor(p);
}

// Days since the session started: the first is day 1. A day turns at midnight.
export function dayAt(time) {
  return Math.floor((time ?? 0) / CYCLE.seconds + CYCLE.start) + 1;
}

// Light 0-1: flat at night, a ramp at dawn and at dusk, full at midday.
export function lightAt(phase) {
  const half = CYCLE.twilight / 2;
  const up = smooth(CYCLE.dawn - half, CYCLE.dawn + half, phase);
  const down = 1 - smooth(CYCLE.dusk - half, CYCLE.dusk + half, phase);
  return CYCLE.minLight + (1 - CYCLE.minLight) * Math.min(up, down);
}

// Air temperature (°C): a single wave, coldest half a day after the warmest.
export function ambientAt(phase) {
  return CYCLE.mean + CYCLE.swing * Math.cos(2 * Math.PI * (phase - CYCLE.warmest));
}

// Everything about the sky at world time t. With the cycle off it is always
// noon at the preferred temperature: nothing in it costs or teaches anything.
export function cycleAt(time) {
  if (!CYCLE.enabled) {
    return { day: 1, phase: 0.5, light: 1, ambient: THERMAL.preferred, isNight: false, on: false };
  }
  const phase = phaseAt(time);
  const light = lightAt(phase);
  return {
    day: dayAt(time),
    phase,
    light,
    ambient: ambientAt(phase),
    isNight: phase < CYCLE.dawn || phase >= CYCLE.dusk,
    on: true,
  };
}

// Which night an instant belongs to: the evening and the small hours after it
// are the same night. For "once per night" (consolidation.js).
export function nightOf(time) {
  const phase = phaseAt(time);
  return phase < CYCLE.dawn ? dayAt(time) - 1 : dayAt(time);
}
