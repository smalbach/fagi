// El pintor de lo podrido.

import { LIGHT, LX, LY, shadow, volume, circle } from './common.js';

// Podrido: ya no tiene forma propia. Bulto irregular, moho agarrado al lado de
// sombra, pozos hundidos y vaho. Y según se le acaba el tiempo se deshincha,
// hasta que desaparece del mapa.
export function rotten(ctx, cx, cy, r, base, rnd, past) {
  const k = 1 - past * 0.28;
  const rr = r * k;
  shadow(ctx, cx, cy, r * 1.05, 0.4);
  puddle(ctx, cx, cy, r, rr, past);

  const pts = deform(cx, cy, rr, rnd);

  ctx.save();
  lump(ctx, pts);
  ctx.clip();
  volume(ctx, cx, cy, rr, base, 0.2, 0.68);   // mate: lo podrido no brilla
  mold(ctx, cx, cy, rr, rnd);
  wells(ctx, cx, cy, rr, rnd);
  ctx.restore();

  mist(ctx, cx, cy, r, rr, rnd);
}

// Jugo: lo que ha soltado al deshacerse, en el suelo y a su alrededor.
function puddle(ctx, cx, cy, r, rr, past) {
  const g = ctx.createRadialGradient(cx, cy + rr * 0.5, 0, cx, cy + rr * 0.5, r * 1.5);
  g.addColorStop(0, `rgba(46,26,32,${0.3 * (0.4 + past)})`);
  g.addColorStop(1, 'rgba(46,26,32,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy + rr * 0.5, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
}

// El contorno vencido: nueve puntos a distancias desiguales del centro.
function deform(cx, cy, rr, rnd) {
  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const f = 0.7 + rnd() * 0.3;
    pts.push({ x: cx + Math.cos(a) * rr * f, y: cy + Math.sin(a) * rr * f * 0.95 });
  }
  return pts;
}

// La ruta blanda que pasa por esos puntos, sin una sola esquina.
function lump(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const m = pts[(i + 1) % n];
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + m.x) / 2, (pts[i].y + m.y) / 2);
  }
  ctx.closePath();
}

// Moho: grumos verdosos pegados al lado que no ve el sol, que es donde
// aguanta la humedad.
function mold(ctx, cx, cy, rr, rnd) {
  for (let m = 0; m < 3; m++) {
    const a = LIGHT + Math.PI + (rnd() - 0.5) * 2;
    const d = rr * (0.2 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    for (let i = 0; i < 6; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * rr * 0.4;
      const color = `rgba(150,168,120,${0.1 + rnd() * 0.16})`;
      circle(ctx, mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, rr * (0.1 + rnd() * 0.16), color);
    }
  }
}

// Pozos: donde se ha hundido la carne. Sombra arriba, filo claro abajo.
function wells(ctx, cx, cy, rr, rnd) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * rr * 0.7;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = rr * (0.12 + rnd() * 0.18);
    circle(ctx, x, y, rad, 'rgba(16,10,14,0.4)');
    ctx.strokeStyle = 'rgba(230,214,208,0.12)';
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LIGHT + 0.6, LIGHT + 2.6);
    ctx.stroke();
  }
}

// Vaho: dos hilillos subiendo. Es lo que se huele desde lejos.
function mist(ctx, cx, cy, r, rr, rnd) {
  for (let i = 0; i < 2; i++) {
    const x = cx + (i ? rr * 0.45 : -rr * 0.35);
    ctx.strokeStyle = `rgba(190,170,180,${0.1 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, cy - rr * 0.7);
    ctx.quadraticCurveTo(x + rr * 0.5, cy - rr * 1.3, x - rr * 0.2, cy - rr * 1.9);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}
