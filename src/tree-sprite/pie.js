// El pie del árbol: donde el tronco se encuentra con la tierra. Va en el mismo
// lienzo que el tronco, pintado justo después del fuste y con el mismo azar.

import { mix } from '../sprite-kit.js';
import { LUZ, LX, LY, LIQUEN } from './comun.js';

export function pintarPie(ctx, rnd, cx, baseY, w0, R, base, seco) {
  // Raíces: contrafuertes que agarran el suelo. Cierran el encuentro del tronco
  // con la tierra, que es lo que más delata a un árbol plantado de mentira. Cada
  // una es una cuña de dos curvas —sube pegada al fuste y baja tendida hasta la
  // tierra—, con su filo claro por donde entra la luz: una punta recta parecería
  // una aleta pegada al tronco, no madera que sale de él.
  const raices = 4 + ((rnd() * 3) | 0);
  for (let i = 0; i < raices; i++) {
    const lado = i % 2 ? 1 : -1;
    const largo = R * (0.1 + rnd() * 0.14);
    const alto = R * (0.1 + rnd() * 0.1);
    const x0 = cx + lado * w0 * 0.7;
    const xf = cx + lado * (w0 + largo);

    ctx.fillStyle = mix(base, '#100b06', 0.2 + rnd() * 0.3);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - alto * 1.8);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.5), baseY - alto * 0.75, xf, baseY + alto * 0.1);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.35), baseY + alto * 0.3, x0, baseY + alto * 0.2);
    ctx.closePath();
    ctx.fill();

    // El lomo de la raíz, por donde le da la luz.
    ctx.strokeStyle = `rgba(226,200,158,${0.1 + rnd() * 0.12})`;
    ctx.lineWidth = Math.max(0.7, R * 0.02);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - alto * 1.6);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.5), baseY - alto * 0.7, xf - lado * largo * 0.15, baseY - alto * 0.05);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Hojarasca del propio árbol: lo que ha ido soltando cae a sus pies y se
  // amontona ahí. Un tronco que sale de la tierra limpia se lee como plantado
  // ayer; con su alfombra de hoja parece llevar años.
  const caidas = 10 + ((rnd() * 10) | 0);
  for (let i = 0; i < caidas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.12 + Math.sqrt(rnd()) * 0.52);
    const x = cx + Math.cos(a) * d;
    const y = baseY + Math.sin(a) * d * 0.34;
    const largo = R * (0.05 + rnd() * 0.06);
    const ancho = largo * (0.3 + rnd() * 0.2);
    const giro = rnd() * Math.PI;
    const tono = mix('#6d5227', seco > 0.5 ? '#54401f' : '#5c5c2e', rnd());

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    const forma = (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(-largo / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, -ancho + dy, largo / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, ancho + dy, -largo / 2 + dx, dy);
      ctx.closePath();
    };
    ctx.fillStyle = 'rgba(10,9,7,0.34)';
    forma(-LX * largo * 0.12, -LY * largo * 0.12);
    ctx.fill();
    ctx.globalAlpha = 0.6 + rnd() * 0.3;
    ctx.fillStyle = tono;
    forma(0, 0);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Musgo al pie, por el lado que no ve el sol: ahí es donde aguanta la humedad.
  for (let i = 0, n = 5 + ((rnd() * 6) | 0); i < n; i++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 1.8;
    const d = R * (0.1 + rnd() * 0.3);
    ctx.globalAlpha = (0.1 + rnd() * 0.14) * (1 - seco * 0.7);
    ctx.fillStyle = LIQUEN[(rnd() * LIQUEN.length) | 0];
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, baseY + Math.sin(a) * d * 0.3,
      R * (0.04 + rnd() * 0.06), R * (0.02 + rnd() * 0.03), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Y la tierra removida alrededor del pie.
  const pie = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, R * 0.55);
  pie.addColorStop(0, 'rgba(38,28,18,0.38)');
  pie.addColorStop(1, 'rgba(38,28,18,0)');
  ctx.fillStyle = pie;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, R * 0.55, R * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}
