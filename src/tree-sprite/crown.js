// --- crown ----------------------------------------------------------------
//
// The procedural crown, which is leaf. It is the one shown while the
// photographic crown loads, and the one that stays if it never loads.

import { canvasOf, mix, seededRng, noise } from '../sprite-kit.js';
import { CROWN_RISE, LX, LY } from './common.js';

const SAP = '#8a6b3a';       // what the leaves turn toward as they dry

export function paintCrown(seedOf, R, color, dry) {
  const rnd = seededRng((seedOf ^ 0x51ed270b) >>> 0);
  const pad = Math.ceil(R * 0.36) + 5;
  const S = (R + pad) * 2;
  const cx = S / 2;
  const cy = S / 2 - R * CROWN_RISE;   // the leaves sit on top: the bole goes below
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');

  // When drying the leaves do not turn brown all at once: they lose green and gain brown.
  const leaf = mix(color, SAP, dry);
  const background = mix(leaf, '#0e1c12', 0.6);
  const middle = mix(leaf, '#0d1a12', 0.22);
  const clear = mix(leaf, '#eef7cd', 0.34);

  // Clusters: the crown is not a circle, it is a heap of overlapping leaf
  // masses. All of them fit inside the radius.
  const scope = R * 0.72;
  const n = 7 + ((rnd() * 4) | 0);
  const clusters = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
    const rad = scope * (0.42 + rnd() * 0.2);
    const d = Math.min(scope - rad * 0.55, scope * (0.2 + rnd() * 0.55));
    clusters.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.9, r: rad });
  }
  clusters.push({ x: cx + (rnd() - 0.5) * R * 0.1, y: cy - R * 0.06, r: scope * 0.62 });

  // The crown's silhouette, so the grain and the shadow do not spill outside it.
  const crop = () => {
    ctx.beginPath();
    for (const m of clusters) {
      ctx.moveTo(m.x + m.r, m.y);
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    }
  };

  // Three passes: the dark mass, the mid tone shifted toward the light and the
  // highlights only on top of each cluster.
  const pass = (col, scaleOf, toward, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = col;
    for (const m of clusters) {
      ctx.beginPath();
      ctx.arc(m.x + LX * m.r * toward, m.y + LY * m.r * toward, m.r * scaleOf, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  pass(background, 1, 0, 1);
  pass(middle, 0.82, 0.16, 0.95);
  pass(clear, 0.5, 0.36, 0.5);

  // Leaf grain, so the patches do not look flat.
  ctx.save();
  crop();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(noise(S, S, rnd, 3, 3), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // Twigs inside the foliage: the little sticks the leaves hang from. They go
  // before the leaves, so the leaves look like they hang from something.
  const twigs = Math.round(R * 0.5);
  ctx.lineCap = 'round';
  for (let i = 0; i < twigs; i++) {
    const m = clusters[(rnd() * clusters.length) | 0];
    const a = rnd() * Math.PI * 2;
    const x = m.x + Math.cos(a) * m.r * 0.3;
    const y = m.y + Math.sin(a) * m.r * 0.3;
    const length = m.r * (0.4 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(48,34,20,${0.3 + rnd() * 0.3})`;
    ctx.lineWidth = Math.max(0.6, R * 0.012);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * length * 0.6, y + Math.sin(a) * length * 0.5,
      x + Math.cos(a) * length, y + Math.sin(a) * length);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Leaves. They are what stops the crown reading as a heap of circles: each
  // one is a leaf, with its lit side, its tip and its midrib if it is one of
  // the big ones. They come out all along the edge of the clusters, and a few
  // break away and stay loose against the sky.
  const leaves = Math.round(R * 7 * (1 - dry * 0.55));
  for (let i = 0; i < leaves; i++) {
    const m = clusters[(rnd() * clusters.length) | 0];
    const a = rnd() * Math.PI * 2;
    const d = m.r * (0.45 + rnd() * 0.62);
    const x = m.x + Math.cos(a) * d;
    const y = m.y + Math.sin(a) * d;
    if (Math.hypot(x - cx, y - cy + R * CROWN_RISE) > R + pad * 0.5) continue;

    const light = (Math.cos(a) * LX + Math.sin(a) * LY + 1) / 2;   // 1 = faces the light
    const length = R * (0.06 + rnd() * 0.07);
    const width = length * (0.36 + rnd() * 0.22);
    const turn = a + (rnd() - 0.5) * 1.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    const tone = mix(background, clear, light * (0.45 + rnd() * 0.55));

    // A two-curve leaf: it narrows to a point. An oval does not read as a leaf.
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, 0);
    ctx.quadraticCurveTo(0, -width, length * 0.5, 0);
    ctx.quadraticCurveTo(0, width, -length * 0.5, 0);
    ctx.fill();

    if (length > R * 0.085) {
      ctx.strokeStyle = mix(tone, '#0d1a12', 0.45);
      ctx.lineWidth = Math.max(0.4, length * 0.07);
      ctx.beginPath();
      ctx.moveTo(-length * 0.45, 0);
      ctx.lineTo(length * 0.45, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.lineWidth = 1;

  // Gaps in the foliage: through them you see the branches painted on top.
  // The drier, the more and bigger the gaps.
  const gaps = Math.round(4 + dry * 8);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < gaps; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * scope * 0.85;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.05 + rnd() * 0.1) * (0.7 + dry);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(0,0,0,${0.55 + dry * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // The crown shades itself underneath, on the side opposite the light.
  ctx.save();
  crop();
  ctx.clip();
  const low = ctx.createRadialGradient(
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 0.1,
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 1.1
  );
  low.addColorStop(0, 'rgba(8,14,10,0.34)');
  low.addColorStop(1, 'rgba(8,14,10,0)');
  ctx.fillStyle = low;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  return c;
}
