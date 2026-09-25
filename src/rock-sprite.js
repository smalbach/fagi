// Rocas pintadas: cada roca se dibuja UNA vez en su propio lienzo (una imagen
// en memoria) y luego solo se estampa. Así puede llevar grano de piedra, vetas
// y sombra sin costar nada por fotograma.
//
// La silueta es irregular pero SIEMPRE cabe dentro del radio de colisión, para
// que lo que se ve y lo que estorba sigan siendo lo mismo.
//
// No hay "una textura de roca": hay materiales. Cada piedra saca uno al azar de
// su semilla, y el material decide color, grano, forma y qué le pasa por encima
// —estratos, huecos, líquen—. Dos rocas seguidas no se parecen.

import { aRGB } from './colors.js';
import { lienzo, mix, azar, semillaDe, ruido, detalle, estampar } from './sprite-kit.js';

const sprites = new Map();   // clave: semilla|radio

// Cuatro geologías y siluetas realmente distintas. La semilla del objeto elige
// una familia y luego altera proporción, orientación, tamaño y tono, así que
// incluso dos rocas del mismo material no son copias exactas.
const FUENTES_ROCA = [
  '/assets/rock-boulder.webp',
  '/assets/rock-granite.webp',
  '/assets/rock-slate.webp',
  '/assets/rock-sandstone.webp',
  '/assets/rock-limestone.webp',
  '/assets/rock-volcanic.webp',
  '/assets/rock-quartzite.webp',
  '/assets/rock-ironstone.webp',
];
const rocasRealistas = FUENTES_ROCA.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// Ocho geologías × tres estados de intemperie = 24 tipos visuales. No son una
// elección por fotograma: la semilla fija el tipo para toda la vida del objeto.
const ACABADOS = [
  { nombre: 'natural', hue: 0, sat: 1, luz: 1, contraste: 1.02, x: 1, y: 1 },
  { nombre: 'humeda', hue: -5, sat: 1.08, luz: 0.82, contraste: 1.14, x: 0.93, y: 1.08 },
  { nombre: 'seca', hue: 7, sat: 0.78, luz: 1.08, contraste: 0.94, x: 1.1, y: 0.88 },
];
const TIPOS_ROCA = FUENTES_ROCA.flatMap((_, base) =>
  ACABADOS.map((acabado) => ({ base, ...acabado }))
);

const SILUETA_MAX = 0.99;    // punto más saliente: nunca sobresale del radio

// min      = cuánto se hunde el contorno (bajo = piedra picuda)
// lados    = cuántos vértices, de menos a más (pocos = bloque tallado)
// aplanado = cuánto puede achatarse por un eje
// grano    = [tamaño de celda del ruido fino, octavas, opacidad]
// vetas    = opacidad de las manchas grandes de mineral
// motas    = [cuántas, probabilidad de que brillen]
// grietas  = [mínimo, máximo]
const MATERIALES = [
  { // Granito: claro, muy moteado de cuarzo, pocas grietas.
    nombre: 'granito',
    tinte: '#6f6a5e', peso: [0.25, 0.3], luzT: 0.38, sombraT: 0.58,
    min: 0.82, lados: [9, 12], aplanado: 0.12,
    grano: [3, 3, 0.34], vetas: 0.22, motas: [30, 0.6], grietas: [0, 2],
  },
  { // Basalto: casi negro, grano cerrado, roto en muchas fracturas.
    nombre: 'basalto',
    tinte: '#2d3138', peso: [0.55, 0.3], luzT: 0.26, sombraT: 0.7,
    min: 0.76, lados: [6, 9], aplanado: 0.2,
    grano: [6, 2, 0.16], vetas: 0.12, motas: [10, 0.15], grietas: [2, 4],
  },
  { // Arenisca: parda y cálida, con los estratos a la vista.
    nombre: 'arenisca',
    tinte: '#8a6a45', peso: [0.45, 0.25], luzT: 0.4, sombraT: 0.5,
    min: 0.86, lados: [11, 14], aplanado: 0.3,
    grano: [2, 3, 0.28], vetas: 0.3, motas: [8, 0.5], grietas: [0, 1],
    estratos: true,
  },
  { // Pizarra: azulada y plana, partida en planos rectos.
    nombre: 'pizarra',
    tinte: '#49556b', peso: [0.5, 0.25], luzT: 0.3, sombraT: 0.66,
    min: 0.7, lados: [5, 7], aplanado: 0.38,
    grano: [8, 2, 0.14], vetas: 0.34, motas: [6, 0.4], grietas: [1, 3],
    lajas: true,
  },
  { // Cuarcita: casi blanca y fría, partida en pocos planos muy marcados.
    nombre: 'cuarcita',
    tinte: '#b9bec9', peso: [0.45, 0.25], luzT: 0.5, sombraT: 0.6,
    min: 0.66, lados: [6, 8], aplanado: 0.25,
    grano: [10, 2, 0.12], vetas: 0.18, motas: [18, 0.85], grietas: [1, 2],
    picos: true, brillo: 0.55,
  },
  { // Conglomerado: pasta oscura con cantos de otras piedras pegados dentro.
    nombre: 'conglomerado',
    tinte: '#5b5248', peso: [0.5, 0.25], luzT: 0.3, sombraT: 0.62,
    min: 0.8, lados: [9, 12], aplanado: 0.18,
    grano: [3, 3, 0.3], vetas: 0.2, motas: [6, 0.3], grietas: [0, 1],
    guijarros: true,
  },
  { // Caliza: pálida, comida de huecos, y le agarra el líquen.
    nombre: 'caliza',
    tinte: '#9a978c', peso: [0.4, 0.3], luzT: 0.42, sombraT: 0.52,
    min: 0.84, lados: [10, 13], aplanado: 0.16,
    grano: [4, 3, 0.24], vetas: 0.26, motas: [14, 0.35], grietas: [0, 2],
    huecos: true, liquen: 0.7,
  },
];

