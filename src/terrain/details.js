// Los detalles del suelo, uno a uno. Los usa el suelo cocido, que los siembra
// donde les toca el terreno, y el detalle de cerca, que los repone al acercarse.
// Todos se apoyan en la misma luz: filo claro de un lado, sombra del otro.

import { LIGHT, LX, LY, LEAF, BRANCH, DRY, MOSS_T } from './palette.js';

// Un guijarro: no es un punto, es una piedra pequeña. Lo que la delata es que
// tiene filo claro por donde entra la luz y sombra pegada por el otro lado.
export function pebble(ctx, x, y, r, rnd) {
  // Medio enterrada: apenas más clara que la tierra. Si destaca, deja de ser
  // una piedra en el suelo y parece algo tirado encima.
  const gray = 52 + ((rnd() * 34) | 0);
  const giro = rnd() * Math.PI;
  const flat = 0.5 + rnd() * 0.45;

  ctx.fillStyle = 'rgba(10,12,15,0.34)';
  ctx.beginPath();
  ctx.ellipse(x - LX * r * 0.45, y - LY * r * 0.45, r * 1.05, r * flat * 1.05, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${gray},${gray - 2},${(gray * 0.92) | 0})`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * flat, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${gray + 46},${gray + 44},${gray + 36},0.34)`;
  ctx.lineWidth = Math.max(0.5, r * 0.26);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.85, r * flat * 0.85, giro, LIGHT - 1.1, LIGHT + 1.1);
  ctx.stroke();
}

