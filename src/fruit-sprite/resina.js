// El pintor de la resina.

import { mix } from '../sprite-kit.js';
import { LUZ, sombra, volumen, lustre, manchas, circulo, cubrir } from './comunes.js';

// Resina: espesa y translúcida. Gota con punta arriba, burbujas dentro y un
// hilo que cuelga. Lo que hace es estirar el tiempo, y se ve en que es lo único
// que parece que se mueve despacio.
export function resina(ctx, cx, cy, r, base, rnd, pasado) {
  sombra(ctx, cx, cy, r, 0.35);
  const y = cy + r * 0.12;

  ctx.save();
  gota(ctx, cx, cy, y, r);
  ctx.clip();
  volumen(ctx, cx, y, r, base, 0.55 - pasado * 0.3, 0.5);

  burbujas(ctx, cx, y, r, rnd);

  // Poso oscuro al fondo: lo espeso se va abajo.
  const poso = ctx.createLinearGradient(0, y, 0, y + r);
  poso.addColorStop(0, 'rgba(70,36,8,0)');
  poso.addColorStop(1, `rgba(70,36,8,${0.3 + pasado * 0.3})`);
  cubrir(ctx, poso);

  manchas(ctx, cx, y, r, pasado * 0.6, rnd);
  ctx.restore();

  // El hilo que gotea, más largo cuanto más vieja: lleva tiempo escurriendo.
  ctx.strokeStyle = mix(base, '#5a2e08', 0.35);
  ctx.lineWidth = Math.max(1, r * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.15, y + r * 0.9);
  ctx.lineTo(cx + r * 0.15, y + r * (1.15 + pasado * 0.35));
  ctx.stroke();
  circulo(ctx, cx + r * 0.15, y + r * (1.2 + pasado * 0.35), r * 0.17, mix(base, '#3b1d05', 0.15));
  ctx.lineWidth = 1;

  lustre(ctx, cx, y - r * 0.15, r, 0.5 - pasado * 0.3);
}

// La silueta de la gota: punta arriba y panza redonda abajo, en `y`.
function gota(ctx, cx, cy, y, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.35);
  ctx.bezierCurveTo(cx + r * 0.45, cy - r * 0.55, cx + r, y - r * 0.35, cx + r, y);
  ctx.arc(cx, y, r, 0, Math.PI);
  ctx.bezierCurveTo(cx - r, y - r * 0.35, cx - r * 0.45, cy - r * 0.55, cx, cy - r * 1.35);
  ctx.closePath();
}

// Lo que lleva dentro: burbujas atrapadas y alguna hebra. El ámbar guarda
// cosas, igual que guarda el hambre para más tarde.
function burbujas(ctx, cx, y, r, rnd) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.7;
    const rad = r * (0.08 + rnd() * 0.16);
    const bx = cx + Math.cos(a) * d;
    const by = y + Math.sin(a) * d;
    circulo(ctx, bx, by, rad, 'rgba(255,240,200,0.18)');
    ctx.strokeStyle = 'rgba(90,50,12,0.22)';
    ctx.beginPath();
    ctx.arc(bx, by, rad, LUZ + 0.7, LUZ + 2.7);
    ctx.stroke();
  }
}
