import test from 'node:test';
import assert from 'node:assert/strict';

import { HABITATS, COLONIES, OBJECT_TYPES } from '../src/config.js';
import { createWorld, nestsOf } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { coldAt, fruitRateOf, habitatOfNest } from '../src/habitats.js';
import { rng, withRng } from '../scripts/batch/random.js';

const map = (seed, { habitats = 1, colonies = 3 } = {}) => {
  const was = [HABITATS.enabled, COLONIES.count];
  HABITATS.enabled = habitats;
  COLONIES.count = colonies;
  try {
    return withRng(rng(seed), () => { const w = createWorld(); generateMap(w); return w; });
  } finally {
    [HABITATS.enabled, COLONIES.count] = was;
  }
};
const on = (fn) => { const was = HABITATS.enabled; HABITATS.enabled = 1; try { return fn(); } finally { HABITATS.enabled = was; } };

test('off: no nest has a habitat, the air and the trees are as ever', () => {
  const w = map(3, { habitats: 0 });
  for (const n of nestsOf(w)) assert.equal(n.habitat, undefined);
  assert.equal(coldAt(w, 100, 100), 0);
  assert.ok(w.objects.filter((o) => o.type === 'tree').every((t) => fruitRateOf(w, t) === 1));
});

test('each of three nests gets a different habitat, and which is which varies by map', () => {
  const firsts = new Set();
  for (let s = 1; s <= 12; s++) {
    const w = map(s);
    const kinds = nestsOf(w).map((n) => n.habitat);
    assert.deepEqual([...kinds].sort(), [...HABITATS.kinds].sort());
    firsts.add(kinds[0]);
  }
  assert.ok(firsts.size > 1, 'the first nest is not always the same habitat');
});

test('the air is colder at the cold nest, and the lean nest\'s trees bear less', () => {
  const w = map(5);
  on(() => {
    const cold = nestsOf(w).find((n) => n.habitat === 'cold');
    assert.equal(coldAt(w, cold.x, cold.y), HABITATS.cold.cold);
    const other = nestsOf(w).find((n) => n.habitat !== 'cold');
    assert.equal(coldAt(w, other.x, other.y), 0);
    const mid = coldAt(w, (cold.x + other.x) / 2, (cold.y + other.y) / 2);
    assert.ok(mid > 0 && mid < HABITATS.cold.cold, `between the two: ${mid}`);
    const lean = nestsOf(w).find((n) => n.habitat === 'lean');
    assert.equal(habitatOfNest(w, lean).fruit, HABITATS.lean.fruit);
    const trees = w.objects.filter((o) => o.type === 'tree');
    const nearest = (t) => nestsOf(w).reduce((a, n) => (Math.hypot(n.x - t.x, n.y - t.y) < Math.hypot(a.x - t.x, a.y - t.y) ? n : a));
    for (const t of trees) assert.equal(fruitRateOf(w, t), nearest(t).habitat === 'lean' ? HABITATS.lean.fruit : 1);
  });
});

test('a poisonous tree grows close to the toxic nest', () => {
  const w = map(7);
  const toxic = nestsOf(w).find((n) => n.habitat === 'toxic');
  const bad = w.objects.filter((o) => o.type === 'tree' && o.fruit === 'toxic');
  assert.equal(bad.length, HABITATS.toxic.trees);
  const [near, far] = HABITATS.toxic.near;
  const d = Math.hypot(bad[0].x - toxic.x, bad[0].y - toxic.y);
  assert.ok(d >= near && d <= far, `${d}`);
});

test('every nest\'s water and trees are inside the map (they used to fall off its edge)', () => {
  for (let s = 1; s <= 40; s++) {
    const w = map(s);
    for (const o of w.objects) {
      if (!['water', 'tree', 'nest'].includes(o.type)) continue;
      const r = o.r ?? OBJECT_TYPES[o.type].radius;
      assert.ok(o.x - r >= 0 && o.y - r >= 0 && o.x + r <= w.width && o.y + r <= w.height, `map ${s}: ${o.type} at ${Math.round(o.x)}, ${Math.round(o.y)}`);
    }
    const waters = w.objects.filter((o) => o.type === 'water');
    for (const n of nestsOf(w)) assert.ok(waters.some((o) => Math.hypot(o.x - n.x, o.y - n.y) <= 330), `map ${s}: nest ${n.id} has water close`);
  }
});
