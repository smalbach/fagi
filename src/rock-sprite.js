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

import { seedFor, detail, stamp } from './sprite-kit.js';
import { realisticRockOf, drawRealisticRock } from './rock-sprite/realistic.js';
import { paintRock } from './rock-sprite/paint.js';

const sprites = new Map();   // clave: semilla|radio

export function drawRock(ctx, o, spec, r) {
  const seedOf = seedFor(o) >>> 0;
  const realistic = realisticRockOf(seedOf);
  if (realistic) {
    drawRealisticRock(ctx, o, r, realistic.rock, realistic.type, seedOf);
    return;
  }
  // Se pinta con el radio multiplicado por la escala de detalle y se estampa al
  // tamaño de mundo: de cerca la piedra tiene más píxeles, no los mismos estirados.
  const z = detail();
  const img = spriteOf(seedFor(o), r * z, spec.color);
  stamp(ctx, img, o.x, o.y, z);
}

function spriteOf(seedOf, r, color) {
  const key = `${seedOf}|${Math.round(r)}|${color}`;
  const saved = sprites.get(key);
  if (saved) return saved;
  const img = paintRock(seedOf, Math.round(r), color);
  sprites.set(key, img);
  return img;
}
