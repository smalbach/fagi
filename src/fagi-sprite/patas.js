// Las patas de Fagi y su andar en trípode.

import { mix } from '../sprite-kit.js';
import { PIEL } from './paleta.js';
import { elipse, linea } from './trazo.js';

// Tres pares, y cada pata tres tramos: fémur, tibia y tarso. El tarso es el que
// toca el suelo, y por eso lleva su pisada debajo.
const PATAS = [
  { x: 4.0, base: 0.78, femur: 5.6, tibia: 6.2, tarso: 3.2 },   // delanteras
  { x: 1.2, base: 1.52, femur: 5.8, tibia: 6.6, tarso: 3.4 },   // medias
  { x: -1.4, base: 2.22, femur: 6.0, tibia: 6.8, tarso: 3.6 },  // traseras
];

export function drawLegs(ctx, paso, c, L, vivo) {
  const oscuro = mix(c.patas, '#120a05', 0.45);
  const claro = mix(c.patas, '#ffe2b4', 0.4);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0; i < PATAS.length; i++) {
    const pata = PATAS[i];
    for (const lado of [-1, 1]) {
      const p = articular(pata, i, lado, paso, vivo);

      pisada(ctx, p, L);

      tramo(ctx, pata.x, 0, p.rodillaX, p.rodillaY, 2.4, oscuro, claro, L);
      tramo(ctx, p.rodillaX, p.rodillaY, p.tobilloX, p.tobilloY, 1.7, oscuro, claro, L);

      // El tarso es fino y sin reflejo: casi un pelo.
      ctx.strokeStyle = oscuro;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.tobilloX, p.tobilloY);
      ctx.quadraticCurveTo(
        p.tobilloX + Math.cos(p.angP) * pata.tarso * 0.6,
        p.tobilloY + Math.sin(p.angP) * pata.tarso * 0.6,
        p.pieX, p.pieY
      );
      ctx.stroke();

      // La coxa: el muñón grueso donde la pata se enchufa al cuerpo. Sin él las
      // patas parecen clavadas con alfileres.
      elipse(ctx, pata.x + Math.cos(p.ang) * 1.6, Math.sin(p.ang) * 1.6, 1.7, 1.2,
        mix(c.patas, '#ffe2b4', 0.18), p.ang);

      if (vivo) espinas(ctx, p, lado, c);
    }
  }
  ctx.lineWidth = 1;
}

// Dónde cae cada articulación de una pata en este momento del paso.
function articular(pata, i, lado, paso, vivo) {
  // Trípode: (delantera izq, media der, trasera izq) van en la misma fase.
  const desfase = ((i + (lado > 0 ? 1 : 0)) % 2) * Math.PI;
  const ciclo = Math.sin(paso + desfase);
  const balanceo = vivo ? ciclo * 0.26 : -0.5;
  const ang = (pata.base + balanceo) * lado;

  // La pata que va en el aire se estira un poco menos y se despega: es lo
  // que hace que se vea caminar y no patalear.
  const vuela = vivo ? Math.max(0, ciclo) : 0;
  const rodillaX = pata.x + Math.cos(ang) * pata.femur;
  const rodillaY = Math.sin(ang) * pata.femur;
  const angT = ang + (0.85 - vuela * 0.22) * lado;
  const tobilloX = rodillaX + Math.cos(angT) * pata.tibia;
  const tobilloY = rodillaY + Math.sin(angT) * pata.tibia;
  const angP = angT + (0.55 + vuela * 0.5) * lado;
  const pieX = tobilloX + Math.cos(angP) * pata.tarso;
  const pieY = tobilloY + Math.sin(angP) * pata.tarso;
  return { ang, angT, angP, vuela, rodillaX, rodillaY, tobilloX, tobilloY, pieX, pieY };
}

// La pisada: solo la que apoya deja sombra, y se le pega al suelo.
function pisada(ctx, p, L) {
  if (p.vuela < 0.35) {
    elipse(ctx, p.pieX - L.x * 0.8, p.pieY - L.y * 0.8, 1.5, 1.0,
      `rgba(8,10,14,${0.3 * (1 - p.vuela / 0.35)})`, p.angP);
  }
}

// Cada tramo más fino que el anterior, y el de arriba con su reflejo: una
// pata de grosor único se lee como alambre.
function tramo(ctx, x0, y0, x1, y1, w, oscuro, claro, L) {
  ctx.strokeStyle = oscuro;
  ctx.lineWidth = w;
  linea(ctx, x0, y0, x1, y1);
  ctx.strokeStyle = claro;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = w * 0.38;
  linea(ctx,
    x0 + L.x * w * 0.26, y0 + L.y * w * 0.26,
    x1 + L.x * w * 0.26, y1 + L.y * w * 0.26);
  ctx.globalAlpha = 1;
}

// Espinas de la tibia: dos pelos tiesos por tramo. Son diminutos y hacen
// más por el bicho que cualquier otro detalle.
function espinas(ctx, p, lado, c) {
  ctx.strokeStyle = `rgba(${c === PIEL ? '60,34,16' : '40,44,52'},0.55)`;
  ctx.lineWidth = 0.6;
  for (const f of [0.4, 0.75]) {
    const sx = p.rodillaX + (p.tobilloX - p.rodillaX) * f;
    const sy = p.rodillaY + (p.tobilloY - p.rodillaY) * f;
    linea(ctx, sx, sy,
      sx + Math.cos(p.angT + 1.4 * lado) * 1.8, sy + Math.sin(p.angT + 1.4 * lado) * 1.8);
  }
}
