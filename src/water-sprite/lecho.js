// El lecho del lago: lo que se ve del fondo a través del agua. Todo se pinta ya
// recortado al agua y en el lienzo quieto, en el orden que manda quieto.js.

import { LAKE } from '../config.js';
import { mix } from '../sprite-kit.js';
import { LUZ, ARENA, contorno } from './forma.js';

// Arena del vado: una franja pegada a la orilla, rota a manchas.
export function arena(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.82 + rnd() * 0.16);
    ctx.globalAlpha = 0.06 + rnd() * 0.1;
    ctx.fillStyle = ARENA;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d,
      R * (0.07 + rnd() * 0.1), R * (0.04 + rnd() * 0.06), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Piedras del fondo: se ven a través del agua, así que van apagadas y con el
// brillo por donde entra la luz. Solo junto a la orilla: en el hondo no se ven.
export function piedras(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < LAKE.piedras; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.55 + rnd() * 0.36);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.025 + rnd() * 0.045);
    const hundida = 0.5 + (d / R) * 0.5;      // más cerca de la orilla, más nítida
    ctx.globalAlpha = 0.2 + hundida * 0.35;
    ctx.fillStyle = mix('#6b6a5e', '#3b4a4a', rnd() * 0.7);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.6 + rnd() * 0.3), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,228,214,0.25)';
    ctx.lineWidth = Math.max(0.4, rad * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 0.82, rad * 0.5, 0, LUZ - 1.1, LUZ + 1.1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// Algas: manchas oscuras pegadas a la orilla, que es donde hay poco fondo y
// luz suficiente. Son lo que quita al agua la cara de disco pintado.
export function algas(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.66 + rnd() * 0.3);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.06 + rnd() * 0.12);
    ctx.globalAlpha = 0.1 + rnd() * 0.18;
    ctx.fillStyle = mix('#33523f', '#1d3230', rnd());
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const b = (j / 12) * Math.PI * 2;
      const rr = rad * (0.6 + Math.sin(b * 3 + a) * 0.25 + rnd() * 0.2);
      const px = x + Math.cos(b) * rr;
      const py = y + Math.sin(b) * rr * 0.8;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// El escalón del hondo: donde el fondo cae de golpe se ve un borde oscuro.
export function escalonHondo(ctx, ox, oy, R, hondo) {
  ctx.globalAlpha = 0.28;
  contorno(ctx, ox, oy, R * LAKE.hondoDesde, hondo, 48);
  const pozo = ctx.createRadialGradient(ox, oy, R * LAKE.hondoDesde * 0.4, ox, oy, R * LAKE.hondoDesde);
  pozo.addColorStop(0, 'rgba(6,20,28,0.4)');
  pozo.addColorStop(1, 'rgba(6,20,28,0)');
  ctx.fillStyle = pozo;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Cáusticas del vado: la red de luz que el sol dibuja en el fondo de poca
// agua. Solo donde se ve el fondo —en el hondo no llega—, y es lo que hace
// que la orilla se lea como agua POCO PROFUNDA y no como pintura clara.
export function causticas(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < LAKE.causticas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.62 + rnd() * 0.33);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const largo = R * (0.05 + rnd() * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.strokeStyle = `rgba(228,246,238,${0.05 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(0.5, R * 0.007);
    ctx.beginPath();
    ctx.moveTo(-largo / 2, 0);
    ctx.quadraticCurveTo(0, largo * (rnd() - 0.5) * 0.9, largo / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1;
}

// Manchas de fondo: el fondo de una charca no está a la misma hondura por
// todas partes. Unas manchas anchas y muy tenues bastan para que el azul deje
// de leerse como una capa de pintura.
export function manchasFondo(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 20; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.9;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.14 + rnd() * 0.26);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const hondo = rnd() < 0.55;
    g.addColorStop(0, hondo ? 'rgba(10,34,46,0.16)' : 'rgba(126,150,128,0.1)');
    g.addColorStop(1, hondo ? 'rgba(10,34,46,0)' : 'rgba(126,150,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}
