import test from 'node:test';
import assert from 'node:assert/strict';

import { LIFE, SEX } from '../src/config.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { createColony, successorOf, swapInto } from '../src/colony.js';
import { createRecorder } from '../src/recorder/recorder.js';
import { createPlayer } from '../src/recorder/replay.js';
import { createNarrator, narrate, followed } from '../src/narrator.js';
import { fertility } from '../src/lifecycle.js';
import { crowding } from '../src/reproduction.js';
import { rng, withRng } from '../scripts/batch/random.js';

function population() {
  LIFE.enabled = 1; SEX.enabled = 1;
  const world = createWorld();
  const shown = createFagi();
  world.colony = createColony(4, shown);
  world.lineage = {};
  for (const f of world.colony.ants) world.lineage[f.id] = { mother: null, father: null, bornAt: 0 };
  return { world, shown, colony: world.colony };
}
const off = () => { LIFE.enabled = 0; SEX.enabled = 0; };

test('when the one followed dies, her nearest living descendant is next, else anyone left', () => {
  const { world, shown, colony } = population();
  const [, a, b, c] = colony.ants;
  world.lineage[c.id] = { mother: shown.id, father: a.id, bornAt: 10 };
  shown.alive = false;
  assert.equal(successorOf(world, colony, shown).next, c);
  assert.equal(successorOf(world, colony, shown).kin, 'child');
  c.alive = false;
  const other = successorOf(world, colony, shown);
  assert.ok([a, b].includes(other.next));
  assert.equal(other.kin, 'kin');
  a.alive = false; b.alive = false;
  assert.equal(successorOf(world, colony, shown), null);
  off();
});

test('following swaps what the two objects are: the screen keeps its object and its cortex', () => {
  const { colony, shown } = population();
  const next = colony.ants[2];
  shown.cortex = { mine: true };
  const [idShown, idNext] = [shown.id, next.id];
  shown.alive = false;
  swapInto(shown, next);
  assert.equal(shown.id, idNext);
  assert.equal(next.id, idShown);
  assert.ok(shown.alive && !next.alive);
  assert.deepEqual(shown.cortex, { mine: true });
  assert.equal(shown.sister, false);
  assert.equal(next.sister, true);
  assert.equal(new Set(colony.ants.map((f) => f.id)).size, colony.ants.length);
  off();
});

test('the recording goes on with whoever is followed, and the replay shows her alive', () => {
  const { world, shown, colony } = withRng(rng(5), () => {
    const p = population();
    generateMap(p.world);
    return p;
  });
  const events = [];
  const rec = createRecorder(world, { send: (batch) => events.push(...batch) });
  world.rec = rec;
  rec.start({ config: {} });
  const narr = createNarrator();
  withRng(rng(6), () => {
    for (let i = 0; i < 200; i++) { step(world, shown, 0.05); rec.observe(shown, narrate(narr, shown)); }
    shown.alive = false;
    shown.cause = 'age';
    rec.observe(shown, narrate(narr, shown));
    const found = successorOf(world, colony, shown);
    swapInto(shown, found.next);
    rec.follow(shown, found.next.id);
    followed(narr, shown, found.kin, found.next.id);
    for (let i = 0; i < 200; i++) { step(world, shown, 0.05); rec.observe(shown, narrate(narr, shown)); }
  });
  rec.end('user', shown, narr.lines);
  off();
  assert.ok(events.some((e) => e.type === 'fagi_death'));
  const follow = events.find((e) => e.type === 'follow');
  assert.ok(follow);
  const player = createPlayer(events);
  player.seek(follow.t - 0.5);
  assert.equal(player.fagi.alive, true);
  player.seek(player.duration);
  assert.equal(player.fagi.alive, true, 'alive again after following another');
  assert.ok(Math.hypot(player.fagi.x - shown.x, player.fagi.y - shown.y) < 2, 'where the one followed is');
  assert.ok(narr.lines.some((l) => l.text.key === 'log.follow.kin'));
});

test('fertility fades through old age, and a crowded nest slows breeding before its ceiling', () => {
  LIFE.enabled = 1;
  const f = { lifeStage: 'senescent', lifespan: 1000, age: 0, startAge: 0 };
  f.age = 1000 * LIFE.senescentAt;
  assert.equal(fertility(f), 1);
  f.age = 1000 * (LIFE.senescentAt + (1 - LIFE.senescentAt) / 2);
  assert.ok(Math.abs(fertility(f) - 0.5) < 1e-9);
  f.age = 1000;
  assert.equal(fertility(f), 0);
  assert.equal(fertility({ lifeStage: 'juvenile' }), 0);
  assert.equal(crowding(0), 1);
  assert.ok(crowding(LIFE.maxPopulation / 2) > 1 && crowding(LIFE.maxPopulation - 1) > crowding(LIFE.maxPopulation / 2));
  LIFE.gradual = 0;
  assert.equal(fertility(f), 0);
  assert.equal(crowding(10), 1);
  LIFE.gradual = 1;
  LIFE.enabled = 0;
});
