// Lo vivo del agua: se dibuja cada fotograma encima del lienzo quieto.

import { LAKE } from '../config.js';
import { seededRng } from '../sprite-kit.js';
import { LX, LY, profile, shoreProfile, outline } from './shape.js';

// Reflejos y ondas. Todo recortado al agua, para que nada se salga a la tierra.
export function surface(ctx, o, r, seedOf, wind, now) {
  const t = now / 1000;
  const shore = shoreProfile(seedOf);
  const va = wind?.angle ?? 0;

  ctx.save();
  outline(ctx, o.x, o.y, r, shore);
  ctx.clip();

  skyLight(ctx, o, r, t);
  skyBands(ctx, o, r, t);
  ripplets(ctx, o, r, seedOf, va, t);

  // Destellos, ondas y motas tiran del mismo azar, uno detrás de otro.
  const rnd = seededRng((seedOf ^ 0x7c3af219) >>> 0);
  sparkles(ctx, o, r, rnd, t);
  ripples(ctx, o, r, seedOf, rnd, t);
  specks(ctx, o, r, rnd, va, t);

  ctx.lineWidth = 1;
  ctx.restore();
}

// La sábana de luz del cielo: entra por donde entra la luz y respira.
function skyLight(ctx, o, r, t) {
  const breathes = 0.8 + Math.sin(t * 0.35) * 0.2;
  const light = ctx.createRadialGradient(
    o.x + LX * r * 0.45, o.y + LY * r * 0.45, 0,
    o.x + LX * r * 0.3, o.y + LY * r * 0.3, r * 1.1
  );
  light.addColorStop(0, `rgba(226,240,246,${0.16 * breathes})`);
  light.addColorStop(0.5, `rgba(160,200,214,${0.07 * breathes})`);
  light.addColorStop(1, 'rgba(160,200,214,0)');
  ctx.fillStyle = light;
  ctx.fillRect(o.x - r * 1.2, o.y - r * 1.2, r * 2.4, r * 2.4);
}

// Bandas de cielo: franjas anchas y tenues que cruzan el agua y se arrastran
// despacio. Es el reflejo, y es lo que separa una superficie de un disco.
function skyBands(ctx, o, r, t) {
  for (let i = 0; i < 2; i++) {
    const phase = i * 2.1;
    const y = o.y + (i - 0.5) * r * 0.5 + Math.sin(t * 0.18 + phase) * r * 0.05;
    const band = ctx.createLinearGradient(0, y - r * 0.14, 0, y + r * 0.14);
    band.addColorStop(0, 'rgba(214,236,244,0)');
    band.addColorStop(0.5, `rgba(214,236,244,${0.028 + 0.018 * Math.sin(t * 0.3 + phase)})`);
    band.addColorStop(1, 'rgba(214,236,244,0)');
    ctx.fillStyle = band;
    ctx.fillRect(o.x - r * 1.2, y - r * 0.14, r * 2.4, r * 0.28);
  }
}

