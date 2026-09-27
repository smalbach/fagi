// ── Suelo: mojado y bajo las nubes (en coordenadas de mundo) ────────────────

import { cielo } from './estado.js';
import { hash, suave, ruido, teselar, pantalla, vista, vientoDe } from './util.js';

// Va después del terreno y antes de los objetos: es el suelo lo que se moja.
export function drawWetGround(ctx, world) {
  const w = cielo.mojado;
  if (w <= 0) return;
  ctx.save();
  // Tierra mojada: más oscura y más fría.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(118,128,142,${(w * 0.55).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // Y brilla un poco donde refleja el cielo: manchas de brillo quietas.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = w * 0.07;
  teselar(ctx, ruido(), 180, 37, 91, 0, 0, world.width, world.height);
  ctx.restore();
}

// Por encima de todo lo del mundo: la luz del día nublado y las nubes que pasan.
export function drawOvercast(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0) return;
  const v = vientoDe(world);
  const t = ahora / 1000;
  ctx.save();
  // Luz apagada y azulada.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(138,148,168,${(n * 0.7).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(22,30,42,${(n * 0.12).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // Sombras de nube, grandes y lentas, a favor del viento.
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'invert(1) brightness(0.55)';
  ctx.globalAlpha = n * 0.32;
  teselar(ctx, ruido(), 900, v.x * t * 9, v.y * t * 9, 0, 0, world.width, world.height);
  ctx.restore();
}

// ── Salpicaduras en el suelo (mundo) ────────────────────────────────────────

const SALPICA_POR_PX2 = 380 / (1280 * 860);   // a pleno chaparrón

export function drawSplashes(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0.02) return;
  const { x0, y0, x1, y1, z } = vista(ctx);
  // Nunca más pequeñas que lo que se distingue en pantalla.
  const k = Math.max(1, pantalla(ctx.canvas) / z);
  const zona = {
    ax: Math.max(0, x0),
    ay: Math.max(0, y0),
    bx: Math.min(world.width, x1),
    by: Math.min(world.height, y1),
  };
  const area = (zona.bx - zona.ax) * (zona.by - zona.ay);
  const cuantas = Math.min(700, Math.max(30, Math.round(area * SALPICA_POR_PX2 * n)));
  const t = ahora / 1000;

  ctx.save();
  ctx.lineCap = 'round';
  const trazos = { anillos: new Path2D(), gotitas: new Path2D(), puntos: new Path2D() };
  for (let i = 0; i < cuantas; i++) salpicadura(trazos, i, t, zona, k);
  ctx.strokeStyle = `rgba(205,222,238,${(0.42 * n).toFixed(3)})`;
  ctx.lineWidth = 0.7 * k;
  ctx.stroke(trazos.anillos);
  ctx.fillStyle = `rgba(225,236,248,${(0.4 * n).toFixed(3)})`;
  ctx.fill(trazos.gotitas);
  ctx.fillStyle = `rgba(240,246,255,${(0.85 * n).toFixed(3)})`;
  ctx.fill(trazos.puntos);
  ctx.restore();
}

// La salpicadura `i` en este instante, añadida a los trazos de todas: se
// pintan juntas, un trazo por clase, que es mucho más barato.
function salpicadura({ anillos, gotitas, puntos }, i, t, { ax, ay, bx, by }, k) {
  const vida = 0.32 + hash(i, 0, 5) * 0.22;
  const u = t / vida + hash(i, 0, 6);
  const ciclo = Math.floor(u);
  const p = u - ciclo;
  // Algunas veces no cae aquí: rompe la regularidad.
  if (hash(i, ciclo, 9) > 0.8) return;
  const x = ax + hash(i, ciclo, 1) * (bx - ax);
  const y = ay + hash(i, ciclo, 2) * (by - ay);
  const tam = (0.9 + hash(i, ciclo, 3) * 1.3) * k;
  if (p < 0.12) {
    // El impacto: un puntito claro.
    puntos.moveTo(x + tam * 0.6, y);
    puntos.arc(x, y, tam * 0.6, 0, Math.PI * 2);
  }
  // El anillo que se abre, algo aplastado por la luz rasante.
  const r = tam * (0.6 + suave(p) * 3.2);
  anillos.moveTo(x + r, y);
  anillos.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
  // La corona: unas gotitas que saltan y vuelven a caer. Su radio va con
  // cuántas saltan, no con la escala de pantalla.
  if (p < 0.6) {
    const q = p / 0.6;
    const saltan = 3 + Math.floor(hash(i, ciclo, 4) * 3);
    for (let j = 0; j < saltan; j++) {
      const a = (j / saltan) * Math.PI * 2 + hash(i, ciclo, 10 + j) * 0.9;
      const d = tam * (1 + q * 4.5);
      const gx = x + Math.cos(a) * d;
      const gy = y + Math.sin(a) * d * 0.8 - Math.sin(q * Math.PI) * tam * 2.2;
      const gr = 0.4 * saltan * (1 - q * 0.6);
      gotitas.moveTo(gx + gr, gy);
      gotitas.arc(gx, gy, gr, 0, Math.PI * 2);
    }
  }
}
