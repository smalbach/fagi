// --- el esqueleto ---------------------------------------------------------

import { mix, azar } from '../sprite-kit.js';
import { LX, LY, lienzoDeTronco } from './comun.js';

// El ramaje, en coordenadas relativas al centro del árbol. Se calcula aparte de
// quien lo pinta porque lo pintan DOS lienzos —el del tronco, por detrás de la
// hoja, y el de las puntas, por delante— y tienen que salir idénticos. Un mismo
// esqueleto pintado dos veces se lee como una rama que entra en la copa y sale
// por el otro lado; dos esqueletos parecidos se leen como un enredo.
export function ramasDe(semilla, R) {
  const rnd = azar((semilla ^ 0x7f4a7c15) >>> 0);
  const inclina = (rnd() - 0.5) * 0.22;
  const x0 = inclina * R;
  const y0 = -R * 0.3;                  // la cruz: donde el fuste se abre
  const segs = [];

  const crecer = (x, y, a, largo, grosor, nivel) => {
    const cx = x + Math.cos(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.28;
    const cy = y + Math.sin(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.28;
    const x2 = x + Math.cos(a) * largo;
    const y2 = y + Math.sin(a) * largo;
    segs.push({ x, y, cx, cy, x2, y2, grosor, nivel });
    if (nivel >= 2) return;
    for (const lado of [-1, 1]) {
      crecer(x2, y2, a + lado * (0.3 + rnd() * 0.45),
        largo * (0.52 + rnd() * 0.22), grosor * 0.58, nivel + 1);
    }
  };

  const n = 4 + ((rnd() * 2) | 0);
  for (let i = 0; i < n; i++) {
    // Se abren en abanico hacia arriba, ninguna colgando hacia el suelo.
    const a = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * 2.4 + (rnd() - 0.5) * 0.26;
    // Cortas a propósito: el ramaje vive DENTRO de la copa. Una rama que asoma
    // por encima de la hoja no se lee como rama, se lee como árbol muerto.
    crecer(x0, y0, a, R * (0.26 + rnd() * 0.12), Math.max(1.6, R * 0.13), 0);
  }
  return { inclina, segs, cruz: { x: x0, y: y0 } };
}

// Traza los tramos que pase el filtro. Cada uno lleva su reflejo por el lado de
// la luz: es lo que separa una rama de una raya pintada.
export function trazarRamas(ctx, cx, cy, segs, claro, oscuro, filtro, alfa = 1) {
  ctx.lineCap = 'round';
  ctx.globalAlpha = alfa;
  for (const s of segs) {
    if (filtro && !filtro(s)) continue;
    ctx.strokeStyle = oscuro;
    ctx.lineWidth = s.grosor;
    ctx.beginPath();
    ctx.moveTo(cx + s.x, cy + s.y);
    ctx.quadraticCurveTo(cx + s.cx, cy + s.cy, cx + s.x2, cy + s.y2);
    ctx.stroke();

    if (s.grosor > 1.8) {
      const d = s.grosor * 0.3;
      ctx.strokeStyle = claro;
      ctx.lineWidth = s.grosor * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx + s.x + LX * d, cy + s.y + LY * d);
      ctx.quadraticCurveTo(cx + s.cx + LX * d, cy + s.cy + LY * d,
        cx + s.x2 + LX * d, cy + s.y2 + LY * d);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// Las puntas del ramaje, para ir POR ENCIMA de la hoja. Solo los tramos más
// finos, y apagados: se trata de que entre hoja y hoja asome madera, no de
// dibujar un esqueleto encima de la copa. Cuanto más seco el árbol, más se ven,
// que es justo lo que delata al viejo.
export function pintarRamaje(semilla, R, seco) {
  const { S, c, ctx, base } = lienzoDeTronco(semilla, R);
  const { segs } = ramasDe(semilla, R);
  trazarRamas(ctx, S / 2, S / 2, segs,
    mix(base, '#d8bc90', 0.45), mix(base, '#120c07', 0.55),
    (s) => s.nivel >= 2, 0.4 + seco * 0.5);
  return c;
}
