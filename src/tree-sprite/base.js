// The tree's foot: where the trunk meets the soil. It goes on the same canvas
// as the trunk, painted right after the bole and with the same randomness.

import { mix } from '../sprite-kit.js';
import { LIGHT, LX, LY, LICHEN } from './common.js';

export function paintFoot(ctx, rnd, cx, baseY, w0, R, base, dry) {
  // Roots: buttresses gripping the ground. They close off where the trunk meets
  // the soil, which is what most gives away a fake planted tree. Each one is a
  // two-curve wedge —it rises hugging the bole and slopes down to the soil—,
  // with its light rim where the light comes in: a straight point would look
  // like a fin stuck on the trunk, not wood growing out of it.
  const roots = 4 + ((rnd() * 3) | 0);
  for (let i = 0; i < roots; i++) {
    const sideOf = i % 2 ? 1 : -1;
    const length = R * (0.1 + rnd() * 0.14);
    const tall = R * (0.1 + rnd() * 0.1);
    const x0 = cx + sideOf * w0 * 0.7;
    const xf = cx + sideOf * (w0 + length);

    ctx.fillStyle = mix(base, '#100b06', 0.2 + rnd() * 0.3);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - tall * 1.8);
    ctx.quadraticCurveTo(cx + sideOf * (w0 + length * 0.5), baseY - tall * 0.75, xf, baseY + tall * 0.1);
    ctx.quadraticCurveTo(cx + sideOf * (w0 + length * 0.35), baseY + tall * 0.3, x0, baseY + tall * 0.2);
    ctx.closePath();
    ctx.fill();

    // The root's back, where the light hits it.
    ctx.strokeStyle = `rgba(226,200,158,${0.1 + rnd() * 0.12})`;
    ctx.lineWidth = Math.max(0.7, R * 0.02);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - tall * 1.6);
    ctx.quadraticCurveTo(cx + sideOf * (w0 + length * 0.5), baseY - tall * 0.7, xf - sideOf * length * 0.15, baseY - tall * 0.05);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // The tree's own leaf litter: what it has been shedding falls at its foot and
  // piles up there. A trunk coming out of clean soil reads as planted
  // yesterday; with its carpet of leaves it looks like it has been there years.
  const falls = 10 + ((rnd() * 10) | 0);
  for (let i = 0; i < falls; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.12 + Math.sqrt(rnd()) * 0.52);
    const x = cx + Math.cos(a) * d;
    const y = baseY + Math.sin(a) * d * 0.34;
    const length = R * (0.05 + rnd() * 0.06);
    const width = length * (0.3 + rnd() * 0.2);
    const turn = rnd() * Math.PI;
    const tone = mix('#6d5227', dry > 0.5 ? '#54401f' : '#5c5c2e', rnd());

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    const shape = (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(-length / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, -width + dy, length / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, width + dy, -length / 2 + dx, dy);
      ctx.closePath();
    };
    ctx.fillStyle = 'rgba(10,9,7,0.34)';
    shape(-LX * length * 0.12, -LY * length * 0.12);
    ctx.fill();
    ctx.globalAlpha = 0.6 + rnd() * 0.3;
    ctx.fillStyle = tone;
    shape(0, 0);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Moss at the foot, on the side that does not see the sun: that is where the damp lingers.
  for (let i = 0, n = 5 + ((rnd() * 6) | 0); i < n; i++) {
    const a = LIGHT + Math.PI + (rnd() - 0.5) * 1.8;
    const d = R * (0.1 + rnd() * 0.3);
    ctx.globalAlpha = (0.1 + rnd() * 0.14) * (1 - dry * 0.7);
    ctx.fillStyle = LICHEN[(rnd() * LICHEN.length) | 0];
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, baseY + Math.sin(a) * d * 0.3,
      R * (0.04 + rnd() * 0.06), R * (0.02 + rnd() * 0.03), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // And the churned soil around the foot.
  const foot = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, R * 0.55);
  foot.addColorStop(0, 'rgba(38,28,18,0.38)');
  foot.addColorStop(1, 'rgba(38,28,18,0)');
  ctx.fillStyle = foot;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, R * 0.55, R * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}
