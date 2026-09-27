// ── Ondas en el agua (mundo) ────────────────────────────────────────────────

import { hash, pantalla } from './util.js';

const LUZ = -Math.PI * 0.72;   // la misma luz que el resto del mundo

// Ondas de gotas en una superficie de agua de radio r. Densidad según el área.
export function drawRipples(ctx, o, r, intensidad, ahora) {
  if (!(intensidad > 0.02)) return;
  const cuantas = Math.min(40, Math.max(3, Math.round((r * r) / 60 * intensidad)));
  const t = ahora / 1000;
  const semilla = (o.id ?? 0) * 13.7;
  const k = Math.max(1, pantalla(ctx.canvas) / (ctx.getTransform().a || 1));
  ctx.save();
  ctx.lineWidth = 0.75 * k;
  for (let i = 0; i < cuantas; i++) {
    const vida = 0.9 + hash(i, semilla, 1) * 0.7;
    const u = t / vida + hash(i, semilla, 2);
    const ciclo = Math.floor(u);
    const p = u - ciclo;
    const a = hash(i + semilla, ciclo, 3) * Math.PI * 2;
    const d = Math.sqrt(hash(i + semilla, ciclo, 4)) * r * 0.82;
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const rr = 0.8 + p * (2.5 + hash(i, ciclo, 5) * 3.5);
    // Que la onda no se salga del agua.
    if (d + rr > r * 0.92) continue;
    const alfa = (1 - p) * (1 - p) * 0.75 * intensidad;
    ctx.strokeStyle = `rgba(215,232,244,${alfa.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rr, rr * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Una segunda onda más pequeña detrás de la primera.
    if (p > 0.25) {
      ctx.strokeStyle = `rgba(215,232,244,${(alfa * 0.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.55, rr * 0.47, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // El golpe de la gota, al principio.
    if (p < 0.08) {
      ctx.fillStyle = `rgba(240,248,255,${(0.6 * intensidad).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Un charco: agua turbia, más clara hacia el borde, con el reflejo del cielo
// del lado de la luz. Si está lloviendo, las gotas le hacen ondas.
export function drawPuddle(ctx, o, r, intensidad, ahora) {
  ctx.save();
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
  g.addColorStop(0, 'rgba(58,78,84,0.85)');
  g.addColorStop(0.75, 'rgba(78,98,96,0.8)');
  g.addColorStop(1, 'rgba(96,104,88,0.35)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, r, r * 0.86, (o.id % 7) * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Reflejo del cielo: más apagado cuando está nublado.
  ctx.fillStyle = `rgba(200,220,235,${(0.16 * (1 - (intensidad || 0) * 0.5)).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(o.x + Math.cos(LUZ) * r * 0.35, o.y + Math.sin(LUZ) * r * 0.35, r * 0.45, r * 0.18, LUZ + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawRipples(ctx, o, r * 0.95, Number(intensidad) || 0, ahora);
}
