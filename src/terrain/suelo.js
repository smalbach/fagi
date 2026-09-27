// El suelo cocido: un lienzo del tamaño del mundo que se pinta una vez por
// mundo y luego solo se estampa. Aquí está el orden en que se pinta; cada capa
// vive en relieve.js y cada detalle en detalles.js.

import { WORLD, TERRAIN } from '../config.js';
import { lienzo, azar, semillaDe } from '../sprite-kit.js';
import { campo, pintarBase, pintarGrano, pintarClaros } from './relieve.js';
import { guijarro, mata, hojarasca, hoja, musgo, raiz, grieta } from './detalles.js';

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
  pintarMotas(ctx, w, h, rnd);
  sembrarDetalles(ctx, w, h, rnd, { alto, humedad, piedra });
  pintarVineta(ctx, w, h);
  pintarVelo(ctx, w, h);

  return c;
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

// Motas de tierra: lo más pequeño, debajo de todo lo demás.
function pintarMotas(ctx, w, h, rnd) {
  for (let i = 0; i < TERRAIN.motas; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(226,216,190,${0.04 + rnd() * 0.08})`
      : `rgba(14,15,18,${0.06 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 1 + (rnd() < 0.25 ? 1 : 0), 1);
  }
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

function sembrarDetalles(ctx, w, h, rnd, { alto, humedad, piedra }) {
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
}

// Los bordes del mundo se apagan: el mapa termina, no se corta.
function pintarVineta(ctx, w, h) {
  const vineta = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.32,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  vineta.addColorStop(0, 'rgba(0,0,0,0)');
  vineta.addColorStop(1, `rgba(0,0,0,${TERRAIN.vineta})`);
  ctx.fillStyle = vineta;
  ctx.fillRect(0, 0, w, h);
}

// Velo del color de fondo: unifica todo y baja el contraste del suelo, que
// debe quedar POR DEBAJO del de Fagi y los puntos.
function pintarVelo(ctx, w, h) {
  ctx.globalAlpha = TERRAIN.velo;
  ctx.fillStyle = WORLD.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}
