import test from 'node:test';
import assert from 'node:assert/strict';

import { PROGRAM, CONDUCT } from '../src/config.js';
import { INNATE, CLAUSES, condId, line, createProgram, programOf, meets } from '../src/program.js';
import { imagine, imagining } from '../src/program/imagine.js';
import { watch, distress, trialOf } from '../src/program/watch.js';
import { qnorm, weigh, clears, review } from '../src/program/learn.js';
import { breaksBan, noteDeclined, conductOf } from '../src/learned/conduct.js';
import { decide } from '../src/decision.js';
import { createFagi } from '../src/fagi.js';
import { createWorld, addPoint } from '../src/world.js';
import { perceive } from '../src/perception.js';

// Settings changed for one test and put back after it.
function withSettings(block, values, fn) {
  const saved = Object.fromEntries(Object.keys(values).map((k) => [k, block[k]]));
  Object.assign(block, values);
  try { return fn(); } finally { Object.assign(block, saved); }
}

// Born with resting moved to the end: it acts only when nothing else would.
function restLast() {
  const moved = INNATE.find((l) => l.id === 'rest');
  const rest = INNATE.filter((l) => l !== moved);
  rest.splice(rest.findIndex((l) => l.id === 'taste'), 0, moved);
  return createProgram(rest);
}

test('imagining: what a behavior writes stays in the shadow, what it reads is hers', () => {
  const fagi = createFagi();
  fagi.memory = 3;
  assert.equal(imagining(), false);
  const seen = imagine(fagi, (her) => {
    assert.equal(imagining(), true);
    her.memory -= 1;
    her.resting = true;
    return { memory: her.memory, x: her.x };
  });
  assert.deepEqual(seen, { memory: 2, x: fagi.x });
  assert.equal(fagi.memory, 3);
  assert.equal(fagi.resting, false);
  assert.equal(imagining(), false);
});

test('imagined, her record of conduct decides nothing and notes nothing', () => {
  withSettings(CONDUCT, { enabled: 1, explore: 0.5, declined: 1 }, () => {
    const fagi = createFagi();
    fagi.hunger = 60;
    const fruit = { id: 77 };
    assert.equal(imagine(fagi, (her) => breaksBan(her, fruit, 45)), false);
    assert.equal(conductOf(fagi).stream, undefined, 'no draw while imagining');
    assert.equal(imagine(fagi, (her) => noteDeclined(her, 'nectar', fruit, 45)), false);
    assert.equal(conductOf(fagi).declined.length, 0);
    // Out of imagining, the same calls do their work.
    breaksBan(fagi, fruit, 45);
    assert.notEqual(conductOf(fagi).stream, undefined);
    assert.equal(noteDeclined(fagi, 'nectar', fruit, 45), true);
  });
});

test('the grammar: clauses to weigh, their names, and where a line came from', () => {
  assert.equal(CLAUSES.length, 3 * 2 * 8 + 5 * 2);
  assert.equal(condId({ thirstBelow: 0.45 }), 'thirstBelow45');
  assert.equal(condId({ raining: false }), 'notRaining');
  assert.equal(condId({}), '');
  const l = line('rest-before-pursue-energyBelow25', {
    tier: 'endure', if: { energyBelow: 0.25 }, do: 'rest', source: 'self', learnedAt: 5, from: 'rest', over: 'pursue',
  });
  assert.equal(l.from, 'rest');
  assert.equal(l.over, 'pursue');
  assert.throws(() => line('rest', { tier: 'endure', do: 'rest', source: 'self', learnedAt: 0, from: 'rest' }), /from/);
  assert.throws(() => line('a', { tier: 'endure', do: 'rest', source: 'self', learnedAt: 0, over: 'not an id' }), /over/);
});

test('distress: the worst need, steeper near the top', () => {
  assert.equal(distress({}, { hungerU: 0.5, thirstU: 0.2, energyU: 0.9 }), 0.5 ** PROGRAM.power);
  assert.equal(distress({}, { hungerU: 0, thirstU: 0, energyU: 0.25 }), 0.75 ** PROGRAM.power);
});

// --- watching ---------------------------------------------------------------

const CALM = { hungerU: 0.5, thirstU: 0.2, energyU: 0.9, inNest: false };

// What the walk found: `id` acted at its own place, or took the turn of `over`.
function walkOf(fagi, id, over = null) {
  const lines = programOf(fagi).lines;
  const i = lines.findIndex((l) => l.id === (over ?? id));
  return { kind: 'line', line: lines.find((l) => l.id === id), index: i, ...(over ? { over: lines[i] } : {}) };
}
// Imagining answers for the lines in `acting`.
const askFor = (acting) => (l) => (acting.includes(l.id) ? { action: l.do } : null);
const look = (fagi, walk, acting, ctx = CALM) => watch(fagi, ctx, PROGRAM.tick, walk, askFor(acting));

