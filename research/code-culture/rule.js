// The lineage rules of step 3c (docs/research/plan-codigo-cultural.md): in
// every world of lineage r one value of one trait poisons (chemistry.js family
// 'one'), fixed by a seed, while the species are drawn anew in each world. A
// model cannot know which value: only what a lineage lived can tell it.
//
// probe(): does a text know the rule? Asked about every look of the
// catalogue with an empty diary at middling hunger, the share of poisonous
// looks it leaves minus the share of the others it leaves. An oracle that
// knows the rule scores 1; the caution text (it tastes everything new) 0.

import { createChemistry, TRAITS } from '../../src/chemistry.js';
import { rng } from '../../scripts/batch/random.js';
import { compile, askCode } from '../../src/learned/code-judge.js';
import { CAUTION_SOURCE } from '../../src/learned/code-judge.js';

export function ruleOf(r) {
  const dim = r % 2 ? 'shape' : 'color';
  const seed = 777001 + r;
  const chem = createChemistry(rng(seed), { family: 'one', dim });
  const poison = chem.rules.poison[0][0].split(':')[1];
  const food = chem.rules.food[0][0].split(':')[1];
  return { dim, seed, poison, food };
}

export const oracleSource = ({ dim, poison }) => CAUTION_SOURCE
  .replace('function ground(obs, look, diary) {', `function ground(obs, look, diary) {\n  if (look.${dim} === '${poison}') return 'leave';`)
  .replace('function wants(obs, look, diary) {', `function wants(obs, look, diary) {\n  if (look.${dim} === '${poison}') return false;`);

export function probe(source, rule) {
  const j = compile(source);
  if (j.error) return { score: 0, poisonLeft: 0, otherLeft: 0, failure: j.error };
  let pl = 0, pn = 0, ol = 0, on = 0;
  for (const color of TRAITS.color) for (const shape of TRAITS.shape) for (const smell of TRAITS.smell) {
    const look = { key: `${color}-${shape}-${smell}`, color, shape, smell };
    const args = { obs: { age: 600, hunger: 50, felt: 50, hungerMax: 100, carrying: null, pantry: {}, meal: null, target: false, innate: 'eat' }, look, diary: [] };
    const left = askCode(j, args).answer === 'leave';
    if (look[rule.dim] === rule.poison) { pn++; if (left) pl++; } else { on++; if (left) ol++; }
  }
  return { score: pl / pn - ol / on, poisonLeft: pl / pn, otherLeft: ol / on };
}

// Step 4: what a lineage that already knows its rule is born with, and why.
export const oracleWhy = ({ dim, poison }) =>
  `Every time we bit a fruit whose ${dim} is ${poison}, our hunger went up: it is poison. So we leave every ${poison} fruit; everything else we judge by our own bites.`;

// The share of looks with value `value` of trait `dim` a text leaves (empty
// diary, middling hunger): after an inversion, leaving the old poison is the
// myth, leaving the old food is the new knowledge.
export function leaves(source, dim, value) {
  const j = compile(source);
  if (j.error) return 0;
  let n = 0, left = 0;
  for (const color of TRAITS.color) for (const shape of TRAITS.shape) for (const smell of TRAITS.smell) {
    const look = { key: `${color}-${shape}-${smell}`, color, shape, smell };
    if (look[dim] !== value) continue;
    n++;
    const args = { obs: { age: 600, hunger: 50, felt: 50, hungerMax: 100, carrying: null, pantry: {}, meal: null, target: false, innate: 'eat' }, look, diary: [] };
    if (askCode(j, args).answer === 'leave') left++;
  }
  return left / n;
}
