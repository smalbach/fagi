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
import { colorPorMadurez } from './colors.js';
import { lienzo, azar, semillaDe, cacheSprite, detalle, estampar } from './sprite-kit.js';
import { baya } from './fruit-sprite/baya.js';
import { chispa } from './fruit-sprite/chispa.js';
import { ojo } from './fruit-sprite/ojo.js';
import { resina } from './fruit-sprite/resina.js';
import { podrido } from './fruit-sprite/podrido.js';

const sprites = new Map();     // clave: tipo|radio|variante|escalón de madurez

const PASOS = 12;              // en cuántos escalones se redondea la madurez
const VARIANTES = 4;           // piezas distintas por tipo: ni dos iguales juntas

const PINTORES = { nectar: baya, chispa, ojo, resina, toxico: podrido };

export function drawFruit(ctx, p) {
  const z = detalle();
  const r = Math.max(2, Math.round(POINT_TYPES[p.type].radius * z));
  const paso = Math.round(ripeness(p) * PASOS);
  const img = cacheSprite(
    sprites,
    `${p.type}|${r}|${semillaDe(p) % VARIANTES}|${paso}`,
    () => pintar(p.type, r, semillaDe(p) % VARIANTES, paso / PASOS),
    600
  );
  estampar(ctx, img, p.x, p.y, z);
}

function pintar(tipo, r, variante, madurez) {
  const semilla = [...tipo].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const rnd = azar((semilla ^ (variante * 7919)) >>> 0);
  const base = colorPorMadurez(tipo, madurez);
  // Lo pasado: 0 = todavía buena, 1 = a punto de pudrirse (o de deshacerse, si
  // ya es lo podrido).
  const pasado = Math.max(0, (madurez - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));

  const pad = Math.ceil(r * 1.4) + 5;
  const S = (r + pad) * 2;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');
  (PINTORES[tipo] ?? baya)(ctx, S / 2, S / 2, r, base, rnd, pasado);
  return c;
}
