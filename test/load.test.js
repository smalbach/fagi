import test from 'node:test';
import assert from 'node:assert/strict';

import { LOAD, MORPH } from '../src/config.js';
import { weighFruit, burden, loadSpeed, loadEffort, hardTake, strengthOf, heft } from '../src/load.js';
import { morphBody } from '../src/morph.js';

const on = (fn) => { LOAD.enabled = 1; try { return fn(); } finally { LOAD.enabled = 0; } };
function seeded(s = 7) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

test('LOAD off: no fruit is weighed, carrying costs nothing extra, every bite gives all', () => {
  const p = weighFruit({ type: 'nectar' }, seeded());
  assert.equal(p.weight, undefined);
  const f = { carrying: { type: 'nectar', weight: 2 }, morph: { gut: 0.5 } };
  assert.equal(loadSpeed(f), 1);
  assert.equal(loadEffort(f), 1);
  assert.equal(hardTake(f, 2), 1);
  assert.deepEqual(heft({ weight: 2 }), {});
});

test('a fruit falls with a weight and a hardness inside their ranges', () => {
  on(() => {
    const rnd = seeded(3);
    for (let i = 0; i < 200; i++) {
      const p = weighFruit({}, rnd);
      assert.ok(p.weight >= LOAD.range[0] - 0.01 && p.weight <= LOAD.range[1] + 0.01);
      assert.ok(p.hardness >= LOAD.hardRange[0] - 0.01 && p.hardness <= LOAD.hardRange[1] + 0.01);
    }
  });
});

test('a heavier fruit slows her more and costs more; more muscle or size carries it easier', () => {
  on(() => {
    const light = { carrying: { weight: 0.6 } };
    const heavy = { carrying: { weight: 1.8 } };
    assert.ok(loadSpeed(heavy) < loadSpeed(light));
    assert.ok(loadEffort(heavy) > loadEffort(light));
    const strong = { carrying: { weight: 1.8 }, morph: { muscle: 1.3, size: 1.1 } };
    assert.ok(strengthOf(strong) > 1);
    assert.ok(burden(strong) < burden(heavy));
    assert.equal(burden({ carrying: null }), 0);
  });
});

test('a hard fruit gives less unless her gut is up to it', () => {
  on(() => {
    assert.equal(hardTake({ morph: { gut: 1 } }, 1), 1);
    assert.ok(hardTake({ morph: { gut: 1 } }, 2) < 1);
    assert.ok(hardTake({ morph: { gut: 1.4 } }, 2) > hardTake({ morph: { gut: 1 } }, 2));
  });
});

test('a bigger mother breeds faster (fecundity grows with size)', () => {
  const ones = { brain: 1, gut: 1, muscle: 1, eyes: 1, antennae: 1 };
  assert.ok(morphBody({ ...ones, size: 1.3 }).brood < morphBody({ ...ones, size: 1 }).brood);
  assert.equal(MORPH.fecundity > 0, true);
});

test('what she brings home counts as her own provision, by its weight', async () => {
  const { createWorld, addObject } = await import('../src/world.js');
  const { createFagi } = await import('../src/fagi.js');
  const { useNest } = await import('../src/nest.js');
  on(() => {
    const world = createWorld();
    const nest = addObject(world, 400, 400, 'nest');
    const f = createFagi();
    f.x = nest.x; f.y = nest.y;
    f.carrying = { type: 'nectar', age: 0, weight: 1.5, hardness: 1 };
    useNest(f, world);
    assert.equal(f.provided, 1.5);
  });
});
