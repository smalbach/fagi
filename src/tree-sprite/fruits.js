// --- fruit ----------------------------------------------------------------

import { TREE, POINT_TYPES } from '../config.js';
import { mix, seededRng, seedFor } from '../sprite-kit.js';
import { CROWN_RISE, LX, LY } from './common.js';

const SPROUTS = 4;              // spots in the crown where fruit can hang

// The hanging fruit. One ripening —the one about to fall— and the rest, buds
// waiting their turn. Which one ripens depends on how many it has dropped, so
// after each fall it is another branch's turn.
// Its outline follows the fruit's shape (chemistry.js SHAPE_PAINTER), so what
// ripens on the branch is already the piece that will fall.
function outline(ctx, painter, x, y, rad) {
  ctx.beginPath();
  if (painter === 'resin') {          // a drop, pointing up
    ctx.moveTo(x, y - rad * 1.5);
    ctx.quadraticCurveTo(x + rad * 1.1, y - rad * 0.2, x, y + rad);
    ctx.quadraticCurveTo(x - rad * 1.1, y - rad * 0.2, x, y - rad * 1.5);
  } else if (painter === 'spark') {   // a crystal
    ctx.moveTo(x, y - rad * 1.3);
    ctx.lineTo(x + rad * 0.85, y);
    ctx.lineTo(x, y + rad * 1.3);
    ctx.lineTo(x - rad * 0.85, y);
    ctx.closePath();
  } else {
    ctx.arc(x, y, rad, 0, Math.PI * 2);
  }
}

// `form` (forms.js): on a palm they hang in a bunch under the hub.
export function fruitsOf(ctx, o, r, v, dry, form = 'broadleaf') {
  const spec = POINT_TYPES[o.fruit ?? TREE.fruit];
  if (!spec) return;

  const rnd = seededRng((seedFor(o) ^ 0x9e3779b9) >>> 0);
  const ready = 1 - Math.max(0, Math.min(1, (o.timer ?? 0) / TREE.interval));
  const which = (o.lastDrop ?? 0) % SPROUTS;
  const green = mix(spec.color, '#39603a', 0.55);

  for (let i = 0; i < SPROUTS; i++) {
    // They hang from the lower half of the crown, which is where they show.
    const a = Math.PI * 0.12 + rnd() * Math.PI * 0.76;
    const d = r * (form === 'palm' ? 0.08 + rnd() * 0.14 : 0.24 + rnd() * 0.38);
    const x = o.x + v.x + Math.cos(a) * d;
    const y = o.y + v.y - r * CROWN_RISE + Math.sin(a) * d;

    const t = i === which ? ready : 0.15 + rnd() * 0.1;
    const rad = spec.radius * (0.35 + t * 0.85) * (1 - dry * 0.5);
    if (rad < 0.8) continue;

    // Little stalk: it is what holds it, and what breaks when it falls.
    ctx.strokeStyle = 'rgba(58,40,24,0.7)';
    ctx.lineWidth = Math.max(1, rad * 0.25);
    ctx.beginPath();
    ctx.moveTo(x, y - rad * 1.7);
    ctx.lineTo(x, y - rad * 0.7);
    ctx.stroke();
    ctx.lineWidth = 1;

    const color = mix(green, spec.color, t);
    const g = ctx.createRadialGradient(x + LX * rad * 0.4, y + LY * rad * 0.4, 0, x, y, rad * 1.2);
    g.addColorStop(0, mix(color, '#ffffff', 0.35));
    g.addColorStop(0.55, color);
    g.addColorStop(1, mix(color, '#101a12', 0.55));
    ctx.fillStyle = g;
    outline(ctx, spec.painter, x, y, rad);
    ctx.fill();
    // The eye-like orb keeps its dark heart.
    if (spec.painter === 'eye' && rad > 2) {
      ctx.fillStyle = mix(color, '#101a12', 0.7);
      ctx.beginPath();
      ctx.arc(x - LX * rad * 0.15, y - LY * rad * 0.15, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // The one that is nearly ready lights up a bit: the warning that it will fall.
    if (i === which && t > 0.82) {
      const halo = ctx.createRadialGradient(x, y, rad, x, y, rad * 2.4);
      halo.addColorStop(0, `rgba(255,246,214,${(t - 0.82) * 0.9})`);
      halo.addColorStop(1, 'rgba(255,246,214,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, rad * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
