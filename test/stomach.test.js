import test from 'node:test';
import assert from 'node:assert/strict';

import { STOMACH } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { feltHunger, digest } from '../src/stomach.js';

const on = (fn, satiety = 1) => { STOMACH.enabled = 1; STOMACH.satiety = satiety; try { return fn(); } finally { STOMACH.enabled = 0; STOMACH.satiety = 1; } };

test('off: a bite takes hunger away at once', () => {
  const f = createFagi();
  f.hunger = 60;
  eat(f, 'nectar');
  assert.ok(f.hunger < 60);
  assert.equal(f.stomach, undefined);
});

test('two stages: a bite fills the stomach, she feels fed at once, the body is fed as it digests', () => {
  on(() => {
    const f = createFagi();
    f.hunger = 60;
    eat(f, 'nectar');
    assert.equal(f.hunger, 60, 'her body not yet');
    assert.ok(f.stomach > 0);
    assert.ok(feltHunger(f) < 60, 'but she feels it');
    for (let t = 0; t < 120; t++) digest(f, 1);
    assert.ok(f.hunger < 60 && f.stomach < 1e-9);
  });
});

test('without satiety she feels only what reached her; a full stomach wastes the rest', () => {
  on(() => {
    const f = createFagi();
    f.hunger = 90;
    eat(f, 'nectar');
    assert.equal(feltHunger(f), 90);
    for (let i = 0; i < 3; i++) eat(f, 'nectar');
    assert.ok(f.stomach <= STOMACH.capacity + 1e-9);
    assert.ok(f.wasted > 0);
  }, 0);
});
