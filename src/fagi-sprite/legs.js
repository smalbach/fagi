// Las patas de Fagi y su andar en trípode.

import { mix } from '../sprite-kit.js';
import { SKIN } from './palette.js';
import { ellipse, line } from './stroke.js';

// Tres pares, y cada pata tres tramos: fémur, tibia y tarso. El tarso es el que
// toca el suelo, y por eso lleva su pisada debajo.
const LEGS = [
  { x: 4.0, base: 0.78, femur: 5.6, tibia: 6.2, tarsus: 3.2 },   // delanteras
  { x: 1.2, base: 1.52, femur: 5.8, tibia: 6.6, tarsus: 3.4 },   // medias
  { x: -1.4, base: 2.22, femur: 6.0, tibia: 6.8, tarsus: 3.6 },  // traseras
];

export function drawLegs(ctx, step, c, L, alive) {
  const dark = mix(c.legs, '#120a05', 0.45);
  const clear = mix(c.legs, '#ffe2b4', 0.4);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0; i < LEGS.length; i++) {
    const leg = LEGS[i];
    for (const sideOf of [-1, 1]) {
      const p = joint(leg, i, sideOf, step, alive);

      footprint(ctx, p, L);

      legSegment(ctx, leg.x, 0, p.kneeX, p.kneeY, 2.4, dark, clear, L);
      legSegment(ctx, p.kneeX, p.kneeY, p.ankleX, p.ankleY, 1.7, dark, clear, L);

      // El tarso es fino y sin reflejo: casi un pelo.
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.ankleX, p.ankleY);
      ctx.quadraticCurveTo(
        p.ankleX + Math.cos(p.angP) * leg.tarsus * 0.6,
        p.ankleY + Math.sin(p.angP) * leg.tarsus * 0.6,
        p.footX, p.footY
      );
      ctx.stroke();

      // La coxa: el muñón grueso donde la pata se enchufa al cuerpo. Sin él las
      // patas parecen clavadas con alfileres.
      ellipse(ctx, leg.x + Math.cos(p.ang) * 1.6, Math.sin(p.ang) * 1.6, 1.7, 1.2,
        mix(c.legs, '#ffe2b4', 0.18), p.ang);

      if (alive) spines(ctx, p, sideOf, c);
    }
  }
  ctx.lineWidth = 1;
}

// Dónde cae cada articulación de una pata en este momento del paso.
function joint(leg, i, sideOf, step, alive) {
  // Trípode: (delantera izq, media der, trasera izq) van en la misma fase.
  const phaseShift = ((i + (sideOf > 0 ? 1 : 0)) % 2) * Math.PI;
  const cycle = Math.sin(step + phaseShift);
  const sway = alive ? cycle * 0.26 : -0.5;
  const ang = (leg.base + sway) * sideOf;

  // La pata que va en el aire se estira un poco menos y se despega: es lo
  // que hace que se vea caminar y no patalear.
  const flies = alive ? Math.max(0, cycle) : 0;
  const kneeX = leg.x + Math.cos(ang) * leg.femur;
  const kneeY = Math.sin(ang) * leg.femur;
  const angT = ang + (0.85 - flies * 0.22) * sideOf;
  const ankleX = kneeX + Math.cos(angT) * leg.tibia;
  const ankleY = kneeY + Math.sin(angT) * leg.tibia;
  const angP = angT + (0.55 + flies * 0.5) * sideOf;
  const footX = ankleX + Math.cos(angP) * leg.tarsus;
  const footY = ankleY + Math.sin(angP) * leg.tarsus;
  return { ang, angT, angP, flies, kneeX, kneeY, ankleX, ankleY, footX, footY };
}

// La pisada: solo la que apoya deja sombra, y se le pega al suelo.
function footprint(ctx, p, L) {
  if (p.flies < 0.35) {
    ellipse(ctx, p.footX - L.x * 0.8, p.footY - L.y * 0.8, 1.5, 1.0,
      `rgba(8,10,14,${0.3 * (1 - p.flies / 0.35)})`, p.angP);
  }
}

// Cada tramo más fino que el anterior, y el de arriba con su reflejo: una
// pata de grosor único se lee como alambre.
function legSegment(ctx, x0, y0, x1, y1, w, dark, clear, L) {
  ctx.strokeStyle = dark;
  ctx.lineWidth = w;
  line(ctx, x0, y0, x1, y1);
  ctx.strokeStyle = clear;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = w * 0.38;
  line(ctx,
    x0 + L.x * w * 0.26, y0 + L.y * w * 0.26,
    x1 + L.x * w * 0.26, y1 + L.y * w * 0.26);
  ctx.globalAlpha = 1;
}

// Espinas de la tibia: dos pelos tiesos por tramo. Son diminutos y hacen
// más por el bicho que cualquier otro detalle.
function spines(ctx, p, sideOf, c) {
  ctx.strokeStyle = `rgba(${c === SKIN ? '60,34,16' : '40,44,52'},0.55)`;
  ctx.lineWidth = 0.6;
  for (const f of [0.4, 0.75]) {
    const sx = p.kneeX + (p.ankleX - p.kneeX) * f;
    const sy = p.kneeY + (p.ankleY - p.kneeY) * f;
    line(ctx, sx, sy,
      sx + Math.cos(p.angT + 1.4 * sideOf) * 1.8, sy + Math.sin(p.angT + 1.4 * sideOf) * 1.8);
  }
}
