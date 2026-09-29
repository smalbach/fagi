import test from 'node:test';
import assert from 'node:assert/strict';

import { SLEEP, LIFE, SEX } from '../src/config.js';
import { NAMES, seedNames, founderName, childName, fullName } from '../src/names.js';
import { createFagi } from '../src/fagi.js';
import { createWorld } from '../src/world.js';
import { familyOf, ancestry } from '../src/family.js';
import { sleep } from '../src/decision/endure.js';

test('the name lists are long, short-named and without repeats', () => {
  for (const list of [NAMES.female, NAMES.male, NAMES.surnames]) {
    assert.ok(list.length >= 120);
    assert.equal(new Set(list).size, list.length);
    assert.ok(list.every((n) => n.length <= 10));
  }
});

test('naming never touches Math.random (a seeded run stays the same)', () => {
  const real = Math.random;
  let calls = 0;
  Math.random = () => { calls++; return real(); };
  try {
    founderName('female');
    childName('male', founderName('male'), founderName('female'));
  } finally {
    Math.random = real;
  }
  assert.equal(calls, 0);
});

test('a child carries her father\'s first surname, then her mother\'s', () => {
  seedNames(7);
  const father = { given: 'Leo', first: 'Rossi', second: 'Kaya' };
  const mother = { given: 'Ana', first: 'Mamani', second: 'Berg' };
  const child = childName('female', father, mother);
  assert.equal(child.first, 'Rossi');
  assert.equal(child.second, 'Mamani');
  assert.ok(NAMES.female.includes(child.given));
  assert.equal(fullName({ name: child }), `${child.given} Rossi Mamani`);
});

test('every Fagi is born with a name; a newborn takes the one she is given', () => {
  const f = createFagi();
  assert.ok(f.name?.given && f.name.first && f.name.second);
  const born = createFagi({ name: { given: 'Nia', first: 'Kim', second: 'Diallo' } });
  assert.equal(fullName(born), 'Nia Kim Diallo');
});

test('the family is read from the lineage: parents, grandparents, siblings, children', () => {
  const world = createWorld();
  world.lineage = {
    1: { mother: null, father: null, sex: 'female', name: { given: 'Ana', first: 'A', second: 'B' } },
    2: { mother: null, father: null, sex: 'male', name: { given: 'Leo', first: 'C', second: 'D' } },
    3: { mother: 1, father: 2, sex: 'female', generation: 1 },
    4: { mother: 1, father: 2, sex: 'male', generation: 1 },
    5: { mother: 3, father: 9, sex: 'female', generation: 2 },
  };
  const ants = [1, 2, 3, 4, 5].map((id) => Object.assign(createFagi(), { id, alive: id !== 2 }));
  world.colony = { ants };
  const fam = familyOf(world, ants[0], 3);
  assert.equal(fam.mother.id, 1);
  assert.equal(fam.father.id, 2);
  assert.equal(fam.father.alive, false);
  assert.deepEqual(fam.siblings.map((s) => s.id), [4]);
  assert.equal(fam.siblings[0].full, true);
  assert.deepEqual(fam.children.map((c) => c.id), [5]);
  const up = ancestry(world, ants[0], 5);
  assert.deepEqual(up[0].map((p) => p?.id ?? null), [9, 3]);
  assert.deepEqual(up[1].map((p) => p?.id ?? null), [null, null, 2, 1]);
});

test('diurnal sleep: at dark she goes to bed however little she has done, and stays until daylight', () => {
  const was = { enabled: SLEEP.enabled, nightly: SLEEP.nightly };
  SLEEP.enabled = 1;
  SLEEP.nightly = 1;
  try {
    const nest = { x: 0, y: 0 };
    const ctx = { inNest: true, nest, hungerU: 0.1, thirstU: 0.1 };
    const f = createFagi();
    f.dark = true;
    f.sleepPressure = 0.05;
    assert.equal(sleep(f, null, ctx)?.action, 'rest');
    // The pressure drains to nothing in the night: she does not get up.
    f.sleepPressure = 0;
    assert.equal(sleep(f, null, ctx)?.action, 'rest');
    // Something pressing does get her up.
    assert.equal(sleep(f, null, { ...ctx, thirstU: 0.9 }), null);
    // Daylight wakes her.
    f.dark = false;
    assert.equal(sleep(f, null, ctx), null);
    // Without the diurnal body the night's wake threshold still wakes her.
    SLEEP.nightly = 0;
    f.dark = true;
    f.sleeping = true;
    f.sleepPressure = 0;
    assert.equal(sleep(f, null, ctx), null);
  } finally {
    Object.assign(SLEEP, was);
  }
});

