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

test('the exported file carries what the body felt (feel synapses), and importing keeps it', () => {
  const fagi = createFagi();
  eat(fagi, 'toxico');
  const syn = Object.values(fagi.brain.synapses).filter((s) => s.kind === 'feel');
  assert.ok(syn.length > 0, 'comer algo malo conecta concepto→sensación');

  const texto = store.exportText(fagi);
  const otra = createFagi();
  store.importText(otra, texto);
  const importadas = Object.values(otra.brain.synapses).filter((s) => s.kind === 'feel');
  assert.equal(importadas.length, syn.length);
  for (const s of syn) {
    const x = otra.brain.synapses[`${s.a}>${s.b}`];
    assert.ok(x, `${s.a}>${s.b}`);
    assert.ok(Math.abs(x.w - s.w) < 1e-3);
  }
  // Y el autoguardado lleva exactamente lo mismo que el archivo.
  assert.deepEqual(Object.keys(store.snapshot(fagi).synapses).sort(), syn.map((s) => `${s.a}>${s.b}`).sort());
});

test('a malformed synapse in an imported file is dropped, not trusted', () => {
  const fagi = createFagi();
  const texto = store.exportText(fagi).replace(
    /export const memoria = \{/,
    'export const memoria = {"synapses":{"x":{"a":"sense:vista","b":"feel:hunger","w":9}},',
  );
  const otra = createFagi();
  store.importText(otra, texto);
  assert.equal(Object.keys(otra.brain.synapses).length, 0);
});
