// La luz, los colores y la forma del lago: lo que comparten el lienzo quieto y
// lo que se dibuja vivo encima.

import { LAKE } from '../config.js';
import { seededRng } from '../sprite-kit.js';

export const LIGHT = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el árbol
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

export const DEEP_KEY = '#16384a';       // el centro, donde no se ve el fondo
export const MIDDLE = '#1f5f79';       // agua con fondo lejano
export const SHALLOWS = '#5c8f86';        // el poco fondo de la orilla, verdoso
export const SAND = '#7d7154';
export const MUD = '#2e281e';
export const REED = ['#5a6e3f', '#6b7d47', '#475a37'];

// La orilla de un lago: un círculo al que se le suman tres ondas lentas. Las
// mismas para el lienzo quieto y para lo que se dibuja vivo encima, así que el
// perfil se saca de la semilla y no del azar de cada pasada.
export function profile(seedOf, blend, amplitude) {
  const rnd = seededRng((seedOf ^ blend) >>> 0);
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    ripples.push({
      k: 2 + i * 2 + ((rnd() * 2) | 0),
      amp: (amplitude / (i + 1)) * (0.7 + rnd() * 0.6),
      phase: rnd() * Math.PI * 2,
    });
  }
  return (a) => {
    let v = 1;
    for (const o of ripples) v += Math.sin(a * o.k + o.phase) * o.amp;
    return v;
  };
}

// El perfil de la orilla del agua. El lienzo, los reflejos y los juncos tienen
// que ceñirse al MISMO borde, así que se saca siempre de aquí.
export const shoreProfile = (seedOf) => profile(seedOf, 0x51ed270b, LAKE.waveEdge);

// Traza el contorno en el contexto que se le dé. 72 tramos: a este tamaño ya no
// se distinguen de una curva.
export function outline(ctx, cx, cy, r, shape, steps = 72) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r * shape(a);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
