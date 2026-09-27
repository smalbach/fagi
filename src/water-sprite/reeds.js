import { LAKE } from '../config.js';
import { seededRng } from '../sprite-kit.js';
import { REED, shoreProfile } from './shape.js';

// Reeds on the shore. They bend with the wind —the same one that carries the
// smells— and nod slowly, each clump with its own phase.
export function reeds(ctx, o, r, seedOf, wind, now) {
  const t = now / 1000;
  const rnd = seededRng((seedOf ^ 0x9e3779b1) >>> 0);
  const shore = shoreProfile(seedOf);
  const vx = Math.cos(wind?.angle ?? 0);
  const vy = Math.sin(wind?.angle ?? 0) * 0.6;

  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.reeds; i++) {
    const a = rnd() * Math.PI * 2;
    if (rnd() < 0.35) continue;               // they don't ring the whole lake
    const d = r * shore(a) * (0.97 + rnd() * 0.12);
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const tall = r * (0.11 + rnd() * 0.12);
    const phase = rnd() * Math.PI * 2;
    const bends = 0.5 + Math.sin(t * 1.3 + phase) * 0.3;
    const tone = REED[(rnd() * REED.length) | 0];

    ctx.fillStyle = 'rgba(10,16,14,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, tall * 0.35, tall * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    const blades = 3 + ((rnd() * 3) | 0);
    for (let j = 0; j < blades; j++) {
      const length = tall * (0.7 + rnd() * 0.7);
      const px = x + (rnd() - 0.5) * tall * 0.4;
      const tx = px + vx * length * bends * 0.8;
      const ty = y - length + vy * length * bends * 0.5;
      ctx.strokeStyle = tone;
      ctx.globalAlpha = 0.55 + rnd() * 0.4;
      ctx.lineWidth = Math.max(0.6, tall * 0.085);
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + vx * length * bends * 0.2, y - length * 0.6, tx, ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}
