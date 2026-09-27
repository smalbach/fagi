// ── Ground: wet and under the clouds (in world coordinates) ─────────────────

import { sky } from './state.js';
import { hash, smooth, noise, tessellate, screen, sight, windOf } from './util.js';

// Runs after the terrain and before the objects: it's the ground that gets wet.
export function drawWetGround(ctx, world) {
  const w = sky.wetness;
  if (w <= 0) return;
  ctx.save();
  // Wet earth: darker and cooler.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(118,128,142,${(w * 0.55).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // And it shines a little where it reflects the sky: still patches of sheen.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = w * 0.07;
  tessellate(ctx, noise(), 180, 37, 91, 0, 0, world.width, world.height);
  ctx.restore();
}

// On top of everything in the world: the overcast daylight and the passing clouds.
export function drawOvercast(ctx, world, now) {
  const n = sky.level;
  if (n <= 0) return;
  const v = windOf(world);
  const t = now / 1000;
  ctx.save();
  // Dim, bluish light.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(138,148,168,${(n * 0.7).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(22,30,42,${(n * 0.12).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // Cloud shadows, big and slow, moving with the wind.
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'invert(1) brightness(0.55)';
  ctx.globalAlpha = n * 0.32;
  tessellate(ctx, noise(), 900, v.x * t * 9, v.y * t * 9, 0, 0, world.width, world.height);
  ctx.restore();
}

// ── Splashes on the ground (world) ──────────────────────────────────────────

const SPLASH_PER_PX2 = 380 / (1280 * 860);   // at full downpour

export function drawSplashes(ctx, world, now) {
  const n = sky.drops;
  if (n <= 0.02) return;
  const { x0, y0, x1, y1, z } = sight(ctx);
  // Never smaller than what can be made out on screen.
  const k = Math.max(1, screen(ctx.canvas) / z);
  const zone = {
    ax: Math.max(0, x0),
    ay: Math.max(0, y0),
    bx: Math.min(world.width, x1),
    by: Math.min(world.height, y1),
  };
  const area = (zone.bx - zone.ax) * (zone.by - zone.ay);
  const howMany = Math.min(700, Math.max(30, Math.round(area * SPLASH_PER_PX2 * n)));
  const t = now / 1000;

  ctx.save();
  ctx.lineCap = 'round';
  const strokes = { rings: new Path2D(), gotitas: new Path2D(), points: new Path2D() };
  for (let i = 0; i < howMany; i++) splash(strokes, i, t, zone, k);
  ctx.strokeStyle = `rgba(205,222,238,${(0.42 * n).toFixed(3)})`;
  ctx.lineWidth = 0.7 * k;
  ctx.stroke(strokes.rings);
  ctx.fillStyle = `rgba(225,236,248,${(0.4 * n).toFixed(3)})`;
  ctx.fill(strokes.gotitas);
  ctx.fillStyle = `rgba(240,246,255,${(0.85 * n).toFixed(3)})`;
  ctx.fill(strokes.points);
  ctx.restore();
}

// Splash `i` at this instant, added to the paths shared by all of them: they're
// painted together, one path per kind, which is much cheaper.
function splash({ rings, gotitas, points }, i, t, { ax, ay, bx, by }, k) {
  const life = 0.32 + hash(i, 0, 5) * 0.22;
  const u = t / life + hash(i, 0, 6);
  const cycle = Math.floor(u);
  const p = u - cycle;
  // Sometimes it doesn't land here: breaks up the regularity.
  if (hash(i, cycle, 9) > 0.8) return;
  const x = ax + hash(i, cycle, 1) * (bx - ax);
  const y = ay + hash(i, cycle, 2) * (by - ay);
  const sz = (0.9 + hash(i, cycle, 3) * 1.3) * k;
  if (p < 0.12) {
    // The impact: a small bright dot.
    points.moveTo(x + sz * 0.6, y);
    points.arc(x, y, sz * 0.6, 0, Math.PI * 2);
  }
  // The ring that opens, somewhat flattened by the low-angle light.
  const r = sz * (0.6 + smooth(p) * 3.2);
  rings.moveTo(x + r, y);
  rings.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
  // The crown: a few droplets that bounce up and fall back. Their radius goes
  // with how many bounce, not with the screen scale.
  if (p < 0.6) {
    const q = p / 0.6;
    const skipped = 3 + Math.floor(hash(i, cycle, 4) * 3);
    for (let j = 0; j < skipped; j++) {
      const a = (j / skipped) * Math.PI * 2 + hash(i, cycle, 10 + j) * 0.9;
      const d = sz * (1 + q * 4.5);
      const gx = x + Math.cos(a) * d;
      const gy = y + Math.sin(a) * d * 0.8 - Math.sin(q * Math.PI) * sz * 2.2;
      const gr = 0.4 * skipped * (1 - q * 0.6);
      gotitas.moveTo(gx + gr, gy);
      gotitas.arc(gx, gy, gr, 0, Math.PI * 2);
    }
  }
}