const LUZ = -Math.PI * 0.72;         // la luz cae igual para todas: arriba-izquierda
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

export function drawRock(ctx, o, spec, r) {
  const semilla = semillaDe(o) >>> 0;
  const indiceTipo = ((semilla ^ (semilla >>> 16)) >>> 0) % TIPOS_ROCA.length;
  const tipo = TIPOS_ROCA[indiceTipo];
  const roca = rocasRealistas[tipo.base];
  if (roca.complete && roca.naturalWidth > 0) {
    drawRockRealista(ctx, o, r, roca, tipo, semilla);
    return;
  }
  // Se pinta con el radio multiplicado por la escala de detalle y se estampa al
  // tamaño de mundo: de cerca la piedra tiene más píxeles, no los mismos estirados.
  const z = detalle();
  const img = spriteDe(semillaDe(o), r * z, spec.color);
  estampar(ctx, img, o.x, o.y, z);
}

function drawRockRealista(ctx, o, r, roca, tipo, semilla) {
  const giro = (((semilla >>> 5) & 255) / 255 - 0.5) * 1.05;
  const ancho = r * (1.86 + ((semilla >>> 13) & 63) / 280) * tipo.x;
  const proporcion = roca.naturalHeight / roca.naturalWidth;
  const alto = ancho * proporcion * (0.78 + ((semilla >>> 19) & 63) / 175) * tipo.y;
  const tono = tipo.hue + (((semilla >>> 9) & 15) - 7);
  const saturacionBase = [0.82, 0.72, 0.76, 0.9, 0.66, 0.72, 0.48, 0.86][tipo.base];
  const brilloBase = [0.88, 0.9, 0.82, 0.86, 0.94, 0.78, 1.02, 0.8][tipo.base];
  const saturacion = saturacionBase * tipo.sat;
  const brillo = (brilloBase + ((semilla >>> 22) & 15) / 100) * tipo.luz;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(5,7,6,0.72)';
  ctx.shadowBlur = Math.max(2, r * 0.13);
  ctx.shadowOffsetX = -LX * r * 0.16;
  ctx.shadowOffsetY = -LY * r * 0.16;
  ctx.filter = `hue-rotate(${tono}deg) saturate(${saturacion}) brightness(${brillo}) contrast(${tipo.contraste})`;
  ctx.drawImage(roca, -ancho / 2, -alto / 2, ancho, alto);
  ctx.restore();
}

function spriteDe(semilla, r, color) {
  const clave = `${semilla}|${Math.round(r)}|${color}`;
  const guardado = sprites.get(clave);
  if (guardado) return guardado;
  const img = pintarRoca(semilla, Math.round(r), color);
  sprites.set(clave, img);
  return img;
}

