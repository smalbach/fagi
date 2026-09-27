import { LAKE } from '../config.js';
import { azar } from '../sprite-kit.js';
import { JUNCO, perfilOrilla } from './forma.js';

// Juncos de la orilla. Se doblan a favor del viento —el mismo que lleva los
// olores— y cabecean despacio, cada mata con su fase.
export function juncos(ctx, o, r, semilla, wind, ahora) {
  const t = ahora / 1000;
  const rnd = azar((semilla ^ 0x9e3779b1) >>> 0);
  const orilla = perfilOrilla(semilla);
  const vx = Math.cos(wind?.angle ?? 0);
  const vy = Math.sin(wind?.angle ?? 0) * 0.6;

  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.juncos; i++) {
    const a = rnd() * Math.PI * 2;
    if (rnd() < 0.35) continue;               // no rodean el lago entero
    const d = r * orilla(a) * (0.97 + rnd() * 0.12);
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const alto = r * (0.11 + rnd() * 0.12);
    const fase = rnd() * Math.PI * 2;
    const dobla = 0.5 + Math.sin(t * 1.3 + fase) * 0.3;
    const tono = JUNCO[(rnd() * JUNCO.length) | 0];

    ctx.fillStyle = 'rgba(10,16,14,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, alto * 0.35, alto * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    const briznas = 3 + ((rnd() * 3) | 0);
    for (let j = 0; j < briznas; j++) {
      const largo = alto * (0.7 + rnd() * 0.7);
      const px = x + (rnd() - 0.5) * alto * 0.4;
      const tx = px + vx * largo * dobla * 0.8;
      const ty = y - largo + vy * largo * dobla * 0.5;
      ctx.strokeStyle = tono;
      ctx.globalAlpha = 0.55 + rnd() * 0.4;
      ctx.lineWidth = Math.max(0.6, alto * 0.085);
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + vx * largo * dobla * 0.2, y - largo * 0.6, tx, ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}
