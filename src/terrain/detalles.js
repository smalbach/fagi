// Los detalles del suelo, uno a uno. Los usa el suelo cocido, que los siembra
// donde les toca el terreno, y el detalle de cerca, que los repone al acercarse.
// Todos se apoyan en la misma luz: filo claro de un lado, sombra del otro.

import { LUZ, LX, LY, HOJA, RAMA, SECA, MUSGO_T } from './paleta.js';

// Un guijarro: no es un punto, es una piedra pequeña. Lo que la delata es que
// tiene filo claro por donde entra la luz y sombra pegada por el otro lado.
export function guijarro(ctx, x, y, r, rnd) {
  // Medio enterrada: apenas más clara que la tierra. Si destaca, deja de ser
  // una piedra en el suelo y parece algo tirado encima.
  const gris = 52 + ((rnd() * 34) | 0);
  const giro = rnd() * Math.PI;
  const plano = 0.5 + rnd() * 0.45;

  ctx.fillStyle = 'rgba(10,12,15,0.34)';
  ctx.beginPath();
  ctx.ellipse(x - LX * r * 0.45, y - LY * r * 0.45, r * 1.05, r * plano * 1.05, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${gris},${gris - 2},${(gris * 0.92) | 0})`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * plano, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${gris + 46},${gris + 44},${gris + 36},0.34)`;
  ctx.lineWidth = Math.max(0.5, r * 0.26);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.85, r * plano * 0.85, giro, LUZ - 1.1, LUZ + 1.1);
  ctx.stroke();
}

