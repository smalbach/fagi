// Evidence from completed, observed decision windows. Imagined alternatives
// identify available actions; only actions actually taken contribute outcomes.

import { PROGRAM } from '../config.js';
import { meets } from '../program.js';

const stat = () => ({ n: 0, sum: 0, sq: 0 });
const mean = (s) => s.sum / s.n;
const variance = (s) => (s.n > 1 ? Math.max(0, (s.sq - (s.sum * s.sum) / s.n) / (s.n - 1)) : 0);

// The standard normal quantile (Acklam's rational approximation, error below
// 1.2e-9): the z beyond which chance alone lands with probability 1 - p.
export function qnorm(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Who acted in a moment where both x and y would have: 'x', 'y', or null if
// the moment is not about the two of them.
export function between(m, x, y) {
  if (m.root === x) return m.by === y ? 'y' : m.by === null && m.below.includes(y) ? 'x' : null;
  if (m.root === y) return m.by === x ? 'x' : m.by === null && m.below.includes(x) ? 'y' : null;
  return null;
}

// What her record says of x against y where `clause` held: the moments each
// acted while the other would have, how much less y cost her (`diff` > 0: y
// did better), her doubt about it (`se`) and what it would have spared her over
// her record (`gain`).
export function weigh(moments, x, y, clause) {
  const sx = stat();
  const sy = stat();
  for (const m of moments) {
    if (!Number.isFinite(m.cost) || m.imagined || m.predicted) continue;
    const who = between(m, x, y);
    if (!who || !meets(clause, m.f)) continue;
    const s = who === 'x' ? sx : sy;
    s.n += 1; s.sum += m.cost; s.sq += m.cost * m.cost;
  }
  const out = { x: sx.n, y: sy.n };
  if (sx.n < PROGRAM.minSupport || sy.n < PROGRAM.minSupport) return { ...out, enough: false };
  const diff = mean(sx) - mean(sy);
  const se = Math.sqrt(variance(sx) / sx.n + variance(sy) / sy.n);
  return { ...out, enough: true, diff, se, gain: diff * (sx.n + sy.n) };
}

// Does a difference clear her doubt, when she weighed `asked` of them at once?
export const clears = (v, asked) => {
  const strictness = PROGRAM.strictness ?? 1.0;
  const effectiveAsked = Math.max(1, asked ** strictness);
  return v.diff > Math.max(PROGRAM.margin, qnorm(1 - PROGRAM.alpha / effectiveAsked) * v.se);
};

// A compact audit receipt. References are representative, not a second store of
// personal memories; exact support and uncertainty are retained in the summary.
export function receipt(fagi, moments, x, y, condition, asked, operation = 'upsert') {
  const v = weigh(moments, x, y, condition);
  const improvement = operation === 'retire' ? -v.diff : v.diff;
  if (!v.enough || !clears({ ...v, diff: improvement }, asked)) return null;
  const relevant = moments.filter((m) => Number.isFinite(m.cost) && !m.imagined && !m.predicted
    && m.who != null && Number.isFinite(m.at) && between(m, x, y) && meets(condition, m.f));
  const references = ['x', 'y'].flatMap((side) => relevant.filter((m) => between(m, x, y) === side).slice(-16))
    .map((m) => ({ who: String(m.who), at: m.at, ...(m.told != null ? { toldBy: String(m.told) } : {}) }));
  return {
    kind: 'observed-comparison', observer: String(fagi.id ?? 1), at: fagi.age ?? 0,
    baseline: x, alternative: y, condition: { ...condition },
    baselineCount: v.x, alternativeCount: v.y, improvement, standardError: v.se,
    minSupport: PROGRAM.minSupport, margin: PROGRAM.margin,
    alpha: PROGRAM.alpha, strictness: PROGRAM.strictness ?? 1, comparisons: asked,
    references,
  };
}
