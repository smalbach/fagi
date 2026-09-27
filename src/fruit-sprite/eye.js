// El pintor del ojo.

import { mix } from '../sprite-kit.js';
import { shadow, volume, lustre, patches, circle } from './common.js';

// Ojo: lo que da es vista, así que es un ojo y mira a algún sitio. Cada variante
// mira hacia otro lado.
export function eye(ctx, cx, cy, r, base, rnd, past) {
  shadow(ctx, cx, cy, r);
  const white = mix(base, '#f6f2ff', 0.82 - past * 0.3);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  volume(ctx, cx, cy, r, white, 0.3, 0.5);

  veinlets(ctx, cx, cy, r, rnd, past);

  // Hacia dónde mira. Nublado y torcido cuando se pasa: deja de ver.
  const looks = rnd() * Math.PI * 2;
  const ix = cx + Math.cos(looks) * r * 0.2;
  const iy = cy + Math.sin(looks) * r * 0.2;
  const rIris = r * 0.55;

  iris(ctx, ix, iy, r, rIris, base, rnd, past);
  patches(ctx, cx, cy, r, past, rnd);
  ctx.restore();

  lustre(ctx, cx, cy, r, 0.5 - past * 0.4);
}

// Venillas: pocas y finas, siempre desde el borde hacia dentro.
function veinlets(ctx, cx, cy, r, rnd, past) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(190,70,90,${0.14 + rnd() * 0.16 + past * 0.25})`;
    ctx.lineWidth = Math.max(0.6, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.quadraticCurveTo(
      cx + Math.cos(a + 0.4) * r * 0.6, cy + Math.sin(a + 0.4) * r * 0.6,
      cx + Math.cos(a - 0.2) * r * 0.35, cy + Math.sin(a - 0.2) * r * 0.35
    );
    ctx.stroke();
  }
}

// El iris con sus fibras, la pupila y, si se pasa, el velo encima.
function iris(ctx, ix, iy, r, rIris, base, rnd, past) {
  circle(ctx, ix, iy, rIris, mix(base, '#0b0a16', 0.15 + past * 0.2));

  // Fibras del iris.
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.2;
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(10,8,20,0.28)';
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(a) * rIris * 0.35, iy + Math.sin(a) * rIris * 0.35);
    ctx.lineTo(ix + Math.cos(a) * rIris * 0.95, iy + Math.sin(a) * rIris * 0.95);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  circle(ctx, ix, iy, rIris * (0.46 + past * 0.2), '#0c0b14');

  // Catarata: al pasarse se le pone un velo lechoso encima.
  if (past > 0) circle(ctx, ix, iy, rIris, `rgba(226,222,208,${past * 0.45})`);
}
