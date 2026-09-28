import test from 'node:test';
import assert from 'node:assert/strict';

import { SEX, ENERGY, GEN, FAGI } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createColony } from '../src/colony.js';
import { createWorld } from '../src/world.js';
import { SEXES, BODY_TRAITS, bodyFor, energyMax } from '../src/biology.js';
import { spendEnergy } from '../src/needs.js';
import { advance } from '../src/movement.js';
import { createGenome, recombine, applyGenome, mutate, diversity, ALL_CUES } from '../src/generations.js';
import { rng, withRng } from '../scripts/batch/random.js';
import { learn } from '../src/brain.js';

SEX.enabled = 1;

test('only valid sexes, about half and half', () => {
  const sexes = withRng(rng(7), () => Array.from({ length: 400 }, () => createFagi().sex));
  for (const s of sexes) assert.ok(SEXES.includes(s));
  const females = sexes.filter((s) => s === 'female').length;
  assert.ok(females > 160 && females < 240, `${females}/400`);
});

test('without SEX there is no sex and the body is the plain one', () => {
  SEX.enabled = 0;
  const f = createFagi();
  assert.equal(f.sex, null);
  assert.deepEqual(f.body, { speed: 1, energyMax: 1, metabolism: 1, insulation: 1 });
  assert.equal(f.energy, ENERGY.max);
  SEX.enabled = 1;
});

test('the body is worked out once: re-reading it never compounds', () => {
  const f = createFagi({ sex: 'male' });
  const first = { ...f.body };
  for (let i = 0; i < 5; i++) applyGenome(f, { cues: {}, body: {} });
  assert.deepEqual(f.body, first);
  assert.equal(f.body.speed, SEX.male.speed);
});

test('energy fills to her own maximum and never past it', () => {
  const world = createWorld();
  for (const sex of SEXES) {
    const f = createFagi({ sex });
    assert.equal(f.energy, ENERGY.max * SEX[sex].energyMax);
    f.energy = 10;
    for (let i = 0; i < 400; i++) spendEnergy(f, world, 0.1, false);
    assert.ok(Math.abs(f.energy - energyMax(f)) < 1e-9);
  }
});

test('a male walks farther in the same second, and burns more doing it', () => {
  const world = createWorld();
  const m = createFagi({ sex: 'male' });
  const w = createFagi({ sex: 'female' });
  for (const f of [m, w]) { f.angle = 0; f.x = 200; f.y = 400; advance(f, world, 1); }
  assert.ok(m.x - 200 > w.x - 200);
  assert.ok(Math.abs((m.x - 200) - FAGI.speed * SEX.male.speed) < 1e-6);
  m.energy = w.energy = 80;
  spendEnergy(m, world, 1, true);
  spendEnergy(w, world, 1, true);
  assert.ok(80 - m.energy > 80 - w.energy);
});

test('the same seed gives the same population', () => {
  const pop = (seed) => withRng(rng(seed), () => createColony(6).ants.map((f) => [f.sex, f.angle]));
  assert.deepEqual(pop(42), pop(42));
});

test('a first population can always breed', () => {
  for (let seed = 1; seed < 60; seed++) {
    const ants = withRng(rng(seed), () => createColony(2).ants);
    assert.ok(ants.some((f) => f.sex === 'female') && ants.some((f) => f.sex === 'male'), `seed ${seed}`);
  }
});

// --- reproduction ------------------------------------------------------------

const genomeOf = (v, body) => ({ cues: Object.fromEntries(ALL_CUES.map((c) => [c, v])), body });

test('a child carries something of each parent', () => {
  GEN.mutation = 0;
  GEN.bodyMutation = 0;
  const mom = genomeOf(0.8, { speed: 1.2, energyMax: 1, metabolism: 1, insulation: 1 });
  const dad = genomeOf(-0.8, { speed: 0.8, energyMax: 1, metabolism: 1, insulation: 1 });
  const child = recombine(mom, dad, rng(3), ['0.1', '0.2']);
  const values = Object.values(child.cues);
  assert.ok(values.includes(0.8) && values.includes(-0.8), 'alleles from both');
  assert.equal(child.body.speed, 1, 'body genes: their average');
  assert.deepEqual(child.parents, ['0.1', '0.2'], 'kinship is recorded');
  GEN.blend = 1;
  assert.deepEqual(recombine(mom, dad, rng(3)).cues, {}, 'blended, +0.8 and -0.8 average to no bias at all');
  GEN.blend = 0;
  GEN.mutation = 0.15;
  GEN.bodyMutation = 0.03;
});

test('mutation stays within bounds', () => {
  GEN.bodyMutation = 1;
  const edge = genomeOf(1, Object.fromEntries(BODY_TRAITS.map((k) => [k, GEN.bodyRange[1]])));
  for (let i = 0; i < 50; i++) {
    const child = recombine(edge, edge, rng(i));
    for (const v of Object.values(child.cues)) assert.ok(v >= -1 && v <= 1);
    for (const v of Object.values(child.body)) assert.ok(v >= GEN.bodyRange[0] && v <= GEN.bodyRange[1]);
  }
  GEN.bodyMutation = 0.03;
});

test('memories are not inherited: only predispositions pass through the genome', () => {
  const mom = createFagi({ sex: 'female' });
  const dad = createFagi({ sex: 'male' });
  learn(mom.brain, 'nectar', 1, 10);
  learn(dad.brain, 'toxic', -1, 10);
  const genome = recombine(mom.genome ?? createGenome(), dad.genome ?? createGenome(), rng(1));
  assert.deepEqual(Object.keys(genome).sort(), ['body', 'cues']);
  const child = createFagi({ sex: 'female', genome });
  applyGenome(child, genome);
  assert.deepEqual(Object.keys(child.brain.facts), [], 'she believes nothing about what they ate');
  assert.equal(child.brain.rules.list.length, 0, 'and was told nothing: culture is separate');
});

test('diversity is zero for clones and grows with differences', () => {
  const a = createGenome();
  assert.equal(diversity([a, a, a]), 0);
  const b = mutate(a, rng(5));
  assert.ok(diversity([a, b]) > 0);
});

test('with SEX off a birth draws one random number, as before: the preregistered runs are untouched', () => {
  SEX.enabled = 0;
  let draws = 0;
  withRng(() => { draws++; return 0.3; }, () => createFagi());
  assert.equal(draws, 1);
  SEX.enabled = 1;
});
