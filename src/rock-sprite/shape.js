// La forma de la roca: la silueta, cómo se traza y las caras que la tallan.

import { LX, LY } from './common.js';
import { SILHOUETTE_MAX } from './materials.js';

// Contorno: pocos vértices de radio muy distinto, unidos por tramos rectos.
// Una piedra tiene caras y aristas; una curva suave parece huevo. Además se
// achata por un eje y se gira, así que ni dos siluetas coinciden.
// Se calcula una vez y se reutiliza, para que recorte, caras y filo cuadren.
export function shape(r, rnd, mat) {
  const [lmin, lmax] = mat.sides;
  const n = lmin + ((rnd() * (lmax - lmin + 1)) | 0);
  const phase = rnd() * Math.PI * 2;
  const giro = rnd() * Math.PI * 2;
  const ex = 1 - rnd() * mat.flattened;   // achatada por el eje X antes de girar
  const cg = Math.cos(giro);
  const sg = Math.sin(giro);
  const pts = [];
  for (let i = 0; i < n; i++) {
    // El ángulo también se mueve: vértices desigualmente repartidos, caras de
    // distinto ancho.
    const a = ((i + (rnd() - 0.5) * 0.45) / n) * Math.PI * 2;
    const lobe = Math.sin(a * 2 + phase) * 0.07 + Math.sin(a * 3 - phase) * 0.05;
    // Con picos, un vértice sí y otro no se queda corto: arista viva en medio.
    const tooth = mat.picos && i % 2 ? 0.8 : 1;
    const f = (mat.min + rnd() * (SILHOUETTE_MAX - mat.min) + lobe) * tooth;
    const rr = r * Math.max(mat.min, Math.min(SILHOUETTE_MAX, f));
    const x = Math.cos(a) * rr * ex;
    const y = Math.sin(a) * rr;
    pts.push({ x: x * cg - y * sg, y: x * sg + y * cg });
  }
  return pts;
}

export function trace(ctx, pts, cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
  ctx.closePath();
}

// Caras: triángulos del centro a cada arista. Cada uno se aclara u oscurece
// según hacia dónde mira respecto a la luz. Es lo que da el aspecto de bloque
// tallado en vez de mancha redonda.
export function faces(ctx, pts, cx, cy, clear, dark, rnd, force) {
  const n = pts.length;
  const hx = cx + (rnd() - 0.5) * 5;   // el vértice interior no está en el centro
  const hy = cy + (rnd() - 0.5) * 5;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = Math.hypot(mx, my) || 1;
    const toward = (mx / d) * LX + (my / d) * LY;   // 1 = cara de cara a la luz
    ctx.fillStyle = toward > 0 ? clear : dark;
    ctx.globalAlpha = Math.abs(toward) * force * (0.7 + rnd() * 0.6);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + a.x, cy + a.y);
    ctx.lineTo(cx + b.x, cy + b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Solo algunas aristas se marcan: si se dibujan todas se ve la porción de
  // tarta. Sueltas, pasan por planos de fractura.
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(10,11,14,0.14)';
  for (let i = 0; i < n; i++) {
    if (rnd() > 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
    ctx.stroke();
  }
}