test('a moment: who leads, who else would have acted, and what it cost her', () => {
  withSettings(PROGRAM, { learn: 0, watch: 1 }, () => {
    const fagi = createFagi();
    look(fagi, walkOf(fagi, 'pursue'), ['pursue', 'memory', 'probe']);
    const w = fagi.brain.watch;
    assert.equal(w.open.length, 1);
    assert.equal(w.open[0].root, 'pursue');
    assert.deepEqual(w.open[0].below, ['memory', 'probe']);
    assert.equal(w.open[0].by, null);
    // The same leader for long is chosen again, every PROGRAM.reconsider seconds.
    for (let t = 0; t < PROGRAM.reconsider; t += PROGRAM.tick) look(fagi, walkOf(fagi, 'pursue'), ['pursue', 'memory']);
    assert.equal(w.stats.moments, 2);
    // Past the horizon, closed: in a steady body it cost her nothing over what she had.
    for (let t = 0; t < PROGRAM.horizon; t += PROGRAM.tick) look(fagi, walkOf(fagi, 'pursue'), ['pursue']);
    assert.ok(w.moments.length >= 2);
    assert.equal(w.moments[0].cost, 0);
  });
});

test('a trial: another line takes the turn of the one leading, and ends when it would not', () => {
  withSettings(PROGRAM, { learn: 1, explore: 1, every: 1e9 }, () => {
    const fagi = createFagi();
    look(fagi, walkOf(fagi, 'pursue'), ['pursue', 'memory']);
    assert.deepEqual({ root: trialOf(fagi).root, by: trialOf(fagi).by }, { root: 'pursue', by: 'memory' });
    assert.equal(fagi.brain.watch.open[0].by, 'memory');
    // While memory acts in pursue's turn and pursue still would, it goes on.
    look(fagi, walkOf(fagi, 'memory', 'pursue'), ['pursue', 'memory']);
    assert.ok(trialOf(fagi));
    // Memory no longer would: pursue acted in its own turn, and the trial is over.
    look(fagi, walkOf(fagi, 'pursue'), ['pursue']);
    assert.equal(trialOf(fagi), null);
  });
});

test('never a trial for a survive line, with something pressing, or in the dark', () => {
  withSettings(PROGRAM, { learn: 1, explore: 1, every: 1e9 }, () => {
    const fagi = createFagi();
    look(fagi, walkOf(fagi, 'drink'), ['drink', 'pursue']);
    assert.equal(trialOf(fagi), null);
    const other = createFagi();
    look(other, walkOf(other, 'pursue'), ['pursue', 'memory'], { ...CALM, thirstU: 0.9 });
    assert.equal(trialOf(other), null);
    const night = createFagi();
    night.dark = true;
    look(night, walkOf(night, 'sleep'), ['sleep', 'pursue']);
    assert.equal(trialOf(night), null);
    // A trial running when the light goes is over.
    const dusk = createFagi();
    look(dusk, walkOf(dusk, 'pursue'), ['pursue', 'memory']);
    assert.ok(trialOf(dusk));
    dusk.dark = true;
    look(dusk, walkOf(dusk, 'memory', 'pursue'), ['pursue', 'memory']);
    assert.equal(trialOf(dusk), null);
  });
});

test('in the walk, a trial lets the other line act in the leader\'s turn', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.energy = 10;                                  // spent: resting leads
  fagi.target = addPoint(world, fagi.x + 300, fagi.y, 'nectar');
  fagi.memory = 5;                                   // and she remembers where the fruit was
  fagi.brain.watch = { trial: { root: 'rest', by: 'memory', until: Infinity } };
  decide(fagi, world, perceive(fagi, world), 0.05);
  assert.equal(fagi.thought.rule, 'memory');
  fagi.brain.watch.trial = null;
  decide(fagi, world, perceive(fagi, world), 0.05);
  assert.equal(fagi.thought.rule, 'rest');
});

// --- learning -----------------------------------------------------------------

test('the quantile her doubt uses', () => {
  for (const [p, z] of [[0.5, 0], [0.95, 1.644854], [0.975, 1.959964], [0.999, 3.090232], [0.9999, 3.719016]]) {
    assert.ok(Math.abs(qnorm(p) - z) < 1e-5, `qnorm(${p})`);
  }
});

const LOW = { hunger: 0.3, thirst: 0.2, energy: 0.15, carrying: false, inNest: false, dark: false, raining: false, pressureFalling: false };
const HIGH = { ...LOW, energy: 0.8 };
const wobble = (i) => 0.02 * Math.sin(i * 12.9898);
// Moments where pursue led and rest would have acted: pursue acting, or rest in its turn.
function moments({ pursueLow, restLow, n = 40, trials = 15 }) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ root: 'pursue', below: ['rest'], by: null, f: i % 2 ? LOW : HIGH, cost: (i % 2 ? pursueLow : 0.02) + wobble(i) });
  for (let i = 0; i < trials * 2; i++) out.push({ root: 'pursue', below: ['rest'], by: 'rest', f: i % 2 ? LOW : HIGH, cost: (i % 2 ? restLow : 0.02) + wobble(i + 99) });
  return out;
}

