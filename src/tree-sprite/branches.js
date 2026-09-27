// --- el esqueleto ---------------------------------------------------------

import { mix, seededRng } from '../sprite-kit.js';
import { LX, LY, trunkCanvas } from './common.js';

// El ramaje, en coordenadas relativas al centro del árbol. Se calcula aparte de
// quien lo pinta porque lo pintan DOS lienzos —el del tronco, por detrás de la
// hoja, y el de las puntas, por delante— y tienen que salir idénticos. Un mismo
// esqueleto pintado dos veces se lee como una rama que entra en la copa y sale
// por el otro lado; dos esqueletos parecidos se leen como un enredo.
export function branchesOf(seedOf, R) {
  const rnd = seededRng((seedOf ^ 0x7f4a7c15) >>> 0);
  const tilts = (rnd() - 0.5) * 0.22;
  const x0 = tilts * R;
  const y0 = -R * 0.3;                  // la cruz: donde el fuste se abre
  const secsOf = [];

  const growBy = (x, y, a, length, thickness, level) => {
    const cx = x + Math.cos(a) * length * 0.5 + (rnd() - 0.5) * length * 0.28;
    const cy = y + Math.sin(a) * length * 0.5 + (rnd() - 0.5) * length * 0.28;
    const x2 = x + Math.cos(a) * length;
    const y2 = y + Math.sin(a) * length;
    secsOf.push({ x, y, cx, cy, x2, y2, thickness, level });
    if (level >= 2) return;
    for (const sideOf of [-1, 1]) {
      growBy(x2, y2, a + sideOf * (0.3 + rnd() * 0.45),
        length * (0.52 + rnd() * 0.22), thickness * 0.58, level + 1);
    }
  };

  const n = 4 + ((rnd() * 2) | 0);
  for (let i = 0; i < n; i++) {
    // Se abren en abanico hacia arriba, ninguna colgando hacia el suelo.
    const a = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * 2.4 + (rnd() - 0.5) * 0.26;
    // Cortas a propósito: el ramaje vive DENTRO de la copa. Una rama que asoma
    // por encima de la hoja no se lee como rama, se lee como árbol muerto.
    growBy(x0, y0, a, R * (0.26 + rnd() * 0.12), Math.max(1.6, R * 0.13), 0);
  }
  return { tilts, secsOf, cross: { x: x0, y: y0 } };
}

// Traza los tramos que pase el filtro. Cada uno lleva su reflejo por el lado de
// la luz: es lo que separa una rama de una raya pintada.
export function traceBranches(ctx, cx, cy, secsOf, clear, dark, filterFn, alpha = 1) {
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha;
  for (const s of secsOf) {
    if (filterFn && !filterFn(s)) continue;
    ctx.strokeStyle = dark;
    ctx.lineWidth = s.thickness;
    ctx.beginPath();
    ctx.moveTo(cx + s.x, cy + s.y);
    ctx.quadraticCurveTo(cx + s.cx, cy + s.cy, cx + s.x2, cy + s.y2);
    ctx.stroke();

    if (s.thickness > 1.8) {
      const d = s.thickness * 0.3;
      ctx.strokeStyle = clear;
      ctx.lineWidth = s.thickness * 0.32;
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
export function paintBranches(seedOf, R, dry) {
  const { S, c, ctx, base } = trunkCanvas(seedOf, R);
  const { secsOf } = branchesOf(seedOf, R);
  traceBranches(ctx, S / 2, S / 2, secsOf,
    mix(base, '#d8bc90', 0.45), mix(base, '#120c07', 0.55),
    (s) => s.level >= 2, 0.4 + dry * 0.5);
  return c;
}
