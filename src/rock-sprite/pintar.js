// La roca procedural, pintada UNA vez en su lienzo: sombra, cuerpo tallado,
// grano del material, lo que le pasa por encima, filo y lascas al pie.

import { aRGB } from '../colors.js';
import { lienzo, mix, azar, ruido } from '../sprite-kit.js';
import { LUZ, LX, LY } from './comun.js';
import { MATERIALES } from './materiales.js';
import { forma, trazar, caras } from './forma.js';
import { estratos, lajas, huecos, liquen, guijarros, motas, grietas } from './superficie.js';

export function pintarRoca(semilla, r, color) {
  const rnd = azar(semilla);
  const mat = MATERIALES[(rnd() * MATERIALES.length) | 0];
  const pad = Math.ceil(r * 0.3) + 4;
  const S = (r + pad) * 2;
  const cx = S / 2;
  const cy = S / 2;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  // El color del material, más un empujón al azar: dos granitos tampoco son
  // del mismo gris.
  const base = mix(mix(color, mat.tinte, mat.peso[0] + rnd() * mat.peso[1]),
                   rnd() < 0.5 ? '#c8c2b4' : '#20242c', rnd() * 0.12);
  const claro = mix(base, '#d8d3c8', mat.luzT);
  const oscuro = mix(base, '#111318', mat.sombraT);

  // La silueta se calcula antes que nada: la necesitan la oclusión de contacto,
  // el recorte, las caras y el filo, y las cuatro tienen que cuadrar.
  const pts = forma(r, rnd, mat);

  // Sombra en el suelo, hacia el lado opuesto a la luz.
  ctx.save();
  ctx.translate(cx - LX * r * 0.18, cy - LY * r * 0.18 + r * 0.16);
  ctx.scale(1, 0.42);
  const sombra = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.15);
  sombra.addColorStop(0, 'rgba(8,9,12,0.5)');
  sombra.addColorStop(1, 'rgba(8,9,12,0)');
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Oclusión de contacto: la raya de sombra dura pegada al pie de la piedra,
  // donde no entra luz de ningún lado. Va DEBAJO del cuerpo, así que la piedra
  // se come la mitad de dentro y solo queda el reborde. Es lo que hace que la
  // roca se apoye en el suelo en vez de estar posada encima.
  ctx.save();
  ctx.filter = `blur(${Math.max(1, r * 0.07)}px)`;
  ctx.strokeStyle = 'rgba(7,8,11,0.55)';
  ctx.lineWidth = Math.max(2, r * 0.14);
  trazar(ctx, pts, cx, cy + r * 0.04);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  trazar(ctx, pts, cx, cy);
  ctx.clip();

  // Volumen: claro donde entra la luz, oscuro en el lado contrario.
  const vol = ctx.createRadialGradient(
    cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.12,
    cx, cy, r * 1.25
  );
  vol.addColorStop(0, claro);
  vol.addColorStop(0.45, base);
  vol.addColorStop(1, oscuro);
  ctx.fillStyle = vol;
  ctx.fillRect(0, 0, S, S);

  caras(ctx, pts, cx, cy, claro, oscuro, rnd, 0.2 + rnd() * 0.2);

  // Grano del material y manchas grandes de mineral, una encima de otra.
  const [celda, octavas, alfa] = mat.grano;
  ctx.globalAlpha = alfa;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(S, S, rnd, celda, octavas), 0, 0);
  ctx.globalAlpha = mat.vetas;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.drawImage(ruido(S, S, rnd, Math.max(5, (r >> 1) + ((rnd() * r) | 0)), 2), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (mat.guijarros) guijarros(ctx, cx, cy, r, rnd);
  if (mat.estratos) estratos(ctx, S, cx, cy, r, rnd);
  if (mat.lajas) lajas(ctx, S, cx, cy, r, rnd);
  if (mat.huecos) huecos(ctx, cx, cy, r, rnd);

  motas(ctx, cx, cy, r, rnd, mat);
  grietas(ctx, cx, cy, r, rnd, mat);

  if (mat.liquen && rnd() < mat.liquen) liquen(ctx, cx, cy, r, rnd);

  // Oscurecido del borde: la piedra se apaga contra su propio canto.
  const canto = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  canto.addColorStop(0, 'rgba(0,0,0,0)');
  canto.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = canto;
  ctx.fillRect(0, 0, S, S);

  // Brillo del filo, solo en el arco que da a la luz.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r * 1.4, LUZ - 1.25, LUZ + 1.25);
  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = Math.max(1, r * 0.055);
  ctx.strokeStyle = `rgba(${aRGB(claro).join(',')},${mat.brillo ?? 0.38})`;
  trazar(ctx, pts, cx, cy);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Lascas al pie: los trozos que la piedra ha ido soltando. Van FUERA de la
  // silueta, así que difuminan el canto contra la tierra y de paso cuentan que
  // esa roca lleva ahí mucho tiempo.
  const lascas = 5 + ((rnd() * 7) | 0);
  for (let i = 0; i < lascas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.98 + rnd() * 0.24);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.9 + r * 0.06;
    const rad = r * (0.03 + rnd() * 0.07);
    ctx.fillStyle = 'rgba(9,10,13,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - LX * rad * 0.6, y - LY * rad * 0.6, rad * 1.15, rad * 0.8, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix(base, rnd() < 0.5 ? claro : oscuro, 0.3 + rnd() * 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.55 + rnd() * 0.3), a, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}
