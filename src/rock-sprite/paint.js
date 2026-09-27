// La roca procedural, pintada UNA vez en su lienzo: sombra, cuerpo tallado,
// grano del material, lo que le pasa por encima, filo y lascas al pie.

import { toRGB } from '../colors.js';
import { canvasOf, mix, seededRng, noise } from '../sprite-kit.js';
import { LIGHT, LX, LY } from './common.js';
import { MATERIALES } from './materials.js';
import { shape, trace, faces } from './shape.js';
import { strata, slabs, gaps, lichen, pebbles, specks, cracks } from './surface.js';

export function paintRock(seedOf, r, color) {
  const rnd = seededRng(seedOf);
  const mat = MATERIALES[(rnd() * MATERIALES.length) | 0];
  const pad = Math.ceil(r * 0.3) + 4;
  const S = (r + pad) * 2;
  const cx = S / 2;
  const cy = S / 2;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');

  // El color del material, más un empujón al azar: dos granitos tampoco son
  // del mismo gris.
  const base = mix(mix(color, mat.tint, mat.weight[0] + rnd() * mat.weight[1]),
                   rnd() < 0.5 ? '#c8c2b4' : '#20242c', rnd() * 0.12);
  const clear = mix(base, '#d8d3c8', mat.lightT);
  const dark = mix(base, '#111318', mat.shadowT);

  // La silueta se calcula antes que nada: la necesitan la oclusión de contacto,
  // el recorte, las caras y el filo, y las cuatro tienen que cuadrar.
  const pts = shape(r, rnd, mat);

  // Sombra en el suelo, hacia el lado opuesto a la luz.
  ctx.save();
  ctx.translate(cx - LX * r * 0.18, cy - LY * r * 0.18 + r * 0.16);
  ctx.scale(1, 0.42);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.15);
  shadow.addColorStop(0, 'rgba(8,9,12,0.5)');
  shadow.addColorStop(1, 'rgba(8,9,12,0)');
  ctx.fillStyle = shadow;
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
  trace(ctx, pts, cx, cy + r * 0.04);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  trace(ctx, pts, cx, cy);
  ctx.clip();

  // Volumen: claro donde entra la luz, oscuro en el lado contrario.
  const flight = ctx.createRadialGradient(
    cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.12,
    cx, cy, r * 1.25
  );
  flight.addColorStop(0, clear);
  flight.addColorStop(0.45, base);
  flight.addColorStop(1, dark);
  ctx.fillStyle = flight;
  ctx.fillRect(0, 0, S, S);

  faces(ctx, pts, cx, cy, clear, dark, rnd, 0.2 + rnd() * 0.2);

  // Grano del material y manchas grandes de mineral, una encima de otra.
  const [cellOf, octaves, alpha] = mat.grain;
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(noise(S, S, rnd, cellOf, octaves), 0, 0);
  ctx.globalAlpha = mat.veins;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.drawImage(noise(S, S, rnd, Math.max(5, (r >> 1) + ((rnd() * r) | 0)), 2), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (mat.pebbles) pebbles(ctx, cx, cy, r, rnd);
  if (mat.strata) strata(ctx, S, cx, cy, r, rnd);
  if (mat.slabs) slabs(ctx, S, cx, cy, r, rnd);
  if (mat.gaps) gaps(ctx, cx, cy, r, rnd);

  specks(ctx, cx, cy, r, rnd, mat);
  cracks(ctx, cx, cy, r, rnd, mat);

  if (mat.lichen && rnd() < mat.lichen) lichen(ctx, cx, cy, r, rnd);

  // Oscurecido del borde: la piedra se apaga contra su propio canto.
  const edge = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, S, S);

  // Brillo del filo, solo en el arco que da a la luz.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r * 1.4, LIGHT - 1.25, LIGHT + 1.25);
  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = Math.max(1, r * 0.055);
  ctx.strokeStyle = `rgba(${toRGB(clear).join(',')},${mat.shine ?? 0.38})`;
  trace(ctx, pts, cx, cy);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Lascas al pie: los trozos que la piedra ha ido soltando. Van FUERA de la
  // silueta, así que difuminan el canto contra la tierra y de paso cuentan que
  // esa roca lleva ahí mucho tiempo.
  const flakes = 5 + ((rnd() * 7) | 0);
  for (let i = 0; i < flakes; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.98 + rnd() * 0.24);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.9 + r * 0.06;
    const rad = r * (0.03 + rnd() * 0.07);
    ctx.fillStyle = 'rgba(9,10,13,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - LX * rad * 0.6, y - LY * rad * 0.6, rad * 1.15, rad * 0.8, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix(base, rnd() < 0.5 ? clear : dark, 0.3 + rnd() * 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.55 + rnd() * 0.3), a, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}
