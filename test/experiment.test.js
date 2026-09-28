import test from 'node:test';
import assert from 'node:assert/strict';

import { EXPERIMENT, SLEEP } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat, tryPickOrEat } from '../src/feeding.js';
import { learn } from '../src/brain.js';
import { recall } from '../src/memory.js';
import { consolidate } from '../src/consolidation.js';
import { agendaFrom } from '../src/experiment.js';
import { taste } from '../src/decision/experiment.js';
import { registerSpecies } from '../src/chemistry.js';
import { createWorld, addPoint } from '../src/world.js';

// Four wild fruit: a poison pair sharing their smell, a good one, and one
// she has only seen.
function species() {
  const make = (color, shape, smell, hunger, effects = []) => ({
    key: `${color}-${shape}-${smell}`,
    spec: { color: '#888', radius: 6, aroma: 100, life: 200, hunger, effects, traits: { color, shape, smell }, species: true },
  });
  registerSpecies([
    make('red', 'round', 'musky', 25, [{ stat: 'speed', mult: 0.6, sec: 5 }]),
    make('blue', 'drop', 'musky', 25),
    make('green', 'orb', 'sweet', -35),
    make('yellow', 'crystal', 'sweet', -35),
  ]);
}

const ctxWith = (fagi, point, extra = {}) => ({
  thirstU: 0, hungerU: 0.2, energyU: 1,
  ranked: [{ key: point.type, kind: 'food', ref: point, dist: 30, guess: null, ...extra }],
});

test('the night\'s questions become the next day\'s agenda, only of fruit she never tasted', () => {
  species();
  const fagi = createFagi();
  learn(fagi.brain, 'green-orb-sweet', 0.8, 10);
  recall(fagi.brain, 'yellow-crystal-sweet');   // seen, never tasted
  recall(fagi.brain, 'blue-drop-musky');
  const agenda = agendaFrom(fagi, { questions: [
    { kind: 'taste', key: 'yellow-crystal-sweet' },
    { kind: 'check', cue: 'smell:musky' },
    { kind: 'taste', key: 'green-orb-sweet' },
  ] });
  assert.deepEqual(agenda, ['yellow-crystal-sweet', 'blue-drop-musky']);
  registerSpecies([]);
});

test('without sorting, the night asks nothing: the agenda stays empty', () => {
  species();
  const fagi = createFagi();
  learn(fagi.brain, 'red-round-musky', -0.8, 10);
  learn(fagi.brain, 'blue-drop-musky', -0.8, 20);
  recall(fagi.brain, 'yellow-crystal-sweet');
  SLEEP.consolidate = 0;
  assert.deepEqual(agendaFrom(fagi, consolidate(fagi, { night: 1, now: 60 })), []);
  SLEEP.consolidate = 1;
  assert.ok(agendaFrom(fagi, consolidate(fagi, { night: 1, now: 60 })).includes('yellow-crystal-sweet'));
  registerSpecies([]);
});

test('she goes for a question only when nothing presses and its traits do not scare her', () => {
  species();
  EXPERIMENT.enabled = 1;
  const world = createWorld();
  const fagi = createFagi();
  const p = addPoint(world, fagi.x + 30, fagi.y, 'yellow-crystal-sweet');
  fagi.agenda = ['yellow-crystal-sweet'];
  assert.equal(taste(fagi, world, ctxWith(fagi, p)).action, 'taste');
  assert.equal(taste(fagi, world, { ...ctxWith(fagi, p), hungerU: 0.9 }), null, 'hunger comes first');
  assert.equal(taste(fagi, world, ctxWith(fagi, p, { guess: { value: -0.9, confidence: 1 } })), null, 'it looks like poison');
  fagi.agenda = [];
  assert.equal(taste(fagi, world, ctxWith(fagi, p)), null, 'no question, no experiment');
  EXPERIMENT.enabled = 0;
  fagi.agenda = ['yellow-crystal-sweet'];
  assert.equal(taste(fagi, world, ctxWith(fagi, p)), null, 'off by default');
  registerSpecies([]);
});

test('a trial bite costs a fraction and teaches what a whole fruit would', () => {
  species();
  EXPERIMENT.enabled = 1;
  const whole = createFagi();
  whole.hunger = 20;
  eat(whole, 'red-round-musky');

  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 20;
  const p = addPoint(world, fagi.x, fagi.y, 'red-round-musky');
  fagi.agenda = ['red-round-musky'];
  fagi.target = p;
  fagi.thought = { action: 'taste' };
  tryPickOrEat(fagi, world);

  assert.equal(world.points.length, 0);
  assert.ok(Math.abs(fagi.hunger - (20 + 25 * EXPERIMENT.portion)) < 1e-9, 'a quarter of the harm');
  assert.ok(fagi.effects.speed.mult > 0.6 && fagi.effects.speed.time < 5, 'a weaker, shorter effect');
  assert.ok(Math.abs(fagi.lastEpisode.reward - whole.lastEpisode.reward) < 0.15, 'she learns about as much as from a whole one');
  assert.ok(fagi.lastEpisode.sensations.some((s) => s.sense === 'trial'));
  assert.deepEqual(fagi.agenda, [], 'the question is answered');
  assert.equal(fagi.experiments, 1);
  EXPERIMENT.enabled = 0;
  registerSpecies([]);
});

test('with experiments off, touching the same fruit is an ordinary meal or load', () => {
  species();
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 80;
  const p = addPoint(world, fagi.x, fagi.y, 'green-orb-sweet');
  fagi.agenda = ['green-orb-sweet'];
  fagi.target = p;
  fagi.thought = { action: 'taste' };
  tryPickOrEat(fagi, world);
  assert.equal(fagi.lastEpisode.portion, undefined);
  assert.ok(Math.abs(fagi.hunger - 45) < 1e-9);
  registerSpecies([]);
});
