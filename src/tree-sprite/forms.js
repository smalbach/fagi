// --- what the tree is -------------------------------------------------------
//
// A tree looks like the fruit it bears. The fruit's SHAPE decides the kind of
// tree, and its COLOR tints the leaves and the flowers:
//
//   · round   (berry) → a broadleaf: the round, leafy crown, in bloom.
//   · drop    (resin) → a conifer: tiers of needles, beaded with resin.
//   · crystal (spark) → a palm: long fronds around a crown of bright fruit.
//   · orb     (eye)   → a willow: a dome with curtains of hanging leaf.
//
// So two trees of different fruit can be told apart at a glance, and every
// tree of the same fruit reads as the same species, the way it is in a wood.

import { canvasOf, mix, seededRng } from '../sprite-kit.js';
import { CROWN_RISE, LX, LY } from './common.js';

export const SAP = '#8a6b3a';       // what the leaves turn toward as they dry

const FORM_OF_PAINTER = { berry: 'broadleaf', resin: 'conifer', spark: 'palm', eye: 'willow' };

// Each kind of tree starts from its own green; the fruit pulls it toward its color.
const GREENS = { broadleaf: '#4f9552', conifer: '#2d5a3c', palm: '#5d9a3c', willow: '#5f9444' };
const TINT = { broadleaf: 0.26, conifer: 0.2, palm: 0.24, willow: 0.22 };

export function formOf(spec) {
  return FORM_OF_PAINTER[spec?.painter] ?? 'broadleaf';
}

// The leaf color of a tree bearing `color`, `dry` of the way to dead.
export function foliageOf(form, color, dry) {
  return mix(mix(GREENS[form], color, TINT[form]), SAP, dry);
}

// Whether the branch tips peek through the leaves: only where there are branches.
export const hasBranches = (form) => form === 'broadleaf';

// The canvas the non-broadleaf crowns are painted on: roomier than the
// broadleaf's, since fronds and curtains reach further. Same center convention.
function crownCanvas(R) {
  const pad = Math.ceil(R * 0.62) + 6;
  const S = (R + pad) * 2;
  const c = canvasOf(S, S);
  return { S, c, ctx: c.getContext('2d'), cx: S / 2, cy: S / 2 - R * CROWN_RISE };
}

// A small glossy bead in the fruit's color: resin, a berry, a blossom's heart.
function bead(ctx, x, y, rad, color) {
  const g = ctx.createRadialGradient(x + LX * rad * 0.4, y + LY * rad * 0.4, 0, x, y, rad * 1.2);
  g.addColorStop(0, mix(color, '#ffffff', 0.5));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mix(color, '#101a12', 0.5));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
}

