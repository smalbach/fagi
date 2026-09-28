import test from 'node:test';
import assert from 'node:assert/strict';

import { CYCLE, SLEEP, THERMAL } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createWorld, addObject } from '../src/world.js';
import { step } from '../src/simulation.js';
import { updateSleep } from '../src/sleep.js';
import { consolidate } from '../src/consolidation.js';
import { learn } from '../src/brain.js';
import { observe } from '../src/observation.js';
import { registerSpecies } from '../src/chemistry.js';
import { perceive } from '../src/perception.js';

SLEEP.enabled = 1;
CYCLE.enabled = 1;

const nightTime = () => (0.95 - CYCLE.start) * CYCLE.seconds;   // late evening of day 1
const dayTime = () => (0.5 - CYCLE.start + 1) * CYCLE.seconds;  // noon of day 2

function home() {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'nest');
  return { world, fagi };
}

// A day of fruit: bad sour ones, good sweet ones (the classic types' traits).
function liveADay(fagi) {
  for (let i = 0; i < 4; i++) learn(fagi.brain, 'toxic', -0.8, 10 + i * 15);
  for (let i = 0; i < 3; i++) learn(fagi.brain, 'nectar', 0.6, 12 + i * 15);
}

// Asleep: the decision says 'rest'.
const asleep = (fagi) => { fagi.thought = { action: 'rest' }; };

test('pressure builds awake, faster in the dark, and drains asleep', () => {
  const { world, fagi } = home();
  world.time = dayTime();
  fagi.thought = { action: 'explore' };
  updateSleep(fagi, world, 10);
  const day = fagi.sleepPressure;
  fagi.sleepPressure = 0;
  world.time = nightTime();
  updateSleep(fagi, world, 10);
  assert.ok(fagi.sleepPressure > day);
  asleep(fagi);
  const before = fagi.sleepPressure;
  updateSleep(fagi, world, 1);
  assert.ok(fagi.sleepPressure < before);
});

test('it does not happen awake', () => {
  const { world, fagi } = home();
  liveADay(fagi);
  world.time = nightTime();
  fagi.thought = { action: 'explore' };
  for (let i = 0; i < 100; i++) updateSleep(fagi, world, 1);
  assert.equal(fagi.consolidations, 0);
});

test('it does not happen the moment she lies down, and it happens once a night', () => {
  const { world, fagi } = home();
  liveADay(fagi);
  world.time = nightTime();
  asleep(fagi);
  updateSleep(fagi, world, 1);
  assert.equal(fagi.consolidations, 0, 'not yet');
  for (let t = 1; t < SLEEP.minSleep + 1; t++) updateSleep(fagi, world, 1);
  assert.equal(fagi.consolidations, 1);
  for (let t = 0; t < 30; t++) updateSleep(fagi, world, 1);
  fagi.thought = { action: 'explore' };
  updateSleep(fagi, world, 1);
  asleep(fagi);
  for (let t = 0; t < SLEEP.minSleep + 2; t++) updateSleep(fagi, world, 1);
  assert.equal(fagi.consolidations, 1, 'a second sleep the same night sorts nothing');
});

test('a nap at noon sorts nothing', () => {
  const { world, fagi } = home();
  liveADay(fagi);
  world.time = dayTime();
  asleep(fagi);
  for (let t = 0; t < SLEEP.minSleep * 3; t++) updateSleep(fagi, world, 1);
  assert.equal(fagi.consolidations, 0);
});

test('it uses only what she lived, and records the evidence', () => {
  const fagi = createFagi();
  liveADay(fagi);
  learn(fagi.brain, 'nectar', 0.6, 5);
  const r = consolidate(fagi, { night: 1, now: 100, since: 8 });
  assert.equal(r.episodes, 7, 'the bite before `since` belongs to another day');
  assert.ok(r.important.length > 0 && r.important.length <= SLEEP.salient);
  for (const e of r.important) assert.ok(['toxic', 'nectar'].includes(e.key));
  const sour = r.hypotheses.find((h) => h.predict === 'harm');
  assert.ok(sour, 'a trait of the toxic fruit predicts harm');
  assert.equal(sour.support, 4);
  assert.equal(sour.exceptions, 0);
  assert.ok(sour.confidence > 0.5 && sour.confidence < 1);
});

test('sorting strengthens beliefs the day agreed with, and merges redundant detail', () => {
  const fagi = createFagi();
  for (let i = 0; i < 8; i++) learn(fagi.brain, 'toxic', -0.8, 10 + i);
  const before = fagi.brain.facts.toxic.confidence;
  const logBefore = fagi.brain.bites.length;
  const r = consolidate(fagi, { night: 1, now: 100 });
  assert.ok(fagi.brain.facts.toxic.confidence >= before);
  assert.deepEqual(r.strengthened, ['toxic']);
  assert.ok(r.forgotten > 0);
  assert.equal(fagi.brain.bites.length, logBefore - r.forgotten);
});

