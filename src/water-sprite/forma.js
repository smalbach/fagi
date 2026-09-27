// La luz, los colores y la forma del lago: lo que comparten el lienzo quieto y
// lo que se dibuja vivo encima.

import { LAKE } from '../config.js';
import { azar } from '../sprite-kit.js';

export const LUZ = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el árbol
export const LX = Math.cos(LUZ);
export const LY = Math.sin(LUZ);

export const HONDO = '#16384a';       // el centro, donde no se ve el fondo
export const MEDIO = '#1f5f79';       // agua con fondo lejano
export const VADO = '#5c8f86';        // el poco fondo de la orilla, verdoso
export const ARENA = '#7d7154';
export const BARRO = '#2e281e';
export const JUNCO = ['#5a6e3f', '#6b7d47', '#475a37'];

// La orilla de un lago: un círculo al que se le suman tres ondas lentas. Las
// mismas para el lienzo quieto y para lo que se dibuja vivo encima, así que el
// perfil se saca de la semilla y no del azar de cada pasada.
export function perfil(semilla, mezcla, amplitud) {
  const rnd = azar((semilla ^ mezcla) >>> 0);
  const ondas = [];
  for (let i = 0; i < 3; i++) {
    ondas.push({
      k: 2 + i * 2 + ((rnd() * 2) | 0),
      amp: (amplitud / (i + 1)) * (0.7 + rnd() * 0.6),
      fase: rnd() * Math.PI * 2,
    });
  }
  return (a) => {
    let v = 1;
    for (const o of ondas) v += Math.sin(a * o.k + o.fase) * o.amp;
    return v;
  };
}

// El perfil de la orilla del agua. El lienzo, los reflejos y los juncos tienen
// que ceñirse al MISMO borde, así que se saca siempre de aquí.
export const perfilOrilla = (semilla) => perfil(semilla, 0x51ed270b, LAKE.bordeOnda);

// Traza el contorno en el contexto que se le dé. 72 tramos: a este tamaño ya no
// se distinguen de una curva.
export function contorno(ctx, cx, cy, r, forma, pasos = 72) {
  ctx.beginPath();
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * Math.PI * 2;
    const rr = r * forma(a);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
