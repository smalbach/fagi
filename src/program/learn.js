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
// retired only when observed evidence supports a disadvantage. A tie or an
// uncertain result leaves it intact. Inherited learned lines face the same review.

import { PROGRAM } from '../config.js';
import { programOf, line, condId, CLAUSES } from '../program.js';
import { weigh, clears, receipt, between } from './evidence.js';
import { recordRevision } from './genome.js';
export { qnorm, weigh, clears } from './evidence.js';

const r3 = (v) => Math.round(v * 1000) / 1000;
const ALWAYS = {};

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
function write(fagi, program, { x, y, clause, chain, v }, asked) {
  const over = program.lines.find((l) => l.id === x);
  const from = program.lines.find((l) => l.id === y);
  const cond = condId(clause);
  const chainId = chain && chain.length ? `-chain-${chain.join('-')}` : '';
  const id = `${y}-before-${x}${chainId}${cond ? `-${cond}` : ''}`.slice(0, 64);
  const where = cond || 'always';
  const chainNote = chain && chain.length ? ` [macro: ${chain.join('->')}]` : '';
  const why = `${where}: ${r3(v.diff)} less distress when ${y} took ${x}'s turn (${v.y} times) than when ${x} acted (${v.x})${chainNote}`;
  const written = line(id, {
    tier: from.tier, ...(cond ? { if: clause } : {}), do: from.do,
    ...(chain ? { chain } : {}),
    source: 'self', learnedAt: at(fagi), from: y, over: x, why: why.slice(0, 160),
  });
  const evidence = receipt(fagi, fagi.brain.watch.moments, x, y, clause, asked);
  // On probation (PROGRAM.confirm) it acts in her life but reaches the egg
  // only once moments lived after it was written back it (confirm, below).
  if (PROGRAM.confirm && !chain) (fagi.brain.watch.probation ??= {})[id] = at(fagi);
  else recordRevision(fagi, 'upsert', written, evidence, x);
  // A line she wrote before and retired, written again: history stays in the genome.
  program.lines = program.lines.filter((l) => l.id !== id);
  program.lines.splice(program.lines.indexOf(over), 0, written);
  changed(fagi, program, { kind: 'written', id, from: y, over: x, where: cond, diff: r3(v.diff), nx: v.x, ny: v.y, why, ...(chain ? { chain } : {}), source: 'self' });
  fagi.justLearnedCode = 3.0;
}

function retire(fagi, program, own, evidence) {
  const v = { diff: -evidence.improvement, x: evidence.baselineCount, y: evidence.alternativeCount };
  const why = `${own.from} caused more distress than ${own.over} there: ${r3(evidence.improvement)} (${v.y} and ${v.x} times)`;
  const retired = line(own.id, { ...bodyOf(own), retired: true, retiredAt: at(fagi), why: why.slice(0, 160) });
  recordRevision(fagi, 'retire', retired, evidence);
  program.lines = program.lines.map((l) => l === own ? retired : l);
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

// Lines on probation (PROGRAM.confirm). The evidence that wrote a line was
// picked as the best of a few hundred questions, so part of its edge is luck.
// Judged again only on moments lived after it was written, a line that still
// clears her doubt goes into her genome, with that new evidence; one that has
// not by PROGRAM.confirmFor seconds is retired, and her daughters never see it.
function confirm(fagi, program, moments) {
  const probation = fagi.brain.watch.probation;
  const ids = Object.keys(probation ?? {});
  for (const id of ids) {
    const own = program.lines.find((l) => l.id === id && !l.retired);
    if (!own) { delete probation[id]; continue; }
    const since = probation[id];
    const fresh = moments.filter((m) => m.at > since);
    const evidence = receipt(fagi, fresh, own.over, own.from, own.if ?? ALWAYS, ids.length);
    if (evidence) {
      delete probation[id];
      recordRevision(fagi, 'upsert', own, evidence, own.over);
      changed(fagi, program, { kind: 'confirmed', id, from: own.from, over: own.over, source: 'self' });
    } else if (fagi.age - since > PROGRAM.confirmFor) {
      delete probation[id];
      const why = `not confirmed by what she lived after writing it (${PROGRAM.confirmFor} s)`;
      program.lines = program.lines.map((l) => l === own ? line(own.id, { ...bodyOf(own), retired: true, retiredAt: at(fagi), why }) : l);
      changed(fagi, program, { kind: 'retired', id, from: own.from, over: own.over, why });
    }
  }
}

// One look at her record: judge what she wrote, then perhaps write one line.
export function review(fagi) {
  const moments = fagi.brain.watch?.moments ?? [];
  const program = programOf(fagi);
  if (PROGRAM.confirm) confirm(fagi, program, moments);
  const learned = (l) => l.source === 'self' || l.source === 'inherited';
  const reviewable = program.lines.filter((l) => !l.retired && learned(l) && l.from && l.over);
  for (const own of reviewable) {
    const evidence = receipt(fagi, moments, own.over, own.from, own.if ?? ALWAYS, reviewable.length, 'retire');
    if (evidence) retire(fagi, program, own, evidence);
  }
  const live = program.lines.filter((l) => !l.retired);
  if (live.filter(learned).length >= PROGRAM.maxOwn) return;
  const born = new Map(live.filter((l) => l.source === 'born').map((l) => [l.id, l]));
  const weighed = [];
  for (const [x, y] of pairsOf(moments)) {
    // Only between lines she was born with, never in front of a survive line,
    // and not a pair she has already put in order.
    if (!born.has(x) || !born.has(y) || born.get(x).tier === 'survive') continue;
    if (live.some((l) => learned(l) && l.from === y && l.over === x)) continue;
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
  if (best) write(fagi, program, best, weighed.length);
}
