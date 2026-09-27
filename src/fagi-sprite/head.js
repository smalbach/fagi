// Fagi's head: armor, compound eyes, frons and mandibles.

import { mix } from '../sprite-kit.js';
import { shell, edgeLine, outline } from './light.js';
import { headPath } from './silhouettes.js';
import { ellipse, point, line } from './stroke.js';

export function head(ctx, c, L, alive, rnd) {
  ctx.save();
  headPath(ctx);
  ctx.clip();

  ctx.fillStyle = shell(ctx, 8.4, 0, 4.7, c.head, L, 0.4, 0.62);
  ctx.fillRect(4, -6, 10, 12);

  // The three ocelli and the frontal groove: an ant's frons is not smooth.
  ctx.strokeStyle = 'rgba(52,26,10,0.34)';
  ctx.lineWidth = 0.7;
  line(ctx, 6.6, 0, 10.6, 0);

  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 4.0;
    const color = `rgba(60,30,12,${0.05 + rnd() * 0.1})`;
    point(ctx, 8.4 + Math.cos(a) * d, Math.sin(a) * d * 0.9, 0.3 + rnd() * 0.3, color);
  }
  ctx.restore();

  outline(ctx, headPath, 0.6);
  edgeLine(ctx, headPath, 8.4, 0, 4.7, mix(c.head, '#ffeccb', 0.7), 0.45, 1, L);

  // The clypeus: the mouth plate, a little lighter and set into the front.
  ctx.fillStyle = mix(c.head, '#ffdca8', 0.24);
  ctx.beginPath();
  ctx.moveTo(10.2, -1.9);
  ctx.quadraticCurveTo(11.9, -1.2, 11.9, 0);
  ctx.quadraticCurveTo(11.9, 1.2, 10.2, 1.9);
  ctx.quadraticCurveTo(10.9, 0, 10.2, -1.9);
  ctx.fill();

  eyes(ctx, L, alive);
  mandibles(ctx, c);
}

// Compound eyes: small, matte and on the sides of the head, not the front.
// A worker's eye is a tiny pill; a shiny black marble turns the critter
// into a doll.
function eyes(ctx, L, alive) {
  for (const sideOf of [-1, 1]) {
    const x = 7.9;
    const y = 3.5 * sideOf;
    const giro = 0.4 * sideOf;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);

    // The rim: the eye is set into the head, not stuck on top.
    ellipse(ctx, 0, 0, 1.55, 1.2, 'rgba(46,24,10,0.5)');

    // Matte and brown, not patent black: a compound eye does not reflect like glass.
    const g = ctx.createRadialGradient(L.x * 0.5, L.y * 0.4, 0.1, 0, 0, 1.3);
    g.addColorStop(0, alive ? '#4f4234' : '#565b66');
    g.addColorStop(0.6, alive ? '#2e241a' : '#43474f');
    g.addColorStop(1, alive ? '#17100a' : '#2f323a');
    ellipse(ctx, 0, 0, 1.25, 0.95, g);

    // Facets: two crossed little lines, just enough so it is not a smooth drop.
    ctx.strokeStyle = 'rgba(255,240,214,0.1)';
    ctx.lineWidth = 0.25;
    for (const i of [-0.45, 0.45]) {
      line(ctx, -1.05, i, 1.05, i);
      line(ctx, i * 1.3, -0.8, i * 1.3, 0.8);
    }

    // A small speck of sky: it shines, but not like a doll's eye.
    if (alive) ellipse(ctx, L.x * 0.55, L.y * 0.45, 0.3, 0.24, 'rgba(224,232,242,0.42)');
    ctx.restore();
  }
}

// Mandibles: two toothed sickles crossing in front of the mouth. They are the
// tool Fagi carries with, so they are drawn as such.
function mandibles(ctx, c) {
  for (const sideOf of [-1, 1]) {
    ctx.save();
    ctx.scale(1, sideOf);

    // The sickle: it leaves the head wide, curves outward and closes to a point
    // crossing in front of the mouth. The inner edge is toothed.
    ctx.fillStyle = mix(c.legs, '#3b2009', 0.25);
    ctx.beginPath();
    ctx.moveTo(10.6, 0.9);
    ctx.quadraticCurveTo(13.4, 3.1, 15.8, 0.9);   // outer edge
    ctx.quadraticCurveTo(15.2, 0.2, 14.4, -0.1);  // the tip, crossed
    ctx.quadraticCurveTo(13.6, 1.1, 12.5, 0.8);   // inner teeth
    ctx.quadraticCurveTo(11.8, 0.6, 11.0, 0.0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(22,12,4,0.55)';
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // The back of the mandible, where the light hits it.
    ctx.strokeStyle = mix(c.legs, '#ffe2b4', 0.5);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(11.2, 1.05);
    ctx.quadraticCurveTo(13.4, 2.6, 15.3, 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.lineWidth = 1;
}
