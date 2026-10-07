// ── What falls between the camera and the ground (in screen pixels) ─────────

import { sky } from './state.js';
import { hash, noise, tessellate, screen, windOf } from './util.js';
import { snowShare } from '../climate-sprite.js';

// Three depth layers. `n` per 1280×860 px of screen.
const LAYERS = [
  { n: 560, length: 11, width: 0.9, alpha: 0.34, life: [0.18, 0.3], opens: 0.05 },
  { n: 280, length: 24, width: 1.3, alpha: 0.42, life: [0.14, 0.22], opens: 0.09 },
  { n: 60, length: 52, width: 2.6, alpha: 0.24, life: [0.1, 0.16], opens: 0.16 },
];

// Runs with the camera removed: the drops are in front of it, not on the ground.
export function drawRainDrops(ctx, world, now) {
  const n = sky.drops;
  if (n <= 0.01) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const v = windOf(world);
  const t = now / 1000;
  const scaleOf = (W * H) / (1280 * 860);
  const k = screen(ctx.canvas);

  // Cold enough, what falls is snow (and sleet, half and half, just above freezing).
  const snow = snowShare();
  const rain = 1 - snow;

  ctx.save();
  ctx.lineCap = 'round';
  if (rain > 0.01) {
    gusts(ctx, n * rain, v, t, W, H);
    LAYERS.forEach((layer, c) => {
      const howMany = Math.round(layer.n * scaleOf * n * rain);
      dropLayer(ctx, layer, c, howMany, { n, v, t, W, H, k });
    });
    lightning(ctx, n * rain, t, W, H);
  }
  if (snow > 0.01) snowfall(ctx, n * snow, v, t, W, H, k, scaleOf);
  ctx.restore();
}

// Gusts: curtains of denser rain that sweep across the view with the wind.
function gusts(ctx, n, v, t, W, H) {
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = n * 0.1;
  tessellate(ctx, noise(), 520, v.x * t * 90, t * 170, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// One depth layer: `howMany` drops, each at its own point in its cycle.
function dropLayer(ctx, layer, c, howMany, { n, v, t, W, H, k }) {
  const cx = W / 2;
  // Three brightness batches per layer: a drop fades in and fades out.
  const rounds = [new Path2D(), new Path2D(), new Path2D()];
  for (let i = 0; i < howMany; i++) {
    const life = layer.life[0] + hash(i, c, 1) * (layer.life[1] - layer.life[0]);
    const u = t / life + hash(i, c, 2);
    const cycle = Math.floor(u);
    const p = u - cycle;
    const x = hash(i, cycle + c * 7919, 3) * (W + 80) - 40;
    const y = hash(i, cycle + c * 7919, 4) * (H + 80) - 40;
    // Direction: always downward; the wind only tilts it (quite a bit sideways,
    // little vertically, so it never looks like it's going up) and the
    // perspective spreads it a little toward the sides.
    const dx = v.x * 0.55 + (x - cx) / W * layer.opens * 4;
    const dy = 1 + v.y * 0.2;
    const m = Math.hypot(dx, dy) || 1;
    const length = layer.length * k * (0.75 + hash(i, cycle, 5) * 0.5);
    const hx = x + (dx / m) * length * p * 1.4;
    const hy = y + (dy / m) * length * p * 1.4;
    const tb = p < 0.2 || p > 0.8 ? 0 : p < 0.35 || p > 0.65 ? 1 : 2;
    rounds[tb].moveTo(hx - (dx / m) * length, hy - (dy / m) * length);
    rounds[tb].lineTo(hx, hy);
  }
  ctx.lineWidth = layer.width * k;
  [0.35, 0.7, 1].forEach((shine, j) => {
    ctx.strokeStyle = `rgba(206,222,240,${(layer.alpha * shine * (0.5 + n * 0.5)).toFixed(3)})`;
    ctx.stroke(rounds[j]);
  });
}

// Lightning: in 25 s windows, sometimes one, with its double flicker.
function lightning(ctx, n, t, W, H) {
  if (n <= 0.6) return;
  const windowOf = Math.floor(t / 25);
  if (hash(windowOf, 0, 21) >= 0.45) return;
  const when = windowOf * 25 + 3 + hash(windowOf, 0, 22) * 19;
  const d = t - when;
  if (d > 0 && d < 0.9) {
    const f = Math.max(0, 1 - d / 0.08) * 0.7 + (d > 0.14 ? Math.exp(-(d - 0.14) * 6) : 0);
    ctx.fillStyle = `rgba(220,228,255,${(Math.min(1, f) * 0.32 * n).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// Snowflakes: slow, drifting with the wind and swaying as they fall, in three
// depths (the near ones big, soft and fast across the screen).
const FLAKES = [
  { n: 520, size: 1.1, alpha: 0.55, fall: 42, sway: 10 },
  { n: 240, size: 2, alpha: 0.75, fall: 70, sway: 16 },
  { n: 50, size: 3.6, alpha: 0.6, fall: 120, sway: 26 },
];

function snowfall(ctx, n, v, t, W, H, k, scaleOf) {
  FLAKES.forEach((layer, c) => {
    const howMany = Math.round(layer.n * scaleOf * n);
    const flakes = new Path2D();
    for (let i = 0; i < howMany; i++) {
      const speed = layer.fall * k * (0.7 + hash(i, c, 31) * 0.6);
      const span = H + 40;
      const y = ((hash(i, c, 32) * span + t * speed) % span) - 20;
      const drift = v.x * t * speed * 0.6;
      const x = ((((hash(i, c, 33) * (W + 40) + drift + Math.sin(t * (0.6 + hash(i, c, 34)) + i) * layer.sway * k)
        % (W + 40)) + (W + 40)) % (W + 40)) - 20;
      const r = layer.size * k * (0.7 + hash(i, c, 35) * 0.6);
      flakes.moveTo(x + r, y);
      flakes.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = `rgba(244,248,255,${(layer.alpha * (0.5 + n * 0.5)).toFixed(3)})`;
    ctx.fill(flakes);
  });
}
