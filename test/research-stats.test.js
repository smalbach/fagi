import test from 'node:test';
import assert from 'node:assert/strict';

import { mean, sd, bootstrapCI, paired, holm, qnorm, lineagesNeeded } from '../research/stats.js';
import { cells, cellId, paramsOf } from '../research/run.js';
import { outcomes } from '../research/analyze.js';
import { params } from '../research/lab/params.js';

test('mean, sd and a bootstrap interval that contains the mean', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.equal(mean(xs), 4.5);
  assert.ok(Math.abs(sd(xs) - 2.449) < 1e-3);
  const [lo, hi] = bootstrapCI(xs);
  assert.ok(lo < 4.5 && hi > 4.5 && lo > 2 && hi < 7);
  assert.deepEqual(bootstrapCI(xs), [lo, hi], 'seeded: the same every time');
});

test('a paired comparison finds a consistent difference and not a null one', () => {
  const a = Array.from({ length: 30 }, (_, i) => i % 7);
  const shifted = a.map((x, i) => x + 1 + (i % 3) * 0.1);
  const r = paired(shifted, a);
  assert.ok(Math.abs(r.diff - 1.1) < 0.01);
  assert.ok(r.p < 0.001 && r.ci[0] > 0.9);
  const noise = a.map((x, i) => x + (i % 2 ? 0.5 : -0.5));
  assert.ok(paired(noise, a).p > 0.5);
  assert.equal(paired([], []).n, 0);
});

test('a one-sided paired test only counts the predicted direction', () => {
  const a = Array.from({ length: 30 }, (_, i) => i % 7);
  const up = a.map((x, i) => x + 1 + (i % 3) * 0.1);
  assert.ok(paired(up, a, { alternative: 'greater' }).p < 0.001);
  assert.ok(paired(a, up, { alternative: 'greater' }).p > 0.99);
  const two = paired(up.slice(0, 8), a.slice(0, 8)).p;
  const one = paired(up.slice(0, 8), a.slice(0, 8), { alternative: 'greater' }).p;
  assert.ok(one < two);
});

test('Holm adjusts step-down and keeps order', () => {
  assert.deepEqual(holm([0.01, 0.04, 0.03]), [0.03, 0.06, 0.06]);
});

test('normal quantiles and sample sizes', () => {
  assert.ok(Math.abs(qnorm(0.975) - 1.959964) < 1e-5);
  assert.ok(Math.abs(qnorm(0.8) - 0.841621) < 1e-5);
  assert.equal(lineagesNeeded(0.5), 34);
  assert.equal(lineagesNeeded(0), Infinity);
});

test('a design expands into cells with their parameters', () => {
  const design = { base: { generations: 8 }, factors: { format: ['rule', 'verdict'], 'sets.SOCIAL.trust': [0.4, 0.8] } };
  const cs = cells(design);
  assert.equal(cs.length, 4);
  assert.equal(cellId(cs[1]), 'format=rule;sets.SOCIAL.trust=0.8');
  const p = paramsOf(design, cs[3]);
  assert.equal(p.format, 'verdict');
  assert.equal(p.generations, 8);
  assert.deepEqual(p.sets, { 'SOCIAL.trust': 0.8 });
});

test('lineage outcomes: steady state without the founders, the shock, the recovery', () => {
  const p = params({ generations: 6, switchAt: 3 });
  const row = (g, over) => ({ g, ants: 5, alive: 5, harmful: 1, encounters: 10, foodSkipped: 1, accBirth: 0.8, mythsEnd: 0, ...over });
  const rows = [
    row(0, { harmful: 9 }), row(1), row(2, { harmful: 3 }),
    row(3, { alive: 2, harmful: 10, foodSkipped: 5, accBirth: 0.4, mythsEnd: 10 }),
    row(4, { accBirth: 0.6 }), row(5, { accBirth: 0.78 }),
  ];
  const o = outcomes(rows, p);
  assert.equal(o['stable.harm'], (1 + 3) / 2 / 5);
  assert.equal(o['shock.alive'], 0.4);
  assert.equal(o['shock.lost'], 0.5);
  assert.equal(o['shock.myths'], 2);
  assert.equal(o.recovery, 2);
  assert.ok(Math.abs(o['excess.harm'] - ((10 + 1 + 1) / 5 - 3 * 0.4)) < 1e-9);
});

test('an interaction is the difference of paired differences, seed by seed', async () => {
  const { interaction } = await import('../research/analyze.js');
  const cell = (format, life, xs) => ({ cell: { format, life }, seeds: [1, 2, 3, 4], values: { y: xs } });
  const data = { cells: [
    cell('verdict', 1800, [5, 6, 5, 6]), cell('rule', 1800, [1, 2, 1, 2]),
    cell('verdict', 900, [5, 6, 5, 6]), cell('rule', 900, [4, 5, 4, 5]),
  ] };
  const r = interaction(data, { factor: 'format', a: 'verdict', b: 'rule', moderator: 'life', m1: 1800, m2: 900, outcome: 'y' });
  assert.deepEqual(r.diffAt, { 1800: 4, 900: 1 });
  assert.equal(r.diff, 3);
});
