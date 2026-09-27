// La hoja que Fagi lleva a la espalda: su carácter y su logo.

import { mix } from '../sprite-kit.js';
import { elipse } from './trazo.js';

// Hoja de dos curvas: con punta y con rabo, no un óvalo.
function forma(ctx) {
  ctx.beginPath();
  ctx.moveTo(-4.9, 0);
  ctx.bezierCurveTo(-2.9, -2.7, 2.1, -2.6, 5.0, 0);
  ctx.bezierCurveTo(2.1, 2.6, -2.9, 2.7, -4.9, 0);
  ctx.closePath();
}

// La hoja que carga a la espalda. Va apoyada en el gáster, así que echa su
// propia sombra encima: sin ella parecería pintada en el caparazón.
export function drawHoja(ctx, hoja, L) {
  ctx.save();
  ctx.translate(-10.4, -0.5);
  ctx.rotate(0.62);

  elipse(ctx, -L.x * 1.3, -L.y * 1.3, 5.6, 3.1, 'rgba(20,12,6,0.4)');

  forma(ctx);
  const g = ctx.createLinearGradient(L.x * -5, L.y * -3, L.x * 5, L.y * 3);
  g.addColorStop(0, mix(hoja.relleno, '#0e2414', 0.45));
  g.addColorStop(0.55, hoja.relleno);
  g.addColorStop(1, hoja.luz);
  ctx.fillStyle = g;
  ctx.fill();

  // Nervio central y secundarios: es lo que la hace hoja y no pegatina.
  // Doblada por el nervio: media hoja mira a la luz y la otra media se queda a
  // la sombra. Es lo que la separa del caparazón en el que se apoya.
  mitadEnSombra(ctx);

  ctx.strokeStyle = hoja.nervio;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-4.7, 0);
  ctx.quadraticCurveTo(0, -0.4, 4.9, 0);
  ctx.stroke();

  // Y su canto, para que no se funda con la hormiga.
  forma(ctx);
  ctx.strokeStyle = 'rgba(18,34,22,0.45)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  nerviosSecundarios(ctx);
  ctx.lineWidth = 1;
  ctx.restore();
}

function mitadEnSombra(ctx) {
  ctx.save();
  forma(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(12,26,16,0.34)';
  ctx.beginPath();
  ctx.moveTo(-5.2, 0);
  ctx.quadraticCurveTo(0, -0.4, 5.2, 0);
  ctx.lineTo(5.2, 3.2);
  ctx.lineTo(-5.2, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Con el color del canto aún puesto: salen del nervio central hacia los bordes.
function nerviosSecundarios(ctx) {
  ctx.lineWidth = 0.4;
  ctx.globalAlpha = 0.7;
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.5;
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, -0.1 * i);
      ctx.quadraticCurveTo(x + 1.0, lado * 1.2, x + 1.5, lado * 2.2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
