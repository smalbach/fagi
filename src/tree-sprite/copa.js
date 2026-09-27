// --- copa -----------------------------------------------------------------
//
// La copa procedural, que es hoja. Es la que se ve mientras carga la copa
// fotográfica, y la que queda si no llega a cargar.

import { lienzo, mix, azar, ruido } from '../sprite-kit.js';
import { COPA_SUBE, LX, LY } from './comun.js';

const SAVIA = '#8a6b3a';       // hacia donde va la hoja al secarse

export function pintarCopa(semilla, R, color, seco) {
  const rnd = azar((semilla ^ 0x51ed270b) >>> 0);
  const pad = Math.ceil(R * 0.36) + 5;
  const S = (R + pad) * 2;
  const cx = S / 2;
  const cy = S / 2 - R * COPA_SUBE;   // la hoja se sienta arriba: abajo va el fuste
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  // Al secarse la hoja no se vuelve marrón de golpe: pierde verde y gana pardo.
  const hoja = mix(color, SAVIA, seco);
  const fondo = mix(hoja, '#0e1c12', 0.6);
  const medio = mix(hoja, '#0d1a12', 0.22);
  const claro = mix(hoja, '#eef7cd', 0.34);

  // Racimos: la copa no es un círculo, es un montón de masas de hoja que se
  // solapan. Todas caben dentro del radio.
  const alcance = R * 0.72;
  const n = 7 + ((rnd() * 4) | 0);
  const racimos = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
    const rad = alcance * (0.42 + rnd() * 0.2);
    const d = Math.min(alcance - rad * 0.55, alcance * (0.2 + rnd() * 0.55));
    racimos.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.9, r: rad });
  }
  racimos.push({ x: cx + (rnd() - 0.5) * R * 0.1, y: cy - R * 0.06, r: alcance * 0.62 });

  // La silueta de la copa, para que el grano y la sombra no se salgan de ella.
  const recorte = () => {
    ctx.beginPath();
    for (const m of racimos) {
      ctx.moveTo(m.x + m.r, m.y);
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    }
  };

  // Tres pasadas: la masa oscura, el tono medio corrido hacia la luz y los
  // claros solo en lo alto de cada racimo.
  const pasada = (col, escala, hacia, alfa) => {
    ctx.globalAlpha = alfa;
    ctx.fillStyle = col;
    for (const m of racimos) {
      ctx.beginPath();
      ctx.arc(m.x + LX * m.r * hacia, m.y + LY * m.r * hacia, m.r * escala, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  pasada(fondo, 1, 0, 1);
  pasada(medio, 0.82, 0.16, 0.95);
  pasada(claro, 0.5, 0.36, 0.5);

  // Grano de hoja, para que las manchas no queden planas.
  ctx.save();
  recorte();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(S, S, rnd, 3, 3), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // Ramillas dentro de la hoja: los palitos de los que cuelgan las hojas. Van
  // antes que ellas, para que la hoja se vea colgada de algo.
  const ramillas = Math.round(R * 0.5);
  ctx.lineCap = 'round';
  for (let i = 0; i < ramillas; i++) {
    const m = racimos[(rnd() * racimos.length) | 0];
    const a = rnd() * Math.PI * 2;
    const x = m.x + Math.cos(a) * m.r * 0.3;
    const y = m.y + Math.sin(a) * m.r * 0.3;
    const largo = m.r * (0.4 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(48,34,20,${0.3 + rnd() * 0.3})`;
    ctx.lineWidth = Math.max(0.6, R * 0.012);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * largo * 0.6, y + Math.sin(a) * largo * 0.5,
      x + Math.cos(a) * largo, y + Math.sin(a) * largo);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Hojas. Son lo que hace que la copa deje de leerse como un montón de
  // círculos: cada una es una hoja, con su lado a la luz, su punta y su nervio
  // si es de las grandes. Salen por todo el canto de los racimos, y unas pocas
  // se despegan y quedan sueltas contra el cielo.
  const hojas = Math.round(R * 7 * (1 - seco * 0.55));
  for (let i = 0; i < hojas; i++) {
    const m = racimos[(rnd() * racimos.length) | 0];
    const a = rnd() * Math.PI * 2;
    const d = m.r * (0.45 + rnd() * 0.62);
    const x = m.x + Math.cos(a) * d;
    const y = m.y + Math.sin(a) * d;
    if (Math.hypot(x - cx, y - cy + R * COPA_SUBE) > R + pad * 0.5) continue;

    const luz = (Math.cos(a) * LX + Math.sin(a) * LY + 1) / 2;   // 1 = da a la luz
    const largo = R * (0.06 + rnd() * 0.07);
    const ancho = largo * (0.36 + rnd() * 0.22);
    const giro = a + (rnd() - 0.5) * 1.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    const tono = mix(fondo, claro, luz * (0.45 + rnd() * 0.55));

    // Hoja de dos curvas: se estrecha en punta. Un óvalo no se lee como hoja.
    ctx.fillStyle = tono;
    ctx.beginPath();
    ctx.moveTo(-largo * 0.5, 0);
    ctx.quadraticCurveTo(0, -ancho, largo * 0.5, 0);
    ctx.quadraticCurveTo(0, ancho, -largo * 0.5, 0);
    ctx.fill();

    if (largo > R * 0.085) {
      ctx.strokeStyle = mix(tono, '#0d1a12', 0.45);
      ctx.lineWidth = Math.max(0.4, largo * 0.07);
      ctx.beginPath();
      ctx.moveTo(-largo * 0.45, 0);
      ctx.lineTo(largo * 0.45, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.lineWidth = 1;

  // Claros entre la hoja: por ahí se ve el ramaje que va pintado encima.
  // Cuanto más seco, más huecos y más grandes.
  const huecos = Math.round(4 + seco * 8);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < huecos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * alcance * 0.85;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.05 + rnd() * 0.1) * (0.7 + seco);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(0,0,0,${0.55 + seco * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // La copa se hace sombra a sí misma por abajo, al lado contrario de la luz.
  ctx.save();
  recorte();
  ctx.clip();
  const bajo = ctx.createRadialGradient(
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 0.1,
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 1.1
  );
  bajo.addColorStop(0, 'rgba(8,14,10,0.34)');
  bajo.addColorStop(1, 'rgba(8,14,10,0)');
  ctx.fillStyle = bajo;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  return c;
}
