// The leaf Fagi carries on her back: her character and her logo.

import { mix } from '../sprite-kit.js';
import { ellipse } from './stroke.js';

// A two-curve leaf: with a tip and a stalk, not an oval.
function shape(ctx) {
  ctx.beginPath();
  ctx.moveTo(-4.9, 0);
  ctx.bezierCurveTo(-2.9, -2.7, 2.1, -2.6, 5.0, 0);
  ctx.bezierCurveTo(2.1, 2.6, -2.9, 2.7, -4.9, 0);
  ctx.closePath();
}

// The leaf she carries on her back. It rests on the gaster, so it casts its
// own shadow on it: without it the leaf would look painted on the shell.
export function drawLeaf(ctx, leaf, L) {
  ctx.save();
  ctx.translate(-10.6, 0.3);
  ctx.rotate(0.55);
  ctx.scale(0.84, 0.84);

  ellipse(ctx, -L.x * 0.7, -L.y * 0.7, 5.3, 2.8, 'rgba(20,12,6,0.26)');

  shape(ctx);
  const g = ctx.createLinearGradient(L.x * -5, L.y * -3, L.x * 5, L.y * 3);
  g.addColorStop(0, mix(leaf.fill, '#0e2414', 0.45));
  g.addColorStop(0.55, leaf.fill);
  g.addColorStop(1, leaf.light);
  ctx.fillStyle = g;
  ctx.fill();

  // Midrib and secondary veins: they make it a leaf and not a sticker.
  // Folded along the midrib: half the leaf faces the light and the other half
  // stays in shade. That is what separates it from the shell it rests on.
  halfInShade(ctx);

  ctx.strokeStyle = leaf.vein;
  ctx.lineWidth = 0.32;
  ctx.beginPath();
  ctx.moveTo(-4.7, 0);
  ctx.quadraticCurveTo(0, -0.4, 4.9, 0);
  ctx.stroke();

  // And its edge, so it does not melt into the ant.
  shape(ctx);
  ctx.strokeStyle = 'rgba(18,34,22,0.3)';
  ctx.lineWidth = 0.22;
  ctx.stroke();

  ctx.save();
  shape(ctx);
  ctx.clip();
  ctx.strokeStyle = leaf.vein;
  secondaryVeins(ctx);
  // A leaf is waxy: one soft gleam where the light falls on it.
  const gl = ctx.createRadialGradient(L.x * 2, L.y * 0.8 - 0.8, 0, L.x * 2, L.y * 0.8 - 0.8, 2.6);
  gl.addColorStop(0, 'rgba(236,255,230,0.3)');
  gl.addColorStop(1, 'rgba(236,255,230,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(-6, -4, 12, 8);
  ctx.restore();
  ctx.lineWidth = 1;
  ctx.restore();
}

function halfInShade(ctx) {
  ctx.save();
  shape(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(12,26,16,0.34)';
  ctx.beginPath();
  ctx.moveTo(-5.2, 0);
  ctx.quadraticCurveTo(0, -0.4, 5.2, 0);
  ctx.lineTo(5.2, 3.2);
  ctx.lineTo(-5.2, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// With the vein color already set: they run from the midrib toward the edges.
function secondaryVeins(ctx) {
  ctx.lineWidth = 0.2;
  ctx.globalAlpha = 0.45;
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.5;
    for (const sideOf of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, -0.1 * i);
      ctx.quadraticCurveTo(x + 1.0, sideOf * 1.2, x + 1.5, sideOf * 2.2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
