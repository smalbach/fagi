// El suelo. Se pinta UNA vez en un lienzo del tamaño del mundo y luego solo se
// estampa: así puede llevar relieve, manchas de tierra y musgo, grano, guijarros
// y matas sin costar nada por fotograma.
//
// No hay "una textura de suelo": hay un terreno. Dos campos de ruido —altura y
// humedad— deciden a la vez el color y la luz de cada trozo, y los detalles se
// siembran donde les toca: las matas donde hay humedad, los guijarros y las
// grietas donde la tierra está seca.
//
// La luz es la misma que la de la roca y el nido: arriba a la izquierda. Es lo
// que hace que las tres cosas parezcan del mismo sitio.
//
// Al final todo se vela hacia el color de fondo: el suelo es escenario, no
// protagonista, y Fagi y los puntos tienen que seguir leyéndose encima.

import { WORLD, TERRAIN } from './config.js';
import { lienzo, azar, semillaDe, ruido } from './sprite-kit.js';

// Un solo suelo guardado: el del mundo que hay ahora. Cada lienzo es del tamaño
// de la pantalla, y al reiniciar el anterior ya no vale para nada.
let suelo = null;             // { clave, img }

// Microtextura fotográfica. El terreno sigue siendo procedural —la altura,
// humedad, grava y la colocación de cada detalle cambian con la semilla—; esta
// imagen solo aporta el nivel microscópico de materia que el ruido sintético no
// consigue: terrones, fibras, piedrecitas y restos orgánicos reconocibles.
const texturaBosque = new Image();
let texturaLista = false;
texturaBosque.onload = () => { texturaLista = true; suelo = null; };
texturaBosque.src = '/assets/forest-floor.webp';

const LUZ = -Math.PI * 0.72;
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

// Paleta en canales, no en hex: el paso de color va por píxel y aquí se mezcla
// miles de veces.
const TIERRA = [72, 63, 49];   // tierra desnuda, parda y apagada
const SECO   = [98, 83, 57];   // lo alto y expuesto: polvo, más claro
const MUSGO  = [49, 70, 43];   // lo bajo y húmedo: verde sucio
const GRAVA  = [82, 77, 65];   // pedregal: gris terroso, no cemento
const HOJA   = ['#5d6b46', '#6e7b4c', '#495c3d', '#7a7f4e'];  // matas
const RAMA   = ['#4a3a28', '#5c4831', '#3d3020'];             // hojarasca
const SECA   = ['#6b5227', '#7d5c2c', '#54401f', '#6a5a30'];  // hoja caída
const MUSGO_T = ['#3f5c34', '#4a6b3c', '#35502f'];            // musgo

export function drawTerrain(ctx, world) {
  ctx.drawImage(sueloDe(world), 0, 0);
}

function sueloDe(world) {
  const w = Math.round(world.width);
  const h = Math.round(world.height);
  const clave = `${semillaDe(world)}|${w}|${h}`;
  if (suelo?.clave === clave) return suelo.img;
  suelo = { clave, img: pintarSuelo(world.seed, w, h) };
  return suelo.img;
}

// Grano de zoom. El suelo se cuece UNA vez al tamaño del mundo, así que al
// acercarse se estira y pierde el tacto: repintarlo por cada escalón de zoom
// costaría un lienzo de varios millones de píxeles. Esta capa va en píxeles de
// PANTALLA, se repite como un azulejo y devuelve el grano que el estirado se
// come, sin repintar nada. Cuanto más cerca, más se nota.
let azulejo = null;
let patron = null;

export function drawGranoZoom(ctx, zoom) {
  if (zoom <= 1.12) return;
  azulejo ??= ruido(160, 160, azar(0x51a3d7), 3, 3);
  patron ??= ctx.createPattern(azulejo, 'repeat');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.22, (zoom - 1) * 0.11);
  ctx.fillStyle = patron;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Detalle de cerca. El suelo se cuece UNA vez al tamaño del mundo, así que al
