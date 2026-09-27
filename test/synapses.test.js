import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrain, learn } from '../src/brain.js';
import { hebb, decaySynapses } from '../src/synapses.js';

test('learning wires the concept to what the body felt, with its sign', () => {
  const brain = createBrain();
  learn(brain, 'nectar', 0.8, 1, [{ sense: 'hunger', v: -35 }]);
  learn(brain, 'toxic', -0.6, 2, [{ sense: 'hunger', v: 25 }, { sense: 'speed', v: 0.6 }]);
  assert.ok(brain.synapses['key:nectar>feel:hunger'].w > 0, 'nectar relieves hunger');
  assert.ok(brain.synapses['key:toxic>feel:hunger'].w < 0, 'toxic causes hunger');
  assert.ok(brain.synapses['key:toxic>feel:speed'].w < 0, 'toxic slows down');
});

test('perceiving together connects; unused connections weaken and get pruned', () => {
  const syn = {};
  let t = 0;
  for (; t < 3; t += 0.1) { hebb(syn, 'sense:sight', 'key:water', 0.1, t); decaySynapses(syn, 0.1, t); }
  const strong = syn['sense:sight>key:water'].w;
  assert.ok(strong > 0.5, `it strengthens: ${strong}`);
  for (; t < 400; t += 1) decaySynapses(syn, 1, t);
  assert.equal(syn['sense:sight>key:water'], undefined, 'unused, it is pruned');
});
