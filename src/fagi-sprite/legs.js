// Fagi's legs and her tripod gait.

import { mix } from '../sprite-kit.js';
import { SKIN } from './palette.js';
import { ellipse, line } from './stroke.js';

// Three pairs, and each leg three segments: femur, tibia and tarsus. The tarsus
// is the one that touches the ground, so it carries its footprint underneath.
const LEGS = [
  { x: 4.0, base: 0.78, femur: 5.6, tibia: 6.2, tarsus: 3.2 },   // front
  { x: 1.2, base: 1.52, femur: 5.8, tibia: 6.6, tarsus: 3.4 },   // middle
  { x: -1.4, base: 2.22, femur: 6.0, tibia: 6.8, tarsus: 3.6 },  // hind
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

      // The tarsus is thin and has no highlight: almost a hair.
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

      // The coxa: the thick stump where the leg plugs into the body. Without it
      // the legs look stuck on with pins.
      ellipse(ctx, leg.x + Math.cos(p.ang) * 1.6, Math.sin(p.ang) * 1.6, 1.7, 1.2,
        mix(c.legs, '#ffe2b4', 0.18), p.ang);

      if (alive) spines(ctx, p, sideOf, c);
    }
  }
  ctx.lineWidth = 1;
}

// Where each joint of a leg falls at this moment of the step.
function joint(leg, i, sideOf, step, alive) {
  // Tripod: (front left, middle right, hind left) move in the same phase.
  const phaseShift = ((i + (sideOf > 0 ? 1 : 0)) % 2) * Math.PI;
  const cycle = Math.sin(step + phaseShift);
  const sway = alive ? cycle * 0.26 : -0.5;
  const ang = (leg.base + sway) * sideOf;

  // The leg in the air stretches a little less and lifts off: that is what
  // makes it look like walking and not kicking.
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

// The footprint: only the planted foot casts a shadow, stuck to the ground.
function footprint(ctx, p, L) {
  if (p.flies < 0.35) {
    ellipse(ctx, p.footX - L.x * 0.8, p.footY - L.y * 0.8, 1.5, 1.0,
      `rgba(8,10,14,${0.3 * (1 - p.flies / 0.35)})`, p.angP);
  }
}

// Each segment thinner than the one before, and the upper one with its
// highlight: a leg of uniform thickness reads as wire.
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

// Tibial spines: two stiff hairs per segment. They are tiny and do more for
// the critter than any other detail.
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
