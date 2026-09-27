// ── Lo que cae entre la cámara y el suelo (en píxeles de pantalla) ──────────

import { cielo } from './estado.js';
import { hash, ruido, teselar, pantalla, vientoDe } from './util.js';

// Tres capas de profundidad. `n` por cada 1280×860 px de pantalla.
const CAPAS = [
  { n: 560, largo: 11, ancho: 0.9, alfa: 0.34, vida: [0.18, 0.3], abre: 0.05 },
  { n: 280, largo: 24, ancho: 1.3, alfa: 0.42, vida: [0.14, 0.22], abre: 0.09 },
  { n: 60, largo: 52, ancho: 2.6, alfa: 0.24, vida: [0.1, 0.16], abre: 0.16 },
];

// Va con la cámara quitada: las gotas están delante de ella, no en el suelo.
export function drawRainDrops(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0.01) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const v = vientoDe(world);
  const t = ahora / 1000;
  const escala = (W * H) / (1280 * 860);
  const k = pantalla(ctx.canvas);

  ctx.save();
  ctx.lineCap = 'round';
  rachas(ctx, n, v, t, W, H);
  CAPAS.forEach((capa, c) => {
    const cuantas = Math.round(capa.n * escala * n);
    capaDeGotas(ctx, capa, c, cuantas, { n, v, t, W, H, k });
  });
  relampago(ctx, n, t, W, H);
  ctx.restore();
}

// Rachas: cortinas de lluvia más densa que cruzan la vista con el viento.
function rachas(ctx, n, v, t, W, H) {
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = n * 0.1;
  teselar(ctx, ruido(), 520, v.x * t * 90, t * 170, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Una capa de profundidad: `cuantas` gotas, cada una en su punto de su ciclo.
function capaDeGotas(ctx, capa, c, cuantas, { n, v, t, W, H, k }) {
  const cx = W / 2;
  // Tres tandas de brillo por capa: una gota se enciende y se apaga.
  const tandas = [new Path2D(), new Path2D(), new Path2D()];
  for (let i = 0; i < cuantas; i++) {
    const vida = capa.vida[0] + hash(i, c, 1) * (capa.vida[1] - capa.vida[0]);
    const u = t / vida + hash(i, c, 2);
    const ciclo = Math.floor(u);
    const p = u - ciclo;
    const x = hash(i, ciclo + c * 7919, 3) * (W + 80) - 40;
    const y = hash(i, ciclo + c * 7919, 4) * (H + 80) - 40;
    // Dirección: siempre hacia abajo; el viento solo la inclina (de lado
    // bastante, en vertical poco, para que nunca parezca que sube) y la
    // perspectiva la abre un poco hacia los lados.
    const dx = v.x * 0.55 + (x - cx) / W * capa.abre * 4;
    const dy = 1 + v.y * 0.2;
    const m = Math.hypot(dx, dy) || 1;
    const largo = capa.largo * k * (0.75 + hash(i, ciclo, 5) * 0.5);
    const hx = x + (dx / m) * largo * p * 1.4;
    const hy = y + (dy / m) * largo * p * 1.4;
    const tb = p < 0.2 || p > 0.8 ? 0 : p < 0.35 || p > 0.65 ? 1 : 2;
    tandas[tb].moveTo(hx - (dx / m) * largo, hy - (dy / m) * largo);
    tandas[tb].lineTo(hx, hy);
  }
  ctx.lineWidth = capa.ancho * k;
  [0.35, 0.7, 1].forEach((brillo, j) => {
    ctx.strokeStyle = `rgba(206,222,240,${(capa.alfa * brillo * (0.5 + n * 0.5)).toFixed(3)})`;
    ctx.stroke(tandas[j]);
  });
}

// Relámpago: en ventanas de 25 s, a veces uno, con su parpadeo doble.
function relampago(ctx, n, t, W, H) {
  if (n <= 0.6) return;
  const ventana = Math.floor(t / 25);
  if (hash(ventana, 0, 21) >= 0.45) return;
  const cuando = ventana * 25 + 3 + hash(ventana, 0, 22) * 19;
  const d = t - cuando;
  if (d > 0 && d < 0.9) {
    const f = Math.max(0, 1 - d / 0.08) * 0.7 + (d > 0.14 ? Math.exp(-(d - 0.14) * 6) : 0);
    ctx.fillStyle = `rgba(220,228,255,${(Math.min(1, f) * 0.32 * n).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
