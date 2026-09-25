// Los frutos pintados. La forma de cada punto no es adorno: es su ficha
// dibujada, para que se lea de un vistazo qué hace al comerlo.
//
//   nectar : baya carnosa con rabo y hoja. Es alimento de verdad, el que llena.
//   chispa : esquirla de cristal, aristas y destellos. Da velocidad.
//   ojo    : un ojo que mira. Da vista.
//   resina : gota de ámbar espesa, con su goteo. Estira lo comido.
//   toxico : masa deshecha, moho y vaho. Es lo podrido.
//
// Y la madurez va en el dibujo, no solo en el color: antes de pudrirse la fruta
// se mancha, se vence y pierde el brillo. Quien mira el mapa puede ver que a esa
// pieza le queda poco sin tener que acordarse de cuándo cayó.
//
// Cada combinación de tipo, radio, variante y escalón de madurez se pinta UNA
// vez en su propio lienzo y luego solo se estampa.

import { POINT_TYPES, FRUIT } from './config.js';
import { ripeness } from './food.js';
import { colorPorMadurez, aRGB } from './colors.js';
import { lienzo, mix, azar, semillaDe, cacheSprite, detalle, estampar } from './sprite-kit.js';

const sprites = new Map();     // clave: tipo|radio|variante|escalón de madurez

const PASOS = 12;              // en cuántos escalones se redondea la madurez
const VARIANTES = 4;           // piezas distintas por tipo: ni dos iguales juntas

const LUZ = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el nido
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

export function drawFruit(ctx, p) {
  const z = detalle();
  const r = Math.max(2, Math.round(POINT_TYPES[p.type].radius * z));
  const paso = Math.round(ripeness(p) * PASOS);
  const img = cacheSprite(
    sprites,
    `${p.type}|${r}|${semillaDe(p) % VARIANTES}|${paso}`,
    () => pintar(p.type, r, semillaDe(p) % VARIANTES, paso / PASOS),
    600
  );
  estampar(ctx, img, p.x, p.y, z);
}

function pintar(tipo, r, variante, madurez) {
  const semilla = [...tipo].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const rnd = azar((semilla ^ (variante * 7919)) >>> 0);
  const base = colorPorMadurez(tipo, madurez);
  // Lo pasado: 0 = todavía buena, 1 = a punto de pudrirse (o de deshacerse, si
  // ya es lo podrido).
  const pasado = Math.max(0, (madurez - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));

  const pad = Math.ceil(r * 1.4) + 5;
  const S = (r + pad) * 2;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');
  (PINTORES[tipo] ?? baya)(ctx, S / 2, S / 2, r, base, rnd, pasado);
  return c;
}

// --- piezas comunes -------------------------------------------------------

