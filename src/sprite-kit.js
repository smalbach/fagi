// Herramientas comunes de los sprites pintados (roca, nido): un lienzo en
// memoria, azar repetible, mezcla de colores y ruido de valor.
//
// Viven aparte porque roca y nido pintan la misma clase de materia —piedra y
// tierra— y el grano se hace igual en las dos.

import { toRGB } from './colors.js';

// Escala de detalle: cuántos píxeles de lienzo se pintan por píxel de mundo.
// La cámara la sube al acercarse y los sprites se pintan con el radio
// multiplicado por ella, así que acercarse no estira una imagen vieja: se
// repinta con más píxeles. Como cada sprite se guarda por su radio, subirla
// solo cuesta un repintado.
let scaleOf = 1;

export function setDetail(v) {
  scaleOf = v;
}

export function detail() {
  return scaleOf;
}

// Estampa un sprite pintado a escala de detalle: ocupa el tamaño de mundo que
// le toca, con los píxeles que pide el zoom.
export function stamp(ctx, img, x, y, z = scaleOf) {
  const w = img.width / z;
  const h = img.height / z;
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

export function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Mezcla propia: la de colors.js solo acepta hex, y aquí se encadenan mezclas.
export function mix(a, b, t) {
  const [r1, g1, b1] = toRGB(a);
  const [r2, g2, b2] = toRGB(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

// Azar repetible: la misma semilla pinta siempre lo mismo.
export function seededRng(seedOf) {
  let s = seedOf >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A cada objeto se le asigna su semilla la primera vez que se dibuja.
export function seedFor(o) {
  if (o.seed == null) o.seed = (Math.random() * 1e9) | 0;
  return o.seed;
}

// Ruido de valor: rejilla de números al azar interpolada suave. Con varias
// octavas sale grano de piedra o de tierra en vez de una nube lisa.
export function noise(w, h, rnd, cellOf, octaves) {
  const c = canvasOf(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    const step = Math.max(2, cellOf >> o);
    const gw = Math.ceil(w / step) + 2;
    const gh = Math.ceil(h / step) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    layers.push({ step, gw, g });
  }

  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      let weight = 0;
      for (let o = 0; o < layers.length; o++) {
        const { step, gw, g } = layers[o];
        const fx = x / step;
        const fy = y / step;
        const ix = fx | 0;
        const iy = fy | 0;
        const tx = smooth(fx - ix);
        const ty = smooth(fy - iy);
        const a = g[iy * gw + ix];
        const b = g[iy * gw + ix + 1];
        const c2 = g[(iy + 1) * gw + ix];
        const d = g[(iy + 1) * gw + ix + 1];
        const amp = 1 / (o + 1);
        v += (a + (b - a) * tx + ((c2 + (d - c2) * tx) - (a + (b - a) * tx)) * ty) * amp;
        weight += amp;
      }
      const n = Math.round((v / weight) * 255);
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Caché de sprites: el mismo dibujo no se pinta dos veces. Los radios se tocan
// en caliente desde el panel, así que al pasarse de tope se vacía entera en vez
// de crecer sin fin.
export function cacheSprite(mapOf, key, paint, cap = 400) {
  const done = mapOf.get(key);
  if (done) return done;
  if (mapOf.size >= cap) mapOf.clear();
  const img = paint();
  mapOf.set(key, img);
  return img;
}
