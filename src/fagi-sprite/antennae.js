// Fagi's antennae.

import { mix } from '../sprite-kit.js';
import { point, line, taper } from './stroke.js';

// The antennae are her sense of smell: when tracking a scent they spread and
// lean toward the side where it reaches her strongest. They are elbowed
// —straight scape, elbow and curved funiculus— because that is how an ant's
// look, not a snail's.
// Asleep they fold back along the head and stop searching. A male's are a
// touch longer.
export function drawAntennas(ctx, fagi, step, c, L, alive, asleep = false, shape = null) {
  const tracking = fagi.targetKind === 'scent';
  const opens = asleep ? 1.25 : tracking ? 0.85 : 0.6;
  const bias = tracking && !asleep ? fagi.castSide * 0.2 : 0;
  const tremble = !alive ? -0.35 : asleep ? 0 : Math.sin(step * 0.8) * 0.13;
  const long = (fagi.sex === 'male' ? 1.08 : 1) * (shape?.antennae ?? 1);
  // They sit on the head, which grows from the neck (5.7) forward.
  const headAt = shape?.headAt ?? 1;
  const fold = asleep ? 0.75 : 1;

  const dark = mix(c.legs, '#120a05', 0.45);
  const clear = mix(c.legs, '#ffe2b4', 0.4);
  ctx.lineCap = 'round';

  for (const sideOf of [-1, 1]) {
    const a = (opens + tremble) * sideOf + bias;
    const bx = headAt === 1 ? 10.0 : 5.7 + 4.3 * headAt;
    const by = 1.6 * sideOf * headAt;
    // Scape: the first segment, straight and thick, from the antennal socket.
    const elbowX = bx + Math.cos(a) * 6.0 * fold;
    const elbowY = by + Math.sin(a) * 6.0 * fold;
    // Funiculus: the second, thinner, bending forward.
    const b = a + 0.5 * sideOf - 0.35;
    const tipX = elbowX + Math.cos(b) * 7.6 * long * fold;
    const tipY = elbowY + Math.sin(b) * 7.6 * long * fold;

    // The scape widens a little toward the elbow, like a club of its own.
    taper(ctx, bx, by, elbowX, elbowY, 0.5, 0.78, dark);
    ctx.strokeStyle = clear;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.22;
    line(ctx, bx + L.x * 0.2, by + L.y * 0.3, elbowX + L.x * 0.2, elbowY + L.y * 0.2);
    ctx.globalAlpha = 1;

    // The funiculus: a string of small beads, not a wire. The last few swell
    // into the club; a round, light tip would read as a matchstick.
    const cx = elbowX + Math.cos(b) * 4.0;
    const cy = elbowY + Math.sin(b) * 3.4 - 0.8 * sideOf;
    const club = mix(c.legs, '#1a0d05', 0.2);
    // The thread that strings the beads: never thinner than about a pixel,
    // or a small ant loses her antennae on screen.
    const m = ctx.getTransform();
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.5, 0.8 / (Math.hypot(m.a, m.b) || 1));
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(cx, cy, tipX, tipY);
    ctx.stroke();
    const SEGMENTS = 14;
    for (let k = 0; k <= SEGMENTS; k++) {
      const t = k / SEGMENTS;
      const u = 1 - t;
      const x = u * u * elbowX + 2 * u * t * cx + t * t * tipX;
      const y = u * u * elbowY + 2 * u * t * cy + t * t * tipY;
      const r = k >= SEGMENTS - 3 ? 0.46 - (k === SEGMENTS ? 0.1 : 0) : 0.27 + t * 0.08;
      point(ctx, x, y, r, k >= SEGMENTS - 3 ? club : dark);
      if (k % 2 === 0) point(ctx, x + L.x * r * 0.4, y + L.y * r * 0.4, r * 0.3, 'rgba(255,232,196,0.3)');
    }
  }
  ctx.lineWidth = 1;
}