// Una mata: tres o cuatro briznas que salen del mismo sitio, curvadas y de
// alturas distintas. Todas se apoyan en una sombrita, si no flotan.
export function bush(ctx, x, y, tall, rnd) {
  ctx.fillStyle = 'rgba(12,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, tall * 0.4, tall * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const blades = 2 + ((rnd() * 3) | 0);
  const tone = LEAF[(rnd() * LEAF.length) | 0];
  ctx.lineCap = 'round';
  for (let i = 0; i < blades; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
    const length = tall * (0.6 + rnd() * 0.8);
    const cx = x + Math.cos(a) * length * 0.5 + (rnd() - 0.5) * length * 0.4;
    const cy = y + Math.sin(a) * length * 0.5;
    ctx.strokeStyle = tone;
    ctx.globalAlpha = 0.45 + rnd() * 0.4;
    ctx.lineWidth = Math.max(0.7, tall * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + (rnd() - 0.5) * 2, y);
    ctx.quadraticCurveTo(cx, cy, x + Math.cos(a) * length, y + Math.sin(a) * length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Hojarasca: ramitas y hojas secas tiradas por el suelo. Rompen la sensación de
// alfombra uniforme más que cualquier textura.
export function litter(ctx, x, y, length, rnd) {
  const a = rnd() * Math.PI * 2;
  ctx.strokeStyle = BRANCH[(rnd() * BRANCH.length) | 0];
  ctx.globalAlpha = 0.5 + rnd() * 0.4;
  ctx.lineWidth = 0.8 + rnd();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Una ramita no es recta: se quiebra una vez.
  const mx = x + Math.cos(a) * length * 0.6;
  const my = y + Math.sin(a) * length * 0.6;
  ctx.lineTo(mx, my);
  const b = a + (rnd() - 0.5) * 1.2;
  ctx.lineTo(mx + Math.cos(b) * length * 0.5, my + Math.sin(b) * length * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Una hoja caída. La hojarasca de ramitas sola no basta: lo que de verdad cubre
// el suelo de un bosque son hojas, y cada una se lee por su forma —punta, nervio
// y su sombra debajo— aunque mida cuatro píxeles.
export function leaf(ctx, x, y, length, rnd) {
  const width = length * (0.3 + rnd() * 0.2);
  const giro = rnd() * Math.PI;
  const tone = DRY[(rnd() * DRY.length) | 0];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);

  const shape = (dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(-length / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, -width + dy, length / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, width + dy, -length / 2 + dx, dy);
    ctx.closePath();
  };

  // Su sombra: la hoja está caída ENCIMA de la tierra, no impresa en ella.
  ctx.fillStyle = 'rgba(10,12,15,0.3)';
  shape(-LX * length * 0.1, -LY * length * 0.1 + length * 0.06);
  ctx.fill();

  ctx.globalAlpha = 0.55 + rnd() * 0.35;
  ctx.fillStyle = tone;
  shape(0, 0);
  ctx.fill();

  // El nervio, y el canto claro por donde la hoja se curva hacia la luz.
  ctx.strokeStyle = 'rgba(28,20,10,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-length * 0.45, 0);
  ctx.lineTo(length * 0.45, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(228,208,168,0.22)';
  ctx.beginPath();
  ctx.moveTo(-length * 0.42, -width * 0.28);
  ctx.quadraticCurveTo(0, -width * 0.8, length * 0.42, -width * 0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Musgo: una alfombra baja de grumos, no briznas. Sale en lo hondo y húmedo,
// que es donde no llega el sol y no se seca.
export function moss(ctx, x, y, r, rnd) {
  const tone = MOSS_T[(rnd() * MOSS_T.length) | 0];
  const clumps = 8 + ((rnd() * 10) | 0);
  for (let i = 0; i < clumps; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    const gx = x + Math.cos(a) * d;
    const gy = y + Math.sin(a) * d * 0.7;
    const rad = r * (0.16 + rnd() * 0.26);
    // Cada grumo con su lado a la luz: una mancha lisa se leería como pintura.
    ctx.fillStyle = tone;
    ctx.globalAlpha = 0.16 + rnd() * 0.2;
    ctx.beginPath();
    ctx.arc(gx, gy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(186,206,150,0.14)';
    ctx.beginPath();
    ctx.arc(gx + LX * rad * 0.3, gy + LY * rad * 0.3, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Un camino quebrado de `largo` que arranca en (x, y): entre `pasos` y
// `pasos + variacion - 1` tramos, cada uno torcido hasta `quiebro` radianes
// respecto al anterior. Lo comparten la raíz y la grieta.
function brokenPath(x, y, length, steps, variation, kink, rnd) {
  let a = rnd() * Math.PI * 2;
  const path = [{ x, y }];
  const n = steps + ((rnd() * variation) | 0);
  for (let s = 0; s < n; s++) {
    a += (rnd() - 0.5) * kink;
    x += Math.cos(a) * (length / n);
    y += Math.sin(a) * (length / n);
    path.push({ x, y });
  }
  return path;
}

// Repasa el camino desplazado (dx, dy). Sin `cap` deja el remate de línea que
// ya hubiera en el contexto.
function trace(ctx, path, dx, dy, col, w, cap) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  if (cap) ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x + dx, path[0].y + dy);
  for (let s = 1; s < path.length; s++) ctx.lineTo(path[s].x + dx, path[s].y + dy);
  ctx.stroke();
}

// Una raíz asomada: el lomo de una raíz que cruza el suelo y se vuelve a
// enterrar. Va más clara por arriba y con su sombra pegada debajo.
export function root(ctx, x, y, length, rnd) {
  const path = brokenPath(x, y, length, 3, 3, 0.9, rnd);
  const thickness = 1.4 + rnd() * 2.2;
  trace(ctx, path, -LX * thickness * 0.5, -LY * thickness * 0.5, 'rgba(10,11,14,0.3)', thickness * 1.2, 'round');
  trace(ctx, path, 0, 0, 'rgba(58,42,26,0.55)', thickness, 'round');
  trace(ctx, path, LX * thickness * 0.3, LY * thickness * 0.3, 'rgba(142,116,76,0.28)', thickness * 0.4, 'round');
}

// Grieta de tierra seca: una línea quebrada oscura con su reflejo claro al lado.
// Igual que en la roca, el reflejo es lo que la hace hendidura y no raya.
export function crack(ctx, x, y, length, rnd) {
  const path = brokenPath(x, y, length, 4, 5, 1.3, rnd);
  trace(ctx, path, LX, LY, 'rgba(180,170,148,0.1)', 1);
  trace(ctx, path, 0, 0, 'rgba(12,13,16,0.3)', 1.3);
}
