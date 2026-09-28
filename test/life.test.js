import test from 'node:test';
import assert from 'node:assert/strict';

import { LIFE, SEX, HUNGER, THERMAL, CYCLE, GEN } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createWorld, addObject, nestOf, storeInNest } from '../src/world.js';
import { createColony } from '../src/colony.js';
import { stageOf, updateStage, lifeSpeed, oldAge } from '../src/lifecycle.js';
import { resolveVitalFailure } from '../src/needs.js';
import { updateLife, foundPopulation, relatedness, eggPace, census } from '../src/reproduction.js';
import { learn } from '../src/brain.js';

function on() { LIFE.enabled = 1; SEX.enabled = 1; }
function off() { LIFE.enabled = 0; SEX.enabled = 0; THERMAL.enabled = 0; CYCLE.enabled = 0; }

// A nest with rations, and a couple (female, male) inside it, grown.
function home(n = 2) {
  const world = createWorld();
  world.rain.timer = Infinity;
  const nest = addObject(world, 400, 400, 'nest');
  for (let i = 0; i < 6; i++) storeInNest(nest, 'nectar');
  const colony = createColony(n);
  colony.ants.forEach((f, i) => { f.sex = i % 2 ? 'male' : 'female'; f.x = nest.x; f.y = nest.y; f.pantry = { nectar: 6 }; });
  world.colony = colony;
  foundPopulation(world, colony);
  for (const f of colony.ants) updateStage(f);
  return { world, colony, nest };
}

test('without LIFE nothing changes: every one an adult, no old age, no brood', () => {
  off();
  const f = createFagi();
  f.age = 1e6;
  updateStage(f);
  assert.equal(f.lifeStage, 'adult');
  assert.equal(lifeSpeed(f), 1);
  assert.equal(oldAge(f), false);
  const world = createWorld();
  const colony = createColony(2);
  updateLife(world, colony, 1);
  assert.equal(colony.life, undefined);
});

test('a life: juvenile, adult, old, and dying of old age', () => {
  on();
  const f = createFagi();
  f.lifespan = 1000;
  f.age = LIFE.adultAt - 1;
  assert.equal(stageOf(f), 'juvenile');
  updateStage(f);
  assert.equal(lifeSpeed(f), LIFE.juvenileSpeed);
  f.age = LIFE.adultAt;
  assert.equal(stageOf(f), 'adult');
  f.age = 1000 * LIFE.senescentAt + 1;
  updateStage(f);
  assert.equal(f.lifeStage, 'senescent');
  assert.ok(lifeSpeed(f) < 1 && lifeSpeed(f) > LIFE.oldSpeed);
  f.age = 1000;
  assert.equal(resolveVitalFailure(f), true);
  assert.equal(f.cause, 'age');
  off();
});

test('two adults who can, in the nest, conceive an egg from both, and pay for it', () => {
  on();
  const { world, colony, nest } = home();
  const [mother, father] = colony.ants;
  mother.genome = { cues: { 'smell:sour': -0.8 }, body: { speed: 1 } };
  father.genome = { cues: { 'smell:sour': 0.8 }, body: { speed: 1 } };
  const before = { m: mother.energy, f: father.energy, h: mother.hunger };
  updateLife(world, colony, 0.05);
  assert.equal(nest.eggs.length, 1);
  const egg = nest.eggs[0];
  assert.deepEqual([egg.mother, egg.father], [mother.id, father.id]);
  assert.deepEqual(egg.genome.parents, [String(mother.id), String(father.id)]);
  assert.ok(Math.abs(egg.genome.cues['smell:sour'] ?? 0) <= 1);
  assert.equal(mother.energy, before.m - LIFE.mateCost);
  assert.equal(father.energy, before.f - LIFE.mateCost);
  assert.equal(mother.hunger, before.h + LIFE.eggCost);
  updateLife(world, colony, 0.05);
  assert.equal(nest.eggs.length, 1, 'rested first: not twice in a row');
  off();
});

