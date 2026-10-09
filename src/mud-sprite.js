// A patch of mud (world.mud, MAPGEN.hazards). Not a dark circle: a hollow in
// the ground where water collects, with a ragged edge, a ring of churned-up
// clods, wet sheen where it still holds water and, when it dries out, a crust
// split into plates. It is painted twice, once soaked and once dry, and the
// weather crossfades between them:
//
//   · Rain soaks it (the rain's wetness, rain-sprite/state.js), and a rainy
//     climate keeps it soft between showers. A dry one bakes it into crust.
//   · In a freeze it sets hard and grays over with ice.
//   · Where many feet go through (m.tread, movement.js), a lighter, packed
//     track is worn across it.
//
// The ragged outline stays inside m.r: what you see is what slows her down.

import { canvasOf, seededRng, cacheSprite, detail } from './sprite-kit.js';
import { baseClimate } from './climate.js';
import { weather } from './climate-sprite.js';
import { sky } from './rain-sprite/state.js';
import { LX, LY } from './terrain/palette.js';

const sprites = new Map();
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function drawMud(ctx, m) {
  const z = detail();
  const R = Math.max(6, Math.round(m.r * z));
  const seed = m.seed ?? ((Math.round(m.x) * 73856093) ^ (Math.round(m.y) * 19349663)) >>> 0;
  const soaked = cacheSprite(sprites, `${seed}|${R}|wet`, () => paintMud(seed, R, 'wet'), 90);
  const crust = cacheSprite(sprites, `${seed}|${R}|dry`, () => paintMud(seed, R, 'dry'), 90);
  const w = soaked.width / z;
  const x = m.x - w / 2;
  const y = m.y - w / 2;

  // How wet: a rainy place stays soft, a dry one bakes; rain soaks it either way.
  const climate = baseClimate();
  const wet = clamp01(0.45 + climate.wet * 0.6 - climate.arid * 0.7 + sky.wetness * 0.9);
  // Soft mud underneath; the crust only forms as it dries out, so its cracks
  // never show through wet mud.
  const crusted = clamp01((0.65 - wet) / 0.5);
  ctx.save();
  ctx.drawImage(soaked, x, y, w, w);
  if (crusted > 0.01) {
    ctx.globalAlpha = crusted;
    ctx.drawImage(crust, x, y, w, w);
  }
  ctx.restore();

  // A worn track: packed lighter earth where feet keep crossing.
  const trod = Math.min(1, (m.tread ?? 0) / 40);
  if (trod > 0.02) {
    ctx.save();
    const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 0.7);
    g.addColorStop(0, `rgba(150,128,96,${(0.35 * trod).toFixed(3)})`);
    g.addColorStop(1, 'rgba(150,128,96,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.r * 0.7, m.r * 0.45, (seed % 628) / 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Frozen: the mud sets hard and gray with rime, its water turns to ice.
  const frozen = clamp01((0.5 - weather.temp) / 3);
  if (frozen > 0.02) {
    const ice = cacheSprite(sprites, `${seed}|${R}|ice`, () => paintMud(seed, R, 'ice'), 90);
    ctx.save();
    ctx.globalAlpha = frozen;
    ctx.drawImage(ice, x, y, w, w);
    ctx.restore();
  }
}

// The outline: a circle pushed in and out by a few harmonics, so no two
// patches share a shape. `k` < 1 for the inner pools.
function outline(rnd, n = 5) {
  const waves = Array.from({ length: n }, (_, i) => ({ a: (rnd() * 0.22) / (i + 1), p: rnd() * Math.PI * 2, f: i + 2 }));
  return (t) => 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.f * t + w.p), 0);
}

