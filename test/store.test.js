import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import * as store from '../src/learned/store.js';

// Un localStorage de mentira, en memoria: no depende de que el entorno
// tenga uno de verdad, y cada prueba parte de uno vacío.
function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('save/load/restore round-trips facts and rules through a storage of choice', () => {
  const storage = fakeStorage();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');
  assert.ok(fagi.brain.rules.list.length > 0);

  assert.equal(store.hasSnapshot(storage), false);
  assert.ok(store.save(store.snapshot(fagi), storage));
  assert.equal(store.hasSnapshot(storage), true);

  const otro = createFagi();
  assert.deepEqual(Object.keys(otro.brain.facts), []);   // nace sin saber nada
  store.restore(otro, store.load(storage));
  assert.deepEqual(Object.keys(otro.brain.facts).sort(), Object.keys(fagi.brain.facts).sort());
  assert.equal(otro.brain.rules.list.length, fagi.brain.rules.list.length);
  assert.equal(otro.brain.facts.toxico.value, fagi.brain.facts.toxico.value);
});

test('exporting and re-importing leaves facts and rules equivalent', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  eat(fagi, 'toxico');
  const texto = store.exportText(fagi);

  const otro = createFagi();
  store.importText(otro, texto);
  assert.equal(otro.brain.facts.nectar.value, fagi.brain.facts.nectar.value);
  assert.equal(otro.brain.facts.toxico.value, fagi.brain.facts.toxico.value);
  assert.equal(otro.brain.rules.list.length, fagi.brain.rules.list.length);
});

test('importing an invalid file throws and never touches the current memory', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  const antes = JSON.stringify(fagi.brain.facts);

  assert.throws(() => store.importText(fagi, 'esto no es un módulo de fagi'));
  assert.equal(JSON.stringify(fagi.brain.facts), antes);
});

test('wipe clears memory, rules and the recoverable copy, but nothing else', () => {
  const storage = fakeStorage();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');
  store.save(store.snapshot(fagi), storage);
  const x = fagi.x;

  store.wipe(fagi, storage);
  assert.deepEqual(fagi.brain.facts, {});
  assert.deepEqual(fagi.brain.rules.list, []);
  assert.equal(store.hasSnapshot(storage), false);
  assert.equal(fagi.x, x);   // no toca nada que no sea lo aprendido
});

test('autoSave only writes every LEARN.autosaveEvery simulated seconds', () => {
  const storage = fakeStorage();
  const fagi = createFagi();
  store.autoSave(fagi, 1, storage);
  assert.equal(store.hasSnapshot(storage), false);
  store.autoSave(fagi, 20, storage);
  assert.equal(store.hasSnapshot(storage), true);
});
