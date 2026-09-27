// Luz y sombra de Fagi: la luz del mundo vista desde dentro del cuerpo, el
// volumen de la quitina, el filo que brilla, el canto oscuro y la sombra que
// deja en el suelo.

import { mix } from '../sprite-kit.js';

const LUZ = -Math.PI * 0.72;

// El cuerpo gira; la luz del mundo no. Dentro del dibujo hay que girarla al
// revés para que el lomo brille siempre por el mismo lado del mapa.
export function luzLocal(angle) {
  const a = LUZ - angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

// Volumen de una pieza de quitina: claro por donde entra la luz, el tono propio
// en medio y el canto apagado al otro lado.
export function coraza(ctx, x, y, r, base, L, luzT = 0.42, sombraT = 0.6) {
  const g = ctx.createRadialGradient(
    x + L.x * r * 0.5, y + L.y * r * 0.5, r * 0.08,
    x, y, r * 1.18
  );
  g.addColorStop(0, mix(base, '#fff0d4', luzT));
  g.addColorStop(0.46, base);
  g.addColorStop(1, mix(base, '#150c06', sombraT));
  return g;
}

// El filo iluminado de una pieza: solo el arco que da a la luz. Se pinta con el
// recorte de la silueta ya puesto, así que el trazo se come hacia dentro y no
// engorda el contorno.
export function filo(ctx, ruta, x, y, r, color, alfa, ancho, L) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const a = Math.atan2(L.y, L.x);
  ctx.arc(x, y, r * 2.2, a - 1.15, a + 1.15);
  ctx.closePath();
  ctx.clip();
  ruta(ctx);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alfa;
  ctx.lineWidth = ancho;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// El canto de la pieza: una línea oscura finísima alrededor. Es lo que recorta
// la quitina contra el suelo; sin ella el degradado solo se lee como peluche.
export function contorno(ctx, ruta, ancho) {
  ruta(ctx);
  ctx.strokeStyle = 'rgba(26,13,5,0.55)';
  ctx.lineWidth = ancho;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// La sombra que deja en el suelo: una sola mancha para todo el cuerpo, tendida
// al lado contrario de la luz. Sin ella la hormiga flota.
export function sombra(ctx, L, vivo) {
  ctx.save();
  ctx.translate(-L.x * 2.6, -L.y * 2.6);
  ctx.rotate(0.06);
  const g = ctx.createRadialGradient(-3, 0, 1.5, -3, 0, 15);
  g.addColorStop(0, `rgba(6,8,11,${vivo ? 0.42 : 0.3})`);
  g.addColorStop(0.55, 'rgba(6,8,11,0.18)');
  g.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
