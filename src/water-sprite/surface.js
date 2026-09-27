// The water's live parts: drawn every frame on top of the still canvas.

import { LAKE } from '../config.js';
import { seededRng } from '../sprite-kit.js';
import { LX, LY, profile, shoreProfile, outline } from './shape.js';

// Reflections and ripples. All clipped to the water, so nothing spills onto the land.
export function surface(ctx, o, r, seedOf, wind, now) {
  const t = now / 1000;
  const shore = shoreProfile(seedOf);
  const va = wind?.angle ?? 0;

  ctx.save();
  outline(ctx, o.x, o.y, r, shore);
  ctx.clip();

  skyLight(ctx, o, r, t);
  skyBands(ctx, o, r, t);
  ripplets(ctx, o, r, seedOf, va, t);

  // Glints, rings and specks draw from the same randomness, one after another.
  const rnd = seededRng((seedOf ^ 0x7c3af219) >>> 0);
  sparkles(ctx, o, r, rnd, t);
  ripples(ctx, o, r, seedOf, rnd, t);
  specks(ctx, o, r, rnd, va, t);

  ctx.lineWidth = 1;
  ctx.restore();
}

// The sheet of skylight: it comes in where the light comes in, and breathes.
function skyLight(ctx, o, r, t) {
  const breathes = 0.8 + Math.sin(t * 0.35) * 0.2;
  const light = ctx.createRadialGradient(
    o.x + LX * r * 0.45, o.y + LY * r * 0.45, 0,
    o.x + LX * r * 0.3, o.y + LY * r * 0.3, r * 1.1
  );
  light.addColorStop(0, `rgba(226,240,246,${0.16 * breathes})`);
  light.addColorStop(0.5, `rgba(160,200,214,${0.07 * breathes})`);
  light.addColorStop(1, 'rgba(160,200,214,0)');
  ctx.fillStyle = light;
  ctx.fillRect(o.x - r * 1.2, o.y - r * 1.2, r * 2.4, r * 2.4);
}

// Sky bands: wide, faint stripes that cross the water and drift slowly.
// They're the reflection, and they're what separates a surface from a disc.
function skyBands(ctx, o, r, t) {
  for (let i = 0; i < 2; i++) {
    const phase = i * 2.1;
    const y = o.y + (i - 0.5) * r * 0.5 + Math.sin(t * 0.18 + phase) * r * 0.05;
    const band = ctx.createLinearGradient(0, y - r * 0.14, 0, y + r * 0.14);
    band.addColorStop(0, 'rgba(214,236,244,0)');
    band.addColorStop(0.5, `rgba(214,236,244,${0.028 + 0.018 * Math.sin(t * 0.3 + phase)})`);
    band.addColorStop(1, 'rgba(214,236,244,0)');
    ctx.fillStyle = band;
    ctx.fillRect(o.x - r * 1.2, y - r * 0.14, r * 2.4, r * 0.28);
  }
}

