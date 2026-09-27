// El terreno antes de los detalles: los campos de ruido que lo deciden todo, el
// color y la luz que salen de ellos, el grano y los claros de sol.

import { TERRAIN } from '../config.js';
import { lienzo, ruido } from '../sprite-kit.js';
import { LUZ, LX, LY, TIERRA, SECO, MUSGO, GRAVA } from './paleta.js';

// Ruido de valor con varias octavas, muestreable en cualquier punto del mundo.
// El de sprite-kit devuelve un lienzo; aquí hace falta el número, porque el
// mismo campo decide el color de un píxel y dónde nace una mata.
export function campo(w, h, rnd, celda, octavas) {
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
export function pintarBase(ctx, w, h, alto, humedad, piedra) {
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
export function pintarGrano(ctx, w, h, rnd) {
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

// Luz moteada muy abierta. Las manchas tienen bordes blandos y direccionalidad
// común; así parecen venir de huecos en un dosel lejano y no círculos pintados.
export function pintarClaros(ctx, w, h, rnd, humedad) {
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
