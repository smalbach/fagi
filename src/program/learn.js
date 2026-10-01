// Rewriting her program, from the record program/watch.js keeps.
//
// What she can write, for now, is one kind of line: one of her behaviors
// moved up in front of another, for some situation. "Rest before pursuing
// food — while my energy is below 25%." The line is new and hers: the
// behavior of a line she was born with (`from`), with a condition, put right
// in front of the line it now goes before (`over`). Nothing she was born with
// is touched: where the condition does not hold, her program is as it was. She
// does not invent behaviors, and nothing goes in front of a survive line.
//
// Why this and not "do without a line here": her lines back each other up.
// Measured (an unchanged program, records of 24 lives pooled): when she did
// without pursuing, the line that took over was most often going back for
// what she had lost sight of — the same chase — and doing without one line
// changed nothing. What changes something is another behavior taking the turn.
//
// The evidence. Her record holds, for two of her lines X and Y, the moments X
// led while Y would have acted too: the ones where X acted, and the ones where,
// trying, Y took its turn; and the same with the two the other way round. For
// every clause the grammar allows (one need at one step, either way, one flag,
// either way, or none), the moments where it held: what did it cost her when X
// acted, and when Y did? With at least PROGRAM.minSupport moments on each side,
// if Y cost less by more than PROGRAM.margin and by more than her own doubt
// allows, Y goes in front of X there.
//
// Her doubt grows with how much she asks. At one look she weighs every pair
// against every clause, a few hundred questions; asked that many times, noise
// alone would answer yes to some. So the difference must clear z standard
// errors with z such that, over all she weighed at that look, chance alone
// passes one with probability PROGRAM.alpha (Bonferroni). Measured before this
// (an unchanged program, records of 24 lives pooled): every line a looser gate
// (z = 2) wrote in single lives made no clear difference once the lives were
// pooled.
//
// Of all that pass, the one that would have spared her most over her record
// (the difference times the moments it covers). One new line per look.
//
// Judge again. At every look, each line she wrote answers to her whole record
// on its pair and its clause (her trials go on: now and then the line it went
// in front of takes its turn back). Written on a clear difference, it is
// retired only when none is left, when Y no longer costs her less than X there.

import { PROGRAM } from '../config.js';
import { programOf, line, meets, condId, CLAUSES } from '../program.js';