test('with LIFE and SEX off nothing about names changes a Fagi\'s body', () => {
  assert.equal(LIFE.enabled, 0);
  assert.equal(SEX.enabled, 0);
  const f = createFagi();
  assert.equal(f.sex, null);
  assert.ok(NAMES.female.includes(f.name.given) || NAMES.male.includes(f.name.given));
});

test('a replay knows who is who: names and parents come back from the recording', async () => {
  const { createColony } = await import('../src/colony.js');
  const { createRecorder } = await import('../src/recorder/recorder.js');
  const { createPlayer } = await import('../src/recorder/replay.js');
  const { invalidEvent } = await import('../src/recorder/events.js');
  const { step } = await import('../src/simulation.js');
  const { generateMap } = await import('../src/mapgen.js');
  const world = createWorld();
  generateMap(world);
  const fagi = createFagi();
  world.colony = createColony(3, fagi);
  // A newborn the recording has not seen yet, with her parents in the lineage.
  world.lineage = { 1: { mother: null, father: null }, 2: { mother: null, father: null } };
  const events = [];
  const rec = createRecorder(world, { send: (batch) => events.push(...batch) });
  world.rec = rec;
  rec.start({ config: {} });
  for (let i = 0; i < 20; i++) { step(world, fagi, 0.05); rec.observe(fagi); }
  const child = Object.assign(createFagi({ name: childName('female', world.colony.ants[1].name, fagi.name) }), { id: 4, sister: true });
  world.colony.ants.push(child);
  world.lineage[4] = { mother: 1, father: 2, generation: 1, sex: 'female', name: child.name };
  for (let i = 0; i < 20; i++) { step(world, fagi, 0.05); rec.observe(fagi); }
  rec.end('test', fagi);
  assert.ok(events.every((e) => invalidEvent(e) === null));
  const player = createPlayer(events);
  player.seek(player.duration);
  assert.equal(player.fagi.name.given, fagi.name.given);
  const kid = player.world.colony.ants.find((s) => s.id === 4);
  assert.equal(fullName(kid), fullName(child));
  const fam = familyOf(player.world, player.fagi, 4);
  assert.equal(fam.mother.id, 1);
  assert.equal(fam.father.id, 2);
});

test('an old recording without names still names everyone, the same on every seek', async () => {
  const { nameForId } = await import('../src/names.js');
  assert.deepEqual(nameForId(3, 'female'), nameForId(3, 'female'));
  assert.notDeepEqual(nameForId(3, 'female'), nameForId(4, 'female'));
  assert.ok(NAMES.male.includes(nameForId(5, 'male').given));
  const { createColony } = await import('../src/colony.js');
  const { createRecorder } = await import('../src/recorder/recorder.js');
  const { createPlayer } = await import('../src/recorder/replay.js');
  const { step } = await import('../src/simulation.js');
  const { generateMap } = await import('../src/mapgen.js');
  const world = createWorld();
  generateMap(world);
  const fagi = createFagi();
  world.colony = createColony(3, fagi);
  const events = [];
  const rec = createRecorder(world, { send: (batch) => events.push(...batch) });
  world.rec = rec;
  rec.start({ config: {} });
  for (let i = 0; i < 20; i++) { step(world, fagi, 0.05); rec.observe(fagi); }
  rec.end('test', fagi);
  // As it was before names: no 'people'.
  const old = events.filter((e) => e.type !== 'people');
  const player = createPlayer(old);
  player.seek(player.duration);
  const names = player.world.colony.ants.map((s) => fullName(s));
  assert.ok(names.every((n) => !n.startsWith('#')));
  player.seek(0);
  player.seek(player.duration);
  assert.deepEqual(player.world.colony.ants.map((s) => fullName(s)), names);
});
