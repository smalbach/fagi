// The organism, piece by piece (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §5.2).
//
// Local frame: +x is forward, the body is centred on 0 and is about as long as
// FAGI.radius × 2. Everything reads from the state she is in, never from
// decisions: how warm she is opens or folds the membranes, how she is doing
// lights the core, walking moves the filaments.

import { mix } from '../sprite-kit.js';
import { MANTLE, DEAD, CORE, FILAMENT } from './palette.js';
import { ellipse, point } from './stroke.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// The shape of her body: a bit broader and rounder for a female, a bit longer
// and slimmer for a male. Subtle on purpose.
export function bodyShape(fagi) {
  if (fagi.sex === 'female') return { rx: 8.6, ry: 6.3, rear: 1.06 };
  if (fagi.sex === 'male') return { rx: 9.1, ry: 5.6, rear: 0.96 };
  return { rx: 8.8, ry: 6, rear: 1 };
}

// How open the membranes are, 0 (folded tight: cold) to 1 (spread: hot). From
// her own temperature; halfway without the organism.
export function openness(fagi) {
  if (fagi.temperature == null) return 0.45;
  return clamp01((fagi.temperature - 14) / 20);
}

// How well she is, 0-1: the worst of hunger, thirst, energy and thermal stress.
export function vitality(fagi) {
  const need = Math.max(fagi.hunger ?? 0, fagi.thirst ?? 0) / 100;
  const tired = 1 - clamp01((fagi.energy ?? 100) / 100);
  const stress = (fagi.thermalStress ?? 0) / 100;
  return clamp01(1 - Math.max(need, tired * 0.6, stress));
}

export function coreColor(v) {
  return v > 0.5 ? mix(CORE.strained, CORE.well, (v - 0.5) * 2) : mix(CORE.failing, CORE.strained, v * 2);
}

// Is she asleep out in the open? (In the nest she is not drawn at all.)
export const asleep = (fagi) => fagi.alive && fagi.thought?.action === 'rest';

// Four filaments, two a side, walking in diagonal pairs: soft and sinuous,
// not jointed legs. Asleep they tuck in under the mantle; dead they curl up.
export function drawFilaments(ctx, fagi, shape, step, colors) {
  const dead = !fagi.alive;
  const tucked = asleep(fagi);
  const color = dead ? FILAMENT.dead : mix(FILAMENT.alive, colors.membrane, 0.35);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const roots = [[3, 1], [-3.4, 1], [3, -1], [-3.4, -1]];
  roots.forEach(([x, side], i) => {
    const phase = (i === 0 || i === 3 ? 0 : Math.PI) + step;
    const swing = dead || tucked ? 0 : Math.sin(phase) * 0.45;
    const reach = dead ? 3.6 : tucked ? 3.2 : 7.8;
    const y0 = side * shape.ry * 0.72;
    const angle = side * (x > 0 ? 1.0 : 2.0) + swing * side;
    const x2 = x + Math.cos(angle) * reach;
    const y2 = y0 + Math.sin(angle) * reach;
    // An S: out, then bending back, like something soft pushing on the ground.
    const bend = dead ? 2.2 : 1.4 + Math.cos(phase) * 0.6;
    const nx = -Math.sin(angle) * side;
    const ny = Math.cos(angle) * side;
    const c1x = x + (x2 - x) * 0.33 + nx * bend;
    const c1y = y0 + (y2 - y0) * 0.33 + ny * bend;
    const c2x = x + (x2 - x) * 0.66 - nx * bend * (dead ? -1 : 1);
    const c2y = y0 + (y2 - y0) * 0.66 - ny * bend * (dead ? -1 : 1);
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = mix(color, '#ffffff', 0.25);
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
  });
  ctx.lineWidth = 1;
}