// La sombra que deja en el suelo. Son DOS: la larga y blanda que tira la luz
// hacia el lado contrario, y la corta y dura del contacto, justo debajo, donde
// no entra luz de ninguna parte. Sin la segunda la pieza flota por muy bien
// pintada que esté.
function sombra(ctx, cx, cy, r, fuerza = 0.45) {
  ctx.save();
  ctx.translate(cx - LX * r * 0.3, cy - LY * r * 0.3 + r * 0.55);
  ctx.scale(1, 0.38);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
  g.addColorStop(0, `rgba(6,8,11,${fuerza})`);
  g.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy + r * 0.62);
  ctx.scale(1, 0.34);
  const c = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.62);
  c.addColorStop(0, `rgba(4,5,7,${fuerza * 1.5})`);
  c.addColorStop(1, 'rgba(4,5,7,0)');
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Volumen de bola: claro por donde entra la luz, oscuro al otro lado. Se llama
// con el recorte de la silueta ya puesto.
function volumen(ctx, cx, cy, r, base, luzT = 0.45, sombraT = 0.58) {
  const g = ctx.createRadialGradient(
    cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.08,
    cx, cy, r * 1.2
  );
  g.addColorStop(0, mix(base, '#ffffff', luzT));
  g.addColorStop(0.5, base);
  g.addColorStop(1, mix(base, '#0d1015', sombraT));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Rebote del suelo: la tierra devuelve algo de luz, así que el lado en sombra
  // no es negro, es pardo. Es lo que ata la pieza al sitio donde está tirada, en
  // vez de dejarla recortada encima.
  const eco = ctx.createRadialGradient(
    cx - LX * r * 0.7, cy - LY * r * 0.7, r * 0.05,
    cx - LX * r * 0.5, cy - LY * r * 0.5, r * 1.05
  );
  eco.addColorStop(0, 'rgba(126,106,72,0.2)');
  eco.addColorStop(1, 'rgba(126,106,72,0)');
  ctx.fillStyle = eco;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// El punto de luz. Una mancha alargada puesta de canto a la luz: es lo que hace
// que una bola parezca mojada en vez de plana.
function lustre(ctx, cx, cy, r, fuerza) {
  if (fuerza <= 0.02) return;
  ctx.save();
  ctx.translate(cx + LX * r * 0.44, cy + LY * r * 0.44);
  ctx.rotate(LUZ + Math.PI / 2);
  ctx.fillStyle = `rgba(255,255,255,${fuerza})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Las manchas de lo que se está pasando: primero salpicaduras, luego zonas
// hundidas. Van dentro del recorte de la pieza.
function manchas(ctx, cx, cy, r, pasado, rnd) {
  if (pasado <= 0) return;
  const n = 2 + ((pasado * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const rad = r * (0.12 + rnd() * 0.24) * (0.5 + pasado * 0.8);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(48,30,22,${0.2 + pasado * 0.4})`);
    g.addColorStop(1, 'rgba(48,30,22,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Rabo y hoja: lo que dice que esto cayó de un árbol. Los dos se secan.
function rabo(ctx, cx, cy, r, pasado, rnd) {
  const lado = rnd() < 0.5 ? -1 : 1;
  ctx.strokeStyle = mix('#6b4a2f', '#3a2a1a', pasado);
  ctx.lineWidth = Math.max(1, r * 0.17);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.82);
  ctx.quadraticCurveTo(cx + lado * r * 0.1, cy - r * 1.15, cx + lado * r * 0.3, cy - r * 1.24);
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.save();
  ctx.translate(cx + lado * r * 0.3, cy - r * 1.2);
  ctx.rotate(lado * -0.45);
  ctx.fillStyle = mix('#4fa05a', '#8a6b3a', Math.min(1, pasado * 1.3));
  ctx.beginPath();
  ctx.ellipse(lado * r * 0.3, 0, r * 0.34, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,34,20,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(lado * r * 0.6, 0);
  ctx.stroke();
  ctx.restore();
}

// --- un pintor por tipo ---------------------------------------------------

// Baya: lo que de verdad alimenta. Carnosa, con su surco y la piel poteada.
// Al pasarse se vence hacia abajo y deja de brillar.
function baya(ctx, cx, cy, r, base, rnd, pasado) {
  const rx = r * (1 - pasado * 0.06);
  const ry = r * (1 + pasado * 0.05);
  const y = cy + r * pasado * 0.06;
  sombra(ctx, cx, cy, r);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  volumen(ctx, cx, y, r, base, 0.46 - pasado * 0.26, 0.55);

  // El surco que parte la baya en dos.
  ctx.strokeStyle = 'rgba(14,26,16,0.18)';
  ctx.lineWidth = Math.max(1, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.12, y - ry);
  ctx.quadraticCurveTo(cx + rx * 0.5, y, cx - rx * 0.06, y + ry);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Poros de la piel: motitas claras, más marcadas por el lado de la luz.
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    ctx.fillStyle = `rgba(255,255,240,${0.06 + rnd() * 0.1})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.5, r * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }

  manchas(ctx, cx, y, r, pasado, rnd);
  ctx.restore();

  lustre(ctx, cx, y, r, 0.42 - pasado * 0.34);
  rabo(ctx, cx, y, r, pasado, rnd);
}

// Chispa: no es carne, es mineral. Un prisma de aristas vivas que suelta
// destellos. Lo que da es velocidad, así que va picuda y no redonda.
function chispa(ctx, cx, cy, r, base, rnd, pasado) {
  const [cr, cg, cb] = aRGB(base);

  // Resplandor: se ve venir de lejos aunque la pieza sea pequeña.
  const halo = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.1);
  halo.addColorStop(0, `rgba(${cr},${cg},${cb},${0.3 - pasado * 0.2})`);
  halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const giro = (rnd() - 0.5) * 0.5;
  const perfil = [[0, -1.45], [0.62, -0.5], [0.44, 0.7], [0, 1.3], [-0.44, 0.7], [-0.62, -0.5]];
  const pts = perfil.map(([px, py]) => {
    const x = px * r * (0.9 + rnd() * 0.25);
    const y = py * r * (0.9 + rnd() * 0.2);
    return {
      x: cx + x * Math.cos(giro) - y * Math.sin(giro),
      y: cy + x * Math.sin(giro) + y * Math.cos(giro),
    };
  });

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.clip();
  volumen(ctx, cx, cy, r, base, 0.6 - pasado * 0.3, 0.66);

  // Caras: del centro a cada arista, una clara y la siguiente oscura. Es lo que
  // lo hace cristal tallado y no un rombo pintado.
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a.x + b.x) / 2 - cx;
    const my = (a.y + b.y) / 2 - cy;
    const d = Math.hypot(mx, my) || 1;
    const hacia = (mx / d) * LX + (my / d) * LY;
    ctx.fillStyle = hacia > 0 ? 'rgba(255,255,255,0.22)' : 'rgba(8,14,22,0.28)';
    ctx.globalAlpha = Math.abs(hacia) * (0.6 + rnd() * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Núcleo encendido.
  const nucleo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
  nucleo.addColorStop(0, `rgba(255,255,255,${0.5 - pasado * 0.35})`);
  nucleo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = nucleo;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  // Filo del canto y destellos sueltos alrededor.
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.75)`;
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 1;

  const destellos = 3 - ((pasado * 2) | 0);
  for (let i = 0; i < destellos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (1.25 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + rnd() * 0.2})`;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    ctx.lineTo(cx + Math.cos(a) * (d + r * 0.45), cy + Math.sin(a) * (d + r * 0.45));
    ctx.stroke();
  }
}

// Ojo: lo que da es vista, así que es un ojo y mira a algún sitio. Cada variante
// mira hacia otro lado.
function ojo(ctx, cx, cy, r, base, rnd, pasado) {
  sombra(ctx, cx, cy, r);
  const blanco = mix(base, '#f6f2ff', 0.82 - pasado * 0.3);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  volumen(ctx, cx, cy, r, blanco, 0.3, 0.5);

  // Venillas: pocas y finas, siempre desde el borde hacia dentro.
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(190,70,90,${0.14 + rnd() * 0.16 + pasado * 0.25})`;
    ctx.lineWidth = Math.max(0.6, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.quadraticCurveTo(
      cx + Math.cos(a + 0.4) * r * 0.6, cy + Math.sin(a + 0.4) * r * 0.6,
      cx + Math.cos(a - 0.2) * r * 0.35, cy + Math.sin(a - 0.2) * r * 0.35
    );
    ctx.stroke();
  }

  // Hacia dónde mira. Nublado y torcido cuando se pasa: deja de ver.
  const mira = rnd() * Math.PI * 2;
  const ix = cx + Math.cos(mira) * r * 0.2;
  const iy = cy + Math.sin(mira) * r * 0.2;
  const rIris = r * 0.55;

  ctx.fillStyle = mix(base, '#0b0a16', 0.15 + pasado * 0.2);
  ctx.beginPath();
  ctx.arc(ix, iy, rIris, 0, Math.PI * 2);
  ctx.fill();

  // Fibras del iris.
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.2;
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(10,8,20,0.28)';
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(a) * rIris * 0.35, iy + Math.sin(a) * rIris * 0.35);
    ctx.lineTo(ix + Math.cos(a) * rIris * 0.95, iy + Math.sin(a) * rIris * 0.95);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  ctx.fillStyle = '#0c0b14';
  ctx.beginPath();
  ctx.arc(ix, iy, rIris * (0.46 + pasado * 0.2), 0, Math.PI * 2);
  ctx.fill();

  // Catarata: al pasarse se le pone un velo lechoso encima.
  if (pasado > 0) {
    ctx.fillStyle = `rgba(226,222,208,${pasado * 0.45})`;
    ctx.beginPath();
    ctx.arc(ix, iy, rIris, 0, Math.PI * 2);
    ctx.fill();
  }
  manchas(ctx, cx, cy, r, pasado, rnd);
  ctx.restore();

  lustre(ctx, cx, cy, r, 0.5 - pasado * 0.4);
}

// Resina: espesa y translúcida. Gota con punta arriba, burbujas dentro y un
// hilo que cuelga. Lo que hace es estirar el tiempo, y se ve en que es lo único
// que parece que se mueve despacio.
function resina(ctx, cx, cy, r, base, rnd, pasado) {
  sombra(ctx, cx, cy, r, 0.35);
  const y = cy + r * 0.12;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.35);
  ctx.bezierCurveTo(cx + r * 0.45, cy - r * 0.55, cx + r, y - r * 0.35, cx + r, y);
  ctx.arc(cx, y, r, 0, Math.PI);
  ctx.bezierCurveTo(cx - r, y - r * 0.35, cx - r * 0.45, cy - r * 0.55, cx, cy - r * 1.35);
  ctx.closePath();
  ctx.clip();
  volumen(ctx, cx, y, r, base, 0.55 - pasado * 0.3, 0.5);

  // Lo que lleva dentro: burbujas atrapadas y alguna hebra. El ámbar guarda
  // cosas, igual que guarda el hambre para más tarde.
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.7;
    const rad = r * (0.08 + rnd() * 0.16);
    const bx = cx + Math.cos(a) * d;
    const by = y + Math.sin(a) * d;
    ctx.fillStyle = 'rgba(255,240,200,0.18)';
    ctx.beginPath();
    ctx.arc(bx, by, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,12,0.22)';
    ctx.beginPath();
    ctx.arc(bx, by, rad, LUZ + 0.7, LUZ + 2.7);
    ctx.stroke();
  }

  // Poso oscuro al fondo: lo espeso se va abajo.
  const poso = ctx.createLinearGradient(0, y, 0, y + r);
  poso.addColorStop(0, 'rgba(70,36,8,0)');
  poso.addColorStop(1, `rgba(70,36,8,${0.3 + pasado * 0.3})`);
  ctx.fillStyle = poso;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  manchas(ctx, cx, y, r, pasado * 0.6, rnd);
  ctx.restore();

  // El hilo que gotea, más largo cuanto más vieja: lleva tiempo escurriendo.
  ctx.strokeStyle = mix(base, '#5a2e08', 0.35);
  ctx.lineWidth = Math.max(1, r * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.15, y + r * 0.9);
  ctx.lineTo(cx + r * 0.15, y + r * (1.15 + pasado * 0.35));
  ctx.stroke();
  ctx.fillStyle = mix(base, '#3b1d05', 0.15);
  ctx.beginPath();
  ctx.arc(cx + r * 0.15, y + r * (1.2 + pasado * 0.35), r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;

  lustre(ctx, cx, y - r * 0.15, r, 0.5 - pasado * 0.3);
}

