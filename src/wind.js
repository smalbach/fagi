// The wind: a single direction for the whole map that changes very slowly.
// It's what decides which way the smell of each thing is carried.

import { WIND } from './config.js';
import { normalizeAngle } from './vision.js';

export function createWind() {
  const a = Math.random() * Math.PI * 2;
  return { angle: a, target: a, timer: 0, t: 0 };
}

export function updateWind(wind, dt) {
  wind.t += dt;

  // Every so often it picks another direction, but reaches it by turning
  // little by little: it never jumps.
  wind.timer -= dt;
  if (wind.timer <= 0) {
    wind.target = normalizeAngle(wind.angle + (Math.random() - 0.5) * WIND.swing);
    wind.timer = WIND.changeEvery.min + Math.random() * (WIND.changeEvery.max - WIND.changeEvery.min);
  }

  const diff = normalizeAngle(wind.target - wind.angle);
  const step = Math.min(Math.abs(diff), WIND.turnRate * dt);
  wind.angle = normalizeAngle(wind.angle + Math.sign(diff) * step);
}

export function windDir(wind) {
  return { x: Math.cos(wind.angle), y: Math.sin(wind.angle) };
}
