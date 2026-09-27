// Lo que el suelo gana al acercarse. El suelo se cuece UNA vez al tamaño del
// mundo, así que de cerca se estira; estas dos capas le devuelven lo que el
// estirado se come.

import { seededRng, seedFor, noise } from '../sprite-kit.js';
import { pebble, bush, leaf, litter } from './details.js';

// Grano de zoom. El suelo se cuece UNA vez al tamaño del mundo, así que al
// acercarse se estira y pierde el tacto: repintarlo por cada escalón de zoom
// costaría un lienzo de varios millones de píxeles. Esta capa va en píxeles de
// PANTALLA, se repite como un azulejo y devuelve el grano que el estirado se
// come, sin repintar nada. Cuanto más cerca, más se nota.
let tile = null;
let pattern = null;

export function drawZoomGrain(ctx, zoom) {
  if (zoom <= 1.12) return;
  tile ??= noise(160, 160, seededRng(0x51a3d7), 3, 3);
  pattern ??= ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.22, (zoom - 1) * 0.11);
  ctx.fillStyle = pattern;
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
const CELL = 96;              // lado de celda, en píxeles de mundo

export function drawNearDetail(ctx, world, cam, canvas) {
  const force = Math.min(1, (cam.zoom - 1.25) / 1.4);
  if (force <= 0) return;

  const vw = canvas.width / cam.zoom;
  const vh = canvas.height / cam.zoom;
  const i0 = Math.floor((cam.x - vw / 2) / CELL);
  const i1 = Math.ceil((cam.x + vw / 2) / CELL);
  const j0 = Math.floor((cam.y - vh / 2) / CELL);
  const j1 = Math.ceil((cam.y + vh / 2) / CELL);
  const seedOf = seedFor(world);

  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ox = i * CELL;
      const oy = j * CELL;
      if (ox > world.width || oy > world.height || ox + CELL < 0 || oy + CELL < 0) continue;
      const rnd = seededRng((seedOf ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0);
      cellOf(ctx, ox, oy, rnd, force);
    }
  }
  ctx.globalAlpha = 1;
}

// Lo que hay en un palmo de tierra: arenilla, alguna china, una brizna y un
// trozo de hoja. En este orden, que es el que tienen en el suelo.
function cellOf(ctx, ox, oy, rnd, force) {
  // `cuantos` a plena fuerza, cada uno en un punto al azar de la celda.
  const scatter = (howMany, put) => {
    for (let k = 0, n = Math.round(howMany * force); k < n; k++) {
      put(ox + rnd() * CELL, oy + rnd() * CELL);
    }
  };

  ctx.globalAlpha = force;
  scatter(34, (x, y) => {
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(228,216,188,${0.05 + rnd() * 0.1})`
      : `rgba(12,13,16,${0.07 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 0.8 + rnd() * 0.7, 0.8);
  });
  scatter(7, (x, y) => pebble(ctx, x, y, 0.8 + rnd() * 1.8, rnd));
  scatter(5, (x, y) => bush(ctx, x, y, 2 + rnd() * 3.5, rnd));
  scatter(4, (x, y) => leaf(ctx, x, y, 2.5 + rnd() * 3.5, rnd));
  scatter(3, (x, y) => litter(ctx, x, y, 2 + rnd() * 4, rnd));
  ctx.globalAlpha = 1;
}
