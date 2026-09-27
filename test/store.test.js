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
  eat(fagi, 'toxic');
  assert.ok(fagi.brain.rules.list.length > 0);

  assert.equal(store.hasSnapshot(storage), false);
  assert.ok(store.save(store.snapshot(fagi), storage));
  assert.equal(store.hasSnapshot(storage), true);

  const other = createFagi();
  assert.deepEqual(Object.keys(other.brain.facts), []);   // nace sin saber nada
  store.restore(other, store.load(storage));
  assert.deepEqual(Object.keys(other.brain.facts).sort(), Object.keys(fagi.brain.facts).sort());
  assert.equal(other.brain.rules.list.length, fagi.brain.rules.list.length);
  assert.equal(other.brain.facts.toxic.value, fagi.brain.facts.toxic.value);
});

test('exporting and re-importing leaves facts and rules equivalent', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  eat(fagi, 'toxic');
  const text = store.exportText(fagi);

  const other = createFagi();
  store.importText(other, text);
  assert.equal(other.brain.facts.nectar.value, fagi.brain.facts.nectar.value);
  assert.equal(other.brain.facts.toxic.value, fagi.brain.facts.toxic.value);
  assert.equal(other.brain.rules.list.length, fagi.brain.rules.list.length);
});

test('importing an invalid file throws and never touches the current memory', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  const before = JSON.stringify(fagi.brain.facts);

  assert.throws(() => store.importText(fagi, 'esto no es un módulo de fagi'));
  assert.equal(JSON.stringify(fagi.brain.facts), before);
});

test('wipe clears memory, rules and the recoverable copy, but nothing else', () => {
  const storage = fakeStorage();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxic');
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

test('the exported file carries what the body felt (feel synapses), and importing keeps it', () => {
  const fagi = createFagi();
  eat(fagi, 'toxic');
  const syn = Object.values(fagi.brain.synapses).filter((s) => s.kind === 'feel');
  assert.ok(syn.length > 0, 'comer algo malo conecta concepto→sensación');

  const text = store.exportText(fagi);
  const another = createFagi();
  store.importText(another, text);
  const importadas = Object.values(another.brain.synapses).filter((s) => s.kind === 'feel');
  assert.equal(importadas.length, syn.length);
  for (const s of syn) {
    const x = another.brain.synapses[`${s.a}>${s.b}`];
    assert.ok(x, `${s.a}>${s.b}`);
    assert.ok(Math.abs(x.w - s.w) < 1e-3);
  }
  // Y el autoguardado lleva exactamente lo mismo que el archivo.
  assert.deepEqual(Object.keys(store.snapshot(fagi).synapses).sort(), syn.map((s) => `${s.a}>${s.b}`).sort());
});

test('a malformed synapse in an imported file is dropped, not trusted', () => {
  const fagi = createFagi();
  const text = store.exportText(fagi).replace(
    /export const memoria = \{/,
    'export const memoria = {"synapses":{"x":{"a":"sense:vista","b":"feel:hunger","w":9}},',
  );
  const another = createFagi();
  store.importText(another, text);
  assert.equal(Object.keys(another.brain.synapses).length, 0);
});