// acercarse se estira: el grano de pantalla devuelve el tacto, pero no devuelve
// COSAS. De cerca, un suelo sin una china, una brizna o un trozo de hoja a
// tamaño de Fagi se lee como una foto borrosa.
//
// Esta capa siembra esas cosas en coordenadas de MUNDO, por celdas y con semilla
// propia de cada celda: la misma china sale siempre en el mismo sitio, así que
// al mover la cámara el suelo no hierve. Solo se siembra lo que se ve, y la
// cantidad sube con el aumento: de lejos no hay nada que pagar.
const CELDA = 96;              // lado de celda, en píxeles de mundo

export function drawDetalleCerca(ctx, world, cam, canvas) {
  const fuerza = Math.min(1, (cam.zoom - 1.25) / 1.4);
  if (fuerza <= 0) return;

  const vw = canvas.width / cam.zoom;
  const vh = canvas.height / cam.zoom;
  const i0 = Math.floor((cam.x - vw / 2) / CELDA);
  const i1 = Math.ceil((cam.x + vw / 2) / CELDA);
  const j0 = Math.floor((cam.y - vh / 2) / CELDA);
  const j1 = Math.ceil((cam.y + vh / 2) / CELDA);
  const semilla = semillaDe(world);

  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ox = i * CELDA;
      const oy = j * CELDA;
      if (ox > world.width || oy > world.height || ox + CELDA < 0 || oy + CELDA < 0) continue;
      const rnd = azar((semilla ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0);
      celda(ctx, ox, oy, rnd, fuerza);
    }
  }
  ctx.globalAlpha = 1;
}

