// Fagi's light and shadow: the world's light seen from inside the body, the
// volume of each chitin piece, its glint, the warm light that comes back out
// of translucent cuticle, and the shadows she casts on the ground.
//
// There are no ink outlines: a real ant has none. Its edges are where the
// shell turns away from the light and goes dark, and that is what is painted.

import { mix } from '../sprite-kit.js';

const LIGHT = -Math.PI * 0.72;

// The body turns; the world's light does not. Inside the drawing it has to be
// turned the opposite way so the back always shines on the same side of the map.
export function localLight(angle) {
  const a = LIGHT - angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

// A chitin piece as a polished ellipsoid of radii (rx, ry) at (x, y), clipped
// by its silhouette `path`:
//   · the body of the color, lit toward the light and turning dark at the rim
//     (an elliptical gradient, so a long piece shades as a long piece);
//   · translucency: on the far side, near the edge, light that went into the
//     cuticle comes back out warm —amber, not painted wood;
//   · the reflection: a broad soft sheen and, inside it, a small sharp glint
//     stretched along the body, as on a polished cylinder.
export function shade(ctx, path, x, y, rx, ry, base, L, { alive = true, gloss = 1, glow = 0.3 } = {}) {
  ctx.save();
  path(ctx);
  ctx.clip();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const lx = L.x * rx * 0.32;
  const ly = (L.y * ry * 0.32) * (rx / ry);
  let g = ctx.createRadialGradient(lx, ly, rx * 0.05, 0, 0, rx * 1.05);
  g.addColorStop(0, mix(base, '#ffe7c2', 0.3));
  g.addColorStop(0.36, base);
  g.addColorStop(0.7, mix(base, '#2b1306', 0.38));
  g.addColorStop(0.9, mix(base, '#140802', 0.7));
  g.addColorStop(1, mix(base, '#0a0401', 0.86));
  ctx.fillStyle = g;
  ctx.fillRect(-rx * 2, -rx * 2, rx * 4, rx * 4);

  if (alive && glow > 0) {
    const gx = -L.x * rx * 0.62;
    const gy = -L.y * rx * 0.62;
    g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rx * 0.62);
    g.addColorStop(0, `rgba(255,146,46,${glow})`);
    g.addColorStop(1, 'rgba(255,146,46,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-rx * 2, -rx * 2, rx * 4, rx * 4);
  }
  ctx.restore();

  // The cuticle is not airbrushed: a fine organic mottle under the gloss.
  const grain = cuticle(ctx);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = alive ? 0.5 : 0.3;
    ctx.globalCompositeOperation = 'overlay';
    ctx.translate(x, y);
    ctx.scale(0.06, 0.06);
    ctx.fillStyle = grain;
    ctx.fillRect(-rx * 40, -rx * 40, rx * 80, rx * 80);
    ctx.restore();
  }

  if (gloss > 0) {
    glint(ctx, x + L.x * rx * 0.4, y + L.y * ry * 0.44, rx, ry, alive ? gloss : gloss * 0.35);
  }
  ctx.restore();

  // The faintest edge, only so the piece does not melt into a ground of its
  // own color. Not a line you would notice.
  path(ctx);
  ctx.strokeStyle = 'rgba(20,8,2,0.22)';
  ctx.lineWidth = 0.25;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// A tile of soft noise, made once: light and dark blotches a few pixels wide.
// Used as a pattern, scaled down into the body's units.
let grainPattern;
function cuticle(ctx) {
  if (grainPattern !== undefined) return grainPattern;
  grainPattern = null;
  if (typeof document === 'undefined') return null;
  const N = 96;
  const tile = document.createElement('canvas');
  tile.width = tile.height = N;
  const t = tile.getContext('2d');
  t.fillStyle = 'rgb(128,128,128)';
  t.fillRect(0, 0, N, N);
  let s = 0x2f6b9e1d;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 900; i++) {
    const v = rnd() < 0.5 ? 0 : 255;
    const r = 1 + rnd() * 4;
    const px = rnd() * N;
    const py = rnd() * N;
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      const g = t.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
      g.addColorStop(0, `rgba(${v},${v},${v},0.16)`);
      g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      t.fillStyle = g;
      t.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
    }
  }
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

function glint(ctx, x, y, rx, ry, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.42);
  let g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 0.55);
  g.addColorStop(0, `rgba(255,240,218,${0.3 * k})`);
  g.addColorStop(1, 'rgba(255,240,218,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  const r = Math.min(rx * 0.22, ry * 0.45);
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(255,253,248,${0.95 * k})`);
  g.addColorStop(0.35, `rgba(255,250,238,${0.6 * k})`);
  g.addColorStop(1, 'rgba(255,248,232,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

// The ambient shade under her: very soft, what the body hides of the sky.
export function shadow(ctx, L, alive, lift = 1) {
  ctx.save();
  ctx.translate(-L.x * 1.6 * lift, -L.y * 1.6 * lift);
  const g = ctx.createRadialGradient(-2, 0, 1, -2, 0, 13);
  g.addColorStop(0, `rgba(6,8,10,${alive ? 0.22 : 0.16})`);
  g.addColorStop(1, 'rgba(6,8,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The cast shadow of the body itself: the same silhouettes, laid on the ground
// away from the light. A tight dark one and a wider soft one, so its edge is
// penumbra and not a cut-out. `lift` pushes it further out on stilts.
export function bodyShadow(ctx, L, paths, lift = 1) {
  ctx.save();
  for (const [d, a, grow] of [[2.2, 0.12, 1.1], [1.4, 0.2, 1.0], [0.9, 0.16, 0.96]]) {
    ctx.save();
    ctx.translate(-L.x * d * lift, -L.y * d * lift);
    ctx.scale(grow, grow);
    ctx.fillStyle = `rgba(5,6,8,${a})`;
    for (const p of paths) { p(ctx); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

// Setae: the fine hairs all over an ant. Each one leaves the cuticle leaning
// backward and catches the light. Barely visible one by one; together they
// take the plastic off the shell.
export function setae(ctx, rnd, count, cx, cy, rx, ry, len, alpha = 0.5) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.1;
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * d * rx;
    const y = cy + Math.sin(a) * d * ry;
    const dir = Math.PI + Math.sin(a) * d * 0.9 + (rnd() - 0.5) * 0.5;
    const l = len * (0.6 + rnd() * 0.6);
    ctx.strokeStyle = `rgba(255,236,200,${alpha * (0.5 + rnd() * 0.5)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(dir) * l, y + Math.sin(dir) * l);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}