// Rizo del viento: la superficie de una charca no tiembla al azar, se riza en
// crestas cortas perpendiculares al viento que corren en su dirección. Es lo
// que ata el agua al MISMO viento que dobla los juncos y arrastra los olores.
//
// Las crestas van repartidas al azar, no en rejilla: alineadas se leen como
// rayones, y una charca rayada no parece agua.
function ripplets(ctx, o, r, seedOf, va, t) {
  const ripple = seededRng((seedOf ^ 0x1f83d9ab) >>> 0);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(va);
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.ripplets; i++) {
    const y = (ripple() - 0.5) * r * 1.9;
    // Cada cresta corre a lo suyo y vuelve a entrar por el otro lado.
    const x = ((ripple() + t * (0.02 + ripple() * 0.03)) % 1 - 0.5) * r * 2;
    if (Math.hypot(x, y) > r * 0.95) continue;
    const length = r * (0.05 + ripple() * 0.08);
    const alpha = 0.04 + 0.05 * Math.max(0, Math.sin(t * 1.1 + y * 0.25));
    ctx.strokeStyle = `rgba(214,238,244,${alpha})`;
    ctx.lineWidth = Math.max(0.5, r * 0.007);
    ctx.beginPath();
    ctx.moveTo(x, y - length / 2);
    ctx.quadraticCurveTo(x + r * 0.022, y, x, y + length / 2);
    ctx.stroke();
    // Y su sombra justo detrás: una cresta sin valle no levanta.
    ctx.strokeStyle = `rgba(8,26,34,${alpha * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.012, y - length / 2);
    ctx.quadraticCurveTo(x + r * 0.01, y, x - r * 0.012, y + length / 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Destellos: rayitas tumbadas que se encienden y se apagan cada una a su aire.
// Es lo que hace que el agua parezca moverse aunque no se mueva nada.
function sparkles(ctx, o, r, rnd, t) {
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.sparkles; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const phase = rnd() * Math.PI * 2;
    const length = r * (0.1 + rnd() * 0.16);
    const alpha = Math.max(0, Math.sin(t * (0.5 + rnd() * 0.5) + phase)) ** 3;
    if (alpha < 0.02) continue;
    const x = o.x + Math.cos(a) * d + Math.sin(t * 0.6 + phase) * r * 0.02;
    const y = o.y + Math.sin(a) * d * 0.9;
    ctx.strokeStyle = `rgba(232,246,250,${alpha * 0.2})`;
    ctx.lineWidth = Math.max(0.7, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(x - length / 2, y);
    ctx.quadraticCurveTo(x, y - r * 0.02, x + length / 2, y);
    ctx.stroke();
  }
}

// Ondas: círculos que nacen en un punto y se abren hasta apagarse. Van
// serpenteados con el mismo truco que la orilla y muy tenues: una
// circunferencia limpia sobre el agua se lee como un dibujo, no como una onda.
function ripples(ctx, o, r, seedOf, rnd, t) {
  for (let i = 0; i < LAKE.ripples; i++) {
    const cxo = o.x + (rnd() - 0.5) * r * 0.9;
    const cyo = o.y + (rnd() - 0.5) * r * 0.8;
    const shape = profile(seedOf ^ (i * 0x45d9f3b), 0x119de1f3, 0.025);
    const period = 3.4 + rnd() * 2.6;
    const step = ((t + i * 1.7) % period) / period;
    const rad = r * (0.08 + step * 0.5);
    // Se apaga al nacer y al morir: una onda que aparece de golpe se ve dibujada.
    const life = Math.sin(step * Math.PI) * (1 - step);
    ctx.strokeStyle = `rgba(216,238,242,${life * 0.1})`;
    ctx.lineWidth = Math.max(0.5, r * 0.009 * (1 - step * 0.5));
    outline(ctx, cxo, cyo, rad, shape, 44);
    ctx.stroke();
    // Y el valle que la sigue por dentro.
    ctx.strokeStyle = `rgba(8,26,34,${life * 0.07})`;
    ctx.lineWidth = Math.max(0.5, r * 0.008);
    outline(ctx, cxo, cyo, rad * 0.93, shape, 44);
    ctx.stroke();
  }
}

// Lo que flota: motas de polen y trocitos de hoja que el viento arrastra por
// la superficie y se amontonan en la orilla de sotavento. Son diminutas y son
// lo que separa un agua viva de un cristal azul.
function specks(ctx, o, r, rnd, va, t) {
  for (let i = 0; i < LAKE.specks; i++) {
    const a = rnd() * Math.PI * 2;
    const base = Math.sqrt(rnd()) * r * 0.9;
    const driftBy = ((t * 0.05 + rnd()) % 1);
    const x = o.x + Math.cos(a) * base + Math.cos(va) * driftBy * r * 0.5;
    const y = o.y + Math.sin(a) * base * 0.92 + Math.sin(va) * driftBy * r * 0.5;
    if (Math.hypot(x - o.x, y - o.y) > r * 0.97) continue;
    const rad = r * (0.006 + rnd() * 0.012);
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(206,196,142,${0.18 + rnd() * 0.2})`
      : `rgba(70,84,58,${0.2 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 1.4, rad, a, 0, Math.PI * 2);
    ctx.fill();
  }
}
