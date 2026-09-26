import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrain, learn } from '../src/brain.js';
import { hebb, decaySynapses } from '../src/synapses.js';

test('learning wires the concept to what the body felt, with its sign', () => {
  const brain = createBrain();
  learn(brain, 'nectar', 0.8, 1, [{ sense: 'hunger', v: -35 }]);
  learn(brain, 'toxico', -0.6, 2, [{ sense: 'hunger', v: 25 }, { sense: 'speed', v: 0.6 }]);
  assert.ok(brain.synapses['key:nectar>feel:hunger'].w > 0, 'néctar alivia el hambre');
  assert.ok(brain.synapses['key:toxico>feel:hunger'].w < 0, 'tóxico da hambre');
  assert.ok(brain.synapses['key:toxico>feel:speed'].w < 0, 'tóxico frena');
});

test('perceiving together connects; unused connections weaken and get pruned', () => {
  const syn = {};
  let t = 0;
  for (; t < 3; t += 0.1) { hebb(syn, 'sense:vista', 'key:agua', 0.1, t); decaySynapses(syn, 0.1, t); }
  const fuerte = syn['sense:vista>key:agua'].w;
  assert.ok(fuerte > 0.5, `se refuerza: ${fuerte}`);
  for (; t < 400; t += 1) decaySynapses(syn, 1, t);
  assert.equal(syn['sense:vista>key:agua'], undefined, 'sin uso se poda');
});
