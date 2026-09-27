import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import * as store from '../src/learned/store.js';
import { createPlayer } from '../src/recorder/replay.js';
import { modernKey } from '../src/legacy.js';

// A learned-code file exported before the codebase moved to English.
const OLD_MODULE = [
  '// Código aprendido por Fagi · edad 132.4s',
  "import { rule } from './dsl.js';",
  'export default [',
  `  rule('evitar-toxico', {"on":["eat","store","pursue"],"when":{"key":"toxico"},"verdict":"avoid","weight":-0.63,"because":[{"sense":"hunger","v":25}],"learnedAt":70.2,"tries":2,"stage":"corta"}),`,
  `  // retirada 40.0s: rule('preferir-chispa', {"on":["eat","store"],"when":{"key":"chispa"},"verdict":"prefer","weight":0.1,"because":[{"sense":"contradiccion","v":0}],"learnedAt":5,"tries":3,"stage":"media","retired":true,"retiredAt":40}),`,
  '];',
  'export const memoria = {"facts":{"toxico":{"value":-0.63,"confidence":0.7,"confirms":1,"stage":"corta","tries":2}},"synapses":{"key:toxico>feel:hunger":{"a":"key:toxico","b":"feel:hunger","w":-0.5,"n":1}}};',
].join('\n');

test('legacy keys map to their English names; English and prose pass through', () => {
  assert.equal(modernKey('evitar-toxico'), 'avoid-toxic');
  assert.equal(modernKey('sense:vista>key:agua'), 'sense:sight>key:water');
  assert.equal(modernKey('stage.corta'), 'stage.short');
  assert.equal(modernKey('avoid-toxic'), 'avoid-toxic');
  assert.equal(modernKey('se secó el charco'), 'se secó el charco');
});

test('an old Spanish learned-code file still imports, in English', () => {
  const fagi = createFagi();
  store.importText(fagi, OLD_MODULE);
  assert.ok(fagi.brain.facts.toxic);
  assert.equal(fagi.brain.facts.toxic.stage, 'short');
  const [active, retired] = fagi.brain.rules.list;
  assert.equal(active.id, 'avoid-toxic');
  assert.equal(active.when.key, 'toxic');
  assert.equal(retired.id, 'prefer-spark');
  assert.equal(retired.stage, 'medium');
  assert.ok(fagi.brain.synapses['key:toxic>feel:hunger']);
});

test('an old Spanish recorded session replays with English keys', () => {
  const player = createPlayer([
    { seq: 0, t: 0, type: 'session_start', config: {}, world: {} },
    { seq: 1, t: 0, type: 'obj_add', id: 1, what: 'nido', x: 10, y: 10 },
    { seq: 2, t: 0, type: 'obj_add', id: 2, what: 'arbol', x: 50, y: 50 },
  ]);
  const types = player.seek(1).world.objects.map((o) => o.type).sort();
  assert.deepEqual(types, ['nest', 'tree']);
});
