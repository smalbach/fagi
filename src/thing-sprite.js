// Things (things.js): drawn from their look alone, so what you see is exactly
// what Fagi sees. The shape gives the silhouette, the texture the surface and
// the color the fill; a drained sap thing looks withered until it recovers.
// Nothing on screen tells what a thing affords.

import { COLOR_HEX } from './chemistry.js';
import { toRGB } from './colors.js';

const rgba = (hex, a, k = 1) => {
  const [r, g, b] = toRGB(hex);
  return `rgba(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)},${a})`;
};

// A small deterministic jitter per thing, so two alike are not identical.
const jitter = (o, i) => {
  const x = Math.sin((o.id ?? 1) * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function silhouette(ctx, shape, r, o) {
  ctx.beginPath();
  if (shape === 'stone') {
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.82 + 0.18 * jitter(o, i % n));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.82;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  } else if (shape === 'pod') {
    ctx.ellipse(0, 0, r * 1.05, r * 0.6, 0.5, 0, Math.PI * 2);
  } else if (shape === 'tuft') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.42;
      ctx.moveTo(0, r * 0.55);
      ctx.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.2, Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
      ctx.quadraticCurveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.1, 0, r * 0.55);
    }
  } else {
    // shell: a fan
    ctx.moveTo(0, r * 0.7);
    ctx.arc(0, r * 0.2, r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
  }
}

function surface(ctx, texture, r, color, o) {
  if (texture === 'smooth') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (texture === 'rough') {
    ctx.fillStyle = rgba(color, 0.9, 0.55);
    for (let i = 0; i < 7; i++) {
      const a = jitter(o, i) * Math.PI * 2;
      const d = jitter(o, i + 9) * r * 0.6;
      ctx.fillRect(Math.cos(a) * d - 0.8, Math.sin(a) * d - 0.8, 1.6, 1.6);
    }
  } else if (texture === 'spiny') {
    ctx.strokeStyle = rgba(color, 0.95, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
    }
    ctx.stroke();
  } else {
    // soft: a fuzzy halo
    ctx.strokeStyle = rgba(color, 0.35, 1.15);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawThing(ctx, o, r, time = 0) {
  if (!o.look) return;
  const color = COLOR_HEX[o.look.color] ?? '#9aa0a8';
  const dry = (o.dryUntil ?? 0) > time;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.globalAlpha = dry ? 0.45 : 1;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(1.5, r * 0.7, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  silhouette(ctx, o.look.shape, r, o);
  ctx.fillStyle = rgba(color, 1, dry ? 0.55 : 1);
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.9, 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
  surface(ctx, o.look.texture, r, color, o);
  ctx.restore();
}
