// Fagi's legs and her tripod gait.

import { mix } from '../sprite-kit.js';
import { ellipse, line, point, taper } from './stroke.js';

// Three pairs, and each leg three parts: femur, tibia and tarsus. Long and
// slender, as a forager's are: short thick legs make a beetle.
const LEGS = [
  { x: 4.2, base: 0.82, femur: 6.0, tibia: 6.6, tarsus: 4.6 },   // front
  { x: 1.6, base: 1.55, femur: 6.4, tibia: 7.2, tarsus: 4.8 },   // middle
  { x: -0.6, base: 2.2, femur: 7.0, tibia: 7.8, tarsus: 5.2 },   // hind
];

// `pose`: `fold` 0-1 draws the legs in under the body (cold, asleep); `stilt`
// 0-1 straightens them, as ants do on hot ground to lift the body off it.
// `thick` (MORPH muscle) widens the femur and tibia.
export function drawLegs(ctx, step, c, L, alive, pose = {}, thick = 1) {
  const dark = mix(c.legs, '#140803', 0.42);
  // Slender legs must not vanish when she is small on screen: no part is
  // drawn thinner than about a pixel.
  const m = ctx.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  const w = (v) => Math.max(v * thick, 0.9 * px);
  const clear = mix(c.legs, '#ffe2b4', 0.45);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const joints = [];
  for (let i = 0; i < LEGS.length; i++) {
    for (const sideOf of [-1, 1]) joints.push([LEGS[i], joint(LEGS[i], i, sideOf, step, alive, pose), sideOf]);
  }

  // Their shadows first, all of them, so no leg is darkened by another's.
  // The body stands a few hairs above the ground: the shadow leaves the foot
  // and moves away from it the higher the joint is.
  const lift = 1 + (pose.stilt ?? 0) * 0.6;
  ctx.strokeStyle = 'rgba(5,6,8,0.26)';
  for (const [leg, p] of joints) {
    const k = 1.5 * lift;
    const hx = -L.x * k;
    const hy = -L.y * k;
    ctx.lineWidth = 0.6 * thick;
    ctx.beginPath();
    ctx.moveTo(leg.x + hx * 1.2, hy * 1.2);
    ctx.lineTo(p.kneeX + hx * 1.1, p.kneeY + hy * 1.1);
    ctx.lineTo(p.ankleX + hx * 0.5, p.ankleY + hy * 0.5);
    ctx.lineTo(p.footX, p.footY);
    ctx.stroke();
  }

  for (const [leg, p, sideOf] of joints) {
    // The femur swells near the body and the tibia is slimmer: a leg of
    // uniform thickness reads as wire.
    legSegment(ctx, leg.x, 0, p.kneeX, p.kneeY, w(0.85), w(0.6), c.legs, dark, clear, L);
    legSegment(ctx, p.kneeX, p.kneeY, p.ankleX, p.ankleY, w(0.55), w(0.42), c.legs, dark, clear, L);
    // The knee: a small darker knuckle where femur and tibia meet.
    point(ctx, p.kneeX, p.kneeY, 0.33 * thick, mix(dark, '#0c0603', 0.35));

    tarsus(ctx, p, leg, dark, 0.75 * px);

    // The coxa: the stump where the leg plugs into the body.
    const cx = leg.x + Math.cos(p.ang) * 1.0;
    const cy = Math.sin(p.ang) * 1.0;
    ellipse(ctx, cx, cy, 1.15, 0.75, mix(c.legs, '#2a1508', 0.2), p.ang);
    ellipse(ctx, cx + L.x * 0.3, cy + L.y * 0.3, 0.55, 0.3, 'rgba(255,236,204,0.3)', p.ang);

    if (alive) spines(ctx, p, sideOf);
  }
  ctx.lineWidth = 1;
}

