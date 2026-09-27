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

import { PIEL, MUERTA, HOJA, HOJA_MUERTA } from './fagi-sprite/paleta.js';
import { luzLocal, sombra } from './fagi-sprite/luz.js';
import { drawLegs } from './fagi-sprite/patas.js';
import { drawBody } from './fagi-sprite/cuerpo.js';
import { drawAntennas } from './fagi-sprite/antenas.js';
import { drawCarried } from './fagi-sprite/carga.js';

export { elipse } from './fagi-sprite/trazo.js';

export function drawFagi(ctx, fagi) {
  const vivo = fagi.alive;
  const c = vivo ? PIEL : MUERTA;
  const hoja = vivo ? HOJA : HOJA_MUERTA;
  const paso = vivo ? fagi.stride * 0.07 : 0;

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x es hacia delante

  // La luz del mundo, vista desde dentro del cuerpo.
  const L = luzLocal(fagi.angle);

  sombra(ctx, L, vivo);

  // Andar no es solo mover las patas: el cuerpo cabecea a cada trípode. Muy
  // poco —medio grado— pero es lo que separa caminar de deslizarse.
  const bamboleo = vivo ? Math.sin(paso) * 0.035 : 0;
  ctx.rotate(bamboleo);

  drawLegs(ctx, paso, c, L, vivo);
  drawBody(ctx, c, hoja, L, vivo);
  drawAntennas(ctx, fagi, paso, c, L, vivo);
  if (fagi.carrying) drawCarried(ctx, fagi.carrying.type, L);

  ctx.restore();
}
