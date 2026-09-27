// Arithmetic for comparing runs with each other.

export const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
export const stdev = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };

export function cosine(a, b) {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

// 1 - Jensen-Shannon divergence (base 2): 1 = they split their time the same way.
export function similarSplit(a, b) {
  const keysOf = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const ta = mean(Object.values(a)) * Object.keys(a).length || 1;
  const tb = mean(Object.values(b)) * Object.keys(b).length || 1;
  const p = keysOf.map((k) => (a[k] ?? 0) / ta);
  const q = keysOf.map((k) => (b[k] ?? 0) / tb);
  const kl = (x, y) => x.reduce((s, xi, i) => (xi > 0 ? s + xi * Math.log2(xi / y[i]) : s), 0);
  const m = p.map((pi, i) => (pi + q[i]) / 2);
  return 1 - (kl(p, m) + kl(q, m)) / 2;
}

// Second at which two paths first drift more than `threshold` px apart.
export function divergence(a, b, threshold = 60) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]) > threshold) return i;
  return null;
}

export function pairs(runs, f) {
  const xs = [];
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) xs.push(f(runs[i], runs[j]));
  return xs;
}