const r3 = (v) => Math.round(v * 1000) / 1000;
const stat = () => ({ n: 0, sum: 0, sq: 0 });
const mean = (s) => s.sum / s.n;
const variance = (s) => (s.n > 1 ? Math.max(0, (s.sq - (s.sum * s.sum) / s.n) / (s.n - 1)) : 0);
const ALWAYS = {};

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
function between(m, x, y) {
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

const bodyOf = ({ id, retired, retiredAt, ...spec }) => spec;
const at = (fagi) => Math.round(fagi.age * 10) / 10;

function changed(fagi, program, news) {
  program.seq += 1;
  fagi.brain.lastProgram = { n: (fagi.brain.lastProgram?.n ?? 0) + 1, ...news };
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
}

// Natural complementary follow-ups for behaviors into macro chains
const COMPLEMENTS = {
  shelterRetreat: ['rest', 'sleep'],
  patrol: ['pantry', 'carry', 'pursue'],
  zigzag: ['pursue', 'scent', 'memory'],
  carry: ['pantry'],
  thirstSearch: ['drink'],
};

const FLAG_CLAUSES = ['dark', 'raining', 'inNest', 'pressureFalling'].flatMap((flag) => [{ [flag]: true }, { [flag]: false }]);

// Y's behavior, with the clause, right in front of X's line.
function write(fagi, program, { x, y, clause, chain, v }) {
  const over = program.lines.find((l) => l.id === x);
  const from = program.lines.find((l) => l.id === y);
  const cond = condId(clause);
  const chainId = chain && chain.length ? `-chain-${chain.join('-')}` : '';
  const id = `${y}-before-${x}${chainId}${cond ? `-${cond}` : ''}`.slice(0, 64);
  const where = cond || 'always';
  const chainNote = chain && chain.length ? ` [macro: ${chain.join('->')}]` : '';
  const why = `${where}: ${r3(v.diff)} less distress when ${y} took ${x}'s turn (${v.y} times) than when ${x} acted (${v.x})${chainNote}`;
  // A line she wrote before and retired, written again: the old one goes.
  program.lines = program.lines.filter((l) => l.id !== id);
  program.lines.splice(program.lines.indexOf(over), 0, line(id, {
    tier: from.tier, ...(cond ? { if: clause } : {}), do: from.do,
    ...(chain ? { chain } : {}),
    source: 'self', learnedAt: at(fagi), from: y, over: x, why: why.slice(0, 160),
  }));
  changed(fagi, program, { kind: 'written', id, from: y, over: x, where: cond, diff: r3(v.diff), nx: v.x, ny: v.y, why, ...(chain ? { chain } : {}), source: 'self' });
  fagi.justLearnedCode = 3.0;
}

function retire(fagi, program, own, v) {
  program.lines = program.lines.map((l) => (l === own ? line(own.id, { ...bodyOf(own), retired: true, retiredAt: at(fagi) }) : l));
  const why = `${own.from} no longer does better than ${own.over} there: ${r3(v.diff)} (${v.y} and ${v.x} times)`;
  changed(fagi, program, { kind: 'retired', id: own.id, from: own.from, over: own.over, diff: r3(v.diff), nx: v.x, ny: v.y, why });
}

// The pairs her record can speak of: x led while y would have acted too.
function pairsOf(moments) {
  const seen = new Set();
  const out = [];
  for (const m of moments) {
    for (const y of m.below) {
      const k = `${m.root}>${y}`;
      if (!seen.has(k)) { seen.add(k); out.push([m.root, y]); }
    }
  }
  return out;
}

// The moments about the two of them, the only ones weigh() can use.
export const involving = (moments, x, y) => moments.filter((m) => between(m, x, y));

// One look at her record: judge what she wrote, then perhaps write one line.
export function review(fagi) {
  const moments = fagi.brain.watch?.moments ?? [];
  const program = programOf(fagi);
  for (const own of program.lines) {
    if (own.retired || own.source !== 'self' || !own.from || !own.over) continue;
    const v = weigh(involving(moments, own.over, own.from), own.over, own.from, own.if ?? ALWAYS);
    if (v.enough && v.diff <= 0) retire(fagi, program, own, v);
  }
  const live = program.lines.filter((l) => !l.retired);
  if (live.filter((l) => l.source === 'self').length >= PROGRAM.maxOwn) return;
  const born = new Map(live.filter((l) => l.source === 'born').map((l) => [l.id, l]));
  const weighed = [];
  for (const [x, y] of pairsOf(moments)) {
    // Only between lines she was born with, never in front of a survive line,
    // and not a pair she has already put in order.
    if (!born.has(x) || !born.has(y) || born.get(x).tier === 'survive') continue;
    if (live.some((l) => l.source === 'self' && l.from === y && l.over === x)) continue;
    // Only where y would really go in front: x must stand before y.
    if (live.indexOf(born.get(x)) > live.indexOf(born.get(y))) continue;
    const theirs = involving(moments, x, y);
    const pairWeighed = [];
    for (const clause of [ALWAYS, ...CLAUSES]) {
      const v = weigh(theirs, x, y, clause);
      if (v.enough) pairWeighed.push({ x, y, clause, v });
    }
    // Inductive compounding: test conjunctions of candidate need clauses with flags
    if (PROGRAM.compound) {
      const needCands = pairWeighed.filter((w) => w.v.diff > 0 && Object.keys(w.clause).some((k) => k.startsWith('hunger') || k.startsWith('thirst') || k.startsWith('energy')));
      for (const cand of needCands) {
        for (const fc of FLAG_CLAUSES) {
          const compClause = { ...cand.clause, ...fc };
          const vc = weigh(theirs, x, y, compClause);
          if (vc.enough && vc.diff > cand.v.diff) {
            pairWeighed.push({ x, y, clause: compClause, v: vc });
          }
        }
      }
    }
    // Macro routine chaining: evaluate complementary sequential chains
    if (PROGRAM.chaining && COMPLEMENTS[y]) {
      for (const followUp of COMPLEMENTS[y]) {
        if (!born.has(followUp)) continue;
        const bestForY = pairWeighed.filter((w) => w.v.diff > 0);
        for (const cand of bestForY) {
          pairWeighed.push({ x, y, clause: cand.clause, chain: [y, followUp], v: cand.v });
        }
      }
    }
    weighed.push(...pairWeighed);
  }
  let best = null;
  for (const c of weighed) if (clears(c.v, weighed.length) && (!best || c.v.gain > best.v.gain)) best = c;
  if (best) write(fagi, program, best);
}
