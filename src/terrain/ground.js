// El suelo cocido: un lienzo del tamaño del mundo que se pinta una vez por
// mundo y luego solo se estampa. Aquí está el orden en que se pinta; cada capa
// vive en relieve.js y cada detalle en detalles.js.

import { WORLD, TERRAIN } from '../config.js';
import { canvasOf, seededRng, seedFor } from '../sprite-kit.js';
import { field, paintBase, paintGrain, paintClearings } from './relief.js';
import { pebble, bush, litter, leaf, moss, root, crack } from './details.js';

// Un solo suelo guardado: el del mundo que hay ahora. Cada lienzo es del tamaño
// de la pantalla, y al reiniciar el anterior ya no vale para nada.
let ground = null;             // { clave, img }

// Microtextura fotográfica. El terreno sigue siendo procedural —la altura,
// humedad, grava y la colocación de cada detalle cambian con la semilla—; esta
// imagen solo aporta el nivel microscópico de materia que el ruido sintético no
// consigue: terrones, fibras, piedrecitas y restos orgánicos reconocibles.
const forestTexture = new Image();
let textureReady = false;
forestTexture.onload = () => { textureReady = true; ground = null; };
forestTexture.src = '/assets/forest-floor.webp';

export function drawTerrain(ctx, world) {
  ctx.drawImage(groundOf(world), 0, 0);
}

function groundOf(world) {
  const w = Math.round(world.width);
  const h = Math.round(world.height);
  const key = `${seedFor(world)}|${w}|${h}`;
  if (ground?.key === key) return ground.img;
  ground = { key, img: paintGround(world.seed, w, h) };
  return ground.img;
}

function paintGround(seedOf, w, h) {
  const rnd = seededRng(seedOf);
  const c = canvasOf(w, h);
  const ctx = c.getContext('2d');

  const tall = field(w, h, rnd, TERRAIN.heightScale, 5);
  const moisture = field(w, h, rnd, TERRAIN.moistureScale, 3);
  const stone = field(w, h, rnd, TERRAIN.gravelScale, 2);

  paintBase(ctx, w, h, tall, moisture, stone);
  paintMicrotexture(ctx, w, h, seedOf);
  paintGrain(ctx, w, h, rnd);
  paintClearings(ctx, w, h, rnd, moisture);
  paintSpecks(ctx, w, h, rnd);
  seedDetails(ctx, w, h, rnd, { tall, moisture, stone });
  paintVignette(ctx, w, h);
  paintVeil(ctx, w, h);

  return c;
}

// La foto se usa como la materia visible del suelo y deja transparentar el
// color de los biomas que hay debajo. Se repite a escala pequeña: las hojas,
// ramitas y piedras son microdetalle del mundo, no objetos del tamaño de Fagi.
function paintMicrotexture(ctx, w, h, seedOf) {
  if (!textureReady) return;
  const rnd = seededRng((seedOf ^ 0x6a09e667) >>> 0);
  const pattern = ctx.createPattern(forestTexture, 'repeat');
  if (!pattern) return;
  const sideOf = forestTexture.naturalWidth * TERRAIN.photoScale;
  const dx = -rnd() * sideOf;
  const dy = -rnd() * sideOf;
  pattern.setTransform(new DOMMatrix()
    .translate(dx, dy)
    .scale(TERRAIN.photoScale));

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = TERRAIN.photo;
  ctx.filter = 'brightness(1.1) saturate(0.86) contrast(0.96)';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Motas de tierra: lo más pequeño, debajo de todo lo demás.
function paintSpecks(ctx, w, h, rnd) {
  for (let i = 0; i < TERRAIN.specks; i++) {
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
function sow(w, h, n, rnd, wants, put) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (rnd() < wants(x, y)) put(x, y);
  }
}

function seedDetails(ctx, w, h, rnd, { tall, moisture, stone }) {
  // Los guijarros salen donde asoma la piedra; las grietas, donde está seco y
  // sin verde; las matas, donde hay humedad. Cada cosa en su sitio.
  sow(w, h, TERRAIN.pebbles, rnd,
    (x, y) => Math.max(0, stone(x, y) - 0.35) * 1.6,
    (x, y) => pebble(ctx, x, y, 1.2 + rnd() * 3.2, rnd));

  sow(w, h, TERRAIN.cracks, rnd,
    (x, y) => Math.max(0, tall(x, y) - 0.55) * Math.max(0, 0.6 - moisture(x, y)) * 4,
    (x, y) => crack(ctx, x, y, 14 + rnd() * 34, rnd));

  sow(w, h, TERRAIN.bushes, rnd,
    (x, y) => Math.max(0, moisture(x, y) - TERRAIN.mossFrom) * 2.2,
    (x, y) => bush(ctx, x, y, 3 + rnd() * 6, rnd));

  sow(w, h, TERRAIN.litter, rnd,
    (x, y) => 0.35 + moisture(x, y) * 0.5,
    (x, y) => litter(ctx, x, y, 3 + rnd() * 7, rnd));

  // El musgo va en lo hondo y húmedo; las raíces asoman donde hay verde, que es
  // donde hay algo que las eche; y la hoja caída cae por todas partes, pero se
  // amontona donde no la barre el sol.
  sow(w, h, TERRAIN.moss, rnd,
    (x, y) => Math.max(0, moisture(x, y) - 0.58) * Math.max(0, 0.6 - tall(x, y)) * 6,
    (x, y) => moss(ctx, x, y, 3 + rnd() * 7, rnd));

  sow(w, h, TERRAIN.roots, rnd,
    (x, y) => Math.max(0, moisture(x, y) - TERRAIN.mossFrom) * 2,
    (x, y) => root(ctx, x, y, 18 + rnd() * 40, rnd));

  sow(w, h, TERRAIN.leaves, rnd,
    (x, y) => 0.3 + moisture(x, y) * 0.6,
    (x, y) => leaf(ctx, x, y, 3.5 + rnd() * 5, rnd));
}

// Los bordes del mundo se apagan: el mapa termina, no se corta.
function paintVignette(ctx, w, h) {
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.32,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${TERRAIN.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

// Velo del color de fondo: unifica todo y baja el contraste del suelo, que
// debe quedar POR DEBAJO del de Fagi y los puntos.
function paintVeil(ctx, w, h) {
  ctx.globalAlpha = TERRAIN.veil;
  ctx.fillStyle = WORLD.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}
