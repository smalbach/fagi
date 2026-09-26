import test from 'node:test';
import assert from 'node:assert/strict';

import { LEARN } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { learn } from '../src/brain.js';
import { rule, renderModule, parseModule } from '../src/learned/dsl.js';
import { createRules, verdict, activeRule } from '../src/learned/rules.js';

test('Fagi is born knowing nothing: no beliefs, no rules', () => {
  const fagi = createFagi();
  assert.deepEqual(Object.keys(fagi.brain.facts), []);
  assert.deepEqual(fagi.brain.rules.list, []);
});

test('rule() rejects malformed specs', () => {
  const base = {
    on: ['eat'], when: { key: 'toxico' }, verdict: 'avoid', weight: -0.5,
    because: [{ sense: 'hunger', v: 25 }], learnedAt: 1, tries: 1, stage: 'corta',
  };
  assert.ok(rule('evitar-toxico', base));
  assert.throws(() => rule('Evitar-Toxico', base));                       // id fuera de forma
  assert.throws(() => rule('evitar-toxico', { ...base, verdict: 'meh' })); // veredicto inválido
  assert.throws(() => rule('evitar-toxico', { ...base, on: [] }));        // alcance vacío
  assert.throws(() => rule('evitar-toxico', { ...base, on: ['volar'] })); // alcance desconocido
  assert.throws(() => rule('evitar-toxico', { ...base, weight: 'mucho' }));
  assert.throws(() => rule('evitar-toxico', { ...base, extra: 1 }));      // campo desconocido
});

test('a module round-trips through render and parse: active, retired and memory', () => {
  const rules = createRules();
  const activa = rule('evitar-toxico', {
    on: ['eat', 'store', 'pursue'], when: { key: 'toxico' }, verdict: 'avoid', weight: -0.63,
    because: [{ sense: 'hunger', v: 25 }, { sense: 'speed', v: 0.6 }],
    learnedAt: 70.2, revisedAt: 85.9, tries: 2, stage: 'corta',
  });
  const retirada = rule('preferir-chispa', {
    on: ['eat', 'store'], when: { key: 'chispa' }, verdict: 'prefer', weight: 0.1,
    because: [{ sense: 'speed', v: 1.8 }], learnedAt: 5, tries: 3, stage: 'corta',
    retired: true, retiredAt: 40,
  });
  const facts = { toxico: { value: -0.63, confidence: 0.7, confirms: 1, stage: 'corta', tries: 2 } };

  const texto = renderModule([activa, retirada], facts, { age: 132.4 });
  assert.match(texto, /rule\('evitar-toxico'/);
  assert.match(texto, /\/\/ retirada 40\.0s: rule\('preferir-chispa'/);

  const leido = parseModule(texto);
  assert.equal(leido.rules.length, 2);
  const back = leido.rules.find((r) => r.id === 'evitar-toxico');
  assert.equal(back.verdict, 'avoid');
  assert.equal(back.weight, -0.63);
  assert.equal(back.revisedAt, 85.9);
  const backRetirada = leido.rules.find((r) => r.id === 'preferir-chispa');
  assert.equal(backRetirada.retired, true);
  assert.equal(backRetirada.retiredAt, 40);
  assert.deepEqual(leido.facts, facts);
});

test('parseModule refuses to execute anything: garbage in, clear error, nothing applied', () => {
  assert.throws(() => parseModule('not a module at all'));
  assert.throws(() => parseModule("rule('bad', {\"verdict\":\"avoid\"})")); // JSON incompleto de campos
  assert.throws(() => parseModule('rule(\'bad\', not json)'));
});

test('verdict: an accidental encounter is vetoed, a deliberate one stays open to curiosity', () => {
  const fagi = createFagi();
  const { list } = fagi.brain.rules;
  list.push(rule('evitar-toxico', {
    on: ['eat', 'store', 'pursue'], when: { key: 'toxico' }, verdict: 'avoid', weight: -0.6,
    because: [{ sense: 'hunger', v: 25 }], learnedAt: 0, tries: 1, stage: 'corta',
  }));

  assert.equal(verdict(fagi, 'eat', 'toxico', { deliberate: false }), 'avoid');
  assert.equal(verdict(fagi, 'store', 'toxico'), 'avoid');   // guardar no admite curiosidad
  // Deliberado Y con curiosidad restante (tries=0 en memoria, no probado de verdad):
  assert.equal(verdict(fagi, 'eat', 'toxico', { deliberate: true }), null);
});

test('a rule that throws is quarantined and stops counting, without touching decide()', () => {
  const fagi = createFagi();
  const { list } = fagi.brain.rules;
  list.push({
    id: 'rota', on: ['eat'], get when() { throw new Error('boom'); },
    verdict: 'avoid', weight: -1, because: [], learnedAt: 0, tries: 1, stage: 'corta',
  });
  assert.doesNotThrow(() => verdict(fagi, 'eat', 'toxico'));
  assert.equal(fagi.brain.rules.quarantined.has('rota'), true);
});

test('one toxic bite is enough to write "evitar-toxico"', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');

  const r = activeRule(fagi.brain.rules, 'toxico', 'avoid');
  assert.ok(r, 'no active avoid rule for toxico');
  assert.deepEqual(r.on, ['eat', 'store', 'pursue']);
  assert.ok(r.because.length > 0);
  assert.equal(fagi.brain.lastRule.kind, 'nueva');
  assert.equal(fagi.brain.lastRule.id, 'evitar-toxico');
});

test('a belief that climbs back above the exit threshold retires its rule', () => {
  const fagi = createFagi();
  learn(fagi.brain, 'chispa', -1, 0);   // mal bocado: nace la regla
  const antes = activeRule(fagi.brain.rules, 'chispa', 'avoid');
  assert.ok(antes);

  // Una confirmación espaciada y buena basta para devolverla por encima del
  // umbral de salida: se retira y no vuelve a "evitar-chispa" mientras siga así.
  const cambio = learn(fagi.brain, 'chispa', 1, 20);
  assert.equal(activeRule(fagi.brain.rules, 'chispa', 'avoid'), null);
  const retirada = fagi.brain.rules.list.find((r) => r.id === 'evitar-chispa');
  assert.equal(retirada.retired, true);

  // Y si la evidencia sigue siendo buena, con el tiempo también aprende a
  // preferirlo: no se queda solo sin la regla mala, escribe la buena.
  let now = 40;
  for (let i = 0; i < 6; i++) { learn(fagi.brain, 'chispa', 1, now); now += 20; }
  assert.ok(activeRule(fagi.brain.rules, 'chispa', 'prefer'));
});
