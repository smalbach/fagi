// ── Lo que cae entre la cámara y el suelo (en píxeles de pantalla) ──────────

import { sky } from './state.js';
import { hash, noise, tessellate, screen, windOf } from './util.js';

// Tres capas de profundidad. `n` por cada 1280×860 px de pantalla.
const LAYERS = [
  { n: 560, length: 11, width: 0.9, alpha: 0.34, life: [0.18, 0.3], opens: 0.05 },
  { n: 280, length: 24, width: 1.3, alpha: 0.42, life: [0.14, 0.22], opens: 0.09 },
  { n: 60, length: 52, width: 2.6, alpha: 0.24, life: [0.1, 0.16], opens: 0.16 },
];

// Va con la cámara quitada: las gotas están delante de ella, no en el suelo.
export function drawRainDrops(ctx, world, now) {
  const n = sky.drops;
  if (n <= 0.01) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const v = windOf(world);
  const t = now / 1000;
  const scaleOf = (W * H) / (1280 * 860);
  const k = screen(ctx.canvas);

  ctx.save();
  ctx.lineCap = 'round';
  gusts(ctx, n, v, t, W, H);
  LAYERS.forEach((layer, c) => {
    const howMany = Math.round(layer.n * scaleOf * n);
    dropLayer(ctx, layer, c, howMany, { n, v, t, W, H, k });
  });
  lightning(ctx, n, t, W, H);
  ctx.restore();
}

// Rachas: cortinas de lluvia más densa que cruzan la vista con el viento.
function gusts(ctx, n, v, t, W, H) {
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = n * 0.1;
  tessellate(ctx, noise(), 520, v.x * t * 90, t * 170, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Una capa de profundidad: `cuantas` gotas, cada una en su punto de su ciclo.
function dropLayer(ctx, layer, c, howMany, { n, v, t, W, H, k }) {
  const cx = W / 2;
  // Tres tandas de brillo por capa: una gota se enciende y se apaga.
  const rounds = [new Path2D(), new Path2D(), new Path2D()];
  for (let i = 0; i < howMany; i++) {
    const life = layer.life[0] + hash(i, c, 1) * (layer.life[1] - layer.life[0]);
    const u = t / life + hash(i, c, 2);
    const cycle = Math.floor(u);
    const p = u - cycle;
    const x = hash(i, cycle + c * 7919, 3) * (W + 80) - 40;
    const y = hash(i, cycle + c * 7919, 4) * (H + 80) - 40;
    // Dirección: siempre hacia abajo; el viento solo la inclina (de lado
    // bastante, en vertical poco, para que nunca parezca que sube) y la
    // perspectiva la abre un poco hacia los lados.
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

// Relámpago: en ventanas de 25 s, a veces uno, con su parpadeo doble.
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
