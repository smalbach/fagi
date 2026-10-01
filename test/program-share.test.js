import test from 'node:test';
import assert from 'node:assert/strict';

import { PROGRAM, SOCIAL } from '../src/config.js';
import { watchOf, keep, momentKey } from '../src/program/watch.js';
import { shareMoments } from '../src/program/share.js';
import { createColony } from '../src/colony.js';
import { socialize } from '../src/social.js';
import { createWorld, addObject } from '../src/world.js';

function withSettings(block, values, fn) {
  const saved = Object.fromEntries(Object.keys(values).map((k) => [k, block[k]]));
  Object.assign(block, values);
  try { return fn(); } finally { Object.assign(block, saved); }
}

const F = { hunger: 0.3, thirst: 0.2, energy: 0.5, carrying: false, inNest: false, dark: false, raining: false, pressureFalling: false };
// A sister who lived `n` moments, at ages 10, 20, 30...
function sisters(count, n = 0) {
  const { ants } = createColony(count);
  for (const f of ants.slice(0, 1)) {
    const w = watchOf(f);
    for (let i = 1; i <= n; i++) keep(w, { who: f.id, root: 'pursue', below: ['rest'], by: null, at: i * 10, f: F, d0: 0, cost: 0.1 });
  }
  return ants;
}

test('a sister passes what she lived, marked as told, kept as it was lived', () => {
  withSettings(PROGRAM, { share: 1 }, () => {
    const [a, b] = sisters(2, 3);
    assert.equal(shareMoments(a, b), 3);
    const got = b.brain.watch.moments;
    assert.deepEqual(got.map((m) => [m.who, m.at, m.told]), [[a.id, 10, a.id], [a.id, 20, a.id], [a.id, 30, a.id]]);
    assert.equal(a.brain.watch.moments[0].told, undefined, 'hers are not marked');
    assert.equal(shareMoments(a, b), 0, 'nothing twice');
  });
});

test('the newest first, a budget at a time, the rest at the next exchange', () => {
  withSettings(PROGRAM, { share: 1, shareBudget: 2 }, () => {
    const [a, b] = sisters(2, 5);
    assert.equal(shareMoments(a, b), 2);
    assert.deepEqual(b.brain.watch.moments.map((m) => m.at), [40, 50]);
    assert.equal(shareMoments(a, b), 2);
    assert.equal(shareMoments(a, b), 1);
    assert.equal(b.brain.watch.moments.length, 5);
  });
});

test('what was told goes on being told, and never counts twice', () => {
  withSettings(PROGRAM, { share: 1 }, () => {
    const [a, b, c] = sisters(3, 2);
    shareMoments(a, b);
    assert.equal(shareMoments(b, c), 2, 'C hears from B what A lived');
    assert.ok(c.brain.watch.moments.every((m) => m.who === a.id && m.told === b.id));
    assert.equal(shareMoments(a, c), 0, 'and does not take it again from A');
    assert.equal(new Set(c.brain.watch.moments.map(momentKey)).size, c.brain.watch.moments.length);
  });
});

test('with PROGRAM.share off nothing passes', () => {
  const [a, b] = sisters(2, 3);
  assert.equal(shareMoments(a, b), 0);
  assert.equal(b.brain.watch, undefined);
});

test('her record keeps its room: the oldest go, and their keys with them', () => {
  withSettings(PROGRAM, { record: 3 }, () => {
    const [a] = sisters(1, 5);
    const w = a.brain.watch;
    assert.deepEqual(w.moments.map((m) => m.at), [30, 40, 50]);
    assert.deepEqual([...w.keys].sort(), w.moments.map(momentKey).sort());
  });
});

test('sisters tell each other their moments in the nest, even when they share no rules', () => {
  withSettings(SOCIAL, { share: 0 }, () => withSettings(PROGRAM, { share: 1 }, () => {
    const world = createWorld();
    const nest = addObject(world, 300, 300, 'nest');
    const colony = createColony(2);
    const [a, b] = colony.ants;
    for (let i = 1; i <= 3; i++) keep(watchOf(a), { who: a.id, root: 'pursue', below: ['rest'], by: null, at: i, f: F, d0: 0, cost: 0 });
    // Away from the nest: nothing.
    a.x = 50; a.y = 50; b.x = 300; b.y = 300;
    socialize(colony, world, 100);
    assert.equal(b.brain.watch, undefined);
    // Both in it: she tells.
    a.x = nest.x; a.y = nest.y;
    socialize(colony, world, 200);
    assert.equal(b.brain.watch.moments.length, 3);
    assert.equal(colony.stats.moments, 3);
    assert.equal(colony.stats.exchanges, 0, 'no rules were exchanged');
  }));
});

// --- what a daughter is born with -------------------------------------------

test('a daughter is born with her mother\'s born lines, never with what her mother wrote', async () => {
  const { LIFE, SEX, THERMAL, CYCLE } = await import('../src/config.js');
  const { storeInNest } = await import('../src/world.js');
  const { updateLife, foundPopulation } = await import('../src/reproduction.js');
  const { updateStage } = await import('../src/lifecycle.js');
  const { INNATE, line, createProgram, programOf, innateOf } = await import('../src/program.js');
  LIFE.enabled = 1; SEX.enabled = 1;
  try {
    const world = createWorld();
    world.rain.timer = Infinity;
    const nest = addObject(world, 400, 400, 'nest');
    for (let i = 0; i < 6; i++) storeInNest(nest, 'nectar');
    const colony = createColony(2);
    colony.ants.forEach((f, i) => { f.sex = i % 2 ? 'male' : 'female'; f.x = nest.x; f.y = nest.y; f.pantry = { nectar: 6 }; });
    world.colony = colony;
    foundPopulation(world, colony);
    for (const f of colony.ants) updateStage(f);
    const [mother] = colony.ants;
    // Born with resting last, and a line of her own that puts it back.
    const moved = INNATE.find((l) => l.id === 'rest');
    const born = INNATE.filter((l) => l !== moved);
    born.splice(born.findIndex((l) => l.id === 'taste'), 0, moved);
    mother.brain.program = createProgram(born);
    const p = programOf(mother);
    p.lines.splice(p.lines.findIndex((l) => l.id === 'pursue'), 0, line('rest-before-pursue', {
      tier: 'endure', do: 'rest', source: 'self', learnedAt: 1, from: 'rest', over: 'pursue',
    }));
    updateLife(world, colony, 0.05);
    assert.equal(nest.eggs.length, 1);
    assert.deepEqual(nest.eggs[0].program, innateOf(mother));
    for (let t = 0; t < LIFE.incubation + 3; t++) updateLife(world, colony, 1);
    const child = colony.ants[2];
    assert.ok(child, 'she hatched');
    const ids = programOf(child).lines.map((l) => l.id);
    assert.deepEqual(ids, born.map((l) => l.id), 'resting last, as her mother was born');
    assert.ok(programOf(child).lines.every((l) => l.source === 'born'));
  } finally {
    LIFE.enabled = 0; SEX.enabled = 0; THERMAL.enabled = 0; CYCLE.enabled = 0;
  }
});
