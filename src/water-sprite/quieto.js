// Lo quieto del lago: el lienzo que se pinta una vez por lago y tamaño. El
// orden de las capas es el de aquí; lo que se ve del fondo vive en lecho.js.

import { LAKE } from '../config.js';
import { lienzo, mix, azar, ruido } from '../sprite-kit.js';
import { LX, LY, HONDO, MEDIO, VADO, ARENA, BARRO, perfil, perfilOrilla, contorno } from './forma.js';
import { arena, piedras, algas, escalonHondo, causticas, manchasFondo } from './lecho.js';

export function pintarLago(semilla, R, color, z) {
  const rnd = azar((semilla ^ 0x3c6ef372) >>> 0);
  const H = Math.ceil(R * (1 + LAKE.orillaAncho) + 8);
  const S = H * 2 * z;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');
  ctx.scale(z, z);            // a partir de aquí se piensa en píxeles de mundo
  const cx = H;
  const cy = H;

  const orilla = perfilOrilla(semilla);
  const hondo = perfil(semilla, 0x2f9a1c07, LAKE.bordeOnda * 1.8);

  barro(ctx, cx, cy, R, orilla, rnd);

  // De aquí en adelante, todo dentro del agua.
  ctx.save();
  contorno(ctx, cx, cy, R, orilla);
  ctx.clip();

  // El hondo no cae en el centro geométrico: un lago tiene la parte honda donde
  // le toca, y un degradado centrado se lee como una diana.
  const desvio = rnd() * Math.PI * 2;
  const ox = cx + Math.cos(desvio) * R * 0.16;
  const oy = cy + Math.sin(desvio) * R * 0.13;

  agua(ctx, cx, cy, R, ox, oy, S);
  arena(ctx, cx, cy, R, rnd);
  piedras(ctx, cx, cy, R, rnd);
  algas(ctx, cx, cy, R, rnd);
  escalonHondo(ctx, ox, oy, R, hondo);
  olas(ctx, cx, cy, R, rnd);
  causticas(ctx, cx, cy, R, rnd);
  manchasFondo(ctx, cx, cy, R, rnd);
  granoAgua(ctx, S, z, rnd);
  penumbra(ctx, cx, cy, R, S);
  ctx.restore();

  canto(ctx, cx, cy, R, orilla, color, rnd);

  return c;
}

// El fondo: claro y verdoso en el vado, azul oscuro al ganar hondo.
function agua(ctx, cx, cy, R, ox, oy, S) {
  const g = ctx.createRadialGradient(ox, oy, R * 0.12, cx, cy, R);
  g.addColorStop(0, HONDO);
  g.addColorStop(0.45, mix(HONDO, MEDIO, 0.7));
  g.addColorStop(0.72, MEDIO);
  g.addColorStop(0.9, mix(VADO, ARENA, 0.22));
  g.addColorStop(1, mix(VADO, ARENA, 0.45));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}

// Olas. Trazos largos y tumbados, tenues y torcidos, repartidos por toda la
// superficie: es la textura que dice "esto es agua" antes que el color. Van
// cocidas en el lienzo porque son muchas; lo que se mueve luego encima son
// solo los reflejos.
function olas(ctx, cx, cy, R, rnd) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const y = cy + (rnd() - 0.5) * R * 2;
    const x = cx + (rnd() - 0.5) * R * 1.7;
    const largo = R * (0.08 + rnd() * 0.18);
    const claro = rnd() < 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.5);     // ninguna acaba paralela a la de al lado
    ctx.strokeStyle = claro
      ? `rgba(206,232,238,${0.03 + rnd() * 0.05})`
      : `rgba(10,30,40,${0.03 + rnd() * 0.06})`;
    ctx.lineWidth = Math.max(0.6, R * (0.006 + rnd() * 0.012));
    ctx.beginPath();
    ctx.moveTo(-largo / 2, 0);
    ctx.bezierCurveTo(
      -largo * 0.2, -largo * 0.22 * (rnd() + 0.4),
      largo * 0.2, largo * 0.22 * (rnd() + 0.4),
      largo / 2, 0
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1;
}

// Grano del agua: rompe el degradado, que si no se ve como plástico. Celda
// grande y flojo: apretado se le ve la rejilla del ruido y parece plástico de
// burbujas, que es peor que el degradado liso.
function granoAgua(ctx, S, z, rnd) {
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(Math.ceil(S / z), Math.ceil(S / z), rnd, 7, 4), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Sombra de la orilla sobre el agua: el agua pegada a la tierra está en
// penumbra por el lado que da la luz.
function penumbra(ctx, cx, cy, R, S) {
  const g = ctx.createRadialGradient(
    cx + LX * R * 0.25, cy + LY * R * 0.25, R * 0.55,
    cx + LX * R * 0.25, cy + LY * R * 0.25, R * 1.12
  );
  g.addColorStop(0, 'rgba(10,22,26,0)');
  g.addColorStop(1, 'rgba(10,22,26,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}

// El canto del agua. Una línea entera y clara alrededor se lee como el borde
// de una pompa, así que va por tramos: espuma donde rompe y nada donde no.
// Debajo, apagadísimo, el color con el que el agua figura en el panel.
function canto(ctx, cx, cy, R, orilla, color, rnd) {
  contorno(ctx, cx, cy, R, orilla);
  ctx.strokeStyle = mix(color, '#0d2530', 0.5);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(0.8, R * 0.015);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a0 = rnd() * Math.PI * 2;
    const largo = 0.2 + rnd() * 0.5;          // en radianes
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) {
      const a = a0 + (j / 10) * largo;
      const rr = R * orilla(a);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(206,228,226,${0.1 + rnd() * 0.14})`;
    ctx.lineWidth = Math.max(0.8, R * (0.012 + rnd() * 0.016));
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

// La tierra mojada de alrededor, con guijarros. Va por fuera del agua: es lo que
// separa el lago del suelo seco sin que parezca pegado con tijera.
function barro(ctx, cx, cy, R, orilla, rnd) {
  const fuera = perfil(rnd() * 1e9 | 0, 0x1b873593, LAKE.bordeOnda * 1.4);
  const ancho = 1 + LAKE.orillaAncho;

  ctx.save();
  contorno(ctx, cx, cy, R * ancho, fuera);
  contorno(ctx, cx, cy, R, orilla);          // el agua queda fuera del relleno
  ctx.clip('evenodd');
  const anillo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * ancho);
  anillo.addColorStop(0, 'rgba(38,32,23,0.85)');
  anillo.addColorStop(0.45, 'rgba(48,41,29,0.55)');
  anillo.addColorStop(1, 'rgba(48,41,29,0)');
  ctx.fillStyle = anillo;
  ctx.fillRect(0, 0, R * 4, R * 4);

  // Guijarros de la orilla, medio enterrados en el barro.
  for (let i = 0; i < 24; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (1.0 + rnd() * LAKE.orillaAncho);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.02 + rnd() * 0.035);
    ctx.fillStyle = 'rgba(12,12,14,0.35)';
    ctx.beginPath();
    ctx.ellipse(x - LX * rad * 0.5, y - LY * rad * 0.5, rad * 1.1, rad * 0.75, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix('#6a6458', BARRO, rnd() * 0.6);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * 0.68, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
