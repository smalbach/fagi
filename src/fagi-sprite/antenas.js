// Las antenas de Fagi.

import { mix } from '../sprite-kit.js';
import { elipse, linea } from './trazo.js';

// Las antenas son su olfato: al rastrear un olor se abren y se inclinan hacia
// el lado por el que le llega más fuerte. Van acodadas —escapo recto, codo y
// funículo curvo— porque así son las de las hormigas y no las de un caracol.
export function drawAntennas(ctx, fagi, paso, c, L, vivo) {
  const rastreando = fagi.targetKind === 'scent';
  const abre = rastreando ? 0.85 : 0.6;
  const sesgo = rastreando ? fagi.castSide * 0.2 : 0;
  const tiemblo = vivo ? Math.sin(paso * 0.8) * 0.13 : -0.35;

  const oscuro = mix(c.patas, '#120a05', 0.35);
  const claro = mix(c.patas, '#ffe2b4', 0.4);
  ctx.lineCap = 'round';

  for (const lado of [-1, 1]) {
    const a = (abre + tiemblo) * lado + sesgo;
    const bx = 10.0;
    const by = 1.6 * lado;
    // Escapo: el primer tramo, recto y grueso, desde el hueco de la antena.
    const codoX = bx + Math.cos(a) * 5.4;
    const codoY = by + Math.sin(a) * 5.4;
    // Funículo: el segundo, más fino, que se dobla hacia delante.
    const b = a + 0.5 * lado - 0.35;
    const puntaX = codoX + Math.cos(b) * 6.2;
    const puntaY = codoY + Math.sin(b) * 6.2;

    ctx.strokeStyle = oscuro;
    ctx.lineWidth = 1.5;
    linea(ctx, bx, by, codoX, codoY);

    ctx.strokeStyle = claro;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.55;
    linea(ctx, bx + L.x * 0.4, by + L.y * 0.4, codoX + L.x * 0.4, codoY + L.y * 0.4);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = oscuro;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(codoX, codoY);
    ctx.quadraticCurveTo(
      codoX + Math.cos(b) * 3.4,
      codoY + Math.sin(b) * 3.4 - 0.8 * lado,
      puntaX, puntaY
    );
    ctx.stroke();

    // La maza: el funículo no acaba en bola, se va engordando en los últimos
    // artejos. Una punta redonda y clara se lee como cerilla.
    const maza = mix(c.punta, c.patas, 0.45);
    ctx.strokeStyle = maza;
    ctx.lineWidth = 1.45;
    linea(ctx, codoX + Math.cos(b) * 4.4, codoY + Math.sin(b) * 4.4, puntaX, puntaY);

    elipse(ctx, puntaX, puntaY, 0.95, 0.72, mix(maza, '#fff0d4', 0.3), b);
  }
  ctx.lineWidth = 1;
}
