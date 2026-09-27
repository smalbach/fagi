// El dibujo de Fagi. Solo pinta: no sabe nada de reglas ni de decisiones.
//
// Fagi es una hormiga, y se dibuja como tal: tres partes de verdad —gáster,
// mesosoma y cabeza— unidas por el peciolo, que es la cintura que solo tienen
// las hormigas y lo que más las delata desde arriba. Seis patas de tres tramos
// que caminan en trípode, antenas acodadas —escapo y funículo, como las de
// verdad— y una hoja verde a la espalda, que es lo que le da carácter y sirve
// igual de logo.
//
// Se pinta con trazo, no con imagen guardada: la cámara la agranda hasta cuatro
// veces y una hormiga estirada se vería antes que cualquier otra cosa.
//
// La luz es la MISMA que la del suelo, la roca y el árbol: arriba a la
// izquierda del mundo. Como el cuerpo gira, dentro del dibujo la luz tiene que
// girar al revés (`luzLocal`), o al darse la vuelta el brillo la seguiría y se
// leería como plástico.
//
// Cada parte vive en su módulo de `fagi-sprite/`; aquí solo se montan en orden.

import { SKIN, DEAD, LEAF, DEAD_LEAF } from './fagi-sprite/palette.js';
import { localLight, shadow } from './fagi-sprite/light.js';
import { drawLegs } from './fagi-sprite/legs.js';
import { drawBody } from './fagi-sprite/body.js';
import { drawAntennas } from './fagi-sprite/antennae.js';
import { drawCarried } from './fagi-sprite/cargo.js';

export { ellipse } from './fagi-sprite/stroke.js';

export function drawFagi(ctx, fagi) {
  const alive = fagi.alive;
  const c = alive ? SKIN : DEAD;
  const leaf = alive ? LEAF : DEAD_LEAF;
  const step = alive ? fagi.stride * 0.07 : 0;

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x es hacia delante

  // La luz del mundo, vista desde dentro del cuerpo.
  const L = localLight(fagi.angle);

  shadow(ctx, L, alive);

  // Andar no es solo mover las patas: el cuerpo cabecea a cada trípode. Muy
  // poco —medio grado— pero es lo que separa caminar de deslizarse.
  const wobble = alive ? Math.sin(step) * 0.035 : 0;
  ctx.rotate(wobble);

  drawLegs(ctx, step, c, L, alive);
  drawBody(ctx, c, leaf, L, alive);
  drawAntennas(ctx, fagi, step, c, L, alive);
  if (fagi.carrying) drawCarried(ctx, fagi.carrying.type, L);

  ctx.restore();
}