// Contorno: pocos vértices de radio muy distinto, unidos por tramos rectos.
// Una piedra tiene caras y aristas; una curva suave parece huevo. Además se
// achata por un eje y se gira, así que ni dos siluetas coinciden.
// Se calcula una vez y se reutiliza, para que recorte, caras y filo cuadren.
function forma(r, rnd, mat) {
  const [lmin, lmax] = mat.lados;
  const n = lmin + ((rnd() * (lmax - lmin + 1)) | 0);
  const fase = rnd() * Math.PI * 2;
  const giro = rnd() * Math.PI * 2;
  const ex = 1 - rnd() * mat.aplanado;   // achatada por el eje X antes de girar
  const cg = Math.cos(giro);
  const sg = Math.sin(giro);
  const pts = [];
  for (let i = 0; i < n; i++) {
    // El ángulo también se mueve: vértices desigualmente repartidos, caras de
    // distinto ancho.
    const a = ((i + (rnd() - 0.5) * 0.45) / n) * Math.PI * 2;
    const lobulo = Math.sin(a * 2 + fase) * 0.07 + Math.sin(a * 3 - fase) * 0.05;
    // Con picos, un vértice sí y otro no se queda corto: arista viva en medio.
    const diente = mat.picos && i % 2 ? 0.8 : 1;
    const f = (mat.min + rnd() * (SILUETA_MAX - mat.min) + lobulo) * diente;
    const rr = r * Math.max(mat.min, Math.min(SILUETA_MAX, f));
    const x = Math.cos(a) * rr * ex;
    const y = Math.sin(a) * rr;
    pts.push({ x: x * cg - y * sg, y: x * sg + y * cg });
  }
  return pts;
}

function trazar(ctx, pts, cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
  ctx.closePath();
}

// Caras: triángulos del centro a cada arista. Cada uno se aclara u oscurece
// según hacia dónde mira respecto a la luz. Es lo que da el aspecto de bloque
// tallado en vez de mancha redonda.
function caras(ctx, pts, cx, cy, claro, oscuro, rnd, fuerza) {
  const n = pts.length;
  const hx = cx + (rnd() - 0.5) * 5;   // el vértice interior no está en el centro
  const hy = cy + (rnd() - 0.5) * 5;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = Math.hypot(mx, my) || 1;
    const hacia = (mx / d) * LX + (my / d) * LY;   // 1 = cara de cara a la luz
    ctx.fillStyle = hacia > 0 ? claro : oscuro;
    ctx.globalAlpha = Math.abs(hacia) * fuerza * (0.7 + rnd() * 0.6);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + a.x, cy + a.y);
    ctx.lineTo(cx + b.x, cy + b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Solo algunas aristas se marcan: si se dibujan todas se ve la porción de
  // tarta. Sueltas, pasan por planos de fractura.
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(10,11,14,0.14)';
  for (let i = 0; i < n; i++) {
    if (rnd() > 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
    ctx.stroke();
  }
}

// Estratos de la arenisca: capas paralelas, algo torcidas, de distinto grosor.
function estratos(ctx, S, cx, cy, r, rnd) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rnd() - 0.5) * 0.6);
  let y = -r;
  while (y < r) {
    const alto = r * (0.08 + rnd() * 0.16);
    const claro = rnd() < 0.5;
    ctx.fillStyle = claro
      ? `rgba(255,246,228,${0.04 + rnd() * 0.07})`
      : `rgba(46,32,20,${0.05 + rnd() * 0.1})`;
    ctx.fillRect(-S, y, S * 2, alto);
    y += alto;
  }
  ctx.restore();
}

// Lajas de la pizarra: planos rectos que cruzan la piedra de lado a lado, todos
// casi en la misma dirección, como se parte de verdad.
function lajas(ctx, S, cx, cy, r, rnd) {
  const dir = rnd() * Math.PI;
  const n = 2 + ((rnd() * 3) | 0);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = dir + (rnd() - 0.5) * 0.25;
    const off = (rnd() - 0.5) * r * 1.5;
    const nx = Math.cos(a + Math.PI / 2) * off;
    const ny = Math.sin(a + Math.PI / 2) * off;
    const dx = Math.cos(a) * S;
    const dy = Math.sin(a) * S;
    for (const [d, col, w] of [
      [-1.2, `rgba(226,230,240,0.1)`, 1],
      [0, `rgba(12,14,19,0.3)`, Math.max(1, r * 0.05)],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(cx + nx - dx + d, cy + ny - dy + d);
      ctx.lineTo(cx + nx + dx + d, cy + ny + dy + d);
      ctx.stroke();
    }
  }
}

