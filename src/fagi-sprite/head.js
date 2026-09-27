// La cabeza de Fagi: coraza, ojos compuestos, frente y mandíbulas.

import { mix } from '../sprite-kit.js';
import { shell, edgeLine, outline } from './light.js';
import { headPath } from './silhouettes.js';
import { ellipse, point, line } from './stroke.js';

export function head(ctx, c, L, alive, rnd) {
  ctx.save();
  headPath(ctx);
  ctx.clip();

  ctx.fillStyle = shell(ctx, 8.4, 0, 4.7, c.head, L, 0.4, 0.62);
  ctx.fillRect(4, -6, 10, 12);

  // Los tres ocelos y el surco frontal: la frente de una hormiga no es lisa.
  ctx.strokeStyle = 'rgba(52,26,10,0.34)';
  ctx.lineWidth = 0.7;
  line(ctx, 6.6, 0, 10.6, 0);

  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 4.0;
    const color = `rgba(60,30,12,${0.05 + rnd() * 0.1})`;
    point(ctx, 8.4 + Math.cos(a) * d, Math.sin(a) * d * 0.9, 0.3 + rnd() * 0.3, color);
  }
  ctx.restore();

  outline(ctx, headPath, 0.6);
  edgeLine(ctx, headPath, 8.4, 0, 4.7, mix(c.head, '#ffeccb', 0.7), 0.45, 1, L);

  // El clípeo: la placa de la boca, un poco más clara y encajada al frente.
  ctx.fillStyle = mix(c.head, '#ffdca8', 0.24);
  ctx.beginPath();
  ctx.moveTo(10.2, -1.9);
  ctx.quadraticCurveTo(11.9, -1.2, 11.9, 0);
  ctx.quadraticCurveTo(11.9, 1.2, 10.2, 1.9);
  ctx.quadraticCurveTo(10.9, 0, 10.2, -1.9);
  ctx.fill();

  eyes(ctx, L, alive);
  mandibles(ctx, c);
}

// Ojos compuestos: pequeños, mates y a los lados de la cabeza, no al frente.
// El ojo de una obrera es una pastilla diminuta; una canica negra y brillante
// convierte al bicho en un muñeco.
function eyes(ctx, L, alive) {
  for (const sideOf of [-1, 1]) {
    const x = 7.9;
    const y = 3.5 * sideOf;
    const giro = 0.4 * sideOf;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);

    // El reborde: el ojo va encajado en la cabeza, no pegado encima.
    ellipse(ctx, 0, 0, 1.55, 1.2, 'rgba(46,24,10,0.5)');

    // Mate y pardo, no negro charol: el ojo compuesto no refleja como un cristal.
    const g = ctx.createRadialGradient(L.x * 0.5, L.y * 0.4, 0.1, 0, 0, 1.3);
    g.addColorStop(0, alive ? '#4f4234' : '#565b66');
    g.addColorStop(0.6, alive ? '#2e241a' : '#43474f');
    g.addColorStop(1, alive ? '#17100a' : '#2f323a');
    ellipse(ctx, 0, 0, 1.25, 0.95, g);

    // Facetas: dos rayitas cruzadas, lo justo para que no sea una gota lisa.
    ctx.strokeStyle = 'rgba(255,240,214,0.1)';
    ctx.lineWidth = 0.25;
    for (const i of [-0.45, 0.45]) {
      line(ctx, -1.05, i, 1.05, i);
      line(ctx, i * 1.3, -0.8, i * 1.3, 0.8);
    }

    // Un punto de cielo, pequeño: brilla, pero no como un ojo de muñeco.
    if (alive) ellipse(ctx, L.x * 0.55, L.y * 0.45, 0.3, 0.24, 'rgba(224,232,242,0.42)');
    ctx.restore();
  }
}

// Mandíbulas: dos hoces dentadas que se cruzan por delante de la boca. Son la
// herramienta con la que Fagi carga, así que se dibujan como tal.
function mandibles(ctx, c) {
  for (const sideOf of [-1, 1]) {
    ctx.save();
    ctx.scale(1, sideOf);

    // La hoz: sale ancha de la cabeza, se curva hacia fuera y cierra en punta
    // cruzando por delante de la boca. El canto de dentro va dentado.
    ctx.fillStyle = mix(c.legs, '#3b2009', 0.25);
    ctx.beginPath();
    ctx.moveTo(10.6, 0.9);
    ctx.quadraticCurveTo(13.4, 3.1, 15.8, 0.9);   // canto de fuera
    ctx.quadraticCurveTo(15.2, 0.2, 14.4, -0.1);  // la punta, cruzada
    ctx.quadraticCurveTo(13.6, 1.1, 12.5, 0.8);   // dientes de dentro
    ctx.quadraticCurveTo(11.8, 0.6, 11.0, 0.0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(22,12,4,0.55)';
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // El lomo de la mandíbula, por donde le da la luz.
    ctx.strokeStyle = mix(c.legs, '#ffe2b4', 0.5);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(11.2, 1.05);
    ctx.quadraticCurveTo(13.4, 2.6, 15.3, 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.lineWidth = 1;
}
