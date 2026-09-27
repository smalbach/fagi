// Las antenas de Fagi.

import { mix } from '../sprite-kit.js';
import { ellipse, line } from './stroke.js';

// Las antenas son su olfato: al rastrear un olor se abren y se inclinan hacia
// el lado por el que le llega más fuerte. Van acodadas —escapo recto, codo y
// funículo curvo— porque así son las de las hormigas y no las de un caracol.
export function drawAntennas(ctx, fagi, step, c, L, alive) {
  const tracking = fagi.targetKind === 'scent';
  const opens = tracking ? 0.85 : 0.6;
  const bias = tracking ? fagi.castSide * 0.2 : 0;
  const tremble = alive ? Math.sin(step * 0.8) * 0.13 : -0.35;

  const dark = mix(c.legs, '#120a05', 0.35);
  const clear = mix(c.legs, '#ffe2b4', 0.4);
  ctx.lineCap = 'round';

  for (const sideOf of [-1, 1]) {
    const a = (opens + tremble) * sideOf + bias;
    const bx = 10.0;
    const by = 1.6 * sideOf;
    // Escapo: el primer tramo, recto y grueso, desde el hueco de la antena.
    const elbowX = bx + Math.cos(a) * 5.4;
    const elbowY = by + Math.sin(a) * 5.4;
    // Funículo: el segundo, más fino, que se dobla hacia delante.
    const b = a + 0.5 * sideOf - 0.35;
    const tipX = elbowX + Math.cos(b) * 6.2;
    const tipY = elbowY + Math.sin(b) * 6.2;

    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    line(ctx, bx, by, elbowX, elbowY);

    ctx.strokeStyle = clear;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.55;
    line(ctx, bx + L.x * 0.4, by + L.y * 0.4, elbowX + L.x * 0.4, elbowY + L.y * 0.4);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(
      elbowX + Math.cos(b) * 3.4,
      elbowY + Math.sin(b) * 3.4 - 0.8 * sideOf,
      tipX, tipY
    );
    ctx.stroke();

    // La maza: el funículo no acaba en bola, se va engordando en los últimos
    // artejos. Una punta redonda y clara se lee como cerilla.
    const club = mix(c.tip, c.legs, 0.45);
    ctx.strokeStyle = club;
    ctx.lineWidth = 1.45;
    line(ctx, elbowX + Math.cos(b) * 4.4, elbowY + Math.sin(b) * 4.4, tipX, tipY);

    ellipse(ctx, tipX, tipY, 0.95, 0.72, mix(club, '#fff0d4', 0.3), b);
  }
  ctx.lineWidth = 1;
}
