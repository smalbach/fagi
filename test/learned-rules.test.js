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
    on: ['eat'], when: { key: 'toxic' }, verdict: 'avoid', weight: -0.5,
    because: [{ sense: 'hunger', v: 25 }], learnedAt: 1, tries: 1, stage: 'short',
  };
  assert.ok(rule('avoid-toxic', base));
  assert.throws(() => rule('Avoid-Toxic', base));                       // malformed id
  assert.throws(() => rule('avoid-toxic', { ...base, verdict: 'meh' })); // invalid verdict
  assert.throws(() => rule('avoid-toxic', { ...base, on: [] }));        // empty scope
  assert.throws(() => rule('avoid-toxic', { ...base, on: ['fly'] }));   // unknown scope
  assert.throws(() => rule('avoid-toxic', { ...base, weight: 'lots' }));
  assert.throws(() => rule('avoid-toxic', { ...base, extra: 1 }));      // unknown field
});

test('a module round-trips through render and parse: active, retired and memory', () => {
  const rules = createRules();
  const activeOne = rule('avoid-toxic', {
    on: ['eat', 'store', 'pursue'], when: { key: 'toxic' }, verdict: 'avoid', weight: -0.63,
    because: [{ sense: 'hunger', v: 25 }, { sense: 'speed', v: 0.6 }],
    learnedAt: 70.2, revisedAt: 85.9, tries: 2, stage: 'short',
  });
  const retiredOne = rule('prefer-spark', {
    on: ['eat', 'store'], when: { key: 'spark' }, verdict: 'prefer', weight: 0.1,
    because: [{ sense: 'speed', v: 1.8 }], learnedAt: 5, tries: 3, stage: 'short',
    retired: true, retiredAt: 40,
  });
  const facts = { toxic: { value: -0.63, confidence: 0.7, confirms: 1, stage: 'short', tries: 2 } };

  const text = renderModule([activeOne, retiredOne], facts, { age: 132.4 });
  assert.match(text, /rule\('avoid-toxic'/);
  assert.match(text, /\/\/ retired 40\.0s: rule\('prefer-spark'/);

  const readOne = parseModule(text);
  assert.equal(readOne.rules.length, 2);
  const back = readOne.rules.find((r) => r.id === 'avoid-toxic');
  assert.equal(back.verdict, 'avoid');
  assert.equal(back.weight, -0.63);
  assert.equal(back.revisedAt, 85.9);
  const retiredBack = readOne.rules.find((r) => r.id === 'prefer-spark');
  assert.equal(retiredBack.retired, true);
  assert.equal(retiredBack.retiredAt, 40);
  assert.deepEqual(readOne.facts, facts);
});

test('parseModule refuses to execute anything: garbage in, clear error, nothing applied', () => {
  assert.throws(() => parseModule('not a module at all'));
  assert.throws(() => parseModule("rule('bad', {\"verdict\":\"avoid\"})")); // JSON missing fields
  assert.throws(() => parseModule('rule(\'bad\', not json)'));
});

test('verdict: an accidental encounter is vetoed, a deliberate one stays open to curiosity', () => {
  const fagi = createFagi();
  const { list } = fagi.brain.rules;
  list.push(rule('avoid-toxic', {
    on: ['eat', 'store', 'pursue'], when: { key: 'toxic' }, verdict: 'avoid', weight: -0.6,
    because: [{ sense: 'hunger', v: 25 }], learnedAt: 0, tries: 1, stage: 'short',
  }));

  assert.equal(verdict(fagi, 'eat', 'toxic', { deliberate: false }), 'avoid');
  assert.equal(verdict(fagi, 'store', 'toxic'), 'avoid');   // storing leaves no room for curiosity
  // Deliberate AND with curiosity left (tries=0 in memory, never really tried):
  assert.equal(verdict(fagi, 'eat', 'toxic', { deliberate: true }), null);
});

test('a rule that throws is quarantined and stops counting, without touching decide()', () => {
  const fagi = createFagi();
  const { list } = fagi.brain.rules;
  list.push({
    id: 'broken', on: ['eat'], get when() { throw new Error('boom'); },
    verdict: 'avoid', weight: -1, because: [], learnedAt: 0, tries: 1, stage: 'short',
  });
  assert.doesNotThrow(() => verdict(fagi, 'eat', 'toxic'));
  assert.equal(fagi.brain.rules.quarantined.has('broken'), true);
});

test('one toxic bite is enough to write "avoid-toxic"', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxic');

  const r = activeRule(fagi.brain.rules, 'toxic', 'avoid');
  assert.ok(r, 'no active avoid rule for toxic');
  assert.deepEqual(r.on, ['eat', 'store', 'pursue']);
  assert.ok(r.because.length > 0);
  assert.equal(fagi.brain.lastRule.kind, 'new');
  assert.equal(fagi.brain.lastRule.id, 'avoid-toxic');
});

test('a belief that climbs back above the exit threshold retires its rule', () => {
  const fagi = createFagi();
  learn(fagi.brain, 'spark', -1, 0);   // bad bite: the rule is born
  const before = activeRule(fagi.brain.rules, 'spark', 'avoid');
  assert.ok(before);

  // One spaced-out, good confirmation is enough to bring it back above the
  // exit threshold: it is retired and does not return to "avoid-spark" while it stays that way.
  const change = learn(fagi.brain, 'spark', 1, 20);
  assert.equal(activeRule(fagi.brain.rules, 'spark', 'avoid'), null);
  const retiredOne = fagi.brain.rules.list.find((r) => r.id === 'avoid-spark');
  assert.equal(retiredOne.retired, true);

  // And if the evidence stays good, over time she also learns to
  // prefer it: she does not just drop the bad rule, she writes the good one.
  let now = 40;
  for (let i = 0; i < 6; i++) { learn(fagi.brain, 'spark', 1, now); now += 20; }
  assert.ok(activeRule(fagi.brain.rules, 'spark', 'prefer'));
});

test('the learned code keeps up with learning and forgetting, not only with rule changes', async () => {
  const { weight } = await import('../src/memory.js');
  const { createWorld } = await import('../src/world.js');
  const { step } = await import('../src/simulation.js');
  const fagi = createFagi();
  const world = createWorld();

  // Learning something that does not reach a rule also changes what was learned.
  const v0 = fagi.brain.version;
  const seq0 = fagi.brain.rules.seq;
  learn(fagi.brain, 'water', 0.2, 0);
  assert.equal(fagi.brain.rules.seq, seq0, 'there is no rule to touch');
  assert.ok(fagi.brain.version > v0, 'but the panel has to find out');

  // With forgetting, the weight written in the rule follows the belief's.
  for (let i = 0; i < 3; i++) learn(fagi.brain, 'toxic', -0.8, i * 20);
  const ruleOf = () => fagi.brain.rules.list.find((r) => r.id === 'avoid-toxic');
  const written = ruleOf().weight;
  for (let i = 0; i < 60 * 20; i++) step(world, fagi, 0.05);
  assert.ok(Math.abs(ruleOf().weight) < Math.abs(written), 'the rule weight drops with forgetting');
  assert.ok(Math.abs(ruleOf().weight - weight(fagi.brain, 'toxic')) < 0.01, 'and matches the belief weight');
  assert.equal(ruleOf().retired, undefined, 'forgetting does not retire it');
});
