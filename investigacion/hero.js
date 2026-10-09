// A static field-guide plate using the actual game sprite. It illustrates the
// organism, not a simulated experiment, and needs no animation loop or RNG.
import { drawFagi } from '../src/fagi-sprite.js';

export function startHero(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = 600;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const specimen = {
    x: 0, y: 0, angle: -0.85, sex: 'female', alive: true,
    stride: 0, castSide: 1, carrying: null, temperature: 24,
    hunger: 20, thirst: 10, energy: 90, thermalStress: 0,
    age: 0, thought: { action: 'explore' },
  };
  ctx.save();
  ctx.translate(300, 295);
  ctx.scale(9, 9);
  drawFagi(ctx, specimen);
  ctx.restore();
}