test('the ablation sleeps but sorts nothing', () => {
  SLEEP.consolidate = 0;
  const fagi = createFagi();
  liveADay(fagi);
  const facts = JSON.stringify(fagi.brain.facts);
  const r = consolidate(fagi, { night: 1, now: 100 });
  assert.equal(r.sorted, false);
  assert.equal(JSON.stringify(fagi.brain.facts), facts);
  assert.deepEqual(r.hypotheses, []);
  SLEEP.consolidate = 1;
});

test('the report is data only: nothing in it can run', () => {
  const fagi = createFagi();
  liveADay(fagi);
  const r = consolidate(fagi, { night: 1, now: 100 });
  const walk = (v) => {
    assert.notEqual(typeof v, 'function');
    if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(r);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
});

test('at night, sleepy, she goes to sleep in the nest and the API sees the report', () => {
  THERMAL.enabled = 1;
  const { world, fagi } = home();
  liveADay(fagi);
  world.time = nightTime();
  fagi.sleepPressure = SLEEP.drowsy + 0.1;
  for (let t = 0; t < SLEEP.minSleep + 2; t += 0.1) step(world, fagi, 0.1);
  assert.equal(fagi.thought.rule, 'sleep');
  assert.equal(fagi.consolidations, 1);
  const { observation } = observe(fagi, world, perceive(fagi, world));
  assert.equal(observation.version, 2);
  assert.equal(observation.memory.lastNightReport.night, fagi.lastNightReport.night);
  assert.equal(observation.biology.temperature != null, true);
  assert.equal('ambient' in observation.senses, false, 'she never reads the air or the hour');
});

// Three wild fruit: two poison ones that share only their smell, and a good one.
function species() {
  const make = (color, shape, smell) => ({
    key: `${color}-${shape}-${smell}`,
    spec: { color: '#888', radius: 6, aroma: 100, life: 200, hunger: 0, effects: [], traits: { color, shape, smell }, species: true },
  });
  registerSpecies([make('red', 'round', 'musky'), make('blue', 'drop', 'musky'), make('green', 'orb', 'sweet')]);
}

function liveWildDay(fagi) {
  learn(fagi.brain, 'red-round-musky', -0.8, 10);
  learn(fagi.brain, 'green-orb-sweet', 0.6, 25);
  learn(fagi.brain, 'blue-drop-musky', -0.8, 40);
}

const blameOf = (cues, cue, key) => {
  const own = key.split('-').map((v, i) => `${['color', 'shape', 'smell'][i]}:${v}`);
  return Math.abs(cues[cue].w) / own.reduce((a, c) => a + Math.abs(cues[c].w), 0);
};

test('interleaved replay gives the shared smell the blame the day spread over one-off traits', () => {
  species();
  const fagi = createFagi();
  liveWildDay(fagi);
  const cues = fagi.brain.cues;
  const n = Object.fromEntries(Object.entries(cues).map(([c, e]) => [c, e.n]));
  const muskyShare = blameOf(cues, 'smell:musky', 'red-round-musky');
  const red = Math.abs(cues['color:red'].w);

  SLEEP.replay = 4;   // off by default since §25.13; here, what it does when on
  const r = consolidate(fagi, { night: 1, now: 60 });
  SLEEP.replay = 0;
  assert.equal(r.replayed.fruit, 3);
  assert.ok(r.replayed.moved.length > 0);
  assert.ok(blameOf(cues, 'smell:musky', 'red-round-musky') > muskyShare, 'the smell carries more of the blame');
  assert.ok(Math.abs(cues['color:red'].w) < red, 'the color seen once gives some back');
  assert.ok(cues['smell:musky'].w < -0.2, 'the smell still warns');
  assert.deepEqual(Object.fromEntries(Object.entries(cues).map(([c, e]) => [c, e.n])), n, 'a rehearsal is not a new meeting');
  registerSpecies([]);
});

test('the replay is deterministic, and SLEEP.replay = 0 leaves the traits alone', () => {
  species();
  const a = createFagi();
  const b = createFagi();
  liveWildDay(a);
  liveWildDay(b);
  SLEEP.replay = 4;
  consolidate(a, { night: 1, now: 60 });
  consolidate(b, { night: 1, now: 60 });
  assert.deepEqual(a.brain.cues, b.brain.cues);

  SLEEP.replay = 0;
  const c = createFagi();
  liveWildDay(c);
  const before = JSON.stringify(c.brain.cues);
  const r = consolidate(c, { night: 1, now: 60 });
  assert.equal(JSON.stringify(c.brain.cues), before);
  assert.deepEqual(r.replayed.moved, []);
  registerSpecies([]);
});
