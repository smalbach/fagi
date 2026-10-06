import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM } from '../src/config.js';
import { programOf } from '../src/program.js';
import { crisis, clauseOf, isCrisisLine } from '../src/program/crisis.js';
import { createFagi } from '../src/fagi.js';

// Feed crisis() a lived stretch: [seconds, share of distress at the end, root
// that led]. Distress goes to crisis() raised to PROGRAM.power, as watch.js
// hands it.
const TICK = 0.25;
function live(fagi, ctx, stretch) {
  let share = stretch.start ?? 0.1;
  for (const [secs, to, root] of stretch.steps) {
    const n = Math.round(secs / TICK);
    const from = share;
    for (let i = 1; i <= n; i++) {
      share = from + ((to - from) * i) / n;
      fagi.age += TICK;
      crisis(fagi, ctx, TICK, share ** PROGRAM.power, root);
    }
  }
}

function sabotaged(...ids) {
  const fagi = createFagi();
  fagi.age = 0;
  const p = programOf(fagi);
  const moved = p.lines.filter((l) => ids.includes(l.id));
  p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  return fagi;
}

const ctx = { hungerU: 0.2, thirstU: 0.1, energyU: 0.3, inNest: false };
const own = (fagi) => programOf(fagi).lines.filter(isCrisisLine);

test('crisis: the reliever she lived goes in front of what she was doing, where it happened', () => {
  const fagi = sabotaged('rest');
  live(fagi, ctx, { steps: [[30, 0.2, 'pursue'], [10, 0.7, 'pursue'], [10, 0.4, 'rest'], [4, 0.3, 'carry']] });
  const lines = own(fagi);
  assert.equal(lines.length, 1);
  const [l] = lines;
  assert.equal(l.from, 'rest');
  assert.equal(l.over, 'pursue');
  assert.deepEqual(l.if, { energyBelow: 0.35 });
  const ids = programOf(fagi).lines.map((x) => x.id);
  assert.ok(ids.indexOf(l.id) < ids.indexOf('pursue'), 'written in front of the culprit');
  assert.equal(fagi.brain.crisis.stats.written, 1);
});

test('crisis: nothing is written when what relieved her already stands first', () => {
  const fagi = createFagi();
  fagi.age = 0;
  live(fagi, ctx, { steps: [[30, 0.2, 'pursue'], [10, 0.7, 'pursue'], [10, 0.4, 'rest'], [4, 0.3, 'carry']] });
  assert.equal(fagi.brain.crisis.stats.onsets, 1);
  assert.equal(own(fagi).length, 0);
});

test('crisis: a need that crept up is not a crisis', () => {
  const fagi = sabotaged('rest');
  live(fagi, ctx, { steps: [[200, 0.7, 'pursue'], [10, 0.4, 'rest'], [4, 0.3, 'carry']] });
  assert.equal(fagi.brain.crisis.stats.onsets, 0);
  assert.equal(own(fagi).length, 0);
});

test('crisis: if her distress fell under nothing she did, nothing is written', () => {
  const fagi = sabotaged('rest');
  live(fagi, ctx, { steps: [[30, 0.2, 'pursue'], [10, 0.7, 'pursue'], [10, 0.8, 'rest'], [5, 0.3, null]] });
  assert.equal(fagi.brain.crisis.stats.onsets, 1);
  assert.equal(own(fagi).length, 0);
});

test('crisis: a line that did not help at the next crisis is retired', () => {
  const fagi = sabotaged('rest');
  const crisisThen = (relief) => live(fagi, ctx, { steps: [[30, 0.2, 'pursue'], [10, 0.7, 'pursue'], [10, relief, 'rest'], [4, 0.3, 'carry']] });
  crisisThen(0.4);
  assert.equal(own(fagi).filter((l) => !l.retired).length, 1);
  // Next time, rest leads and her distress keeps rising; it falls only later.
  live(fagi, ctx, { steps: [[30, 0.2, 'pursue'], [10, 0.7, 'pursue'], [10, 0.85, 'rest'], [4, 0.3, null]] });
  const [l] = own(fagi);
  assert.equal(l.retired, true);
  assert.equal(fagi.brain.crisis.stats.retired, 1);
});

test('crisis: off by default', () => {
  assert.equal(PROGRAM.crisis, 0);
});

test('crisis: the clause says what held — a flag on, else the need that hurt most', () => {
  assert.deepEqual(clauseOf({ hunger: 0.2, thirst: 0.1, energy: 0.3, dark: true, raining: true }), { dark: true });
  assert.deepEqual(clauseOf({ hunger: 0.8, thirst: 0.1, energy: 0.9 }), { hungerFrom: 0.75 });
  assert.deepEqual(clauseOf({ hunger: 0.1, thirst: 0.2, energy: 0.2 }), { energyBelow: 0.25 });
});
