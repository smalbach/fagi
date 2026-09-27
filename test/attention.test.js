import test from 'node:test';
import assert from 'node:assert/strict';

import { BACKEND, NEST } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { perceive } from '../src/perception.js';
import { notice } from '../src/attention.js';
import { createCortex, updateCortex } from '../src/cortex.js';
import { fovOf, viewRangeOf, normalizeAngle } from '../src/vision.js';
import { addObject, addPoint, createWorld } from '../src/world.js';
import { waypointInView } from '../src/explore.js';
import { EXPLORE, WORLD } from '../src/config.js';

// An empty world with Fagi in the middle, facing right, with no needs.
function tranquila() {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  return { world, fagi };
}

function runOnce(world, fagi, seconds, dt = 0.05) {
  for (let t = 0; t < seconds; t += dt) step(world, fagi, dt);
}

// Places something to one side of her heading, inside the field of view.
function alongside(fagi, degrees, dist) {
  const a = fagi.angle + (degrees * Math.PI) / 180;
  return { x: fagi.x + Math.cos(a) * dist, y: fagi.y + Math.sin(a) * dist };
}

test('exploring goes leg by leg to a point it can see', () => {
  const { world, fagi } = tranquila();
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'explore');
  const w = fagi.exploreTarget;
  assert.ok(w?.inView, 'the leg ends at a point in view, not at a far cell of the map');
  const d = Math.hypot(w.x - fagi.x, w.y - fagi.y);
  assert.ok(d <= viewRangeOf(fagi) + 1, `leg of ${d.toFixed(0)}px, beyond its sight`);
  const rel = Math.abs(normalizeAngle(Math.atan2(w.y - fagi.y, w.x - fagi.x) - fagi.angle));
  assert.ok(rel <= fovOf(fagi) / 2 + 0.2, 'the leg lies inside its field of view');

  // On reaching the end of the leg, she plots another from what she sees then.
  const firstOne = fagi.exploreLegs;
  runOnce(world, fagi, 8);
  assert.ok(fagi.exploreLegs > firstOne + 1, 'keeps deciding new legs as it walks');
});

test('something new at its side mid-leg makes it reconsider and go for it', () => {
  const { world, fagi } = tranquila();
  fagi.hunger = 40;                  // peckish, without getting pressed
  runOnce(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');

  const p = alongside(fagi, -40, 120);
  addPoint(world, p.x, p.y, 'nectar');
  const fruit = world.points[world.points.length - 1];
  step(world, fagi, 0.05);

  assert.equal(fagi.thought.action, 'seekFood');
  assert.equal(fagi.target, fruit);
  assert.equal(fagi.rethink.what, 'nectar');
  assert.equal(fagi.rethink.side, 'left');
  assert.equal(fagi.rethink.changed, true);
  assert.equal(fagi.rethink.forNew, true);
  assert.equal(fagi.rethink.from, 'explore');
});

test('something new that is no use now is weighed and the leg goes on', () => {
  const { world, fagi } = tranquila();
  addObject(world, fagi.x - 300, fagi.y, 'nest');
  fagi.pantry = { nectar: NEST.full };   // believes the pantry is full
  runOnce(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');

  const p = alongside(fagi, 35, 110);
  addPoint(world, p.x, p.y, 'nectar');
  step(world, fagi, 0.05);

  assert.equal(fagi.thought.action, 'explore');
  assert.equal(fagi.rethink.what, 'nectar');
  assert.equal(fagi.rethink.side, 'right');
  assert.equal(fagi.rethink.changed, false);
  assert.equal(fagi.rethink.why, 'notUseful');

  // Once seen, it does not count as new again on the next frame.
  const n = fagi.rethink.n;
  step(world, fagi, 0.05);
  assert.equal(fagi.rethink.n, n);
});

test('carrying home, water in sight with some thirst is worth a detour', () => {
  const { world, fagi } = tranquila();
  addObject(world, fagi.x - 350, fagi.y, 'nest');
  fagi.carrying = { type: 'nectar', age: 0 };
  fagi.thirst = 40;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'carry');

  addObject(world, fagi.x + 30, fagi.y + 140, 'water');   // off to the side
  fagi.angle = Math.PI / 2;                              // turns and sees it
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'seekWater');
  assert.equal(fagi.thought.reason.key, 'reason.detourWater');
  assert.equal(fagi.rethink.forNew, true);
});

