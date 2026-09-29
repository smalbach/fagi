import test from 'node:test';
import assert from 'node:assert/strict';

import { CHOICE, SITES, GEN, HUNGER } from '../src/config.js';
import { createGenome, recombine, mutate, forageGene, priorOf, FORAGE_GENES } from '../src/generations.js';
import { createWorld, addPoint } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { noteSites } from '../src/sites.js';
import { updateChoice } from '../src/choice.js';
import { rng } from '../scripts/batch/random.js';

function withGenes(fn) {
  const saved = { c: { ...CHOICE }, s: { ...SITES } };
  CHOICE.enabled = 1; CHOICE.mode = 1; CHOICE.genes = 1; SITES.enabled = 1;
  try { fn(); } finally { Object.assign(CHOICE, saved.c); Object.assign(SITES, saved.s); }
}

test('founders carry 0: their starting beliefs are the plain ones of way 1', () => withGenes(() => {
  const f = createFagi();
  f.genome = createGenome();
  for (const k of FORAGE_GENES) assert.equal(forageGene(f, k), 0);
  assert.deepEqual(priorOf(0), { a: 1, b: 1 });
}));

test('a child inherits each foraging gene from a parent, mutated, within [-1, 1]', () => withGenes(() => {
  const mother = { cues: {}, body: {}, forage: { explore: 0.8, site: -0.5, memory: 0, patience: 0.3 } };
  const father = { cues: {}, body: {}, forage: { explore: 0.8, site: -0.5, memory: 0, patience: 0.3 } };
  const rnd = rng(3);
  const kids = Array.from({ length: 200 }, () => recombine(mother, father, rnd));
  const mean = (k) => kids.reduce((a, g) => a + g.forage[k], 0) / kids.length;
  assert.ok(Math.abs(mean('explore') - 0.8) < 0.05, `explore ${mean('explore')}`);
  assert.ok(Math.abs(mean('site') + 0.5) < 0.05);
  assert.ok(kids.every((g) => FORAGE_GENES.every((k) => g.forage[k] >= -1 && g.forage[k] <= 1)));
  assert.ok(new Set(kids.map((g) => g.forage.explore)).size > 10, 'mutation makes them differ');
  assert.ok(mutate(mother, rnd).forage, 'asexual too');
}));

test('with the learned choice off, genomes carry no foraging genes and draw nothing more', () => {
  const a = recombine({ cues: {}, body: {} }, { cues: {}, body: {} }, rng(5));
  assert.equal(a.forage, undefined);
  let n = 0;
  const count = () => { n++; return 0.5; };
  recombine({ cues: {}, body: {} }, { cues: {}, body: {} }, count);
  const without = n;
  withGenes(() => { n = 0; recombine({ cues: {}, body: {} }, { cues: {}, body: {} }, count); });
  assert.ok(n > without, 'the genes draw only when on');
});

test('a hopeful explorer is born believing exploring pays; a wary one, not', () => withGenes(() => {
  const born = (g) => {
    const world = createWorld();
    world.rain.timer = Infinity;
    const f = createFagi();
    f.genome = { cues: {}, forage: { explore: g, site: 0, memory: 0, patience: 0 } };
    f.hunger = HUNGER.max * 0.7;
    updateChoice(f, noteSites(f, world));
    const e = f.brain.choice.explore;
    return e.a / (e.a + e.b);
  };
  assert.ok(born(1) > 0.7);
  assert.ok(born(-1) < 0.3);
  assert.equal(born(0), 0.5);
}));

test('a site found by a wary one starts from her inborn doubt', () => withGenes(() => {
  const world = createWorld();
  const f = createFagi();
  f.angle = 0;
  f.genome = { cues: {}, forage: { explore: 0, site: -1, memory: 0, patience: 0 } };
  addPoint(world, f.x + 60, f.y, 'nectar');
  noteSites(f, world);
  const s = f.brain.sites[0];
  assert.ok(s.b > s.a, `a ${s.a} b ${s.b}`);
}));
