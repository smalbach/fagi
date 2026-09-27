// Rocas pintadas: cada roca se dibuja UNA vez en su propio lienzo (una imagen
// en memoria) y luego solo se estampa. Así puede llevar grano de piedra, vetas
// y sombra sin costar nada por fotograma.
//
// La silueta es irregular pero SIEMPRE cabe dentro del radio de colisión, para
// que lo que se ve y lo que estorba sigan siendo lo mismo.
//
// No hay "una textura de roca": hay materiales. Cada piedra saca uno al azar de
// su semilla, y el material decide color, grano, forma y qué le pasa por encima
// —estratos, huecos, líquen—. Dos rocas seguidas no se parecen.

// Las piezas viven en rock-sprite/: la roca fotográfica, los materiales, la
// forma, lo que le pasa por encima y el pintado de la procedural. Aquí solo se
// elige cuál se dibuja y se guardan los lienzos ya pintados.

import { semillaDe, detalle, estampar } from './sprite-kit.js';
import { rocaRealistaDe, drawRockRealista } from './rock-sprite/realista.js';
import { pintarRoca } from './rock-sprite/pintar.js';

const sprites = new Map();   // clave: semilla|radio

export function drawRock(ctx, o, spec, r) {
  const semilla = semillaDe(o) >>> 0;
  const realista = rocaRealistaDe(semilla);
  if (realista) {
    drawRockRealista(ctx, o, r, realista.roca, realista.tipo, semilla);
    return;
  }
  // Se pinta con el radio multiplicado por la escala de detalle y se estampa al
  // tamaño de mundo: de cerca la piedra tiene más píxeles, no los mismos estirados.
  const z = detalle();
  const img = spriteDe(semillaDe(o), r * z, spec.color);
  estampar(ctx, img, o.x, o.y, z);
}

function spriteDe(semilla, r, color) {
  const clave = `${semilla}|${Math.round(r)}|${color}`;
  const guardado = sprites.get(clave);
  if (guardado) return guardado;
  const img = pintarRoca(semilla, Math.round(r), color);
  sprites.set(clave, img);
  return img;
}