test('with a directive in force, something new makes it ask the API again', () => {
  const before = BACKEND.enabled;
  BACKEND.enabled = 1;
  try {
    const { world, fagi } = tranquila();
    let callCount = 0;
    const cortex = createCortex({ name: 'stub', decide: () => { callCount++; return new Promise(() => {}); } });
    cortex.inflight = false;
    fagi.directive = { action: 'explore', until: 999, source: 'stub' };
    fagi.age = 10;

    const ctx = perceive(fagi, world);
    ctx.newOnes = notice(fagi, ctx);
    updateCortex(cortex, fagi, world, ctx, 0.05);
    assert.equal(callCount, 0, 'nothing new, directive in force: no need to ask');

    const p = alongside(fagi, 20, 100);
    addPoint(world, p.x, p.y, 'nectar');
    cortex.seenKeys.add('nectar');     // not a new type: a new fruit
    fagi.age = 13;
    const ctx2 = perceive(fagi, world);
    ctx2.newOnes = notice(fagi, ctx2);
    assert.equal(ctx2.newOnes.length, 1);
    updateCortex(cortex, fagi, world, ctx2, 0.05);
    assert.equal(callCount, 1);
  } finally {
    BACKEND.enabled = before;
  }
});

// Marks the whole mental map as known except around (x, y).
function onlyUnknown(fagi, x, y) {
  fagi.explored.fill(EXPLORE.visitMax);
  const cols = Math.ceil(WORLD.width / EXPLORE.cell);
  fagi.explored[Math.floor(y / EXPLORE.cell) * cols + Math.floor(x / EXPLORE.cell)] = 0;
}

test('back to exploring, the unfinished leg competes with new ones on the same terms', () => {
  const { world, fagi } = tranquila();

  // The old leg ends out of her sight, in the only place she does not know: she
  // resumes it even if she has to turn, because what she sees she already knows.
  const old = alongside(fagi, 90, 200);
  onlyUnknown(fagi, old.x, old.y);
  const a = waypointInView(fagi, fagi.explored, null, world, { ...old, inView: true });
  assert.equal(a.resumed, true);
  assert.ok(a.score > a.rival);

  // The old leg is behind her, on ground she already knows, and what lies
  // ahead she does not know: she plots a new one.
  const behind = alongside(fagi, 180, 150);
  fagi.explored.fill(EXPLORE.visitMax);
  const cols = Math.ceil(WORLD.width / EXPLORE.cell);
  const ahead = alongside(fagi, 0, 180);
  fagi.explored[Math.floor(ahead.y / EXPLORE.cell) * cols + Math.floor(ahead.x / EXPLORE.cell)] = 0;
  const b = waypointInView(fagi, fagi.explored, null, world, { ...behind, inView: true });
  assert.equal(b.resumed, false);
  assert.ok(b.score > b.rival);
});

test('after a detour it decides whether to resume the leg, and says so', () => {
  const { world, fagi } = tranquila();
  fagi.hunger = 40;
  runOnce(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');
  const leg = { ...fagi.exploreTarget };

  const p = alongside(fagi, -30, 60);
  addPoint(world, p.x, p.y, 'nectar');
  let steps = 0;
  while (world.points.length && steps++ < 200) step(world, fagi, 0.05);   // goes, and eats it or carries it
  fagi.carrying = null;
  fagi.hunger = 0;
  runOnce(world, fagi, 0.2);

  assert.equal(fagi.thought.action, 'explore');
  assert.ok(fagi.legChoice, 'weighed resuming against a new leg');
  const resumed = fagi.exploreTarget.x === leg.x && fagi.exploreTarget.y === leg.y;
  assert.equal(fagi.legChoice.resumed, resumed);
});