// Five petals and a heart: the broadleaf's bloom, and the willow's.
export function blossom(ctx, x, y, rad, color, turn) {
  ctx.fillStyle = mix(color, '#ffffff', 0.3);
  for (let k = 0; k < 5; k++) {
    const a = turn + (k / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * rad * 0.55, y + Math.sin(a) * rad * 0.55, rad * 0.5, rad * 0.32, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = mix(color, '#3a2410', 0.35);
  ctx.beginPath();
  ctx.arc(x, y, rad * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

export function paintForm(form, seedOf, R, color, dry) {
  if (form === 'conifer') return paintConifer(seedOf, R, color, dry);
  if (form === 'palm') return paintPalm(seedOf, R, color, dry);
  return paintWillow(seedOf, R, color, dry);
}

// Tiers of needles seen from above, each smaller and higher, like a cone.
function paintConifer(seedOf, R, color, dry) {
  const rnd = seededRng((seedOf ^ 0x3c6ef372) >>> 0);
  const { c, ctx, cx, cy } = crownCanvas(R);
  const leaf = foliageOf('conifer', color, dry);
  const tiers = 5;
  const lift = R * 0.13;

  for (let t = 0; t < tiers; t++) {
    const k = t / (tiers - 1);                 // 0 = the base, 1 = the tip
    const rad = R * (1.0 - k * 0.78);
    const x = cx + (rnd() - 0.5) * R * 0.04;
    const y = cy + R * 0.18 - t * lift;
    const arms = 16 + ((rnd() * 5) | 0);
    const turn = rnd() * Math.PI * 2;
    const tone = mix(mix(leaf, '#07120b', 0.45 - k * 0.3), '#e4f2c0', k * 0.16);

    // The star: long needled arms and short notches between them.
    ctx.fillStyle = tone;
    ctx.beginPath();
    for (let i = 0; i <= arms * 2; i++) {
      const a = turn + (i / (arms * 2)) * Math.PI * 2;
      const d = i % 2 ? rad * (0.72 + rnd() * 0.1) : rad * (0.9 + rnd() * 0.12);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d * 0.86;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // The lit side of the tier.
    const g = ctx.createRadialGradient(x + LX * rad * 0.5, y + LY * rad * 0.5, 0, x, y, rad);
    g.addColorStop(0, 'rgba(230,246,200,0.22)');
    g.addColorStop(1, 'rgba(230,246,200,0)');
    ctx.fillStyle = g;
    ctx.fill();

    // Needles along each arm: fine strokes, fewer the drier.
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(0.5, R * 0.009);
    const needles = Math.round(arms * 12 * (1 - dry * 0.6));
    for (let i = 0; i < needles; i++) {
      const a = turn + rnd() * Math.PI * 2;
      const d = rad * (0.25 + rnd() * 0.68);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d * 0.86;
      const len = R * (0.04 + rnd() * 0.05);
      const b = a + (rnd() < 0.5 ? 0.6 : -0.6);
      const light = (Math.cos(a) * LX + Math.sin(a) * LY + 1) / 2;
      ctx.strokeStyle = mix(tone, light > 0.5 ? '#dff0b8' : '#040a06', 0.35);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(b) * len, py + Math.sin(b) * len * 0.86);
      ctx.stroke();
    }

    // The shadow the tier above throws on this one.
    if (t < tiers - 1) {
      const up = R * (1.0 - (k + 1 / (tiers - 1)) * 0.78);
      const sh = ctx.createRadialGradient(x - LX * lift, y - LY * lift - lift, up * 0.4, x, y - lift, up * 1.25);
      sh.addColorStop(0, 'rgba(4,10,6,0.32)');
      sh.addColorStop(1, 'rgba(4,10,6,0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.arc(x, y - lift, up * 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Resin: beads of the fruit's color caught at the tips of the arms.
    const beads = 2 + ((rnd() * 3) | 0);
    for (let i = 0; i < beads && t < tiers - 1; i++) {
      const a = turn + (((rnd() * arms) | 0) / arms) * Math.PI * 2;
      bead(ctx, x + Math.cos(a) * rad * 0.82, y + Math.sin(a) * rad * 0.82 * 0.86,
        Math.max(1, R * 0.028), mix(color, SAP, dry * 0.6));
    }
  }
  return c;
}

// Fronds around a hub: each a drooping spine with its leaflets on both sides.
function paintPalm(seedOf, R, color, dry) {
  const rnd = seededRng((seedOf ^ 0x1f83d9ab) >>> 0);
  const { c, ctx, cx, cy } = crownCanvas(R);
  const leaf = foliageOf('palm', color, dry);
  const n = 9 + ((rnd() * 3) | 0);
  const turn = rnd() * Math.PI * 2;
  const fronds = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
    fronds.push({ a, len: R * (0.85 + rnd() * 0.3) * (1 - dry * 0.25), droop: R * (0.18 + rnd() * 0.16) });
  }
  // The ones reaching up are further away: painted first, and darker.
  fronds.sort((p, q) => Math.sin(p.a) - Math.sin(q.a));

  ctx.lineCap = 'round';
  for (const f of fronds) {
    const back = (1 - Math.sin(f.a)) / 2;       // 1 = the far side
    const tone = mix(leaf, '#08140a', back * 0.35);
    const ex = cx + Math.cos(f.a) * f.len;
    const ey = cy + Math.sin(f.a) * f.len * 0.8 + f.droop;
    const mx = cx + Math.cos(f.a) * f.len * 0.55;
    const my = cy + Math.sin(f.a) * f.len * 0.45 - f.droop * 0.35;
    const at = (t) => ({
      x: (1 - t) ** 2 * cx + 2 * (1 - t) * t * mx + t * t * ex,
      y: (1 - t) ** 2 * cy + 2 * (1 - t) * t * my + t * t * ey,
    });

    // Leaflets: pairs that shrink toward the tip, swept forward along the spine.
    const pairs = Math.round(16 * (1 - dry * 0.5));
    for (let i = 1; i <= pairs; i++) {
      const t = i / (pairs + 1);
      const p = at(t);
      const q = at(Math.min(1, t + 0.02));
      const dir = Math.atan2(q.y - p.y, q.x - p.x);
      const len = R * 0.22 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (0.8 + rnd() * 0.3);
      for (const side of [-1, 1]) {
        const b = dir + side * (0.95 + rnd() * 0.3);
        const light = (Math.cos(b) * LX + Math.sin(b) * LY + 1) / 2;
        ctx.strokeStyle = mix(tone, light > 0.5 ? '#e6f5bf' : '#06100a', 0.12 + light * 0.18);
        ctx.lineWidth = Math.max(0.8, R * 0.022);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + Math.cos(b) * len * 0.6, p.y + Math.sin(b) * len * 0.6,
          p.x + Math.cos(b + side * 0.25) * len, p.y + Math.sin(b + side * 0.25) * len + len * 0.25);
        ctx.stroke();
      }
    }
    // The spine over its leaflets.
    ctx.strokeStyle = mix(tone, '#d9cf96', 0.35);
    ctx.lineWidth = Math.max(1, R * 0.03);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }

  // The hub, and the bunch of fruit it carries in the fruit's color.
  const hub = ctx.createRadialGradient(cx + LX * R * 0.05, cy + LY * R * 0.05, 0, cx, cy, R * 0.16);
  hub.addColorStop(0, mix(leaf, '#e6f5bf', 0.3));
  hub.addColorStop(1, mix(leaf, '#08140a', 0.5));
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.16, 0, Math.PI * 2);
  ctx.fill();
  const bunch = 5 + ((rnd() * 3) | 0);
  for (let i = 0; i < bunch; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * 0.08 * Math.sqrt(rnd());
    bead(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d + R * 0.04, Math.max(1, R * 0.045), mix(color, SAP, dry * 0.6));
  }
  ctx.lineWidth = 1;
  return c;
}

// A low dome and, hanging from it, curtains of leaf that reach toward the ground.
function paintWillow(seedOf, R, color, dry) {
  const rnd = seededRng((seedOf ^ 0x6a09e667) >>> 0);
  const { c, ctx, cx, cy } = crownCanvas(R);
  const leaf = foliageOf('willow', color, dry);
  const dark = mix(leaf, '#0b170d', 0.55);
  const clear = mix(leaf, '#eef7cd', 0.35);

  // The dome: wide and low.
  const dome = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
    dome.push({ x: cx + Math.cos(a) * R * 0.42, y: cy + Math.sin(a) * R * 0.28, r: R * (0.34 + rnd() * 0.12) });
  }
  dome.push({ x: cx, y: cy - R * 0.06, r: R * 0.46 });
  for (const [col, s, toward] of [[dark, 1, 0], [leaf, 0.8, 0.18], [clear, 0.45, 0.4]]) {
    ctx.fillStyle = col;
    for (const m of dome) {
      ctx.beginPath();
      ctx.arc(m.x + LX * m.r * toward, m.y + LY * m.r * toward, m.r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Small leaves over the dome, lit on the side the light comes from.
  const leaves = Math.round(R * 4 * (1 - dry * 0.5));
  for (let i = 0; i < leaves; i++) {
    const m = dome[(rnd() * dome.length) | 0];
    const a = rnd() * Math.PI * 2;
    const d = m.r * Math.sqrt(rnd()) * 0.95;
    const light = (Math.cos(a) * LX + Math.sin(a) * LY + 1) / 2;
    ctx.fillStyle = mix(dark, clear, light * (0.4 + rnd() * 0.6));
    ctx.beginPath();
    ctx.ellipse(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, R * 0.02, R * 0.05, (rnd() - 0.5) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // The curtains: thin strands that fall and sway a little outward, dotted with
  // leaves. The ones behind go darker. Fewer, and shorter, the drier.
  const strands = Math.round(R * 1.6 * (1 - dry * 0.5));
  const list = [];
  for (let i = 0; i < strands; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.3 + rnd() * 0.55);
    list.push({ a, x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.55 - R * 0.1, fall: R * (0.4 + rnd() * 0.45) * (1 - dry * 0.4) });
  }
  list.sort((p, q) => p.y - q.y);
  ctx.lineCap = 'round';
  for (const s of list) {
    const out = Math.cos(s.a) * R * 0.12;
    const front = (Math.sin(s.a) + 1) / 2;
    const tone = mix(dark, clear, 0.2 + front * 0.6 * rnd());
    ctx.strokeStyle = tone;
    ctx.lineWidth = Math.max(0.6, R * 0.014);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(s.x + out, s.y + s.fall * 0.5, s.x + out * 0.7, s.y + s.fall);
    ctx.stroke();
    ctx.fillStyle = tone;
    for (let t = 0.2; t < 1; t += 0.14) {
      const px = (1 - t) ** 2 * s.x + 2 * (1 - t) * t * (s.x + out) + t * t * (s.x + out * 0.7);
      const py = s.y + s.fall * t;
      ctx.beginPath();
      ctx.ellipse(px + (rnd() - 0.5) * 2, py, R * 0.018, R * 0.042, (rnd() - 0.5) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Some strands end in a blossom of the fruit's color.
    if (rnd() < 0.18) blossom(ctx, s.x + out * 0.7, s.y + s.fall, Math.max(1.2, R * 0.04), mix(color, SAP, dry * 0.6), rnd() * 6);
  }
  ctx.lineWidth = 1;
  return c;
}