// Lo que hay en un palmo de tierra: arenilla, alguna china, una brizna y un
// trozo de hoja. En este orden, que es el que tienen en el suelo.
function celda(ctx, ox, oy, rnd, fuerza) {
  const dentro = () => [ox + rnd() * CELDA, oy + rnd() * CELDA];

  ctx.globalAlpha = fuerza;
  for (let k = 0, n = Math.round(34 * fuerza); k < n; k++) {
    const [x, y] = dentro();
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(228,216,188,${0.05 + rnd() * 0.1})`
      : `rgba(12,13,16,${0.07 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 0.8 + rnd() * 0.7, 0.8);
  }

  for (let k = 0, n = Math.round(7 * fuerza); k < n; k++) {
    const [x, y] = dentro();
    guijarro(ctx, x, y, 0.8 + rnd() * 1.8, rnd);
  }

  for (let k = 0, n = Math.round(5 * fuerza); k < n; k++) {
    const [x, y] = dentro();
    mata(ctx, x, y, 2 + rnd() * 3.5, rnd);
  }

  for (let k = 0, n = Math.round(4 * fuerza); k < n; k++) {
    const [x, y] = dentro();
    hoja(ctx, x, y, 2.5 + rnd() * 3.5, rnd);
  }

  for (let k = 0, n = Math.round(3 * fuerza); k < n; k++) {
    const [x, y] = dentro();
    hojarasca(ctx, x, y, 2 + rnd() * 4, rnd);
  }
  ctx.globalAlpha = 1;
}

// Orilla: lo único del suelo que NO se cuece en el lienzo. El jugador pone y
// quita charcos, y una mancha de humedad sin agua debajo sería mentira, así que
// se pinta cada fotograma pegada a su charco.
export function drawShore(ctx, o, r) {
  const g = ctx.createRadialGradient(o.x, o.y, r * 0.9, o.x, o.y, r * TERRAIN.orilla);
  g.addColorStop(0, 'rgba(24,30,28,0.55)');
  g.addColorStop(0.45, 'rgba(30,38,34,0.3)');
  g.addColorStop(1, 'rgba(30,38,34,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, o.y, r * TERRAIN.orilla, 0, Math.PI * 2);
  ctx.fill();
}

// Ruido de valor con varias octavas, muestreable en cualquier punto del mundo.
// El de sprite-kit devuelve un lienzo; aquí hace falta el número, porque el
// mismo campo decide el color de un píxel y dónde nace una mata.
function campo(w, h, rnd, celda, octavas) {
  const capas = [];
  for (let o = 0; o < octavas; o++) {
    const paso = Math.max(3, celda / 2 ** o);
    const gw = Math.ceil(w / paso) + 2;
    const gh = Math.ceil(h / paso) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    capas.push({ paso, gw, gh, g });
  }

  const suave = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    let v = 0;
    let peso = 0;
    for (let o = 0; o < capas.length; o++) {
      const { paso, gw, gh, g } = capas[o];
      const fx = Math.min(Math.max(x, 0) / paso, gw - 2);
      const fy = Math.min(Math.max(y, 0) / paso, gh - 2);
      const ix = fx | 0;
      const iy = fy | 0;
      const tx = suave(fx - ix);
      const ty = suave(fy - iy);
      const arriba = g[iy * gw + ix] + (g[iy * gw + ix + 1] - g[iy * gw + ix]) * tx;
      const abajo = g[(iy + 1) * gw + ix] + (g[(iy + 1) * gw + ix + 1] - g[(iy + 1) * gw + ix]) * tx;
      const amp = 1 / (o + 1);
      v += (arriba + (abajo - arriba) * ty) * amp;
      peso += amp;
    }
    return v / peso;
  };
}

function lerp(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Color de un trozo de suelo: tierra de base, más seca cuanto más alto, más
// verde cuanto más húmedo, y pedregal donde asoma la piedra.
function tono(alto, humedad, piedra) {
  let c = lerp(TIERRA, SECO, Math.max(0, (alto - 0.45) / 0.55));
  c = lerp(c, MUSGO, Math.max(0, (humedad - TERRAIN.musgoDesde) / (1 - TERRAIN.musgoDesde)));
  return lerp(c, GRAVA, Math.max(0, (piedra - TERRAIN.gravaDesde) / (1 - TERRAIN.gravaDesde)));
}

// Base: color y luz de golpe, en una rejilla basta que luego se estira. El
// relieve no se dibuja, se ilumina: la pendiente del campo de altura decide si
// una ladera mira a la luz o se queda a la sombra. Es lo que convierte una
// mancha de ruido en lomas.
function pintarBase(ctx, w, h, alto, humedad, piedra) {
  const paso = TERRAIN.celdaLuz;
  const gw = Math.ceil(w / paso);
  const gh = Math.ceil(h / paso);
  const c = lienzo(gw, gh);
  const bctx = c.getContext('2d');
  const img = bctx.createImageData(gw, gh);

  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = i * paso;
      const y = j * paso;
      const a = alto(x, y);
      const col = tono(a, humedad(x, y), piedra(x, y));

      // Pendiente por diferencias: hacia dónde cae el terreno aquí.
      const dx = (alto(x + paso, y) - alto(x - paso, y)) * TERRAIN.relieve;
      const dy = (alto(x, y + paso) - alto(x, y - paso)) * TERRAIN.relieve;
      const luz = -(dx * LX + dy * LY);
      // Lo hondo recibe menos cielo: se apaga un poco aunque esté llano.
      const factor = 1 + luz + (a - 0.5) * TERRAIN.hondo;

      const k = (j * gw + i) * 4;
      img.data[k] = Math.max(0, Math.min(255, col[0] * factor));
      img.data[k + 1] = Math.max(0, Math.min(255, col[1] * factor));
      img.data[k + 2] = Math.max(0, Math.min(255, col[2] * factor));
      img.data[k + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, 0, 0, w, h);
}

// Grano: dos capas de ruido estiradas. La fina es el terrón; la basta, las
// manchas grandes de tierra de distinto color. Se generan a menor tamaño y se
// estiran, que es más barato y encima no deja costuras.
function pintarGrano(ctx, w, h, rnd) {
  // El terrón va a tamaño real: estirado se emborrona y el suelo pierde el
  // tacto. Es lo más caro de todo el suelo y solo se paga una vez.
  const fino = ruido(w, h, rnd, 3, 3);
  const basto = ruido((w / 5) | 0, (h / 5) | 0, rnd, 7, 2);

  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = TERRAIN.grano;
  ctx.drawImage(fino, 0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = TERRAIN.manchas;
  ctx.drawImage(basto, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// La foto se usa como la materia visible del suelo y deja transparentar el
// color de los biomas que hay debajo. Se repite a escala pequeña: las hojas,
// ramitas y piedras son microdetalle del mundo, no objetos del tamaño de Fagi.
function pintarMicrotextura(ctx, w, h, semilla) {
  if (!texturaLista) return;
  const rnd = azar((semilla ^ 0x6a09e667) >>> 0);
  const patron = ctx.createPattern(texturaBosque, 'repeat');
  if (!patron) return;
  const lado = texturaBosque.naturalWidth * TERRAIN.escalaFoto;
  const dx = -rnd() * lado;
  const dy = -rnd() * lado;
  patron.setTransform(new DOMMatrix()
    .translate(dx, dy)
    .scale(TERRAIN.escalaFoto));

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = TERRAIN.foto;
  ctx.filter = 'brightness(1.1) saturate(0.86) contrast(0.96)';
  ctx.fillStyle = patron;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Luz moteada muy abierta. Las manchas tienen bordes blandos y direccionalidad
// común; así parecen venir de huecos en un dosel lejano y no círculos pintados.
function pintarClaros(ctx, w, h, rnd, humedad) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < TERRAIN.claros; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 24 + rnd() * 90;
    const fuerza = 0.025 + Math.max(0, 0.62 - humedad(x, y)) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(LUZ + (rnd() - 0.5) * 0.35);
    ctx.scale(1, 0.38 + rnd() * 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,235,185,${fuerza})`);
    g.addColorStop(0.55, `rgba(240,220,170,${fuerza * 0.55})`);
    g.addColorStop(1, 'rgba(240,220,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Un guijarro: no es un punto, es una piedra pequeña. Lo que la delata es que
// tiene filo claro por donde entra la luz y sombra pegada por el otro lado.
function guijarro(ctx, x, y, r, rnd) {
  // Medio enterrada: apenas más clara que la tierra. Si destaca, deja de ser
  // una piedra en el suelo y parece algo tirado encima.
  const gris = 52 + ((rnd() * 34) | 0);
  const giro = rnd() * Math.PI;
  const plano = 0.5 + rnd() * 0.45;

  ctx.fillStyle = 'rgba(10,12,15,0.34)';
  ctx.beginPath();
  ctx.ellipse(x - LX * r * 0.45, y - LY * r * 0.45, r * 1.05, r * plano * 1.05, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${gris},${gris - 2},${(gris * 0.92) | 0})`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * plano, giro, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${gris + 46},${gris + 44},${gris + 36},0.34)`;
  ctx.lineWidth = Math.max(0.5, r * 0.26);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.85, r * plano * 0.85, giro, LUZ - 1.1, LUZ + 1.1);
  ctx.stroke();
}

// Una mata: tres o cuatro briznas que salen del mismo sitio, curvadas y de
// alturas distintas. Todas se apoyan en una sombrita, si no flotan.
function mata(ctx, x, y, alto, rnd) {
  ctx.fillStyle = 'rgba(12,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, alto * 0.4, alto * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const briznas = 2 + ((rnd() * 3) | 0);
  const tono = HOJA[(rnd() * HOJA.length) | 0];
  ctx.lineCap = 'round';
  for (let i = 0; i < briznas; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
    const largo = alto * (0.6 + rnd() * 0.8);
    const cx = x + Math.cos(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.4;
    const cy = y + Math.sin(a) * largo * 0.5;
    ctx.strokeStyle = tono;
    ctx.globalAlpha = 0.45 + rnd() * 0.4;
    ctx.lineWidth = Math.max(0.7, alto * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + (rnd() - 0.5) * 2, y);
    ctx.quadraticCurveTo(cx, cy, x + Math.cos(a) * largo, y + Math.sin(a) * largo);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Hojarasca: ramitas y hojas secas tiradas por el suelo. Rompen la sensación de
// alfombra uniforme más que cualquier textura.
function hojarasca(ctx, x, y, largo, rnd) {
  const a = rnd() * Math.PI * 2;
  ctx.strokeStyle = RAMA[(rnd() * RAMA.length) | 0];
  ctx.globalAlpha = 0.5 + rnd() * 0.4;
  ctx.lineWidth = 0.8 + rnd();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Una ramita no es recta: se quiebra una vez.
  const mx = x + Math.cos(a) * largo * 0.6;
  const my = y + Math.sin(a) * largo * 0.6;
  ctx.lineTo(mx, my);
  const b = a + (rnd() - 0.5) * 1.2;
  ctx.lineTo(mx + Math.cos(b) * largo * 0.5, my + Math.sin(b) * largo * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Una hoja caída. La hojarasca de ramitas sola no basta: lo que de verdad cubre
// el suelo de un bosque son hojas, y cada una se lee por su forma —punta, nervio
// y su sombra debajo— aunque mida cuatro píxeles.
function hoja(ctx, x, y, largo, rnd) {
  const ancho = largo * (0.3 + rnd() * 0.2);
  const giro = rnd() * Math.PI;
  const tono = SECA[(rnd() * SECA.length) | 0];

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

  // Su sombra: la hoja está caída ENCIMA de la tierra, no impresa en ella.
  ctx.fillStyle = 'rgba(10,12,15,0.3)';
  forma(-LX * largo * 0.1, -LY * largo * 0.1 + largo * 0.06);
  ctx.fill();

  ctx.globalAlpha = 0.55 + rnd() * 0.35;
  ctx.fillStyle = tono;
  forma(0, 0);
  ctx.fill();

  // El nervio, y el canto claro por donde la hoja se curva hacia la luz.
  ctx.strokeStyle = 'rgba(28,20,10,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-largo * 0.45, 0);
  ctx.lineTo(largo * 0.45, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(228,208,168,0.22)';
  ctx.beginPath();
  ctx.moveTo(-largo * 0.42, -ancho * 0.28);
  ctx.quadraticCurveTo(0, -ancho * 0.8, largo * 0.42, -ancho * 0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Musgo: una alfombra baja de grumos, no briznas. Sale en lo hondo y húmedo,
// que es donde no llega el sol y no se seca.
function musgo(ctx, x, y, r, rnd) {
  const tono = MUSGO_T[(rnd() * MUSGO_T.length) | 0];
  const grumos = 8 + ((rnd() * 10) | 0);
  for (let i = 0; i < grumos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    const gx = x + Math.cos(a) * d;
    const gy = y + Math.sin(a) * d * 0.7;
    const rad = r * (0.16 + rnd() * 0.26);
    // Cada grumo con su lado a la luz: una mancha lisa se leería como pintura.
    ctx.fillStyle = tono;
    ctx.globalAlpha = 0.16 + rnd() * 0.2;
    ctx.beginPath();
    ctx.arc(gx, gy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(186,206,150,0.14)';
    ctx.beginPath();
    ctx.arc(gx + LX * rad * 0.3, gy + LY * rad * 0.3, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Una raíz asomada: el lomo de una raíz que cruza el suelo y se vuelve a
// enterrar. Va más clara por arriba y con su sombra pegada debajo.
function raiz(ctx, x, y, largo, rnd) {
  let a = rnd() * Math.PI * 2;
  const camino = [{ x, y }];
  const pasos = 3 + ((rnd() * 3) | 0);
  for (let s = 0; s < pasos; s++) {
    a += (rnd() - 0.5) * 0.9;
    x += Math.cos(a) * (largo / pasos);
    y += Math.sin(a) * (largo / pasos);
    camino.push({ x, y });
  }
  const grosor = 1.4 + rnd() * 2.2;
  const traza = (dx, dy, col, w) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(camino[0].x + dx, camino[0].y + dy);
    for (let s = 1; s < camino.length; s++) ctx.lineTo(camino[s].x + dx, camino[s].y + dy);
    ctx.stroke();
  };
  traza(-LX * grosor * 0.5, -LY * grosor * 0.5, 'rgba(10,11,14,0.3)', grosor * 1.2);
  traza(0, 0, 'rgba(58,42,26,0.55)', grosor);
  traza(LX * grosor * 0.3, LY * grosor * 0.3, 'rgba(142,116,76,0.28)', grosor * 0.4);
}

// Grieta de tierra seca: una línea quebrada oscura con su reflejo claro al lado.
// Igual que en la roca, el reflejo es lo que la hace hendidura y no raya.
function grieta(ctx, x, y, largo, rnd) {
  let a = rnd() * Math.PI * 2;
  const camino = [{ x, y }];
  const pasos = 4 + ((rnd() * 5) | 0);
  for (let s = 0; s < pasos; s++) {
    a += (rnd() - 0.5) * 1.3;
    x += Math.cos(a) * (largo / pasos);
    y += Math.sin(a) * (largo / pasos);
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
  traza(LX, LY, 'rgba(180,170,148,0.1)', 1);
  traza(0, 0, 'rgba(12,13,16,0.3)', 1.3);
}

// Siembra: tira puntos al azar y deja que el terreno decida si ahí va algo.
// `quiere` devuelve 0..1 y se compara con un dado, así que el detalle no aparece
// de golpe en una frontera: se va aclarando.
function sembrar(w, h, n, rnd, quiere, poner) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (rnd() < quiere(x, y)) poner(x, y);
  }
}

function pintarSuelo(semilla, w, h) {
  const rnd = azar(semilla);
  const c = lienzo(w, h);
  const ctx = c.getContext('2d');

  const alto = campo(w, h, rnd, TERRAIN.escalaAltura, 5);
  const humedad = campo(w, h, rnd, TERRAIN.escalaHumedad, 3);
  const piedra = campo(w, h, rnd, TERRAIN.escalaGrava, 2);

  pintarBase(ctx, w, h, alto, humedad, piedra);
  pintarMicrotextura(ctx, w, h, semilla);
  pintarGrano(ctx, w, h, rnd);
  pintarClaros(ctx, w, h, rnd, humedad);

  // Motas de tierra: lo más pequeño, debajo de todo lo demás.
  for (let i = 0; i < TERRAIN.motas; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(226,216,190,${0.04 + rnd() * 0.08})`
      : `rgba(14,15,18,${0.06 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 1 + (rnd() < 0.25 ? 1 : 0), 1);
  }

  // Los guijarros salen donde asoma la piedra; las grietas, donde está seco y
  // sin verde; las matas, donde hay humedad. Cada cosa en su sitio.
  sembrar(w, h, TERRAIN.guijarros, rnd,
    (x, y) => Math.max(0, piedra(x, y) - 0.35) * 1.6,
    (x, y) => guijarro(ctx, x, y, 1.2 + rnd() * 3.2, rnd));

  sembrar(w, h, TERRAIN.grietas, rnd,
    (x, y) => Math.max(0, alto(x, y) - 0.55) * Math.max(0, 0.6 - humedad(x, y)) * 4,
    (x, y) => grieta(ctx, x, y, 14 + rnd() * 34, rnd));

  sembrar(w, h, TERRAIN.matas, rnd,
    (x, y) => Math.max(0, humedad(x, y) - TERRAIN.musgoDesde) * 2.2,
    (x, y) => mata(ctx, x, y, 3 + rnd() * 6, rnd));

  sembrar(w, h, TERRAIN.hojarasca, rnd,
    (x, y) => 0.35 + humedad(x, y) * 0.5,
    (x, y) => hojarasca(ctx, x, y, 3 + rnd() * 7, rnd));

  // El musgo va en lo hondo y húmedo; las raíces asoman donde hay verde, que es
  // donde hay algo que las eche; y la hoja caída cae por todas partes, pero se
  // amontona donde no la barre el sol.
  sembrar(w, h, TERRAIN.musgo, rnd,
    (x, y) => Math.max(0, humedad(x, y) - 0.58) * Math.max(0, 0.6 - alto(x, y)) * 6,
    (x, y) => musgo(ctx, x, y, 3 + rnd() * 7, rnd));

  sembrar(w, h, TERRAIN.raices, rnd,
    (x, y) => Math.max(0, humedad(x, y) - TERRAIN.musgoDesde) * 2,
    (x, y) => raiz(ctx, x, y, 18 + rnd() * 40, rnd));

  sembrar(w, h, TERRAIN.hojas, rnd,
    (x, y) => 0.3 + humedad(x, y) * 0.6,
    (x, y) => hoja(ctx, x, y, 3.5 + rnd() * 5, rnd));

  // Los bordes del mundo se apagan: el mapa termina, no se corta.
  const vineta = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.32,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  vineta.addColorStop(0, 'rgba(0,0,0,0)');
  vineta.addColorStop(1, `rgba(0,0,0,${TERRAIN.vineta})`);
  ctx.fillStyle = vineta;
  ctx.fillRect(0, 0, w, h);

  // Velo del color de fondo: unifica todo y baja el contraste del suelo, que
  // debe quedar POR DEBAJO del de Fagi y los puntos.
  ctx.globalAlpha = TERRAIN.velo;
  ctx.fillStyle = WORLD.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  return c;
}
