// ── Ripples on the water (world) ────────────────────────────────────────────

import { canvasOf, cacheSprite, detail, stamp } from '../sprite-kit.js';
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

// Uneven shallow depressions: the muddy rim and sediment are cached.
const puddles = new Map();
export function drawPuddle(ctx, o, r, intensity, now) {
  const z = detail();
  const R = Math.max(2, Math.round(r * z));
  const image = cacheSprite(puddles, `${o.id % 12}|${R}`, () => paintPuddle(o.id % 12, R), 96);
  stamp(ctx, image, o.x, o.y, z);
  drawRipples(ctx, o, r * 0.72, Number(intensity) || 0, now);
}
function paintPuddle(seed, r) {
  const c = canvasOf(r * 3, r * 3), ctx = c.getContext('2d');
  const center = r * 1.5;
  ctx.translate(center, center);
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * Math.PI * 2;
    const d = r * (0.85 + Math.sin(a * 3 + seed) * 0.06 + Math.cos(a * 5 - seed) * 0.045);
    const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.9;
    if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#2a261a66'; ctx.lineWidth = r * 0.13; ctx.stroke();
  ctx.save(); ctx.clip();
  const g = ctx.createRadialGradient(-r * 0.12, -r * 0.2, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(42,58,56,0.94)');
  g.addColorStop(0.65, 'rgba(72,85,72,0.85)');
  g.addColorStop(1, 'rgba(98,89,63,0.7)');
  ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
  for (let i = 0; i < 45; i++) {
    const x = (hash(seed, i, 1) - 0.5) * r * 2, y = (hash(seed, i, 2) - 0.5) * r * 2;
    ctx.fillStyle = i % 2 ? '#acaa7940' : '#142c2545';
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.028, r * 0.014, i, 0, Math.PI * 2); ctx.fill();
  }
  const sky = ctx.createLinearGradient(-r, -r, r, r);
  sky.addColorStop(0, 'rgba(197,218,214,0.22)'); sky.addColorStop(0.6, 'rgba(197,218,214,0)');
  ctx.fillStyle = sky; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  return c;
}
