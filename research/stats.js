// Statistics for lineage-level outcomes. The unit is the lineage: rows from
// one lineage are never treated as independent. Cells share seeds, so two
// cells are compared seed by seed (paired), which removes the variance of the
// worlds themselves.
//
// Everything is resampling-based (no distributional assumptions) and seeded,
// so an analysis gives the same numbers every time.

import { rng } from '../scripts/batch/random.js';

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export function sd(xs) {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

function quantile(sorted, q) {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

// 95% percentile bootstrap interval of the mean.
export function bootstrapCI(xs, { B = 2000, level = 0.95, seed = 1 } = {}) {
  if (!xs.length) return [NaN, NaN];
  const rnd = rng(seed);
  const means = [];
  for (let b = 0; b < B; b++) {
    let s = 0;
    for (let i = 0; i < xs.length; i++) s += xs[Math.floor(rnd() * xs.length)];
    means.push(s / xs.length);
  }
  means.sort((a, b) => a - b);
  return [quantile(means, (1 - level) / 2), quantile(means, 1 - (1 - level) / 2)];
}

// Paired comparison of two samples aligned by seed: the mean difference (a - b),
// its bootstrap interval, a two-sided sign-flip permutation p-value, and the
// standardized effect dz (mean difference / sd of differences).
export function paired(a, b, { B = 5000, seed = 1 } = {}) {
  if (a.length !== b.length) throw new Error('paired samples must have the same length');
  const d = a.map((x, i) => x - b[i]).filter((x) => !Number.isNaN(x));
  if (!d.length) return { n: 0, diff: NaN, ci: [NaN, NaN], p: NaN, dz: NaN };
  const m = mean(d);
  const rnd = rng(seed + 7);
  let extreme = 0;
  for (let k = 0; k < B; k++) {
    let s = 0;
    for (const x of d) s += rnd() < 0.5 ? x : -x;
    if (Math.abs(s / d.length) >= Math.abs(m) - 1e-12) extreme += 1;
  }
  const s = sd(d);
  return {
    n: d.length, diff: m, ci: bootstrapCI(d, { seed }),
    p: (extreme + 1) / (B + 1),
    dz: s > 0 ? m / s : m === 0 ? 0 : Infinity,
  };
}

// Holm's step-down adjustment of a list of p-values (same order back).
export function holm(ps) {
  const order = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]);
  const out = new Array(ps.length);
  let running = 0;
  order.forEach(([p, i], k) => {
    running = Math.max(running, Math.min(1, p * (ps.length - k)));
    out[i] = running;
  });
  return out;
}

// Standard normal quantile (Acklam's approximation, |error| < 1.2e-9).
export function qnorm(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) return -qnorm(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Lineages per cell needed to detect a paired effect of size dz with this
// power, two-sided at alpha (normal approximation plus the usual +2 for the t).
export function lineagesNeeded(dz, { alpha = 0.05, power = 0.8 } = {}) {
  if (!Number.isFinite(dz) || dz === 0) return Infinity;
  const z = qnorm(1 - alpha / 2) + qnorm(power);
  return Math.ceil((z / Math.abs(dz)) ** 2) + 2;
}
