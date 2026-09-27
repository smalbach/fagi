// El pintor del ojo.

import { mix } from '../sprite-kit.js';
import { sombra, volumen, lustre, manchas, circulo } from './comunes.js';

// Ojo: lo que da es vista, así que es un ojo y mira a algún sitio. Cada variante
// mira hacia otro lado.
export function ojo(ctx, cx, cy, r, base, rnd, pasado) {
  sombra(ctx, cx, cy, r);
  const blanco = mix(base, '#f6f2ff', 0.82 - pasado * 0.3);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  volumen(ctx, cx, cy, r, blanco, 0.3, 0.5);

  venillas(ctx, cx, cy, r, rnd, pasado);

  // Hacia dónde mira. Nublado y torcido cuando se pasa: deja de ver.
  const mira = rnd() * Math.PI * 2;
  const ix = cx + Math.cos(mira) * r * 0.2;
  const iy = cy + Math.sin(mira) * r * 0.2;
  const rIris = r * 0.55;

  iris(ctx, ix, iy, r, rIris, base, rnd, pasado);
  manchas(ctx, cx, cy, r, pasado, rnd);
  ctx.restore();

  lustre(ctx, cx, cy, r, 0.5 - pasado * 0.4);
}

// Venillas: pocas y finas, siempre desde el borde hacia dentro.
function venillas(ctx, cx, cy, r, rnd, pasado) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(190,70,90,${0.14 + rnd() * 0.16 + pasado * 0.25})`;
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
function iris(ctx, ix, iy, r, rIris, base, rnd, pasado) {
  circulo(ctx, ix, iy, rIris, mix(base, '#0b0a16', 0.15 + pasado * 0.2));

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

  circulo(ctx, ix, iy, rIris * (0.46 + pasado * 0.2), '#0c0b14');

  // Catarata: al pasarse se le pone un velo lechoso encima.
  if (pasado > 0) circulo(ctx, ix, iy, rIris, `rgba(226,222,208,${pasado * 0.45})`);
}