// Where each joint of a leg falls at this moment of the step.
function joint(leg, i, sideOf, step, alive, { fold = 0, stilt = 0 } = {}) {
  // Tripod: (front left, middle right, hind left) move in the same phase.
  const phaseShift = ((i + (sideOf > 0 ? 1 : 0)) % 2) * Math.PI;
  const cycle = Math.sin(step + phaseShift);
  const sway = alive ? cycle * 0.24 * (1 - fold) : -0.5;
  const ang = (leg.base + sway) * sideOf;

  // The leg in the air stretches a little less and lifts off: that is what
  // makes it look like walking and not kicking. Folded, the knee closes and the
  // leg shortens toward the body; on stilts, it opens.
  const flies = alive ? Math.max(0, cycle) * (1 - fold) : 0;
  const reach = 1 - fold * 0.32 + stilt * 0.08;
  const kneeX = leg.x + Math.cos(ang) * leg.femur * reach;
  const kneeY = Math.sin(ang) * leg.femur * reach;
  const angT = ang + (0.8 - flies * 0.2 + fold * 0.75 - stilt * 0.3) * sideOf;
  const ankleX = kneeX + Math.cos(angT) * leg.tibia * reach;
  const ankleY = kneeY + Math.sin(angT) * leg.tibia * reach;
  const angP = angT + (0.35 + flies * 0.4) * sideOf;
  const footX = ankleX + Math.cos(angP) * leg.tarsus * reach;
  const footY = ankleY + Math.sin(angP) * leg.tarsus * reach;
  return { ang, angT, angP, flies, kneeX, kneeY, ankleX, ankleY, footX, footY };
}

// Each segment tapers: translucent amber in the middle, dark at the edges,
// with a thin bright line along the lit side —a polished tube, not a stroke.
function legSegment(ctx, x0, y0, x1, y1, w0, w1, base, dark, clear, L) {
  taper(ctx, x0, y0, x1, y1, w0, w1, dark);
  ctx.globalAlpha = 0.7;
  taper(ctx, x0, y0, x1, y1, w0 * 0.6, w1 * 0.55, base);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = clear;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = w1 * 0.22;
  const o = (w0 + w1) * 0.14;
  line(ctx, x0 + L.x * o, y0 + L.y * o, x1 + L.x * o, y1 + L.y * o);
  ctx.globalAlpha = 1;
}

// The tarsus: a chain of five little segments, thin as a hair, ending in a
// pair of claws that grip the ground.
function tarsus(ctx, p, leg, dark, min = 0) {
  const mx = p.ankleX + Math.cos(p.angP) * leg.tarsus * 0.5;
  const my = p.ankleY + Math.sin(p.angP) * leg.tarsus * 0.5;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.42, min);
  ctx.beginPath();
  ctx.moveTo(p.ankleX, p.ankleY);
  ctx.quadraticCurveTo(mx, my, p.footX, p.footY);
  ctx.stroke();
  for (let k = 1; k <= 4; k++) {
    const t = k / 5;
    const u = 1 - t;
    const x = u * u * p.ankleX + 2 * u * t * mx + t * t * p.footX;
    const y = u * u * p.ankleY + 2 * u * t * my + t * t * p.footY;
    point(ctx, x, y, 0.28 - t * 0.08, dark);
  }
  const a = Math.atan2(p.footY - my, p.footX - mx);
  ctx.lineWidth = 0.2;
  for (const s of [-0.6, 0.6]) {
    line(ctx, p.footX, p.footY, p.footX + Math.cos(a + s) * 0.55, p.footY + Math.sin(a + s) * 0.55);
  }
}

// Tibial spines: a row of stiff hairs along the tibia, and the spur at its end.
function spines(ctx, p, sideOf) {
  ctx.strokeStyle = 'rgba(70,40,18,0.45)';
  ctx.lineWidth = 0.18;
  for (const f of [0.3, 0.55, 0.8, 0.97]) {
    const sx = p.kneeX + (p.ankleX - p.kneeX) * f;
    const sy = p.kneeY + (p.ankleY - p.kneeY) * f;
    line(ctx, sx, sy,
      sx + Math.cos(p.angT + 1.0 * sideOf) * 0.8, sy + Math.sin(p.angT + 1.0 * sideOf) * 0.8);
  }
}
