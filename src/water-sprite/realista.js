// Estanque fotográfico. El motor procedural sigue disponible como respaldo;
// cuando la imagen termina de cargar se usa esta base y se añaden encima unas
// ondas vivas muy sutiles para que no parezca una fotografía inmóvil.

import { semillaDe } from '../sprite-kit.js';
import { LX, LY } from './forma.js';

const lagoRealista = new Image();
let listo = false;
lagoRealista.onload = () => { listo = true; };
lagoRealista.src = '/assets/pond-natural.webp';

export const lagoRealistaListo = () => listo;

export function dibujarLagoRealista(ctx, o, r, wind, ahora) {
  const semilla = semillaDe(o) >>> 0;
  estamparFoto(ctx, o, r, semilla);
  reflejos(ctx, o, r, semilla, wind, ahora);
}

function estamparFoto(ctx, o, r, semilla) {
  const giro = (((semilla >>> 7) & 255) / 255 - 0.5) * 0.18;
  const lado = r * (2.82 + ((semilla >>> 16) & 31) / 240);

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(9,13,10,0.58)';
  ctx.shadowBlur = r * 0.15;
  ctx.filter = 'saturate(1.12) brightness(0.93) contrast(1.14)';
  // Se estampa cuadrado a propósito: el original ancho se vuelve una charca
  // compacta e irregular y encaja mejor con el radio real donde Fagi bebe.
  ctx.drawImage(lagoRealista, -lado / 2, -lado / 2, lado, lado);
  ctx.restore();
}

// Reflejos móviles contenidos en la zona central del agua. No repintan la
// costa ni producen el viejo disco azul: solo alteran la superficie.
function reflejos(ctx, o, r, semilla, wind, ahora) {
  const t = ahora / 1000;
  const viento = wind?.angle ?? 0;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(viento);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const fase = (semilla % 997) * 0.01 + i * 1.73;
    const y = Math.sin(fase * 2.1) * r * 0.48;
    const x = ((t * (3.2 + i * 0.17) + i * r * 0.29) % (r * 1.7)) - r * 0.85;
    const largo = r * (0.12 + (i % 3) * 0.035);
    const alfa = 0.07 + Math.max(0, Math.sin(t * 0.85 + fase)) * 0.08;
    ctx.strokeStyle = `rgba(220,239,235,${alfa})`;
    ctx.lineWidth = Math.max(0.65, r * 0.009);
    ctx.beginPath();
    ctx.moveTo(x, y - largo / 2);
    ctx.quadraticCurveTo(x + r * 0.025, y, x, y + largo / 2);
    ctx.stroke();
  }

  const brillo = ctx.createRadialGradient(
    LX * r * 0.35, LY * r * 0.35, 0,
    LX * r * 0.2, LY * r * 0.2, r * 0.95
  );
  brillo.addColorStop(0, `rgba(222,239,236,${0.08 + Math.sin(t * 0.3) * 0.02})`);
  brillo.addColorStop(1, 'rgba(222,239,236,0)');
  ctx.fillStyle = brillo;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}
