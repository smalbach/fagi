// Lo que comparten las piezas del árbol: la luz, la corteza y el lienzo del
// tronco. El tronco y las puntas del ramaje se pintan en lienzos del mismo
// tamaño y con el mismo color de madera, así que salen de aquí los dos.

import { canvasOf, mix, seededRng } from '../sprite-kit.js';

export const CROWN_RISE = 0.34;        // cuánto se sienta la copa por encima del centro

export const LIGHT = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el nido
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

const BARK = '#4e3620';
export const LICHEN = ['#6c7a52', '#87906a', '#5c6b4a'];

// El lienzo del tronco y el color de su madera. Lo usan el tronco y las puntas
// del ramaje con la misma semilla: así el ramaje de encima de la hoja es de la
// misma madera que el de debajo. Devuelve también el azar, que el tronco sigue
// gastando después.
export function trunkCanvas(seedOf, R) {
  const rnd = seededRng((seedOf ^ 0x2545f491) >>> 0);
  const pad = Math.ceil(R * 0.6) + 6;
  const S = (R + pad) * 2;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  const base = mix(BARK, rnd() < 0.5 ? '#6a4b2c' : '#3d2a18', rnd() * 0.5);
  return { rnd, S, c, ctx, base };
}
