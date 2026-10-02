// Fagi's antennae.

import { mix } from '../sprite-kit.js';
import { ellipse, line } from './stroke.js';

// The antennae are her sense of smell: when tracking a scent they spread and
// lean toward the side where it reaches her strongest. They are elbowed
// —straight scape, elbow and curved funiculus— because that is how an ant's
// look, not a snail's.
// Asleep they fold back along the head and stop searching. A male's are a
// touch longer.
export function drawAntennas(ctx, fagi, step, c, L, alive, asleep = false) {
  const tracking = fagi.targetKind === 'scent';
  const opens = asleep ? 1.25 : tracking ? 0.85 : 0.6;
  const bias = tracking && !asleep ? fagi.castSide * 0.2 : 0;
  const tremble = !alive ? -0.35 : asleep ? 0 : Math.sin(step * 0.8) * 0.13;
  const long = fagi.sex === 'male' ? 1.08 : 1;
  const fold = asleep ? 0.75 : 1;

  const dark = mix(c.legs, '#120a05', 0.35);
  const clear = mix(c.legs, '#ffe2b4', 0.4);
  ctx.lineCap = 'round';

  for (const sideOf of [-1, 1]) {
    const a = (opens + tremble) * sideOf + bias;
    const bx = 10.0;
    const by = 1.6 * sideOf;
    // Scape: the first segment, straight and thick, from the antennal socket.
    const elbowX = bx + Math.cos(a) * 5.4 * fold;
    const elbowY = by + Math.sin(a) * 5.4 * fold;
    // Funiculus: the second, thinner, bending forward.
    const b = a + 0.5 * sideOf - 0.35;
    const tipX = elbowX + Math.cos(b) * 6.2 * long * fold;
    const tipY = elbowY + Math.sin(b) * 6.2 * long * fold;

    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    line(ctx, bx, by, elbowX, elbowY);

    ctx.strokeStyle = clear;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.55;
    line(ctx, bx + L.x * 0.4, by + L.y * 0.4, elbowX + L.x * 0.4, elbowY + L.y * 0.4);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(
      elbowX + Math.cos(b) * 3.4,
      elbowY + Math.sin(b) * 3.4 - 0.8 * sideOf,
      tipX, tipY
    );
    ctx.stroke();

    // The club: the funiculus does not end in a ball, it thickens over the last
    // segments. A round, light tip reads as a matchstick.
    const club = mix(c.tip, c.legs, 0.45);
    ctx.strokeStyle = club;
    ctx.lineWidth = 1.45;
    line(ctx, elbowX + Math.cos(b) * 4.4, elbowY + Math.sin(b) * 4.4, tipX, tipY);

    ellipse(ctx, tipX, tipY, 0.95, 0.72, mix(club, '#fff0d4', 0.3), b);
  }
  ctx.lineWidth = 1;
}