// Una mata: tres o cuatro briznas que salen del mismo sitio, curvadas y de
// alturas distintas. Todas se apoyan en una sombrita, si no flotan.
export function mata(ctx, x, y, alto, rnd) {
  ctx.fillStyle = 'rgba(12,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, alto * 0.4, alto * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const briznas = 2 + ((rnd() * 3) | 0);
  const tono = HOJA[(rnd() * HOJA.length) | 0];
  ctx.lineCap = 'round';
  for (let i = 0; i < briznas; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
    const largo = alto * (0.6 + rnd() * 0.8);
    const cx = x + Math.cos(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.4;
    const cy = y + Math.sin(a) * largo * 0.5;
    ctx.strokeStyle = tono;
    ctx.globalAlpha = 0.45 + rnd() * 0.4;
    ctx.lineWidth = Math.max(0.7, alto * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + (rnd() - 0.5) * 2, y);
    ctx.quadraticCurveTo(cx, cy, x + Math.cos(a) * largo, y + Math.sin(a) * largo);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Hojarasca: ramitas y hojas secas tiradas por el suelo. Rompen la sensación de
// alfombra uniforme más que cualquier textura.
export function hojarasca(ctx, x, y, largo, rnd) {
  const a = rnd() * Math.PI * 2;
  ctx.strokeStyle = RAMA[(rnd() * RAMA.length) | 0];
  ctx.globalAlpha = 0.5 + rnd() * 0.4;
  ctx.lineWidth = 0.8 + rnd();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Una ramita no es recta: se quiebra una vez.
  const mx = x + Math.cos(a) * largo * 0.6;
  const my = y + Math.sin(a) * largo * 0.6;
  ctx.lineTo(mx, my);
  const b = a + (rnd() - 0.5) * 1.2;
  ctx.lineTo(mx + Math.cos(b) * largo * 0.5, my + Math.sin(b) * largo * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Una hoja caída. La hojarasca de ramitas sola no basta: lo que de verdad cubre
// el suelo de un bosque son hojas, y cada una se lee por su forma —punta, nervio
// y su sombra debajo— aunque mida cuatro píxeles.
export function hoja(ctx, x, y, largo, rnd) {
  const ancho = largo * (0.3 + rnd() * 0.2);
  const giro = rnd() * Math.PI;
  const tono = SECA[(rnd() * SECA.length) | 0];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);

  const forma = (dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(-largo / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, -ancho + dy, largo / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, ancho + dy, -largo / 2 + dx, dy);
    ctx.closePath();
  };

  // Su sombra: la hoja está caída ENCIMA de la tierra, no impresa en ella.
  ctx.fillStyle = 'rgba(10,12,15,0.3)';
  forma(-LX * largo * 0.1, -LY * largo * 0.1 + largo * 0.06);
  ctx.fill();

  ctx.globalAlpha = 0.55 + rnd() * 0.35;
  ctx.fillStyle = tono;
  forma(0, 0);
  ctx.fill();

  // El nervio, y el canto claro por donde la hoja se curva hacia la luz.
  ctx.strokeStyle = 'rgba(28,20,10,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-largo * 0.45, 0);
  ctx.lineTo(largo * 0.45, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(228,208,168,0.22)';
  ctx.beginPath();
  ctx.moveTo(-largo * 0.42, -ancho * 0.28);
  ctx.quadraticCurveTo(0, -ancho * 0.8, largo * 0.42, -ancho * 0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Musgo: una alfombra baja de grumos, no briznas. Sale en lo hondo y húmedo,
// que es donde no llega el sol y no se seca.
export function musgo(ctx, x, y, r, rnd) {
  const tono = MUSGO_T[(rnd() * MUSGO_T.length) | 0];
  const grumos = 8 + ((rnd() * 10) | 0);
  for (let i = 0; i < grumos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    const gx = x + Math.cos(a) * d;
    const gy = y + Math.sin(a) * d * 0.7;
    const rad = r * (0.16 + rnd() * 0.26);
    // Cada grumo con su lado a la luz: una mancha lisa se leería como pintura.
    ctx.fillStyle = tono;
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
function caminoQuebrado(x, y, largo, pasos, variacion, quiebro, rnd) {
  let a = rnd() * Math.PI * 2;
  const camino = [{ x, y }];
  const n = pasos + ((rnd() * variacion) | 0);
  for (let s = 0; s < n; s++) {
    a += (rnd() - 0.5) * quiebro;
    x += Math.cos(a) * (largo / n);
    y += Math.sin(a) * (largo / n);
    camino.push({ x, y });
  }
  return camino;
}

// Repasa el camino desplazado (dx, dy). Sin `cap` deja el remate de línea que
// ya hubiera en el contexto.
function trazar(ctx, camino, dx, dy, col, w, cap) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  if (cap) ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(camino[0].x + dx, camino[0].y + dy);
  for (let s = 1; s < camino.length; s++) ctx.lineTo(camino[s].x + dx, camino[s].y + dy);
  ctx.stroke();
}

// Una raíz asomada: el lomo de una raíz que cruza el suelo y se vuelve a
// enterrar. Va más clara por arriba y con su sombra pegada debajo.
export function raiz(ctx, x, y, largo, rnd) {
  const camino = caminoQuebrado(x, y, largo, 3, 3, 0.9, rnd);
  const grosor = 1.4 + rnd() * 2.2;
  trazar(ctx, camino, -LX * grosor * 0.5, -LY * grosor * 0.5, 'rgba(10,11,14,0.3)', grosor * 1.2, 'round');
  trazar(ctx, camino, 0, 0, 'rgba(58,42,26,0.55)', grosor, 'round');
  trazar(ctx, camino, LX * grosor * 0.3, LY * grosor * 0.3, 'rgba(142,116,76,0.28)', grosor * 0.4, 'round');
}

// Grieta de tierra seca: una línea quebrada oscura con su reflejo claro al lado.
// Igual que en la roca, el reflejo es lo que la hace hendidura y no raya.
export function grieta(ctx, x, y, largo, rnd) {
  const camino = caminoQuebrado(x, y, largo, 4, 5, 1.3, rnd);
  trazar(ctx, camino, LX, LY, 'rgba(180,170,148,0.1)', 1);
  trazar(ctx, camino, 0, 0, 'rgba(12,13,16,0.3)', 1.3);
}
