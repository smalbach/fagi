// Fagi's head: armor, compound eyes, frons and mandibles.

import { mix } from '../sprite-kit.js';
import { shade, setae } from './light.js';
import { headPath, HEAD } from './silhouettes.js';
import { ellipse, point, line } from './stroke.js';

export function head(ctx, c, L, alive, rnd, eyeScale = 1) {
  // Mandibles first: they come out from under the clypeus.
  mandibles(ctx, c, L, alive);

  const { x, rx, ry } = HEAD;
  shade(ctx, headPath, x, 0, rx, ry, c.head, L, { alive, gloss: 0.8, glow: 0.22 });

  ctx.save();
  headPath(ctx);
  ctx.clip();

  // The frons is not smooth: a fine groove down the middle and the two frontal
  // carinae, the ridges that guard the antennal sockets.
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(40,16,4,0.18)';
  ctx.lineWidth = 0.18;
  line(ctx, 6.8, 0, 9.6, 0);
  for (const sideOf of [-1, 1]) {
    ctx.strokeStyle = 'rgba(40,16,4,0.2)';
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ctx.moveTo(10.6, 0.8 * sideOf);
    ctx.quadraticCurveTo(9.6, 1.05 * sideOf, 8.6, 0.8 * sideOf);
    ctx.stroke();
  }

  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    point(ctx, x + Math.cos(a) * d * rx, Math.sin(a) * d * ry, 0.12 + rnd() * 0.14,
      `rgba(48,20,6,${0.04 + rnd() * 0.08})`);
  }

  // The clypeus: the mouth plate, set into the front edge, a touch lighter
  // and translucent at its rim.
  ctx.fillStyle = mix(c.head, '#ffd49a', alive ? 0.14 : 0.05);
  ctx.beginPath();
  ctx.moveTo(10.6, -1.9);
  ctx.quadraticCurveTo(12.0, -1.3, 12.0, 0);
  ctx.quadraticCurveTo(12.0, 1.3, 10.6, 1.9);
  ctx.quadraticCurveTo(11.2, 0, 10.6, -1.9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,16,4,0.3)';
  ctx.lineWidth = 0.25;
  ctx.stroke();
  ctx.restore();

  // The antennal sockets: small dark pits the scapes plug into.
  for (const sideOf of [-1, 1]) {
    ellipse(ctx, 10.0, 1.6 * sideOf, 0.55, 0.45, 'rgba(26,10,3,0.55)');
  }

  eyes(ctx, L, alive, eyeScale);
  if (alive) setae(ctx, rnd, 6, 9.0, 0, 2.2, 2.6, 0.5, 0.14);
}

// Compound eyes: small, set on the sides of the head and bulging a little.
// A worker's eye is an oval of dark facets with one wet glint; a big black
// marble turns the critter into a doll.
function eyes(ctx, L, alive, k = 1) {
  for (const sideOf of [-1, 1]) {
    ctx.save();
    ctx.translate(9.5, 3.15 * sideOf);
    ctx.rotate(0.35 * sideOf);
    if (k !== 1) ctx.scale(k, k);

    // The socket: the eye sits in the head, not on it.
    ellipse(ctx, 0, 0, 1.15, 0.85, 'rgba(30,12,3,0.45)');

    const g = ctx.createRadialGradient(L.x * 0.35, L.y * 0.3, 0.05, 0, 0, 1.0);
    g.addColorStop(0, alive ? '#5a4a3a' : '#5b606a');
    g.addColorStop(0.55, alive ? '#2a1f16' : '#41454d');
    g.addColorStop(1, alive ? '#0e0905' : '#2a2d33');
    ellipse(ctx, 0, 0, 0.98, 0.7, g);

    // Facets: a fine honeycomb, just enough that it is not a smooth drop.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.98, 0.7, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let row = -3; row <= 3; row++) {
      for (let col = -4; col <= 4; col++) {
        point(ctx, col * 0.24 + (row % 2 ? 0.12 : 0), row * 0.21, 0.06, 'rgba(255,240,214,0.09)');
      }
    }
    ctx.restore();

    if (alive) {
      ellipse(ctx, L.x * 0.42, L.y * 0.3, 0.26, 0.15, 'rgba(240,246,255,0.75)', Math.atan2(L.y, L.x));
    }
    ctx.restore();
  }
}

// Mandibles: two toothed triangular blades closing in front of the mouth,
// darker and redder than the head, and black at the tips where they are
// hardest. They are the tool Fagi carries with, so they are drawn as such.
function mandibles(ctx, c, L, alive) {
  const base = mix(c.legs, '#3a1206', 0.32);
  for (const sideOf of [-1, 1]) {
    ctx.save();
    ctx.scale(1, sideOf);

    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(10.9, 2.2);
      ctx.quadraticCurveTo(13.0, 1.9, 14.1, 0.35);  // outer edge
      ctx.lineTo(14.15, -0.15);                     // the tip, at the midline
      // The masticatory margin: a row of small teeth, not a smooth blade.
      ctx.lineTo(13.75, 0.08);
      ctx.lineTo(13.55, -0.05);
      ctx.lineTo(13.2, 0.22);
      ctx.lineTo(12.95, 0.1);
      ctx.lineTo(12.6, 0.38);
      ctx.lineTo(12.3, 0.3);
      ctx.quadraticCurveTo(11.6, 0.55, 11.0, 0.6);
      ctx.closePath();
    };

    const ly = L.y * sideOf;
    const g = ctx.createLinearGradient(12.5 + L.x * 1.2, 1.2 + ly * 1.2, 12.5 - L.x * 1.2, 1.2 - ly * 1.2);
    g.addColorStop(0, mix(base, '#ffd6a0', alive ? 0.32 : 0.1));
    g.addColorStop(0.5, base);
    g.addColorStop(1, mix(base, '#100602', 0.55));
    blade();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,6,2,0.4)';
    ctx.lineWidth = 0.2;
    ctx.stroke();

    // The tips and teeth: hardened, almost black.
    ctx.save();
    blade();
    ctx.clip();
    const tip = ctx.createLinearGradient(12.4, 0, 15.0, 0);
    tip.addColorStop(0, 'rgba(14,5,1,0)');
    tip.addColorStop(1, 'rgba(14,5,1,0.75)');
    ctx.fillStyle = tip;
    ctx.fillRect(12, -1, 4, 4);
    ctx.restore();

    ctx.restore();
  }
  ctx.lineWidth = 1;
}
