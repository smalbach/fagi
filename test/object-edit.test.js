import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, addObject, addPoint } from '../src/world.js';
import { editParams, editSet, noteEdit } from '../src/object-edit.js';
import { intervalOf, maxNearOf } from '../src/trees.js';

test('a tree set by hand keeps its own pace, fruit and size', () => {
  const w = createWorld();
  const tree = addObject(w, 200, 200, 'tree');
  assert.ok(editParams(tree).some((p) => p.id === 'fruit' && p.options.includes('toxic')));
  assert.deepEqual(editSet(w, tree, 'interval', 12), { from: intervalOf({}), to: 12 });
  assert.equal(intervalOf(tree), 12);
  assert.ok(tree.timer <= 12);
  editSet(w, tree, 'maxNear', 999);
  assert.equal(maxNearOf(tree), 30);   // clamped
  editSet(w, tree, 'fruit', 'toxic');
  assert.equal(tree.fruit, 'toxic');
  assert.equal(editSet(w, tree, 'fruit', 'nothing-like-it'), null);
  editSet(w, tree, 'r', 60);
  assert.equal(tree.r, 60);
});

test('only a finished edit in a running session marks it as touched', () => {
  const w = createWorld();
  const rock = addObject(w, 300, 300, 'rock');
  assert.deepEqual(editParams(rock).map((p) => p.id), ['r']);
  noteEdit(w, rock, 'r', 20, 30, { mark: false });
  assert.equal(w.god ?? 0, 0);
  noteEdit(w, rock, 'r', 20, 30);
  assert.equal(w.god, 1);
});

test('a fruit can be aged by hand', () => {
  const w = createWorld();
  const p = addPoint(w, 100, 100, 'nectar');
  editSet(w, p, 'age', 5);
  assert.equal(p.age, 5);
});
