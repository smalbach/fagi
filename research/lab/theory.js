// What the founders of a lineage are taught before they live anything: the
// initial theory. It is the one thing the experiment sets about their culture;
// the rest they live, tell and teach.
//
//   none:       nothing;
//   correct:    the chemistry's own clauses: avoid the poison, prefer the food;
//   partial:    each clause cut to a single trait (a smell, if it has one). On a
//               one-trait chemistry that is the correct theory; on a conjunctive
//               one it is too broad: it avoids every fruit with that smell;
//   false:      the other way round: avoid the food, prefer the poison;
//   irrelevant: avoid one shape the chemistry does not care about. A
//               superstition that costs a few meals and nothing else.
//
// Every seeded rule is marked born from ant 0 with the culture's trust, and
// its origin is 'seed/<rule id>', so its lineage can be told apart from what
// was lived.

import { TRAITS } from '../../src/chemistry.js';
import { rule } from '../../src/learned/dsl.js';
import { upsertRule } from '../../src/learned/rules.js';
import { SCOPE } from '../../src/learned/synth.js';
import { GEN } from '../../src/config.js';

const dimOf = (c) => c.split(':')[0];

function cut(clause) {
  return [clause.find((c) => dimOf(c) === 'smell') ?? clause[0]];
}

// The theory as a list of { verdict, all }.
export function theoryOf(chem, kind, rnd = Math.random) {
  const { poison, food } = chem.rules;
  if (kind === 'none') return [];
  if (kind === 'correct') return [...poison.map((all) => ({ verdict: 'avoid', all })), ...food.map((all) => ({ verdict: 'prefer', all }))];
  if (kind === 'partial') return [...poison.map((all) => ({ verdict: 'avoid', all: cut(all) })), ...food.map((all) => ({ verdict: 'prefer', all: cut(all) }))];
  if (kind === 'false') return [...food.map((all) => ({ verdict: 'avoid', all })), ...poison.map((all) => ({ verdict: 'prefer', all }))];
  if (kind === 'irrelevant') {
    const used = new Set([...poison, ...food].flat());
    const free = TRAITS.shape.map((v) => `shape:${v}`).filter((c) => !used.has(c));
    return [{ verdict: 'avoid', all: [free[Math.floor(rnd() * free.length)]] }];
  }
  throw new Error(`unknown theory: ${kind}`);
}

const idOf = (verdict, all) => `${verdict}-${all.map((c) => c.replace(':', '-')).join('-')}`;

// Teaches an ant the theory, as if a founding elder had.
export function seed(fagi, theory) {
  for (const { verdict, all } of theory) {
    const id = idOf(verdict, all);
    upsertRule(fagi.brain.rules, {
      ...rule(id, {
        on: SCOPE[verdict], when: { all }, verdict, weight: verdict === 'avoid' ? -0.6 : 0.6,
        because: [{ sense: 'born', v: verdict === 'avoid' ? -1 : 1 }], learnedAt: 0, tries: 0, stage: 'short',
        source: { kind: 'born', from: 0, at: 0, trust: GEN.cultureTrust },
      }),
      origin: `seed/${id}`,
    });
  }
}