// The side membranes: see-through fins along both flanks. They spread and
// thin out with heat (to shed it), fold into a narrow dark hem with cold.
export function drawMembranes(ctx, fagi, shape, colors) {
  const open = fagi.alive ? openness(fagi) : 0.1;
  const width = 1.4 + open * 3.8;
  const tint = mix(colors.membrane, colors.dark, fagi.alive ? (1 - open) * 0.45 : 0.4);
  for (const side of [1, -1]) {
    // Soft scallops: each lobe a curve bulging out, the widest in the middle.
    const x0 = -shape.rx * 0.8;
    const span = shape.rx * 1.4;
    const lobes = 4;
    const base = shape.ry * 0.6;
    const route = () => {
      ctx.beginPath();
      ctx.moveTo(x0, side * base);
      for (let k = 0; k < lobes; k++) {
        const a = x0 + (k / lobes) * span;
        const b = x0 + ((k + 1) / lobes) * span;
        const peak = shape.ry * 0.8 + Math.sin(((k + 0.5) / lobes) * Math.PI) * width;
        ctx.quadraticCurveTo((a + b) / 2, side * (peak + width * 0.35), b, side * (shape.ry * 0.78 + Math.sin(((k + 1) / lobes) * Math.PI) * width * 0.35));
      }
      ctx.lineTo(x0 + span, side * base);
      ctx.closePath();
    };
    route();
    ctx.globalAlpha = fagi.alive ? 0.5 + open * 0.2 : 0.45;
    ctx.fillStyle = tint;
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = mix(tint, colors.rim, 0.5);
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // The veins that carry the warmth out.
    ctx.globalAlpha = 0.35;
    for (let k = 0; k < lobes; k++) {
      const x = x0 + ((k + 0.5) / lobes) * span;
      ctx.beginPath();
      ctx.moveTo(x, side * base);
      ctx.lineTo(x, side * (shape.ry * 0.8 + Math.sin(((k + 0.5) / lobes) * Math.PI) * width));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// The mantle: an oval with its volume, the lit rim toward the light and a
// fine dark edge. Dead, it is flat and its edge crumples.
export function drawMantle(ctx, fagi, shape, colors, L) {
  const { rx, ry } = shape;
  const route = (c) => {
    c.beginPath();
    if (fagi.alive) {
      c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    } else {
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const crumple = 1 - 0.06 * Math.abs(Math.sin(k * 2.3));
        const x = Math.cos(a) * rx * crumple;
        const y = Math.sin(a) * ry * 0.8 * crumple;
        if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    }
  };
  const g = ctx.createRadialGradient(L.x * rx * 0.4, L.y * ry * 0.4, 0.5, 0, 0, rx * 1.1);
  g.addColorStop(0, mix(colors.base, colors.rim, fagi.alive ? 0.45 : 0.2));
  g.addColorStop(0.55, colors.base);
  g.addColorStop(1, colors.dark);
  route(ctx);
  ctx.fillStyle = g;
  ctx.fill();
  // The rear swells a touch more on a female: where the reserves are.
  if (fagi.alive && shape.rear !== 1) {
    ellipse(ctx, -rx * 0.35, 0, rx * 0.45 * shape.rear, ry * 0.7 * shape.rear, mix(colors.base, colors.dark, 0.18));
  }
  // A faint ridge down the middle, and the lit rim.
  ctx.strokeStyle = mix(colors.base, colors.rim, 0.3);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, 0);
  ctx.quadraticCurveTo(0, -0.4, rx * 0.8, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  route(ctx);
  ctx.strokeStyle = 'rgba(8,20,22,0.6)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// The two sensory organs at the front: stalks with a bulb, like feelers but
// soft. Tracking a smell they sweep toward the side she is casting; asleep they
// fold back; dead they droop.
export function drawSenses(ctx, fagi, shape, colors, step) {
  const dead = !fagi.alive;
  const tucked = asleep(fagi);
  const tracking = fagi.targetKind === 'scent';
  const long = fagi.sex === 'male' ? 1.08 : 1;
  for (const side of [1, -1]) {
    const x0 = shape.rx * 0.78;
    const y0 = side * 1.6;
    let angle = side * 0.45;
    if (tracking) angle += side * (fagi.castSide === side ? 0.35 : -0.15) + Math.sin(step * 0.5) * 0.1;
    const len = (dead ? 3 : tucked ? 2.6 : 5.2) * long;
    const x1 = x0 + Math.cos(angle) * len;
    const y1 = y0 + Math.sin(angle) * len + (dead ? side * 1.5 : 0);
    ctx.strokeStyle = dead ? DEAD.rim : mix(colors.base, colors.rim, 0.45);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.6, y0 + side * 0.3, x1, y1);
    ctx.stroke();
    ctx.lineWidth = 1;
    point(ctx, x1, y1, dead ? 0.8 : 1.25, dead ? DEAD.rim : mix(colors.rim, '#ffffff', 0.3));
  }
}

// The core, under the skin of the back. Its color says how she is; it breathes
// slowly, slower asleep. Dead, it is a dark hollow.
export function drawCore(ctx, fagi) {
  if (!fagi.alive) {
    ellipse(ctx, 0.6, 0, 2.4, 1.9, 'rgba(10,11,14,0.55)');
    ctx.strokeStyle = 'rgba(160,165,175,0.35)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(0.6, 0, 2.4, 1.9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    return;
  }
  const color = coreColor(vitality(fagi));
  const rate = asleep(fagi) ? 0.9 : 2.2;
  const breath = 0.8 + 0.2 * Math.sin((fagi.age ?? 0) * rate);
  const g = ctx.createRadialGradient(0.6, 0, 0.2, 0.6, 0, 3.6);
  g.addColorStop(0, mix(color, '#ffffff', 0.5));
  g.addColorStop(0.4, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = breath;
  point(ctx, 0.6, 0, 3.6, g);
  ctx.globalAlpha = 1;
}

// What she carries rides on her back, behind the core.
export function drawCargo(ctx, spec, L) {
  const r = Math.max(2.4, spec.radius * 0.5);
  const x = -4.6;
  ellipse(ctx, x - L.x * 1.2, -L.y * 1.2, r, r * 0.85, 'rgba(6,14,16,0.45)');
  const g = ctx.createRadialGradient(x + L.x * r * 0.45, L.y * r * 0.45, r * 0.1, x, 0, r * 1.2);
  g.addColorStop(0, mix(spec.color, '#ffffff', 0.45));
  g.addColorStop(0.5, spec.color);
  g.addColorStop(1, mix(spec.color, '#100a06', 0.55));
  point(ctx, x, 0, r, g);
}

export function colorsOf(fagi) {
  return fagi.alive ? MANTLE[fagi.sex] ?? MANTLE.none : DEAD;
}
