// The body she was born with: sex and body genes, as multipliers on the
// species' numbers (config.js).
//
// Sex changes the body, never the rules (SEX): no "the female tends, the male
// explores". If such roles appear, they come from costs, chances and learning.
//
// fagi.body is worked out once, at birth (and again when a genome is applied),
// so every multiplier is applied exactly once and never compounds. With sex
// off and no body genes it is all ones: multiplying by 1 changes nothing, so a
// run without the organism is the preregistered one to the last digit.

import { ENERGY, SEX, GEN } from './config.js';
import { morphOn, morphBody, plasticCost } from './morph.js';
import { givenName } from './names.js';

export const SEXES = ['female', 'male'];
export const BODY_TRAITS = ['speed', 'energyMax', 'metabolism', 'insulation'];
const NEUTRAL = Object.freeze({ speed: 1, energyMax: 1, metabolism: 1, insulation: 1 });

// Heads or tails. Draws a random number only when sex is on: turning it on
// must not shift the random stream of a run that has it off.
export function assignSex(rnd = Math.random) {
  if (!SEX.enabled) return null;
  return rnd() < 0.5 ? 'female' : 'male';
}

const clampGene = (v) => Math.max(GEN.bodyRange[0], Math.min(GEN.bodyRange[1], v));

// Sex × genes, trait by trait; with MORPH, her organs on top (morph.js):
// `morph` is what she carries, her genes unless she has lived it otherwise.
export function bodyFor(sex, genome = null, morph = genome?.morph) {
  const bySex = SEX.enabled && sex ? SEX[sex] ?? NEUTRAL : NEUTRAL;
  const genes = genome?.body ?? {};
  const body = {};
  for (const k of BODY_TRAITS) body[k] = (bySex[k] ?? 1) * clampGene(genes[k] ?? 1);
  if (morphOn() && morph) {
    const m = morphBody(morph);
    body.speed *= m.speed;
    body.energyMax *= m.energyMax;
    body.insulation *= m.insulation;
    const keep = plasticCost(genome);   // Baldwin: being able to change costs
    body.drain = body.metabolism * m.drain * keep;
    body.metabolism *= m.metabolism * keep;
    for (const k of ['view', 'smell', 'memory', 'digest', 'tolerance', 'life', 'brood']) body[k] = m[k];
  }
  return body;
}

// One of her body's multipliers, 1 if her body has none (MORPH off, or a body
// from before it).
export const bodyMult = (fagi, k) => fagi.body?.[k] ?? 1;

export const bodyOf = (fagi) => fagi.body ?? NEUTRAL;

// Her own maximum energy: what the species has, times her body.
export const energyMax = (fagi) => ENERGY.max * bodyOf(fagi).energyMax;

// A population that can breed at all: when every one of them drew the same
// sex, the last one is the other. Only the first generation of a run needs it
// (the spec's §9.3): after that, a sex dying out is a real result.
export function ensureBothSexes(ants) {
  if (!SEX.enabled || ants.length < 2) return;
  if (ants.every((f) => f.sex === ants[0].sex)) {
    const last = ants.at(-1);
    last.sex = ants[0].sex === 'female' ? 'male' : 'female';
    last.body = bodyFor(last.sex, last.genome);
    last.energy = energyMax(last);   // she is just born: full
    if (last.name) last.name = { ...last.name, given: givenName(last.sex) };
  }
}
