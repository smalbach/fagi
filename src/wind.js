// El viento: una sola dirección para todo el mapa que cambia muy despacio.
// Es lo que decide hacia dónde se arrastra el olor de cada cosa.

import { WIND } from './config.js';
import { normalizeAngle } from './vision.js';

export function createWind() {
  const a = Math.random() * Math.PI * 2;
  return { angle: a, target: a, timer: 0, t: 0 };
}

export function updateWind(wind, dt) {
  wind.t += dt;

  // Cada cierto tiempo se propone otra dirección, pero llega a ella girando
  // poco a poco: nunca da un salto.
  wind.timer -= dt;
  if (wind.timer <= 0) {
    wind.target = normalizeAngle(wind.angle + (Math.random() - 0.5) * WIND.swing);
    wind.timer = WIND.changeEvery.min + Math.random() * (WIND.changeEvery.max - WIND.changeEvery.min);
  }

  const diff = normalizeAngle(wind.target - wind.angle);
  const paso = Math.min(Math.abs(diff), WIND.turnRate * dt);
  wind.angle = normalizeAngle(wind.angle + Math.sign(diff) * paso);
}

export function windDir(wind) {
  return { x: Math.cos(wind.angle), y: Math.sin(wind.angle) };
}
