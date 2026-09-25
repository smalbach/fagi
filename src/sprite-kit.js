// Herramientas comunes de los sprites pintados (roca, nido): un lienzo en
// memoria, azar repetible, mezcla de colores y ruido de valor.
//
// Viven aparte porque roca y nido pintan la misma clase de materia —piedra y
// tierra— y el grano se hace igual en las dos.

import { aRGB } from './colors.js';

// Escala de detalle: cuántos píxeles de lienzo se pintan por píxel de mundo.
// La cámara la sube al acercarse y los sprites se pintan con el radio
// multiplicado por ella, así que acercarse no estira una imagen vieja: se
// repinta con más píxeles. Como cada sprite se guarda por su radio, subirla
// solo cuesta un repintado.
let escala = 1;

export function setDetalle(v) {
  escala = v;
}

export function detalle() {
  return escala;
}

// Estampa un sprite pintado a escala de detalle: ocupa el tamaño de mundo que
// le toca, con los píxeles que pide el zoom.
export function estampar(ctx, img, x, y, z = escala) {
  const w = img.width / z;
  const h = img.height / z;
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

export function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Mezcla propia: la de colors.js solo acepta hex, y aquí se encadenan mezclas.
export function mix(a, b, t) {
  const [r1, g1, b1] = aRGB(a);
  const [r2, g2, b2] = aRGB(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

// Azar repetible: la misma semilla pinta siempre lo mismo.
export function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A cada objeto se le asigna su semilla la primera vez que se dibuja.
export function semillaDe(o) {
  if (o.seed == null) o.seed = (Math.random() * 1e9) | 0;
  return o.seed;
}

// Ruido de valor: rejilla de números al azar interpolada suave. Con varias
// octavas sale grano de piedra o de tierra en vez de una nube lisa.
export function ruido(w, h, rnd, celda, octavas) {
  const c = lienzo(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const capas = [];
  for (let o = 0; o < octavas; o++) {
    const paso = Math.max(2, celda >> o);
    const gw = Math.ceil(w / paso) + 2;
    const gh = Math.ceil(h / paso) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    capas.push({ paso, gw, g });
  }

  const suave = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      let peso = 0;
      for (let o = 0; o < capas.length; o++) {
        const { paso, gw, g } = capas[o];
        const fx = x / paso;
        const fy = y / paso;
        const ix = fx | 0;
        const iy = fy | 0;
        const tx = suave(fx - ix);
        const ty = suave(fy - iy);
        const a = g[iy * gw + ix];
        const b = g[iy * gw + ix + 1];
        const c2 = g[(iy + 1) * gw + ix];
        const d = g[(iy + 1) * gw + ix + 1];
        const amp = 1 / (o + 1);
        v += (a + (b - a) * tx + ((c2 + (d - c2) * tx) - (a + (b - a) * tx)) * ty) * amp;
        peso += amp;
      }
      const n = Math.round((v / peso) * 255);
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
export function cacheSprite(mapa, clave, pintar, tope = 400) {
  const hecho = mapa.get(clave);
  if (hecho) return hecho;
  if (mapa.size >= tope) mapa.clear();
  const img = pintar();
  mapa.set(clave, img);
  return img;
}
