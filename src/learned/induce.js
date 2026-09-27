// Induction: the shortest descriptions that explain what she has tasted.
//
// cues.js learns what each trait tends to mean, one trait at a time. This looks
// at whole species instead: the ones that made her sick, the ones that did her
// good, and the traits they share. "The two fruit that made me sick both smell
// sour and are drops" becomes a rule about sour drops, before she has met a
// third one.
//
// It works from the specific to the general, the way a careful learner would:
//   - one species alone is never generalized: its own rule (memory.js) says
//     all there is to say about it;
//   - two species that did the same are summed up by the traits they share,
//     and only those (their most specific common description);
//   - each new species that fits drops the traits it does not share, so a rule
//     grows more general only when the evidence says so;
//   - a species that fits the description but did the opposite is written as
//     an exception (the trait that sets it apart), not a reason to drop the
//     rule, as long as the rule still has more cases for it than against it.
//
// Nothing here decides anything: it returns descriptions, and synth.js turns
// them into rules with the same hysteresis as every other rule.

import { POINT_TYPES, CUES } from '../config.js';
import { weight } from '../memory.js';
import { activeRule } from './rules.js';
import { cuesOf } from './cues.js';

const ORDER = ['color', 'shape', 'smell'];
const byDimension = (a, b) => {
  const [da, db] = [a.split(':')[0], b.split(':')[0]];
  return (ORDER.indexOf(da) - ORDER.indexOf(db)) || (a < b ? -1 : a > b ? 1 : 0);
};

// What she has tasted, sorted into what did her harm, what did her good, and
// what did neither clearly (`rest`). A species' label is its own rule: that already has
// hysteresis, so a belief hovering at the limit does not flip the label.
export function tastedCases(brain) {
  const bad = [];
  const good = [];
  const rest = [];
  for (const key of Object.keys(brain.facts).sort()) {
    if (!POINT_TYPES[key]?.traits || !(brain.facts[key].tries > 0)) continue;
    if (activeRule(brain.rules, key, 'avoid')) bad.push(key);
    else if (activeRule(brain.rules, key, 'prefer')) good.push(key);
    else rest.push(key);
  }
  return { bad, good, rest };
}

const covers = (all, key) => {
  const traits = cuesOf(key);
  return all.every((c) => traits.includes(c));
};

// The exceptions that keep a description true: for each species it wrongly
// covers, a trait of that species that none of the backing cases has (the
// one shared by most of them first). If none sets it apart, the species itself.
function exceptionsFor(wrong, cases) {
  const theirs = new Set(cases.flatMap(cuesOf));
  const left = [...wrong];
  const out = [];
  while (left.length) {
    const count = {};
    for (const k of left) for (const c of cuesOf(k)) if (!theirs.has(c)) count[c] = (count[c] ?? 0) + 1;
    const best = Object.keys(count).sort((a, b) => count[b] - count[a] || byDimension(a, b))[0];
    if (!best) { out.push(left.shift()); continue; }
    out.push(best);
    for (let i = left.length - 1; i >= 0; i--) if (cuesOf(left[i]).includes(best)) left.splice(i, 1);
  }
  return out.sort(byDimension);
}

function describe(all, cases, others) {
  const wrong = others.filter((k) => covers(all, k));
  // A rule needs more cases for it than against it.
  if (wrong.length >= cases.length) return null;
  return { all, cases, con: wrong.length, except: exceptionsFor(wrong, cases) };
}

// Groups the species in `cases` by what they share, never covering more of
// `others` (the opposite outcome) than it can explain away. Agglomerative:
// each step merges the two groups whose shared description stays the most
// specific, so the traits dropped are only those the evidence rules out.
function generalize(cases, others) {
  let groups = cases.map((k) => ({ all: cuesOf(k).sort(byDimension), cases: [k], con: 0, except: [] }));
  for (;;) {
    let best = null;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const all = groups[i].all.filter((c) => groups[j].all.includes(c));
        if (!all.length) continue;
        const merged = describe(all, [...groups[i].cases, ...groups[j].cases].sort(), others);
        if (!merged) continue;
        const score = all.length * 100 - merged.con * 10 + merged.cases.length;
        if (!best || score > best.score) best = { i, j, merged, score };
      }
    }
    if (!best) break;
    groups = groups.filter((_, k) => k !== best.i && k !== best.j);
    groups.push(best.merged);
  }
  return groups.filter((g) => g.cases.length >= CUES.induceMin);
}

// Every description worth a rule: { verdict, all, except, cases, pro, con, weight }.
export function induce(brain) {
  const { bad, good, rest } = tastedCases(brain);
  // What contradicts a rule: the opposite outcome, or anything that leaned
  // the other way without earning its own rule.
  const leaning = (sign) => rest.filter((k) => sign * weight(brain, k) > 0);
  const out = [];
  for (const [verdict, cases, others] of [['avoid', bad, [...good, ...leaning(1)]], ['prefer', good, [...bad, ...leaning(-1)]]]) {
    for (const g of generalize(cases, others)) {
      const w = g.cases.reduce((sum, k) => sum + weight(brain, k), 0) / g.cases.length;
      out.push({ verdict, all: g.all, except: g.except, cases: g.cases, pro: g.cases.length, con: g.con, weight: w });
    }
  }
  return out;
}
