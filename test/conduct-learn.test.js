import test from 'node:test';
import assert from 'node:assert/strict';

import { CONDUCT } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { noteMeal, conductOf, noteDeclined } from '../src/learned/conduct.js';
import { candidates, replay, learnConduct } from '../src/learned/conduct-learn.js';

function withConduct(settings, fn) {
  const saved = { ...CONDUCT, born: [...CONDUCT.born] };
  Object.assign(CONDUCT, settings);
  try { return fn(); } finally { Object.assign(CONDUCT, saved); }
}
const meal = (over) => ({ key: 'toxic', at: 100, portion: 1, novel: true, harmedBefore: false, harmedMostly: false, before: 50, after: 75, harmed: true, ...over });

test('a harmful whole bite of a new kind proposes a trial bite and leaving it, about that moment', () => {
  const cs = candidates(meal());
  assert.ok(cs.some((c) => c.do === 'taste' && c.if.novel));
  assert.ok(cs.some((c) => c.do === 'leave' && c.if.novel));
  assert.ok(cs.every((c) => Object.keys(c.if).length > 0));
  assert.ok(candidates(meal({ portion: 0.25 })).every((c) => c.do === 'leave'));
});

test('replayed over her bites, a line counts what it spares and what it costs', () => withConduct({ valuation: 'static' }, () => {
  const meals = [meal({ at: 10 }), meal({ at: 20, key: 'nectar', harmed: false, after: 15 }), meal({ at: 30 })];
  const s = replay({ if: { novel: true }, do: 'leave' }, meals);
  assert.equal(s.pro, 2);
  assert.equal(s.con, 1);
}));

test('as a stock, a meal left behind costs more than judged alone', () => {
  const meals = [
    meal({ at: 10, key: 'nectar', harmed: false, before: 50, after: 15 }),
    meal({ at: 40, key: 'nectar', novel: false, harmed: false, before: 70, after: 35 }),
  ];
  const leave = { if: { hungerBelow: 60 }, do: 'leave' };
  const alone = withConduct({ valuation: 'static' }, () => replay(leave, meals).gain);
  const stock = withConduct({ valuation: 'trajectory' }, () => replay(leave, meals).gain);
  assert.ok(stock < alone);
});

test('after enough harm she writes a line of her own, and says why', () => withConduct({ enabled: 1, learn: 1 }, () => {
  const fagi = createFagi();
  for (const [i, key] of ['blue-drop-sharp', 'red-orb-sour', 'green-drop-musky'].entries()) {
    fagi.age = 100 + 50 * i;
    learnConduct(fagi, noteMeal(fagi, { key, portion: 1, before: 50, after: 75 }));
  }
  const lines = conductOf(fagi).list.filter((r) => r.source === 'self');
  assert.ok(lines.length >= 1);
  assert.match(lines[0].why, /spared/);
}));

test('a fruit left because of a line is recorded once, only when hungry, and counts against the line', () => withConduct({ enabled: 1, declined: 1 }, () => {
  const fagi = createFagi();
  fagi.hunger = 30;
  assert.equal(noteDeclined(fagi, 'nectar', { id: 7 }, 45), false);
  fagi.hunger = 60;
  assert.equal(noteDeclined(fagi, 'nectar', { id: 7 }, 45), true);
  assert.equal(noteDeclined(fagi, 'nectar', { id: 7 }, 45), false);
  const c = conductOf(fagi);
  const fed = [meal({ at: 5, key: 'nectar', harmed: false, before: 50, after: 15 })];
  const s = replay({ if: { hungerFrom: 45 }, do: 'leave' }, fed, c.declined);
  assert.ok(s.con >= 2);
  assert.ok(s.gain < 0);
}));

test('a line born from a mother brings what her line gathered', () => withConduct({ enabled: 1, born: [
  { id: 'leave-novel', if: { novel: true }, do: 'leave', lineage: { pro: 5, con: 1, gain: 0.4, lives: 3 } },
] }, () => {
  const fagi = createFagi();
  const c = conductOf(fagi);
  assert.equal(c.list[0].source, 'born');
  assert.deepEqual(c.base['leave-novel'], { pro: 5, con: 1, gain: 0.4, lives: 3 });
}));
