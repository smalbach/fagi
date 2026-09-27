// Estanque fotográfico. El motor procedural sigue disponible como respaldo;
// cuando la imagen termina de cargar se usa esta base y se añaden encima unas
// ondas vivas muy sutiles para que no parezca una fotografía inmóvil.

import { seedFor } from '../sprite-kit.js';
import { LX, LY } from './shape.js';

const realisticLake = new Image();
let ready = false;
realisticLake.onload = () => { ready = true; };
realisticLake.src = '/assets/pond-natural.webp';

export const realisticLakeReady = () => ready;

export function drawRealisticLake(ctx, o, r, wind, now) {
  const seedOf = seedFor(o) >>> 0;
  stampPhoto(ctx, o, r, seedOf);
  reflections(ctx, o, r, seedOf, wind, now);
}

function stampPhoto(ctx, o, r, seedOf) {
  const giro = (((seedOf >>> 7) & 255) / 255 - 0.5) * 0.18;
  const sideOf = r * (2.82 + ((seedOf >>> 16) & 31) / 240);

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(9,13,10,0.58)';
  ctx.shadowBlur = r * 0.15;
  ctx.filter = 'saturate(1.12) brightness(0.93) contrast(1.14)';
  // Se estampa cuadrado a propósito: el original ancho se vuelve una charca
  // compacta e irregular y encaja mejor con el radio real donde Fagi bebe.
  ctx.drawImage(realisticLake, -sideOf / 2, -sideOf / 2, sideOf, sideOf);
  ctx.restore();
}

// Reflejos móviles contenidos en la zona central del agua. No repintan la
// costa ni producen el viejo disco azul: solo alteran la superficie.
function reflections(ctx, o, r, seedOf, wind, now) {
  const t = now / 1000;
  const windState = wind?.angle ?? 0;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(windState);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const phase = (seedOf % 997) * 0.01 + i * 1.73;
    const y = Math.sin(phase * 2.1) * r * 0.48;
    const x = ((t * (3.2 + i * 0.17) + i * r * 0.29) % (r * 1.7)) - r * 0.85;
    const length = r * (0.12 + (i % 3) * 0.035);
    const alpha = 0.07 + Math.max(0, Math.sin(t * 0.85 + phase)) * 0.08;
    ctx.strokeStyle = `rgba(220,239,235,${alpha})`;
    ctx.lineWidth = Math.max(0.65, r * 0.009);
    ctx.beginPath();
    ctx.moveTo(x, y - length / 2);
    ctx.quadraticCurveTo(x + r * 0.025, y, x, y + length / 2);
    ctx.stroke();
  }

  const shine = ctx.createRadialGradient(
    LX * r * 0.35, LY * r * 0.35, 0,
    LX * r * 0.2, LY * r * 0.2, r * 0.95
  );
  shine.addColorStop(0, `rgba(222,239,236,${0.08 + Math.sin(t * 0.3) * 0.02})`);
  shine.addColorStop(1, 'rgba(222,239,236,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}
