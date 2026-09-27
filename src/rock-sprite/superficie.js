// Lo que le pasa a la piedra por encima de su color: lo propio de cada material
// (estratos, lajas, huecos, líquen, guijarros), las motas y las grietas. Todo se
// pinta dentro del recorte de la silueta y gasta el azar de la roca en orden.

import { aRGB } from '../colors.js';
import { mix } from '../sprite-kit.js';
import { LUZ, LX, LY } from './comun.js';

// Estratos de la arenisca: capas paralelas, algo torcidas, de distinto grosor.
export function estratos(ctx, S, cx, cy, r, rnd) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rnd() - 0.5) * 0.6);
  let y = -r;
  while (y < r) {
    const alto = r * (0.08 + rnd() * 0.16);
    const claro = rnd() < 0.5;
    ctx.fillStyle = claro
      ? `rgba(255,246,228,${0.04 + rnd() * 0.07})`
      : `rgba(46,32,20,${0.05 + rnd() * 0.1})`;
    ctx.fillRect(-S, y, S * 2, alto);
    y += alto;
  }
  ctx.restore();
}

// Lajas de la pizarra: planos rectos que cruzan la piedra de lado a lado, todos
// casi en la misma dirección, como se parte de verdad.
export function lajas(ctx, S, cx, cy, r, rnd) {
  const dir = rnd() * Math.PI;
  const n = 2 + ((rnd() * 3) | 0);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = dir + (rnd() - 0.5) * 0.25;
    const off = (rnd() - 0.5) * r * 1.5;
    const nx = Math.cos(a + Math.PI / 2) * off;
    const ny = Math.sin(a + Math.PI / 2) * off;
    const dx = Math.cos(a) * S;
    const dy = Math.sin(a) * S;
    for (const [d, col, w] of [
      [-1.2, `rgba(226,230,240,0.1)`, 1],
      [0, `rgba(12,14,19,0.3)`, Math.max(1, r * 0.05)],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(cx + nx - dx + d, cy + ny - dy + d);
      ctx.lineTo(cx + nx + dx + d, cy + ny + dy + d);
      ctx.stroke();
    }
  }
}

// Huecos de la caliza: la disuelve el agua y queda picada. Cada hueco es sombra
// arriba y un filo claro abajo, al revés que un bulto.
export function huecos(ctx, cx, cy, r, rnd) {
  const n = 5 + ((rnd() * 7) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.05 + rnd() * 0.1);
    ctx.fillStyle = 'rgba(12,13,17,0.34)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,238,230,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LUZ + 0.6, LUZ + 2.6);
    ctx.stroke();
  }
}

// Líquen: manchas verdosas pegadas al lado de sombra, que es donde aguanta la
// humedad. Cada mancha son varios círculos sueltos, nunca un borde limpio.
export function liquen(ctx, cx, cy, r, rnd) {
  const tono = ['#6f7f4a', '#7d8f5c', '#8a9a63', '#5f7350'][(rnd() * 4) | 0];
  const manchas = 1 + ((rnd() * 3) | 0);
  for (let m = 0; m < manchas; m++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 2.2;
    const d = r * (0.25 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    const esc = r * (0.16 + rnd() * 0.22);
    const grumos = 5 + ((rnd() * 7) | 0);
    for (let i = 0; i < grumos; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * esc;
      ctx.fillStyle = `rgba(${aRGB(tono).join(',')},${0.1 + rnd() * 0.14})`;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, esc * (0.3 + rnd() * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Guijarros del conglomerado: cantos redondeados de otra piedra metidos en la
// pasta. Cada uno lleva su propia luz y su sombra, como los de verdad.
export function guijarros(ctx, cx, cy, r, rnd) {
  const tonos = ['#8d8375', '#6e6a62', '#9c8f78', '#5d6470', '#a49a86'];
  const n = 5 + ((rnd() * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.72;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.12 + rnd() * 0.16);
    const tono = tonos[(rnd() * tonos.length) | 0];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.scale(1, 0.62 + rnd() * 0.3);   // cantos aplastados, no bolas
    const g = ctx.createRadialGradient(LX * rad * 0.4, LY * rad * 0.4, rad * 0.1, 0, 0, rad);
    g.addColorStop(0, mix(tono, '#efeade', 0.35));
    g.addColorStop(1, mix(tono, '#15171c', 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    // Surco donde el canto se hunde en la pasta.
    ctx.strokeStyle = 'rgba(12,13,17,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

// Motas: unas brillan (cuarzo) y otras son huecos oscuros.
export function motas(ctx, cx, cy, r, rnd, mat) {
  const [nMotas, brillo] = mat.motas;
  const cuantas = (nMotas * (0.6 + rnd() * 0.8)) | 0;
  for (let i = 0; i < cuantas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.92;
    const rad = 0.6 + rnd() * (r * 0.06);
    ctx.fillStyle = rnd() < brillo
      ? `rgba(255,252,244,${0.05 + rnd() * 0.12})`
      : `rgba(14,15,19,${0.1 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Grietas: una línea quebrada con su reflejo claro al lado, que es lo que
// hace que se lea como hendidura y no como raya pintada.
export function grietas(ctx, cx, cy, r, rnd, mat) {
  const [gmin, gmax] = mat.grietas;
  const cuantas = gmin + ((rnd() * (gmax - gmin + 1)) | 0);
  for (let i = 0; i < cuantas; i++) {
    let a = rnd() * Math.PI * 2;
    let x = cx + Math.cos(a) * r * 0.75;
    let y = cy + Math.sin(a) * r * 0.75;
    a += Math.PI + (rnd() - 0.5) * 0.9;
    const pasos = 3 + ((rnd() * 4) | 0);
    const camino = [{ x, y }];
    for (let s = 0; s < pasos; s++) {
      a += (rnd() - 0.5) * 1.1;
      const paso = r * (0.16 + rnd() * 0.22);
      x += Math.cos(a) * paso;
      y += Math.sin(a) * paso;
      camino.push({ x, y });
    }
    const traza = (dx, dy, col, w) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(camino[0].x + dx, camino[0].y + dy);
      for (let s = 1; s < camino.length; s++) ctx.lineTo(camino[s].x + dx, camino[s].y + dy);
      ctx.stroke();
    };
    traza(LX * 0.9, LY * 0.9, 'rgba(236,232,224,0.13)', 1.1);
    traza(0, 0, 'rgba(10,11,14,0.42)', Math.max(1, r * 0.045));
  }
}
