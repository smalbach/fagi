import { TERRAIN } from '../config.js';

// Shore: the only part of the ground that is NOT baked into the canvas. The player
// adds and removes puddles, and a damp patch with no water underneath would be a
// lie, so it's painted every frame, stuck to its puddle.
export function drawShore(ctx, o, r) {
  const g = ctx.createRadialGradient(o.x, o.y, r * 0.9, o.x, o.y, r * TERRAIN.shore);
  g.addColorStop(0, 'rgba(24,30,28,0.55)');
  g.addColorStop(0.45, 'rgba(30,38,34,0.3)');
  g.addColorStop(1, 'rgba(30,38,34,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, o.y, r * TERRAIN.shore, 0, Math.PI * 2);
  ctx.fill();
}
