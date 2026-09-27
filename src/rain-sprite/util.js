// ── Utilities ───────────────────────────────────────────────────────────────

export function hash(a, b, s = 0) {
  const x = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

export const smooth = (x) => x * x * (3 - 2 * x);

// Fractal noise that tiles seamlessly: used for clouds and for gusts.
let noiseTexture = null;
export function noise() {
  if (noiseTexture) return noiseTexture;
  const N = 256;
  const c = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(N, N)
    : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const octave = (x, y, cells, seedOf) => {
    const fx = (x / N) * cells;
    const fy = (y / N) * cells;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const v = (i, j) => hash(((x0 + i) % cells + cells) % cells, ((y0 + j) % cells + cells) % cells, seedOf);
    const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx;
    const b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
    return a + (b - a) * ty;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = octave(x, y, 4, 1) * 0.55 + octave(x, y, 8, 2) * 0.27 + octave(x, y, 16, 3) * 0.13 + octave(x, y, 32, 4) * 0.05;
      const k = (y * N + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(Math.max(0, Math.min(1, (n - 0.35) * 2.2)) * 255);
    }
  }
  g.putImageData(img, 0, 0);
  noiseTexture = c;
  return c;
}

// Noise tiles, scaled and offset, covering the given rectangle.
export function tessellate(ctx, img, sideOf, ox, oy, x0, y0, x1, y1) {
  const sx = x0 - ((((x0 - ox) % sideOf) + sideOf) % sideOf);
  const sy = y0 - ((((y0 - oy) % sideOf) + sideOf) % sideOf);
  for (let y = sy; y < y1; y += sideOf) {
    for (let x = sx; x < x1; x += sideOf) ctx.drawImage(img, x, y, sideOf, sideOf);
  }
}

// How many canvas pixels fit in one screen pixel. The canvas is as big as the
// world and the browser shrinks it: without this a thin line gets lost.
export function screen(canvas) {
  const w = canvas.clientWidth || canvas.width;
  return Math.max(1, canvas.width / w);
}

// What the camera lets you see, in world coordinates.
export function sight(ctx) {
  const m = ctx.getTransform();
  const z = m.a || 1;
  const x0 = -m.e / z;
  const y0 = -m.f / z;
  return { x0, y0, x1: x0 + ctx.canvas.width / z, y1: y0 + ctx.canvas.height / z, z };
}

export function windOf(world) {
  const a = world.wind?.angle ?? 0;
  return { x: Math.cos(a) * 0.85, y: Math.sin(a) * 0.85 };
}
