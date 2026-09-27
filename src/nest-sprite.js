// The nest: an anthill of dug-out soil. Like the rock, the mound is painted
// ONCE on its own canvas and then just stamped; the only thing repainted every
// frame is the mouth, which breathes when Fagi sleeps inside.
//
// An anthill has no edge: it is loose soil piled up, so the border is not
// drawn, it fades away. All the volume is built with soft blots and an
// irregular mask, so it does not read as a disc.
//
// The mound fills the nest's use radius: what you see is exactly the area
// where Fagi is "at home".

import { canvasOf, mix, seededRng, seedFor, noise, detail, stamp } from './sprite-kit.js';

const sprites = new Map();   // key: seed|radius|color

const MOUTH = 0.17;           // the mouth, as a fraction of the radius
const LIGHT = -Math.PI * 0.72; // same light as the rocks: top left
const LX = Math.cos(LIGHT);
const LY = Math.sin(LIGHT);

export function drawNest(ctx, o, spec, r) {
  const z = detail();
  const img = spriteOf(seedFor(o), Math.round(r * z), spec.color);
  stamp(ctx, img, o.x, o.y, z);
}

// The inside of the mouth. Painted apart from the mound because it pulses: with
// Fagi inside a faint ember lights up in it, rising and falling like breathing.
export function drawNestMouth(ctx, o, r, busy, now) {
  const rb = r * MOUTH;

  // The hole: black in the center, with the tunnel wall a bit less black on
  // the side where the light gets in.
  const tunnel = ctx.createRadialGradient(
    o.x - LX * rb * 0.45, o.y - LY * rb * 0.45, rb * 0.15,
    o.x, o.y, rb * 1.05
  );
  tunnel.addColorStop(0, '#000000');
  tunnel.addColorStop(0.7, '#0c0a08');
  tunnel.addColorStop(1, '#221a12');
  ctx.fillStyle = tunnel;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, rb, rb * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  if (busy) {
    const late = 0.5 + 0.5 * Math.sin(now / 900);
    const ember = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rb * 1.6);
    ember.addColorStop(0, `rgba(226,168,74,${0.08 + late * 0.14})`);
    ember.addColorStop(1, 'rgba(226,168,74,0)');
    ctx.fillStyle = ember;
    ctx.beginPath();
    ctx.arc(o.x, o.y, rb * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spriteOf(seedOf, r, color) {
  const key = `${seedOf}|${r}|${color}`;
  const saved = sprites.get(key);
  if (saved) return saved;
  const img = paintNest(seedOf, r, color);
  sprites.set(key, img);
  return img;
}

// A soft blot: used by the dozen, for the bulk and for the mask.
function patch(ctx, x, y, rad, alpha, color = '255,255,255') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
}

// The silhouette: a heap of soil, not a circle. It is made of loose blots
// spread along the border, so the outline ends up broken and frayed, and it
// also fades outward. It never goes past the radius.
function mask(S, r, rnd) {
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  const cx = S / 2;
  const cy = S / 2;

  const body = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 0.97);
  body.addColorStop(0, 'rgba(255,255,255,1)');
  body.addColorStop(0.62, 'rgba(255,255,255,0.97)');
  body.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, S, S);

  // Tongues of soil: the heap does not end at the same distance on every
  // side. Some bite inward and others stick out, always within the radius.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.2;
    const d = r * (0.6 + rnd() * 0.22);
    patch(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.13 + rnd() * 0.16), 0.5 + rnd() * 0.4);
  }

  // And bites are taken out of the border so it is not a regular rim.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.84 + rnd() * 0.2);
    patch(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.1 + rnd() * 0.2), 0.5 + rnd() * 0.5);
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function paintNest(seedOf, r, color) {
  const rnd = seededRng(seedOf);
  const pad = Math.ceil(r * 0.45) + 8;
  const S = (r + pad) * 2;
  const cx = S / 2;
  const cy = S / 2;
  const rb = r * MOUTH;

  // Churned soil: brown and dull, with a pinch of the nest's ochre so it reads
  // as its own and not as just another stone.
  const soil = mix('#5b452e', color, 0.12);
  const clear = mix(soil, '#d8bd90', 0.55);
  const dark = mix(soil, '#171109', 0.62);

  // --- The mound, on its own canvas, so it can be clipped with the mask.
  const m = canvasOf(S, S);
  const mc = m.getContext('2d');

  mc.fillStyle = soil;
  mc.fillRect(0, 0, S, S);

  // Cone volume. The high part is the ring around the mouth: outward it slopes
  // down to the ground, and inward it drops into the hole.
  const cone = mc.createRadialGradient(cx, cy, rb * 1.1, cx, cy, r);
  cone.addColorStop(0, mix(soil, '#cdae7d', 0.3));
  cone.addColorStop(0.35, mix(soil, '#8a6c46', 0.25));
  cone.addColorStop(0.75, soil);
  cone.addColorStop(1, dark);
  mc.fillStyle = cone;
  mc.fillRect(0, 0, S, S);

  // Light from one side: a mound, not a bullseye.
  const sideOf = mc.createLinearGradient(cx + LX * r, cy + LY * r, cx - LX * r, cy - LY * r);
  sideOf.addColorStop(0, 'rgba(255,240,210,0.34)');
  sideOf.addColorStop(0.42, 'rgba(0,0,0,0)');
  sideOf.addColorStop(1, 'rgba(10,8,6,0.52)');
  mc.fillStyle = sideOf;
  mc.fillRect(0, 0, S, S);

  // Clods: soft blots, some in the light and others in shadow. They break up
  // the flat tone and make it look like soil thrown by the shovelful.
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rb * 1.2 + Math.sqrt(rnd()) * (r * 0.95 - rb * 1.2);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.06 + rnd() * 0.14);
    const clodLight = rnd() < 0.5;
    patch(mc, x - LX * rad * 0.3, y - LY * rad * 0.3, rad, clodLight ? 0.1 : 0.16,
      clodLight ? '236,214,175' : '22,17,11');
  }

  // Grain: fine sand over coarse clods.
  mc.globalAlpha = 0.5;
  mc.globalCompositeOperation = 'overlay';
  mc.drawImage(noise(S, S, rnd, 3, 3), 0, 0);
  mc.globalAlpha = 0.45;
  mc.globalCompositeOperation = 'soft-light';
  mc.drawImage(noise(S, S, rnd, Math.max(5, r >> 2), 2), 0, 0);
  mc.globalCompositeOperation = 'source-over';
  mc.globalAlpha = 1;

  // Loose pebbles: a point of light with its shadow stuck underneath.
  for (let i = 0; i < 18 + ((rnd() * 10) | 0); i++) {
    const a = rnd() * Math.PI * 2;
    const d = rb * 1.4 + Math.sqrt(rnd()) * (r * 0.9 - rb * 1.4);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.012 + rnd() * 0.028);
    mc.fillStyle = 'rgba(18,13,8,0.35)';
    mc.beginPath();
    mc.arc(x - LX * rad * 0.9, y - LY * rad * 0.9, rad * 1.1, 0, Math.PI * 2);
    mc.fill();
    mc.fillStyle = mix(clear, soil, 0.25 + rnd() * 0.5);
    mc.beginPath();
    mc.arc(x, y, rad, 0, Math.PI * 2);
    mc.fill();
  }

  // The light is gone over AFTER the grain: otherwise the sand flattens the
  // bulk and the heap ends up as a flat blot.
  const relief = mc.createRadialGradient(
    cx + LX * r * 0.5, cy + LY * r * 0.5, r * 0.08,
    cx, cy, r * 1.05
  );
  relief.addColorStop(0, 'rgba(255,240,208,0.2)');
  relief.addColorStop(0.5, 'rgba(0,0,0,0)');
  relief.addColorStop(1, 'rgba(12,9,6,0.5)');
  mc.fillStyle = relief;
  mc.fillRect(0, 0, S, S);

  // Two or three wide shadows on the dark slope: the heap is not smooth.
  for (let i = 0; i < 3; i++) {
    const a = LIGHT + Math.PI + (rnd() - 0.5) * 1.6;
    const d = r * (0.35 + rnd() * 0.4);
    patch(mc, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.25 + rnd() * 0.2), 0.16, '14,10,6');
  }

  // Worn paths running down from the mouth: trodden soil gets lighter and
  // smoother. They are drawn blurred because they are tracks, not grooves.
  mc.save();
  mc.filter = `blur(${Math.max(1, r * 0.05)}px)`;
  mc.lineCap = 'round';
  for (let i = 0, n = 2 + ((rnd() * 3) | 0); i < n; i++) {
    let a = rnd() * Math.PI * 2;
    let x = cx + Math.cos(a) * rb * 1.3;
    let y = cy + Math.sin(a) * rb * 1.3;
    mc.strokeStyle = `rgba(222,199,158,${0.06 + rnd() * 0.06})`;
    mc.lineWidth = r * (0.06 + rnd() * 0.05);
    mc.beginPath();
    mc.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      a += (rnd() - 0.5) * 0.5;
      x += Math.cos(a) * r * 0.28;
      y += Math.sin(a) * r * 0.28;
      mc.lineTo(x, y);
    }
    mc.stroke();
  }
  mc.restore();

  // The crater: the raised lip around the hole, lit on one side and shaded on
  // the other, and the funnel dropping inward.
  mc.save();
  mc.filter = `blur(${Math.max(1, r * 0.04)}px)`;
  mc.lineWidth = rb * 0.7;
  mc.strokeStyle = 'rgba(244,227,192,0.42)';
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.45, LIGHT - 1.5, LIGHT + 1.5);
  mc.stroke();
  mc.strokeStyle = 'rgba(14,10,6,0.5)';
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.45, LIGHT + 1.6, LIGHT - 1.6);
  mc.stroke();
  mc.restore();

  const funnel = mc.createRadialGradient(cx, cy, rb * 0.85, cx, cy, rb * 1.9);
  funnel.addColorStop(0, 'rgba(9,7,4,0.78)');
  funnel.addColorStop(0.5, 'rgba(9,7,4,0.26)');
  funnel.addColorStop(1, 'rgba(9,7,4,0)');
  mc.fillStyle = funnel;
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.9, 0, Math.PI * 2);
  mc.fill();

  // Clip: the soil only exists where the mask says so.
  mc.globalCompositeOperation = 'destination-in';
  mc.drawImage(mask(S, r, rnd), 0, 0);
  mc.globalCompositeOperation = 'source-over';

  // --- And now it all comes together: ground shadow, mound, scattered soil.
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');

  ctx.save();
  ctx.translate(cx - LX * r * 0.12, cy - LY * r * 0.12 + r * 0.1);
  ctx.scale(1, 0.6);
  patch(ctx, 0, 0, r * 1.15, 0.4, '6,7,10');
  ctx.restore();

  ctx.drawImage(m, 0, 0);

  // Loose grains outside the heap: what flies out when digging. They go on
  // top, and blur the end of the mound against the ground.
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.88 + Math.sqrt(rnd()) * 0.34);
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(126,101,68,${0.1 + rnd() * 0.18})`
      : `rgba(52,40,27,${0.12 + rnd() * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.009 + rnd() * 0.018), 0, Math.PI * 2);
    ctx.fill();
  }

  // A twig or dry needle or two fallen on the heap.
  ctx.lineCap = 'round';
  for (let i = 0, n = 2 + ((rnd() * 2) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.4 + rnd() * 0.45);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const ang = rnd() * Math.PI;
    const len = r * (0.1 + rnd() * 0.14);
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(104,82,52,0.5)' : 'rgba(88,97,61,0.45)';
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  return c;
}
