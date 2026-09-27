// El pintor de la chispa.

import { aRGB } from '../colors.js';
import { LX, LY, volumen, cubrir, poligono } from './comunes.js';

// Chispa: no es carne, es mineral. Un prisma de aristas vivas que suelta
// destellos. Lo que da es velocidad, así que va picuda y no redonda.
export function chispa(ctx, cx, cy, r, base, rnd, pasado) {
  const [cr, cg, cb] = aRGB(base);

  // Resplandor: se ve venir de lejos aunque la pieza sea pequeña.
  const halo = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.1);
  halo.addColorStop(0, `rgba(${cr},${cg},${cb},${0.3 - pasado * 0.2})`);
  halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  cubrir(ctx, halo);

  const pts = tallar(cx, cy, r, rnd);

  ctx.save();
  poligono(ctx, pts);
  ctx.clip();
  volumen(ctx, cx, cy, r, base, 0.6 - pasado * 0.3, 0.66);
  caras(ctx, cx, cy, pts, rnd);

  // Núcleo encendido.
  const nucleo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
  nucleo.addColorStop(0, `rgba(255,255,255,${0.5 - pasado * 0.35})`);
  nucleo.addColorStop(1, 'rgba(255,255,255,0)');
  cubrir(ctx, nucleo);
  ctx.restore();

  // Filo del canto y destellos sueltos alrededor.
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.75)`;
  ctx.lineWidth = Math.max(1, r * 0.12);
  poligono(ctx, pts);
  ctx.stroke();
  ctx.lineWidth = 1;

  destellos(ctx, cx, cy, r, rnd, pasado);
}

// El perfil del prisma, algo torcido y con cada arista un poco a su aire.
function tallar(cx, cy, r, rnd) {
  const giro = (rnd() - 0.5) * 0.5;
  const perfil = [[0, -1.45], [0.62, -0.5], [0.44, 0.7], [0, 1.3], [-0.44, 0.7], [-0.62, -0.5]];
  return perfil.map(([px, py]) => {
    const x = px * r * (0.9 + rnd() * 0.25);
    const y = py * r * (0.9 + rnd() * 0.2);
    return {
      x: cx + x * Math.cos(giro) - y * Math.sin(giro),
      y: cy + x * Math.sin(giro) + y * Math.cos(giro),
    };
  });
}

// Caras: del centro a cada arista, una clara y la siguiente oscura. Es lo que
// lo hace cristal tallado y no un rombo pintado.
function caras(ctx, cx, cy, pts, rnd) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a.x + b.x) / 2 - cx;
    const my = (a.y + b.y) / 2 - cy;
    const d = Math.hypot(mx, my) || 1;
    const hacia = (mx / d) * LX + (my / d) * LY;
    ctx.fillStyle = hacia > 0 ? 'rgba(255,255,255,0.22)' : 'rgba(8,14,22,0.28)';
    ctx.globalAlpha = Math.abs(hacia) * (0.6 + rnd() * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function destellos(ctx, cx, cy, r, rnd, pasado) {
  const n = 3 - ((pasado * 2) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (1.25 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + rnd() * 0.2})`;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    ctx.lineTo(cx + Math.cos(a) * (d + r * 0.45), cy + Math.sin(a) * (d + r * 0.45));
    ctx.stroke();
  }
}