test('the evidence on a pair counts both ways round', () => {
  const ms = [
    { root: 'pursue', below: ['rest'], by: null, f: LOW, cost: 0.3 },
    { root: 'pursue', below: ['rest'], by: 'rest', f: LOW, cost: 0.1 },
    { root: 'rest', below: ['pursue'], by: null, f: LOW, cost: 0.1 },
    { root: 'rest', below: ['pursue'], by: 'pursue', f: LOW, cost: 0.3 },
    { root: 'pursue', below: ['memory'], by: null, f: LOW, cost: 9 },   // not about rest
  ];
  withSettings(PROGRAM, { minSupport: 2 }, () => {
    const v = weigh(ms, 'pursue', 'rest', {});
    assert.deepEqual([v.x, v.y], [2, 2]);
    assert.ok(Math.abs(v.diff - 0.2) < 1e-9);
  });
  assert.equal(clears({ diff: 0.1, se: 0.025 }, 1), true);
  assert.equal(clears({ diff: 0.1, se: 0.025 }, 10000), false, 'asked that many times, z = 4 is not enough');
});

test('rest put back before pursue, where she is spent: a line of her own', () => {
  const fagi = createFagi();
  fagi.brain.program = restLast();
  fagi.brain.watch = { moments: moments({ pursueLow: 0.3, restLow: 0.02 }) };
  review(fagi);
  const lines = programOf(fagi).lines;
  const own = lines.find((l) => l.source === 'self');
  assert.ok(own, 'she wrote a line');
  assert.equal(own.do, 'rest');
  assert.equal(own.from, 'rest');
  assert.equal(own.over, 'pursue');
  assert.equal(lines[lines.indexOf(own) + 1].id, 'pursue');
  assert.ok(!own.if || meets(own.if, LOW), 'it holds when she is spent');
  assert.ok(lines.filter((l) => l.source === 'born').every((l) => !l.retired), 'nothing she was born with is touched');
  assert.equal(fagi.brain.lastProgram.kind, 'written');
  assert.equal(programOf(fagi).seq, 1);
});

test('noise rewrites nothing', () => {
  const fagi = createFagi();
  fagi.brain.program = restLast();
  fagi.brain.watch = { moments: moments({ pursueLow: 0.05, restLow: 0.05 }) };
  review(fagi);
  assert.equal(programOf(fagi).lines.some((l) => l.source === 'self'), false);
});

test('a line of hers is retired when what backed it is gone, and a narrower one may take its place', () => {
  const fagi = createFagi();
  fagi.brain.program = restLast();
  fagi.brain.watch = { moments: moments({ pursueLow: 0.3, restLow: 0.02 }) };
  review(fagi);
  const own = programOf(fagi).lines.find((l) => l.source === 'self');
  // Since then, where it holds and she was not spent, resting has cost her
  // more than pursuing would.
  for (let i = 0; i < 200; i++) {
    fagi.brain.watch.moments.push({ root: 'rest', below: ['pursue'], by: i % 3 ? null : 'pursue', f: HIGH, cost: i % 3 ? 0.5 : 0 });
  }
  review(fagi);
  const lines = programOf(fagi).lines;
  if (!own.if || meets(own.if, HIGH)) assert.equal(lines.find((l) => l.id === own.id).retired, true);
  // Whatever of hers is live now says nothing about where resting went wrong.
  for (const l of lines.filter((x) => x.source === 'self' && !x.retired)) {
    assert.ok(l.if && !meets(l.if, HIGH) && meets(l.if, LOW), `${l.id} still covers it`);
  }
  assert.ok(lines.some((l) => l.retired && l.source === 'self'), 'the over-general line was taken back');
});

test('never in front of a survive line, and never past her limit of lines', () => {
  const fagi = createFagi();
  fagi.brain.program = restLast();
  fagi.brain.watch = { moments: moments({ pursueLow: 0.3, restLow: 0.02 }).map((m) => ({ ...m, root: 'drink' })) };
  review(fagi);
  assert.equal(programOf(fagi).lines.some((l) => l.source === 'self'), false);
  withSettings(PROGRAM, { maxOwn: 0 }, () => {
    const other = createFagi();
    other.brain.program = restLast();
    other.brain.watch = { moments: moments({ pursueLow: 0.3, restLow: 0.02 }) };
    review(other);
    assert.equal(programOf(other).lines.some((l) => l.source === 'self'), false);
  });
});
