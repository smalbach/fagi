// Things (things.js): drawn from their look alone, so what you see is exactly
// what Fagi sees. The shape gives the silhouette, the texture the surface and
// the color the fill; a drained sap thing looks withered until it recovers.
// Nothing on screen tells what a thing affords.

import { canvasOf, cacheSprite, detail, stamp, mix } from './sprite-kit.js';
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
    for (let i = 0; i < 15; i++) {
      const a = -Math.PI / 2 + (i - 7) * 0.15;
      const height = r * (0.65 + jitter(o, i + 40) * 0.42);
      const tipX = Math.cos(a) * height, tipY = Math.sin(a) * height;
      const width = r * (0.025 + jitter(o, i + 70) * 0.035);
      ctx.moveTo(-width, r * 0.55);
      ctx.quadraticCurveTo(tipX * 0.6 - width, tipY * 0.5, tipX, tipY);
      ctx.quadraticCurveTo(tipX * 0.35 + width, tipY * 0.1, width, r * 0.55);
      ctx.closePath();
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
    const gloss = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, -r * 0.3, -r * 0.3, r * 0.35);
    gloss.addColorStop(0, 'rgba(255,249,225,0.3)'); gloss.addColorStop(1, 'rgba(255,249,225,0)');
    ctx.fillStyle = gloss;
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
    // Short fibers instead of a circular outline around the object.
    ctx.strokeStyle = rgba(color, 0.28, 1.1);
    ctx.lineWidth = Math.max(0.4, r * 0.006);
    for (let i = 0; i < 45; i++) {
      const x = (jitter(o, i + 31) - 0.5) * r * 1.3;
      const y = (jitter(o, i + 121) - 0.5) * r * 1.3;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + r * 0.04, y - r * (0.06 + jitter(o, i + 98) * 0.06)); ctx.stroke();
    }
  }
}

const sprites = new Map();
export function drawThing(ctx, o, r, time = 0) {
  if (!o.look) return;
  const z = detail();
  const R = Math.max(2, Math.round(r * z));
  const dry = (o.dryUntil ?? 0) > time;
  const key = `${o.id}|${o.look.color}|${o.look.shape}|${o.look.texture}|${R}|${dry}`;
  const img = cacheSprite(sprites, key, () => paintThing(o, R, dry), 240);
  stamp(ctx, img, o.x, o.y, z);
}

function paintThing(o, r, dry) {
  const c = canvasOf(Math.ceil(r * 3.4 + 8), Math.ceil(r * 3.4 + 8));
  const ctx = c.getContext('2d');
  const base = mix(COLOR_HEX[o.look.color] ?? '#9aa0a8', '#706f53', 0.22);
  const color = dry ? mix(base, '#665b3b', 0.5) : base;
  ctx.translate(c.width / 2, c.height / 2);
  // Soft cast shadow and close contact with the soil.
  const shadow = ctx.createRadialGradient(r * 0.15, r * 0.35, r * 0.1, r * 0.15, r * 0.35, r * 1.2);
  shadow.addColorStop(0, '#07100c99'); shadow.addColorStop(1, '#07100c00');
  ctx.fillStyle = shadow; ctx.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
  ctx.save();
  silhouette(ctx, o.look.shape, r, o); ctx.clip();
  const light = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, 0, 0, r * 1.15);
  light.addColorStop(0, mix(color, '#fff1cf', 0.35));
  light.addColorStop(0.45, color); light.addColorStop(1, mix(color, '#141b13', 0.68));
  ctx.fillStyle = light; ctx.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
  // Mineral pores and plant fibers are clipped to their actual silhouette.
  const count = o.look.texture === 'rough' ? 150 : 65;
  for (let i = 0; i < count; i++) {
    const x = (jitter(o, i + 20) - 0.5) * r * 2;
    const y = (jitter(o, i + 300) - 0.5) * r * 2;
    ctx.fillStyle = i % 3 ? '#16211433' : '#f5e9bf45';
    const size = r * (0.008 + jitter(o, i + 600) * 0.024);
    ctx.fillRect(x, y, Math.max(0.3, size), Math.max(0.3, size));
  }
  if (o.look.shape === 'shell') {
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (1.12 + i / 12 * 0.76);
      ctx.strokeStyle = i % 2 ? '#f7ecd259' : '#20281b66';
      ctx.lineWidth = Math.max(0.5, r * 0.018);
      ctx.beginPath(); ctx.moveTo(0, r * 0.68);
      ctx.quadraticCurveTo(Math.cos(a) * r * 0.55, -r * 0.1, Math.cos(a) * r, Math.sin(a) * r + r * 0.2); ctx.stroke();
    }
  } else if (o.look.shape === 'pod') {
    ctx.strokeStyle = '#28241466'; ctx.lineWidth = Math.max(0.5, r * 0.025);
    ctx.beginPath(); ctx.moveTo(-r, -r * 0.4); ctx.quadraticCurveTo(0, r * 0.2, r, r * 0.4); ctx.stroke();
  }
  ctx.restore();
  surface(ctx, o.look.texture, r, color, o);
  return c;
}
