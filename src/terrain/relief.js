// El terreno antes de los detalles: los campos de ruido que lo deciden todo, el
// color y la luz que salen de ellos, el grano y los claros de sol.

import { TERRAIN } from '../config.js';
import { canvasOf, noise } from '../sprite-kit.js';
import { LIGHT, LX, LY, SOIL, DRY_TONE, MOSS, GRAVEL } from './palette.js';

// Ruido de valor con varias octavas, muestreable en cualquier punto del mundo.
// El de sprite-kit devuelve un lienzo; aquí hace falta el número, porque el
// mismo campo decide el color de un píxel y dónde nace una mata.
export function field(w, h, rnd, cellOf, octaves) {
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    const step = Math.max(3, cellOf / 2 ** o);
    const gw = Math.ceil(w / step) + 2;
    const gh = Math.ceil(h / step) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    layers.push({ step, gw, gh, g });
  }

  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    let v = 0;
    let weight = 0;
    for (let o = 0; o < layers.length; o++) {
      const { step, gw, gh, g } = layers[o];
      const fx = Math.min(Math.max(x, 0) / step, gw - 2);
      const fy = Math.min(Math.max(y, 0) / step, gh - 2);
      const ix = fx | 0;
      const iy = fy | 0;
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const up = g[iy * gw + ix] + (g[iy * gw + ix + 1] - g[iy * gw + ix]) * tx;
      const down = g[(iy + 1) * gw + ix] + (g[(iy + 1) * gw + ix + 1] - g[(iy + 1) * gw + ix]) * tx;
      const amp = 1 / (o + 1);
      v += (up + (down - up) * ty) * amp;
      weight += amp;
    }
    return v / weight;
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
function tone(tall, moisture, stone) {
  let c = lerp(SOIL, DRY_TONE, Math.max(0, (tall - 0.45) / 0.55));
  c = lerp(c, MOSS, Math.max(0, (moisture - TERRAIN.mossFrom) / (1 - TERRAIN.mossFrom)));
  return lerp(c, GRAVEL, Math.max(0, (stone - TERRAIN.gravelFrom) / (1 - TERRAIN.gravelFrom)));
}

// Base: color y luz de golpe, en una rejilla basta que luego se estira. El
// relieve no se dibuja, se ilumina: la pendiente del campo de altura decide si
// una ladera mira a la luz o se queda a la sombra. Es lo que convierte una
// mancha de ruido en lomas.
export function paintBase(ctx, w, h, tall, moisture, stone) {
  const step = TERRAIN.lightCell;
  const gw = Math.ceil(w / step);
  const gh = Math.ceil(h / step);
  const c = canvasOf(gw, gh);
  const bctx = c.getContext('2d');
  const img = bctx.createImageData(gw, gh);

  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = i * step;
      const y = j * step;
      const a = tall(x, y);
      const col = tone(a, moisture(x, y), stone(x, y));

      // Pendiente por diferencias: hacia dónde cae el terreno aquí.
      const dx = (tall(x + step, y) - tall(x - step, y)) * TERRAIN.relief;
      const dy = (tall(x, y + step) - tall(x, y - step)) * TERRAIN.relief;
      const light = -(dx * LX + dy * LY);
      // Lo hondo recibe menos cielo: se apaga un poco aunque esté llano.
      const factor = 1 + light + (a - 0.5) * TERRAIN.deep;

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
export function paintGrain(ctx, w, h, rnd) {
  // El terrón va a tamaño real: estirado se emborrona y el suelo pierde el
  // tacto. Es lo más caro de todo el suelo y solo se paga una vez.
  const thin = noise(w, h, rnd, 3, 3);
  const coarse = noise((w / 5) | 0, (h / 5) | 0, rnd, 7, 2);

  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = TERRAIN.grain;
  ctx.drawImage(thin, 0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = TERRAIN.patches;
  ctx.drawImage(coarse, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Luz moteada muy abierta. Las manchas tienen bordes blandos y direccionalidad
// común; así parecen venir de huecos en un dosel lejano y no círculos pintados.
export function paintClearings(ctx, w, h, rnd, moisture) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < TERRAIN.clearings; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 24 + rnd() * 90;
    const force = 0.025 + Math.max(0, 0.62 - moisture(x, y)) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(LIGHT + (rnd() - 0.5) * 0.35);
    ctx.scale(1, 0.38 + rnd() * 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,235,185,${force})`);
    g.addColorStop(0.55, `rgba(240,220,170,${force * 0.55})`);
    g.addColorStop(1, 'rgba(240,220,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