// Huecos de la caliza: la disuelve el agua y queda picada. Cada hueco es sombra
// arriba y un filo claro abajo, al revés que un bulto.
function huecos(ctx, cx, cy, r, rnd) {
  const n = 5 + ((rnd() * 7) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.05 + rnd() * 0.1);
    ctx.fillStyle = 'rgba(12,13,17,0.34)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,238,230,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LUZ + 0.6, LUZ + 2.6);
    ctx.stroke();
  }
}

// Líquen: manchas verdosas pegadas al lado de sombra, que es donde aguanta la
// humedad. Cada mancha son varios círculos sueltos, nunca un borde limpio.
function liquen(ctx, cx, cy, r, rnd) {
  const tono = ['#6f7f4a', '#7d8f5c', '#8a9a63', '#5f7350'][(rnd() * 4) | 0];
  const manchas = 1 + ((rnd() * 3) | 0);
  for (let m = 0; m < manchas; m++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 2.2;
    const d = r * (0.25 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    const esc = r * (0.16 + rnd() * 0.22);
    const grumos = 5 + ((rnd() * 7) | 0);
    for (let i = 0; i < grumos; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * esc;
      ctx.fillStyle = `rgba(${aRGB(tono).join(',')},${0.1 + rnd() * 0.14})`;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, esc * (0.3 + rnd() * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Guijarros del conglomerado: cantos redondeados de otra piedra metidos en la
// pasta. Cada uno lleva su propia luz y su sombra, como los de verdad.
function guijarros(ctx, cx, cy, r, rnd) {
  const tonos = ['#8d8375', '#6e6a62', '#9c8f78', '#5d6470', '#a49a86'];
  const n = 5 + ((rnd() * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.72;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.12 + rnd() * 0.16);
    const tono = tonos[(rnd() * tonos.length) | 0];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.scale(1, 0.62 + rnd() * 0.3);   // cantos aplastados, no bolas
    const g = ctx.createRadialGradient(LX * rad * 0.4, LY * rad * 0.4, rad * 0.1, 0, 0, rad);
    g.addColorStop(0, mix(tono, '#efeade', 0.35));
    g.addColorStop(1, mix(tono, '#15171c', 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    // Surco donde el canto se hunde en la pasta.
    ctx.strokeStyle = 'rgba(12,13,17,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function pintarRoca(semilla, r, color) {
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

  // Motas: unas brillan (cuarzo) y otras son huecos oscuros.
  const [nMotas, brillo] = mat.motas;
  const motas = (nMotas * (0.6 + rnd() * 0.8)) | 0;
  for (let i = 0; i < motas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.92;
    const rad = 0.6 + rnd() * (r * 0.06);
    ctx.fillStyle = rnd() < brillo
      ? `rgba(255,252,244,${0.05 + rnd() * 0.12})`
      : `rgba(14,15,19,${0.1 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grietas: una línea quebrada con su reflejo claro al lado, que es lo que
  // hace que se lea como hendidura y no como raya pintada.
  const [gmin, gmax] = mat.grietas;
  const grietas = gmin + ((rnd() * (gmax - gmin + 1)) | 0);
  for (let i = 0; i < grietas; i++) {
    let a = rnd() * Math.PI * 2;
    let x = cx + Math.cos(a) * r * 0.75;
    let y = cy + Math.sin(a) * r * 0.75;
    a += Math.PI + (rnd() - 0.5) * 0.9;
    const pasos = 3 + ((rnd() * 4) | 0);
    const camino = [{ x, y }];
    for (let s = 0; s < pasos; s++) {
      a += (rnd() - 0.5) * 1.1;
      const paso = r * (0.16 + rnd() * 0.22);
      x += Math.cos(a) * paso;
      y += Math.sin(a) * paso;
      camino.push({ x, y });
    }
    const traza = (dx, dy, col, w) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(camino[0].x + dx, camino[0].y + dy);
      for (let s = 1; s < camino.length; s++) ctx.lineTo(camino[s].x + dx, camino[s].y + dy);
      ctx.stroke();
    };
    traza(LX * 0.9, LY * 0.9, 'rgba(236,232,224,0.13)', 1.1);
    traza(0, 0, 'rgba(10,11,14,0.42)', Math.max(1, r * 0.045));
  }

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