function blob(g, cx, cy, r, shape, squash = 1, turn = 0) {
  g.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const rr = r * shape(t);
    const px = Math.cos(t) * rr;
    const py = Math.sin(t) * rr * squash;
    const x = cx + px * Math.cos(turn) - py * Math.sin(turn);
    const y = cy + px * Math.sin(turn) + py * Math.cos(turn);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

// `state`: 'wet', 'dry' (cracked crust) or 'ice' (frozen hard). The same seed
// gives the same outline and pools in all three, so they crossfade cleanly.
function paintMud(seed, R, state) {
  const wet = state !== 'dry';
  const ice = state === 'ice';
  const side = R * 2;
  const c = canvasOf(side, side);
  const g = c.getContext('2d');
  const rnd = seededRng(seed);
  const shape = outline(rnd);
  const turn = rnd() * Math.PI;
  const squash = 0.72 + rnd() * 0.2;
  const cx = R;
  const cy = R;
  const r = R * 0.8;   // the harmonics push the edge out to ~R

  // The damp halo: the earth around darkens before it turns to mud.
  const halo = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, R);
  halo.addColorStop(0, ice ? 'rgba(40,36,32,0.35)' : wet ? 'rgba(30,22,14,0.42)' : 'rgba(70,56,38,0.25)');
  halo.addColorStop(1, 'rgba(30,22,14,0)');
  g.fillStyle = halo;
  g.fillRect(0, 0, side, side);

  // The body of the mud: darker toward the bottom of the hollow, its edge
  // feathered into the earth around it.
  g.save();
  g.filter = `blur(${Math.max(1, R * 0.035).toFixed(1)}px)`;
  blob(g, cx, cy, r, shape, squash, turn);
  const body = g.createRadialGradient(cx + LX * r * 0.2, cy + LY * r * 0.2, r * 0.1, cx, cy, r * 1.1);
  if (ice) {
    body.addColorStop(0, 'rgb(64,58,52)');
    body.addColorStop(0.6, 'rgb(74,67,58)');
    body.addColorStop(1, 'rgb(86,77,64)');
  } else if (wet) {
    body.addColorStop(0, 'rgb(46,34,22)');
    body.addColorStop(0.6, 'rgb(62,47,31)');
    body.addColorStop(1, 'rgb(84,66,44)');
  } else {
    body.addColorStop(0, 'rgb(122,100,72)');
    body.addColorStop(0.7, 'rgb(136,113,82)');
    body.addColorStop(1, 'rgb(118,97,70)');
  }
  g.fillStyle = body;
  g.fill();
  g.restore();

  // Its surface, clipped to it.
  g.save();
  blob(g, cx, cy, r, shape, squash, turn);
  g.clip();
  // Grain: small dents and bumps.
  for (let i = 0; i < R * R * 0.12; i++) {
    const x = rnd() * side;
    const y = rnd() * side;
    g.fillStyle = rnd() < 0.5 ? 'rgba(10,8,5,0.18)' : (wet ? 'rgba(120,98,70,0.14)' : 'rgba(170,146,110,0.18)');
    g.fillRect(x, y, 1 + rnd() * 1.5, 1 + rnd());
  }
  if (wet) {
    // Standing water in the lowest spots, reflecting the sky.
    const pools = 1 + ((rnd() * 2) | 0);
    for (let i = 0; i < pools; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * r * 0.35;
      const pr = r * (0.2 + rnd() * 0.22);
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * squash;
      const pshape = outline(rnd, 3);
      const pturn = turn + rnd();
      // Murky water: almost as dark as the mud, a little cooler.
      g.save();
      g.filter = `blur(${Math.max(0.6, pr * 0.08).toFixed(1)}px)`;
      blob(g, px, py, pr, pshape, 0.55, pturn);
      g.fillStyle = ice ? 'rgba(138,152,164,0.75)' : 'rgba(24,20,15,0.7)';
      g.fill();
      g.restore();
      // A flat film of water: a faint wash of sky across it and a thin glint
      // along the edge that faces away from the light.
      g.save();
      blob(g, px, py, pr * 0.96, pshape, 0.55, pturn);
      g.clip();
      const sheen = g.createLinearGradient(px + LX * pr, py + LY * pr, px - LX * pr, py - LY * pr);
      sheen.addColorStop(0, 'rgba(0,0,0,0)');
      sheen.addColorStop(0.7, 'rgba(120,132,146,0.1)');
      sheen.addColorStop(1, 'rgba(176,190,206,0.26)');
      g.fillStyle = sheen;
      g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      if (ice) {
        // White fractures in the ice.
        g.strokeStyle = 'rgba(246,250,255,0.7)';
        g.lineWidth = Math.max(0.5, pr * 0.03);
        for (let k = 0; k < 4; k++) {
          let qx = px + (rnd() - 0.5) * pr;
          let qy = py + (rnd() - 0.5) * pr * 0.5;
          let qa = rnd() * Math.PI * 2;
          g.beginPath();
          g.moveTo(qx, qy);
          for (let j = 0; j < 3; j++) {
            qa += (rnd() - 0.5) * 1.2;
            qx += Math.cos(qa) * pr * 0.3;
            qy += Math.sin(qa) * pr * 0.3;
            g.lineTo(qx, qy);
          }
          g.stroke();
        }
      }
      g.restore();
    }
    // Glints: the wet surface catches the light in a few sparks; frozen, the
    // rime on it is a dense frost of them.
    for (let i = 0; i < R * (ice ? 0.9 : 0.25); i++) {
      const x = cx + (rnd() - 0.5) * r * 1.6;
      const y = cy + (rnd() - 0.5) * r * 1.6 * squash;
      g.fillStyle = `rgba(220,226,232,${((ice ? 0.18 : 0.08) + rnd() * 0.2).toFixed(3)})`;
      g.beginPath();
      g.ellipse(x, y, 0.6 + rnd() * 1.4, 0.4 + rnd() * 0.6, LX, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // Dried out: the crust shrinks and splits into plates (desiccation cracks).
    crackNet(g, cx, cy, r, rnd);
  }
  g.restore();

  // The rim of churned clods, lit from the top left.
  const clods = Math.round(R * 0.7);
  for (let i = 0; i < clods; i++) {
    const t = rnd() * Math.PI * 2;
    const rr = r * shape(t) * (0.92 + rnd() * 0.16);
    const px = Math.cos(t) * rr;
    const py = Math.sin(t) * rr * squash;
    const x = cx + px * Math.cos(turn) - py * Math.sin(turn);
    const y = cy + px * Math.sin(turn) + py * Math.cos(turn);
    const s = (0.5 + rnd() * 1.4) * Math.max(1, R / 90);
    g.fillStyle = 'rgba(10,8,5,0.22)';
    g.beginPath();
    g.ellipse(x - LX * s * 0.4, y - LY * s * 0.4, s, s * 0.7, t, 0, Math.PI * 2);
    g.fill();
    const k = (rnd() * 16) | 0;
    g.fillStyle = ice ? `rgba(${88 + k},${82 + k},${74 + k},0.75)`
      : wet ? `rgba(${66 + k},${52 + k},${38 + k},0.75)` : `rgba(${118 + k},${100 + k},${76 + k},0.75)`;
    g.beginPath();
    g.ellipse(x, y, s, s * 0.7, t, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

// Mud cracks into polygons as it dries: a few seeds, and the boundaries where
// their cells meet, drawn as dark gaps with a lit lip on one side.
function crackNet(g, cx, cy, r, rnd) {
  const seeds = Array.from({ length: 14 + ((rnd() * 10) | 0) }, () => ({
    x: cx + (rnd() - 0.5) * r * 2.2,
    y: cy + (rnd() - 0.5) * r * 2.2,
  }));
  const step = Math.max(1, Math.round(r / 40));
  const x0 = Math.max(0, Math.floor(cx - r * 1.2));
  const x1 = Math.ceil(cx + r * 1.2);
  const y0 = Math.max(0, Math.floor(cy - r * 1.2));
  const y1 = Math.ceil(cy + r * 1.2);
  const nearest = (x, y) => {
    let best = 0;
    let bd = Infinity;
    let second = Infinity;
    for (let i = 0; i < seeds.length; i++) {
      const d = (seeds[i].x - x) ** 2 + (seeds[i].y - y) ** 2;
      if (d < bd) { second = bd; bd = d; best = i; } else if (d < second) second = d;
    }
    return { best, gap: Math.sqrt(second) - Math.sqrt(bd) };
  };
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const { gap } = nearest(x, y);
      if (gap < 1.4 * step) {
        g.fillStyle = `rgba(28,20,12,${(0.65 - gap / (3 * step)).toFixed(3)})`;
        g.fillRect(x, y, step, step);
        g.fillStyle = 'rgba(196,174,136,0.22)';
        g.fillRect(x + LX * step * 1.5, y + LY * step * 1.5, step, step);
      }
    }
  }
}