test('no brood from a juvenile, a hungry one, one out of the nest, or a lean pantry', () => {
  on();
  const cases = [
    ({ colony }) => { colony.ants[0].startAge = 0; colony.ants[0].age = 10; updateStage(colony.ants[0]); },
    ({ colony }) => { colony.ants[0].hunger = HUNGER.max * LIFE.mateNeed; },
    ({ colony }) => { colony.ants[1].x += 500; },
    ({ colony }) => { colony.ants[0].pantry = {}; },
  ];
  for (const spoil of cases) {
    const h = home();
    spoil(h);
    updateLife(h.world, h.colony, 0.05);
    assert.equal(h.nest.eggs?.length ?? 0, 0);
  }
  off();
});

test("the egg develops with the nest's warmth, hatches on a ration, and dies if there is none", () => {
  on();
  assert.equal(eggPace(null), 1);
  assert.equal(eggPace(LIFE.eggCold - 1), 0);
  assert.equal(eggPace(LIFE.eggWarm + 1), 1);
  const { world, colony, nest } = home();
  const mother = colony.ants[0];
  // Something for her to teach (learning that 'toxic' harms would make her
  // generalize "avoid round", nectar included, and she would not breed).
  learn(mother.brain, 'nectar', 0.9, 1);
  learn(mother.brain, 'nectar', 0.9, 30);
  updateLife(world, colony, 0.05);
  const stock = nest.stock.nectar;
  for (let t = 0; t < LIFE.incubation + 3; t++) updateLife(world, colony, 1);
  assert.equal(nest.eggs.length, 0);
  assert.equal(colony.ants.length, 3);
  assert.equal(nest.stock.nectar, stock - 1, 'the ration it hatched on');
  const child = colony.ants[2];
  assert.equal(child.lifeStage, 'juvenile');
  assert.equal(child.generation, 1);
  assert.deepEqual(child.brain.bites, [], 'no memories of hers');
  if (GEN.culture) assert.ok(child.brain.rules.list.some((r) => r.source?.kind === 'born'), 'taught by her mother');
  assert.deepEqual(world.lineage[child.id], { ...world.lineage[child.id], mother: mother.id, father: colony.ants[1].id, generation: 1 });

  // Now an egg with nothing in the pantry.
  const lean = home();
  updateLife(lean.world, lean.colony, 0.05);
  lean.nest.stock = {};
  lean.nest.ages = {};
  lean.colony.ants[0].pantry = {};   // and she knows it: no second brood
  for (let t = 0; t < LIFE.incubation + LIFE.eggStarve + 4; t++) { lean.world.time += 1; updateLife(lean.world, lean.colony, 1); }
  assert.equal(lean.nest.eggs.length, 0);
  assert.equal(lean.colony.life.eggsLost.starved, 1);
  off();
});

test('relatives are known, and close ones do not mate', () => {
  on();
  const lineage = {
    1: { mother: null, father: null, bornAt: 0 }, 2: { mother: null, father: null, bornAt: 0 },
    3: { mother: 1, father: 2, bornAt: 10 }, 4: { mother: 1, father: 2, bornAt: 20 },
    5: { mother: 1, father: 9, bornAt: 30 }, 9: { mother: null, father: null, bornAt: 0 },
  };
  assert.equal(relatedness(lineage, 1, 3), 0.5, 'mother and daughter');
  assert.equal(relatedness(lineage, 3, 4), 0.5, 'full siblings');
  assert.equal(relatedness(lineage, 3, 5), 0.25, 'half siblings');
  assert.equal(relatedness(lineage, 2, 9), 0, 'strangers');

  const { world, colony, nest } = home();
  world.lineage[colony.ants[0].id] = { mother: 7, father: 8, bornAt: 5 };
  world.lineage[colony.ants[1].id] = { mother: 7, father: 8, bornAt: 6 };
  updateLife(world, colony, 0.05);
  assert.equal(nest.eggs?.length ?? 0, 0, 'brother and sister');
  off();
});

test('when the last one dies with no egg left, the population is extinct', () => {
  on();
  const { world, colony } = home();
  for (const f of colony.ants) { f.alive = false; f.cause = 'age'; }
  updateLife(world, colony, 0.05);
  const c = census(world, colony);
  assert.equal(c.alive, 0);
  assert.equal(c.extinctAt, world.time);
  assert.equal(c.deaths.age, 2);
  off();
});