// Wind ripples: a pond's surface doesn't tremble at random, it ripples into
// short crests perpendicular to the wind that run in its direction. That's what
// ties the water to the SAME wind that bends the reeds and carries the smells.
//
// The crests are scattered at random, not on a grid: lined up they read as
// scratches, and a scratched pond doesn't look like water.
function ripplets(ctx, o, r, seedOf, va, t) {
  const ripple = seededRng((seedOf ^ 0x1f83d9ab) >>> 0);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(va);
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.ripplets; i++) {
    const y = (ripple() - 0.5) * r * 1.9;
    // Each crest runs at its own pace and wraps back in from the other side.
    const x = ((ripple() + t * (0.02 + ripple() * 0.03)) % 1 - 0.5) * r * 2;
    if (Math.hypot(x, y) > r * 0.95) continue;
    const length = r * (0.05 + ripple() * 0.08);
    const alpha = 0.04 + 0.05 * Math.max(0, Math.sin(t * 1.1 + y * 0.25));
    ctx.strokeStyle = `rgba(214,238,244,${alpha})`;
    ctx.lineWidth = Math.max(0.5, r * 0.007);
    ctx.beginPath();
    ctx.moveTo(x, y - length / 2);
    ctx.quadraticCurveTo(x + r * 0.022, y, x, y + length / 2);
    ctx.stroke();
    // And its shadow right behind: a crest without a trough doesn't stand up.
    ctx.strokeStyle = `rgba(8,26,34,${alpha * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.012, y - length / 2);
    ctx.quadraticCurveTo(x + r * 0.01, y, x - r * 0.012, y + length / 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Glints: little lying streaks that light up and fade out, each on its own.
// It's what makes the water seem to move even when nothing is moving.
function sparkles(ctx, o, r, rnd, t) {
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.sparkles; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const phase = rnd() * Math.PI * 2;
    const length = r * (0.1 + rnd() * 0.16);
    const alpha = Math.max(0, Math.sin(t * (0.5 + rnd() * 0.5) + phase)) ** 3;
    if (alpha < 0.02) continue;
    const x = o.x + Math.cos(a) * d + Math.sin(t * 0.6 + phase) * r * 0.02;
    const y = o.y + Math.sin(a) * d * 0.9;
    ctx.strokeStyle = `rgba(232,246,250,${alpha * 0.2})`;
    ctx.lineWidth = Math.max(0.7, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(x - length / 2, y);
    ctx.quadraticCurveTo(x, y - r * 0.02, x + length / 2, y);
    ctx.stroke();
  }
}

// Rings: circles born at a point that spread until they fade. They're made
// wavy with the same trick as the shoreline and very faint: a clean
// circle on the water reads as a drawing, not as a ripple.
function ripples(ctx, o, r, seedOf, rnd, t) {
  for (let i = 0; i < LAKE.ripples; i++) {
    const cxo = o.x + (rnd() - 0.5) * r * 0.9;
    const cyo = o.y + (rnd() - 0.5) * r * 0.8;
    const shape = profile(seedOf ^ (i * 0x45d9f3b), 0x119de1f3, 0.025);
    const period = 3.4 + rnd() * 2.6;
    const step = ((t + i * 1.7) % period) / period;
    const rad = r * (0.08 + step * 0.5);
    // Faded at birth and at death: a ripple that pops in abruptly looks drawn.
    const life = Math.sin(step * Math.PI) * (1 - step);
    ctx.strokeStyle = `rgba(216,238,242,${life * 0.1})`;
    ctx.lineWidth = Math.max(0.5, r * 0.009 * (1 - step * 0.5));
    outline(ctx, cxo, cyo, rad, shape, 44);
    ctx.stroke();
    // And the trough that follows it on the inside.
    ctx.strokeStyle = `rgba(8,26,34,${life * 0.07})`;
    ctx.lineWidth = Math.max(0.5, r * 0.008);
    outline(ctx, cxo, cyo, rad * 0.93, shape, 44);
    ctx.stroke();
  }
}

// What floats: specks of pollen and bits of leaf that the wind drags across
// the surface and that pile up on the leeward shore. They're tiny and they're
// what separates living water from blue glass.
function specks(ctx, o, r, rnd, va, t) {
  for (let i = 0; i < LAKE.specks; i++) {
    const a = rnd() * Math.PI * 2;
    const base = Math.sqrt(rnd()) * r * 0.9;
    const driftBy = ((t * 0.05 + rnd()) % 1);
    const x = o.x + Math.cos(a) * base + Math.cos(va) * driftBy * r * 0.5;
    const y = o.y + Math.sin(a) * base * 0.92 + Math.sin(va) * driftBy * r * 0.5;
    if (Math.hypot(x - o.x, y - o.y) > r * 0.97) continue;
    const rad = r * (0.006 + rnd() * 0.012);
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(206,196,142,${0.18 + rnd() * 0.2})`
      : `rgba(70,84,58,${0.2 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 1.4, rad, a, 0, Math.PI * 2);
    ctx.fill();
  }
}