// Podrido: ya no tiene forma propia. Bulto irregular, moho agarrado al lado de
// sombra, pozos hundidos y vaho. Y según se le acaba el tiempo se deshincha,
// hasta que desaparece del mapa.
function podrido(ctx, cx, cy, r, base, rnd, pasado) {
  const k = 1 - pasado * 0.28;
  const rr = r * k;
  sombra(ctx, cx, cy, r * 1.05, 0.4);

  // Jugo: lo que ha soltado al deshacerse, en el suelo y a su alrededor.
  const charco = ctx.createRadialGradient(cx, cy + rr * 0.5, 0, cx, cy + rr * 0.5, r * 1.5);
  charco.addColorStop(0, `rgba(46,26,32,${0.3 * (0.4 + pasado)})`);
  charco.addColorStop(1, 'rgba(46,26,32,0)');
  ctx.fillStyle = charco;
  ctx.beginPath();
  ctx.ellipse(cx, cy + rr * 0.5, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const f = 0.7 + rnd() * 0.3;
    pts.push({ x: cx + Math.cos(a) * rr * f, y: cy + Math.sin(a) * rr * f * 0.95 });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const m = pts[(i + 1) % n];
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + m.x) / 2, (pts[i].y + m.y) / 2);
  }
  ctx.closePath();
  ctx.clip();
  volumen(ctx, cx, cy, rr, base, 0.2, 0.68);   // mate: lo podrido no brilla

  // Moho: grumos verdosos pegados al lado que no ve el sol, que es donde
  // aguanta la humedad.
  for (let m = 0; m < 3; m++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 2;
    const d = rr * (0.2 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    for (let i = 0; i < 6; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * rr * 0.4;
      ctx.fillStyle = `rgba(150,168,120,${0.1 + rnd() * 0.16})`;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, rr * (0.1 + rnd() * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pozos: donde se ha hundido la carne. Sombra arriba, filo claro abajo.
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * rr * 0.7;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = rr * (0.12 + rnd() * 0.18);
    ctx.fillStyle = 'rgba(16,10,14,0.4)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,214,208,0.12)';
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LUZ + 0.6, LUZ + 2.6);
    ctx.stroke();
  }
  ctx.restore();

  // Vaho: dos hilillos subiendo. Es lo que se huele desde lejos.
  for (let i = 0; i < 2; i++) {
    const x = cx + (i ? rr * 0.45 : -rr * 0.35);
    ctx.strokeStyle = `rgba(190,170,180,${0.1 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, cy - rr * 0.7);
    ctx.quadraticCurveTo(x + rr * 0.5, cy - rr * 1.3, x - rr * 0.2, cy - rr * 1.9);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

const PINTORES = { nectar: baya, chispa, ojo, resina, toxico: podrido };
