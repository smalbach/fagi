// ── Ripples on the water (world) ────────────────────────────────────────────

import { hash, screen } from './util.js';

const LIGHT = -Math.PI * 0.72;   // the same light as the rest of the world

// Drop ripples on a water surface of radius r. Density based on the area.
export function drawRipples(ctx, o, r, intensity, now) {
  if (!(intensity > 0.02)) return;
  const howMany = Math.min(40, Math.max(3, Math.round((r * r) / 60 * intensity)));
  const t = now / 1000;
  const seedOf = (o.id ?? 0) * 13.7;
  const k = Math.max(1, screen(ctx.canvas) / (ctx.getTransform().a || 1));
  ctx.save();
  ctx.lineWidth = 0.75 * k;
  for (let i = 0; i < howMany; i++) {
    const life = 0.9 + hash(i, seedOf, 1) * 0.7;
    const u = t / life + hash(i, seedOf, 2);
    const cycle = Math.floor(u);
    const p = u - cycle;
    const a = hash(i + seedOf, cycle, 3) * Math.PI * 2;
    const d = Math.sqrt(hash(i + seedOf, cycle, 4)) * r * 0.82;
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const rr = 0.8 + p * (2.5 + hash(i, cycle, 5) * 3.5);
    // Keep the ripple from spilling out of the water.
    if (d + rr > r * 0.92) continue;
    const alpha = (1 - p) * (1 - p) * 0.75 * intensity;
    ctx.strokeStyle = `rgba(215,232,244,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rr, rr * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    // A second, smaller ripple behind the first.
    if (p > 0.25) {
      ctx.strokeStyle = `rgba(215,232,244,${(alpha * 0.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.55, rr * 0.47, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // The drop's impact, at the start.
    if (p < 0.08) {
      ctx.fillStyle = `rgba(240,248,255,${(0.6 * intensity).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// A puddle: murky water, lighter toward the edge, with the sky's reflection
// on the side of the light. If it's raining, the drops make ripples on it.
export function drawPuddle(ctx, o, r, intensity, now) {
  ctx.save();
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
  g.addColorStop(0, 'rgba(58,78,84,0.85)');
  g.addColorStop(0.75, 'rgba(78,98,96,0.8)');
  g.addColorStop(1, 'rgba(96,104,88,0.35)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, r, r * 0.86, (o.id % 7) * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Sky reflection: dimmer when it's overcast.
  ctx.fillStyle = `rgba(200,220,235,${(0.16 * (1 - (intensity || 0) * 0.5)).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(o.x + Math.cos(LIGHT) * r * 0.35, o.y + Math.sin(LIGHT) * r * 0.35, r * 0.45, r * 0.18, LIGHT + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawRipples(ctx, o, r * 0.95, Number(intensity) || 0, now);
}
