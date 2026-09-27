// Los frutos pintados. La forma de cada punto no es adorno: es su ficha
// dibujada, para que se lea de un vistazo qué hace al comerlo.
//
//   nectar : baya carnosa con rabo y hoja. Es alimento de verdad, el que llena.
//   chispa : esquirla de cristal, aristas y destellos. Da velocidad.
//   ojo    : un ojo que mira. Da vista.
//   resina : gota de ámbar espesa, con su goteo. Estira lo comido.
//   toxico : masa deshecha, moho y vaho. Es lo podrido.
//
// Y la madurez va en el dibujo, no solo en el color: antes de pudrirse la fruta
// se mancha, se vence y pierde el brillo. Quien mira el mapa puede ver que a esa
// pieza le queda poco sin tener que acordarse de cuándo cayó.
//
// Cada combinación de tipo, radio, variante y escalón de madurez se pinta UNA
// vez en su propio lienzo y luego solo se estampa.
//
// Cada pintor vive en su módulo de `fruit-sprite/`, y lo que comparten (luz,
// sombra, volumen, lustre, manchas, rabo) en `fruit-sprite/comunes.js`.

import { POINT_TYPES, FRUIT } from './config.js';
import { ripeness } from './food.js';
import { colorByRipeness } from './colors.js';
import { canvasOf, seededRng, seedFor, cacheSprite, detail, stamp } from './sprite-kit.js';
import { berry } from './fruit-sprite/berry.js';
import { spark } from './fruit-sprite/spark.js';
import { eye } from './fruit-sprite/eye.js';
import { resin } from './fruit-sprite/resin.js';
import { rotten } from './fruit-sprite/rotten.js';

const sprites = new Map();     // clave: tipo|radio|variante|escalón de madurez

const STEPS = 12;              // en cuántos escalones se redondea la madurez
const VARIANTS = 4;           // piezas distintas por tipo: ni dos iguales juntas

const PAINTERS = { nectar: berry, spark, eye, resin, toxic: rotten };

export function drawFruit(ctx, p) {
  const z = detail();
  const r = Math.max(2, Math.round(POINT_TYPES[p.type].radius * z));
  const step = Math.round(ripeness(p) * STEPS);
  const img = cacheSprite(
    sprites,
    `${p.type}|${r}|${seedFor(p) % VARIANTS}|${step}`,
    () => paint(p.type, r, seedFor(p) % VARIANTS, step / STEPS),
    600
  );
  stamp(ctx, img, p.x, p.y, z);
}

function paint(type, r, variant, ripenessOf) {
  const seedOf = [...type].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const rnd = seededRng((seedOf ^ (variant * 7919)) >>> 0);
  const base = colorByRipeness(type, ripenessOf);
  // Lo pasado: 0 = todavía buena, 1 = a punto de pudrirse (o de deshacerse, si
  // ya es lo podrido).
  const past = Math.max(0, (ripenessOf - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));

  const pad = Math.ceil(r * 1.4) + 5;
  const S = (r + pad) * 2;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  (PAINTERS[type] ?? berry)(ctx, S / 2, S / 2, r, base, rnd, past);
  return c;
}
