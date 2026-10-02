import test from 'node:test';
import assert from 'node:assert/strict';

import { COLONIES, LIFE, SEX } from '../src/config.js';
import { createWorld, addObject, nestOf, nestsOf, storeInNest } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createColony } from '../src/colony.js';
import { updateLife } from '../src/reproduction.js';
import { nestUnder } from '../src/nest.js';

const many = (fn) => { COLONIES.count = 3; try { return fn(); } finally { COLONIES.count = 1; } };
const breeding = (fn) => { LIFE.enabled = 1; SEX.enabled = 1; try { return fn(); } finally { LIFE.enabled = 0; SEX.enabled = 0; } };

test('one colony, as always: one nest, nobody has a home of her own', () => {
  const w = createWorld();
  generateMap(w);
  assert.equal(nestsOf(w).length, 1);
});

test('more colonies: nests apart on the map, each with founders at its door', () => {
  many(() => breeding(() => {
    const w = createWorld();
    generateMap(w);
    const nests = nestsOf(w);
    assert.equal(nests.length, 3);
    for (let i = 0; i < nests.length; i++) for (let j = i + 1; j < nests.length; j++) {
      assert.ok(Math.hypot(nests[i].x - nests[j].x, nests[i].y - nests[j].y) >= COLONIES.spacing);
    }
    for (const n of nests) storeInNest(n, 'nectar');
    const colony = createColony(4);
    w.colony = colony;
    updateLife(w, colony, 0.1);
    for (const n of nests) {
      const members = colony.ants.filter((f) => f.home === n.id);
      assert.equal(members.length, COLONIES.founders);
      assert.ok(members.some((f) => f.sex === 'female') && members.some((f) => f.sex === 'male'));
      assert.equal(nestOf(w, members[0]), n);
    }
  }));
});

test('she goes into her own nest only', () => {
  const w = createWorld();
  const a = addObject(w, 200, 200, 'nest');
  const b = addObject(w, 800, 600, 'nest');
  const f = { x: b.x, y: b.y, home: a.id };
  assert.equal(nestUnder(f, w), null, 'not into another colony\'s');
  f.home = b.id;
  assert.equal(nestUnder(f, w), b);
});

test('an emptied nest is refounded by a pair from a thriving colony', () => {
  many(() => breeding(() => {
    const w = createWorld();
    generateMap(w);
    const [first, , empty] = nestsOf(w);
    const colony = createColony(4);
    w.colony = colony;
    updateLife(w, colony, 0.1);
    // The third colony dies out; the first is full enough to send a pair.
    for (const f of colony.ants) if (f.home === empty.id) f.alive = false;
    const need = Math.ceil(COLONIES.foundAt * LIFE.maxPopulation);
    for (const f of colony.ants.filter((x) => x.home === first.id)) f.lifeStage = 'adult';
    const extra = colony.ants.filter((x) => x.home === first.id).length;
    for (let i = extra; i < need; i++) {
      const src = colony.ants.find((x) => x.home === first.id);
      colony.ants.push({ ...src, id: 1000 + i, sex: i % 2 ? 'male' : 'female' });
    }
    w.time = 1000;
    updateLife(w, colony, 0.1);
    const moved = colony.ants.filter((f) => f.alive && f.home === empty.id);
    assert.equal(moved.length, 2);
    assert.deepEqual(new Set(moved.map((f) => f.sex)), new Set(['female', 'male']));
    assert.equal(colony.life.founded, 1);
  }));
});
