// Cuentas para comparar corridas entre sí.

export const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
export const media = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
export const desv = (xs) => { const m = media(xs); return Math.sqrt(media(xs.map((x) => (x - m) ** 2))); };

export function coseno(a, b) {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

// 1 - divergencia de Jensen-Shannon (base 2): 1 = reparten el tiempo igual.
export function parecidoReparto(a, b) {
  const claves = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const ta = media(Object.values(a)) * Object.keys(a).length || 1;
  const tb = media(Object.values(b)) * Object.keys(b).length || 1;
  const p = claves.map((k) => (a[k] ?? 0) / ta);
  const q = claves.map((k) => (b[k] ?? 0) / tb);
  const kl = (x, y) => x.reduce((s, xi, i) => (xi > 0 ? s + xi * Math.log2(xi / y[i]) : s), 0);
  const m = p.map((pi, i) => (pi + q[i]) / 2);
  return 1 - (kl(p, m) + kl(q, m)) / 2;
}

// Segundo en el que dos caminos se separan más de `umbral` px por primera vez.
export function divergencia(a, b, umbral = 60) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]) > umbral) return i;
  return null;
}

export function pares(runs, f) {
  const xs = [];
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) xs.push(f(runs[i], runs[j]));
  return xs;
}
