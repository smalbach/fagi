// Lo que el suelo gana al acercarse. El suelo se cuece UNA vez al tamaño del
// mundo, así que de cerca se estira; estas dos capas le devuelven lo que el
// estirado se come.

import { azar, semillaDe, ruido } from '../sprite-kit.js';
import { guijarro, mata, hoja, hojarasca } from './detalles.js';

// Grano de zoom. El suelo se cuece UNA vez al tamaño del mundo, así que al
// acercarse se estira y pierde el tacto: repintarlo por cada escalón de zoom
// costaría un lienzo de varios millones de píxeles. Esta capa va en píxeles de
// PANTALLA, se repite como un azulejo y devuelve el grano que el estirado se
// come, sin repintar nada. Cuanto más cerca, más se nota.
let azulejo = null;
let patron = null;

export function drawGranoZoom(ctx, zoom) {
  if (zoom <= 1.12) return;
  azulejo ??= ruido(160, 160, azar(0x51a3d7), 3, 3);
  patron ??= ctx.createPattern(azulejo, 'repeat');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.22, (zoom - 1) * 0.11);
  ctx.fillStyle = patron;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Detalle de cerca. El suelo se cuece UNA vez al tamaño del mundo, así que al
// acercarse se estira: el grano de pantalla devuelve el tacto, pero no devuelve
// COSAS. De cerca, un suelo sin una china, una brizna o un trozo de hoja a
// tamaño de Fagi se lee como una foto borrosa.
//
// Esta capa siembra esas cosas en coordenadas de MUNDO, por celdas y con semilla
// propia de cada celda: la misma china sale siempre en el mismo sitio, así que
// al mover la cámara el suelo no hierve. Solo se siembra lo que se ve, y la
// cantidad sube con el aumento: de lejos no hay nada que pagar.
const CELDA = 96;              // lado de celda, en píxeles de mundo

export function drawDetalleCerca(ctx, world, cam, canvas) {
  const fuerza = Math.min(1, (cam.zoom - 1.25) / 1.4);
  if (fuerza <= 0) return;

  const vw = canvas.width / cam.zoom;
  const vh = canvas.height / cam.zoom;
  const i0 = Math.floor((cam.x - vw / 2) / CELDA);
  const i1 = Math.ceil((cam.x + vw / 2) / CELDA);
  const j0 = Math.floor((cam.y - vh / 2) / CELDA);
  const j1 = Math.ceil((cam.y + vh / 2) / CELDA);
  const semilla = semillaDe(world);

  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ox = i * CELDA;
      const oy = j * CELDA;
      if (ox > world.width || oy > world.height || ox + CELDA < 0 || oy + CELDA < 0) continue;
      const rnd = azar((semilla ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0);
      celda(ctx, ox, oy, rnd, fuerza);
    }
  }
  ctx.globalAlpha = 1;
}

// Lo que hay en un palmo de tierra: arenilla, alguna china, una brizna y un
// trozo de hoja. En este orden, que es el que tienen en el suelo.
function celda(ctx, ox, oy, rnd, fuerza) {
  // `cuantos` a plena fuerza, cada uno en un punto al azar de la celda.
  const esparcir = (cuantos, poner) => {
    for (let k = 0, n = Math.round(cuantos * fuerza); k < n; k++) {
      poner(ox + rnd() * CELDA, oy + rnd() * CELDA);
    }
  };

  ctx.globalAlpha = fuerza;
  esparcir(34, (x, y) => {
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(228,216,188,${0.05 + rnd() * 0.1})`
      : `rgba(12,13,16,${0.07 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 0.8 + rnd() * 0.7, 0.8);
  });
  esparcir(7, (x, y) => guijarro(ctx, x, y, 0.8 + rnd() * 1.8, rnd));
  esparcir(5, (x, y) => mata(ctx, x, y, 2 + rnd() * 3.5, rnd));
  esparcir(4, (x, y) => hoja(ctx, x, y, 2.5 + rnd() * 3.5, rnd));
  esparcir(3, (x, y) => hojarasca(ctx, x, y, 2 + rnd() * 4, rnd));
  ctx.globalAlpha = 1;
}
