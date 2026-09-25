// Color: mezclas y el color que le toca a cada cosa según su estado.

import { POINT_TYPES, FRUIT, WORLD } from './config.js';
import { ripeness } from './food.js';

// Acepta '#rrggbb' o 'rgb(r,g,b)' y devuelve los tres canales.
export function aRGB(c) {
  if (c.startsWith('#')) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return c.match(/\d+/g).slice(0, 3).map(Number);
}

// Mezcla dos colores hex. Sirve para ver cómo algo se va estropeando.
export function mezcla(a, b, t) {
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

// Color de un tipo según lo pasado que esté: del suyo al del tóxico. Y si ya
// es tóxico, se va apagando hacia el fondo hasta que desaparece.
// Va por madurez y no por punto para que el sprite pueda pedir el color de un
// escalón concreto sin tener delante la pieza.
export function colorPorMadurez(tipo, madurez) {
  const spec = POINT_TYPES[tipo];
  const aviso = Math.max(0, (madurez - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));
  if (aviso <= 0) return spec.color;
  const destino = tipo === FRUIT.rot ? WORLD.bgColor : POINT_TYPES[FRUIT.rot].color;
  return mezcla(spec.color, destino, aviso * 0.85);
}

// El de un punto concreto. Lo usan el punto y su estela, para que los dos
// cuenten lo mismo.
export function colorDe(p) {
  return colorPorMadurez(p.type, ripeness(p));
}

