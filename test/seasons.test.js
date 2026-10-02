import test from 'node:test';
import assert from 'node:assert/strict';

import { SEASONS, CYCLE } from '../src/config.js';
import { createWorld } from '../src/world.js';
import { updateSeasons, seasonNow } from '../src/seasons.js';
import { cycleAt } from '../src/cycle.js';

const on = (fn) => { SEASONS.enabled = 1; try { return fn(); } finally { SEASONS.enabled = 0; SEASONS.unpredictable = 0; } };
const at = (world, t) => { world.time = t; updateSeasons(world); return seasonNow(); };

test('off: every day the same, trees at their rate, no cold', () => {
  const w = createWorld();
  const s = at(w, SEASONS.year * SEASONS.winterAt);
  assert.equal(s.fruit, 1);
  assert.equal(s.cold, 0);
});

test('a predictable year: lean, cold winter at its centre; generous summer; the same every year', () => {
  on(() => {
    const w = createWorld();
    const deep = at(w, SEASONS.year * SEASONS.winterAt);
    assert.equal(deep.name, 'winter');
    assert.ok(Math.abs(deep.fruit - SEASONS.winterFruit) < 1e-9);
    assert.ok(Math.abs(deep.cold - SEASONS.winterCold) < 1e-9);
    const summer = at(w, SEASONS.year * ((SEASONS.winterAt + 0.5) % 1));
    assert.equal(summer.name, 'summer');
    assert.equal(summer.fruit, SEASONS.summerFruit);
    const next = at(w, SEASONS.year * (1 + SEASONS.winterAt));
    assert.equal(next.depth, deep.depth);
  });
});

test('unpredictable: winters differ from year to year', () => {
  on(() => {
    SEASONS.unpredictable = 1;
    const w = createWorld();
    const depths = [];
    for (let y = 0; y < 6; y++) depths.push(at(w, SEASONS.year * (y + SEASONS.winterAt)).depth.toFixed(3));
    assert.ok(new Set(depths).size > 1, depths.join(' '));
  });
});

test('winter takes degrees off the sky', () => {
  on(() => {
    CYCLE.enabled = 1;
    try {
      const w = createWorld();
      const t = SEASONS.year * SEASONS.winterAt;
      SEASONS.enabled = 0; updateSeasons(w);
      const mild = cycleAt(t).ambient;
      SEASONS.enabled = 1; w.time = t; updateSeasons(w);
      assert.ok(Math.abs(mild - cycleAt(t).ambient - SEASONS.winterCold) < 1e-9);
    } finally { CYCLE.enabled = 0; updateSeasons(createWorld()); }
  });
});

test('hot years: a summer that scorches, a winter lean but not cold; persist keeps the kind', () => {
  on(() => {
    SEASONS.hotYears = 1;
    try {
      const w = createWorld();
      const summer = at(w, SEASONS.year * ((SEASONS.winterAt + 0.5) % 1));
      assert.ok(summer.hot);
      assert.ok(Math.abs(summer.cold + SEASONS.summerHeat) < 1e-9, 'the air is summerHeat warmer');
      const deep = at(w, SEASONS.year * SEASONS.winterAt);
      assert.ok(deep.cold <= 0, 'no winter cold');
      assert.ok(Math.abs(deep.fruit - SEASONS.winterFruit) < 1e-9, 'still lean');
      // Half hot, always kept: every year the first one's kind.
      SEASONS.hotYears = 0.5; SEASONS.persist = 1;
      const w2 = createWorld();
      const kinds = new Set();
      for (let y = 0; y < 8; y++) kinds.add(at(w2, SEASONS.year * (y + 0.1)).hot);
      assert.equal(kinds.size, 1);
      // Never kept: both kinds show up.
      SEASONS.persist = 0;
      const w3 = createWorld();
      const k3 = [];
      for (let y = 0; y < 20; y++) k3.push(at(w3, SEASONS.year * (y + 0.1)).hot);
      assert.equal(new Set(k3).size, 2);
    } finally { SEASONS.hotYears = 0; SEASONS.persist = 0; }
  });
});

test('far years: only the trees beyond the middle distance bear; near years, only the nearer', async () => {
  const { addObject } = await import('../src/world.js');
  const { updateTrees } = await import('../src/trees.js');
  on(() => {
    SEASONS.farYears = 1; SEASONS.persist = 1;
    try {
      const w = createWorld();
      addObject(w, 100, 100, 'nest');
      const near = addObject(w, 150, 100, 'tree');
      const far = addObject(w, 900, 600, 'tree');
      at(w, SEASONS.year * ((SEASONS.winterAt + 0.5) % 1));
      assert.equal(seasonNow().far, true);
      near.timer = far.timer = 1000;
      updateTrees(w, 10);
      assert.ok(1000 - far.timer > 1000 - near.timer, `far ${far.timer} near ${near.timer}`);
    } finally { SEASONS.farYears = 0; SEASONS.persist = 0; }
  });
});
