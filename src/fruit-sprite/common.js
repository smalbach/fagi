// Piezas comunes de los frutos: la luz, la sombra en el suelo, el volumen, el
// punto de luz, las manchas de lo que se pasa y el rabo con su hoja. Y los
// trazos sueltos que todos los pintores repiten.

import { mix } from '../sprite-kit.js';

export const LIGHT = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el nido
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

// --- trazos ---------------------------------------------------------------

// Un círculo relleno.
export function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Pinta el lienzo entero: con el recorte puesto, solo cae dentro de la pieza.
export function cover(ctx, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// La ruta cerrada que une una lista de puntos.
export function polygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// --- piezas ---------------------------------------------------------------

// La sombra que deja en el suelo. Son DOS: la larga y blanda que tira la luz
// hacia el lado contrario, y la corta y dura del contacto, justo debajo, donde
// no entra luz de ninguna parte. Sin la segunda la pieza flota por muy bien
// pintada que esté.
export function shadow(ctx, cx, cy, r, force = 0.45) {
  blurred(ctx, cx - LX * r * 0.3, cy - LY * r * 0.3 + r * 0.55, 0.38, r * 1.2, '6,8,11', force);
  blurred(ctx, cx, cy + r * 0.62, 0.34, r * 0.62, '4,5,7', force * 1.5);
}

// Una mancha redonda que se apaga hacia el borde, aplastada contra el suelo.
function blurred(ctx, x, y, squash, rad, rgb, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  circle(ctx, 0, 0, rad, g);
  ctx.restore();
}

// Volumen de bola: claro por donde entra la luz, oscuro al otro lado. Se llama
// con el recorte de la silueta ya puesto.
export function volume(ctx, cx, cy, r, base, lightT = 0.45, shadowT = 0.58) {
  const g = ctx.createRadialGradient(
    cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.08,
    cx, cy, r * 1.2
  );
  g.addColorStop(0, mix(base, '#ffffff', lightT));
  g.addColorStop(0.5, base);
  g.addColorStop(1, mix(base, '#0d1015', shadowT));
  cover(ctx, g);

  // Rebote del suelo: la tierra devuelve algo de luz, así que el lado en sombra
  // no es negro, es pardo. Es lo que ata la pieza al sitio donde está tirada, en
  // vez de dejarla recortada encima.
  const echo = ctx.createRadialGradient(
    cx - LX * r * 0.7, cy - LY * r * 0.7, r * 0.05,
    cx - LX * r * 0.5, cy - LY * r * 0.5, r * 1.05
  );
  echo.addColorStop(0, 'rgba(126,106,72,0.2)');
  echo.addColorStop(1, 'rgba(126,106,72,0)');
  cover(ctx, echo);
}

// El punto de luz. Una mancha alargada puesta de canto a la luz: es lo que hace
// que una bola parezca mojada en vez de plana.
export function lustre(ctx, cx, cy, r, force) {
  if (force <= 0.02) return;
  ctx.save();
  ctx.translate(cx + LX * r * 0.44, cy + LY * r * 0.44);
  ctx.rotate(LIGHT + Math.PI / 2);
  ctx.fillStyle = `rgba(255,255,255,${force})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Las manchas de lo que se está pasando: primero salpicaduras, luego zonas
// hundidas. Van dentro del recorte de la pieza.
export function patches(ctx, cx, cy, r, past, rnd) {
  if (past <= 0) return;
  const n = 2 + ((past * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const rad = r * (0.12 + rnd() * 0.24) * (0.5 + past * 0.8);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(48,30,22,${0.2 + past * 0.4})`);
    g.addColorStop(1, 'rgba(48,30,22,0)');
    circle(ctx, x, y, rad, g);
  }
}

// Rabo y hoja: lo que dice que esto cayó de un árbol. Los dos se secan.
export function stub(ctx, cx, cy, r, past, rnd) {
  const sideOf = rnd() < 0.5 ? -1 : 1;
  ctx.strokeStyle = mix('#6b4a2f', '#3a2a1a', past);
  ctx.lineWidth = Math.max(1, r * 0.17);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.82);
  ctx.quadraticCurveTo(cx + sideOf * r * 0.1, cy - r * 1.15, cx + sideOf * r * 0.3, cy - r * 1.24);
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.save();
  ctx.translate(cx + sideOf * r * 0.3, cy - r * 1.2);
  ctx.rotate(sideOf * -0.45);
  ctx.fillStyle = mix('#4fa05a', '#8a6b3a', Math.min(1, past * 1.3));
  ctx.beginPath();
  ctx.ellipse(sideOf * r * 0.3, 0, r * 0.34, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,34,20,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sideOf * r * 0.6, 0);
  ctx.stroke();
  ctx.restore();
}
