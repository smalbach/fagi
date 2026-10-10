import test from 'node:test';
import assert from 'node:assert/strict';

import { DIZZY } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { senseTurning, shunned } from '../src/dizzy.js';
import { turnTowards } from '../src/movement.js';

// Going round a small circle: a full turn every 4 s, never getting away.
function circle(fagi, target, secs) {
  fagi.target = target;
  const dt = 0.05;
  for (let t = 0; t < secs; t += dt) {
    fagi.age += dt;
    fagi.angle += (2 * Math.PI / 4) * dt;
    fagi.x = 100 + Math.cos(fagi.angle) * 10;
    fagi.y = 100 + Math.sin(fagi.angle) * 10;
    senseTurning(fagi, dt);
    if (fagi.dizzy) return;
  }
}

test('without DIZZY going round and round changes nothing', () => {
  const fagi = createFagi();
  circle(fagi, { x: 100, y: 100 }, 12);
  assert.equal(fagi.dizzy ?? null, null);
});

test('with DIZZY a full circle getting nowhere makes her dizzy, and she shuns what she was going for', () => {
  DIZZY.enabled = 1;
  const fagi = createFagi();
  fagi.dizzyK = 1;
  const target = { x: 100, y: 100 };
  circle(fagi, target, 12);
  assert.ok(fagi.dizzy, 'dizzy');
  assert.equal(fagi.dizzy.dir, 1);
  assert.ok(shunned(fagi, target));
  // She won't turn further that way, but she can turn back.
  const a = fagi.angle;
  turnTowards(fagi, a + 1, 0.1);
  assert.equal(fagi.angle, a);
  turnTowards(fagi, a - 1, 0.1);
  assert.ok(fagi.angle < a);
  fagi.age += DIZZY.shun + 1;
  assert.equal(shunned(fagi, target), false, 'a while later it is in reach again');
  DIZZY.enabled = 0;
});

test('with DIZZY turning while getting somewhere is no dizziness', () => {
  DIZZY.enabled = 1;
  const fagi = createFagi();
  fagi.dizzyK = 1;
  const dt = 0.05;
  for (let t = 0; t < 12; t += dt) {
    fagi.age += dt;
    fagi.angle += 0.5 * dt;
    fagi.x += Math.cos(fagi.angle) * 70 * dt + 20 * dt;
    fagi.y += Math.sin(fagi.angle) * 70 * dt;
    senseTurning(fagi, dt);
  }
  assert.equal(fagi.dizzy ?? null, null);
  DIZZY.enabled = 0;
});
