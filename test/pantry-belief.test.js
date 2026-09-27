import test from 'node:test';
import assert from 'node:assert/strict';

import { NEST, POINT_TYPES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { useNest } from '../src/nest.js';
import { tryPickOrEat } from '../src/feeding.js';
import { addObject, addPoint, createWorld, stockFull, storeInNest, updateNest } from '../src/world.js';

// A full nest, far from where Fagi is.
function fillNest(world, x = 900, y = 900) {
  const nestObj = addObject(world, x, y, 'nest');
  for (let i = 0; i < NEST.full; i++) storeInNest(nestObj, 'nectar');
  return nestObj;
}

test('looking at the pantry is what puts it in Fagi\'s head', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nestObj = fillNest(world, fagi.x, fagi.y);

  // She has not gone in yet: the nest is full and she does not know it.
  assert.deepEqual(fagi.pantry, {});
  assert.equal(stockFull(fagi.pantry), false);

  useNest(fagi, world);
  assert.equal(fagi.pantry.nectar, nestObj.stock.nectar);
  assert.equal(stockFull(fagi.pantry), true);
});

test('what spoils while she is away she does not learn about until she returns', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nestObj = fillNest(world, fagi.x, fagi.y);
  useNest(fagi, world);             // she saw it full
  fagi.x += 600;                    // and left

  // EVERYTHING is lost while she is away.
  updateNest(world, POINT_TYPES.nectar.life * NEST.keepFactor);
  assert.equal(nestObj.stock.nectar, 0);

  // The world changed; her memory did not. She still believes the pantry is stocked.
  assert.equal(fagi.pantry.nectar, NEST.full);
  assert.equal(stockFull(fagi.pantry), true);

  // She goes back home and there she does find out.
  fagi.x = nestObj.x;
  fagi.y = nestObj.y;
  useNest(fagi, world);
  assert.equal(fagi.pantry.nectar ?? 0, 0);
  assert.equal(stockFull(fagi.pantry), false);
});

test('believing the pantry is stocked she does not pick up, even if the nest is empty', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nestObj = fillNest(world, fagi.x, fagi.y);
  useNest(fagi, world);
  fagi.x += 600;
  fagi.y += 600;
  updateNest(world, POINT_TYPES.nectar.life * NEST.keepFactor);

  // She comes across fruit without hunger: with the pantry (she thinks) stocked, she leaves it.
  fagi.hunger = 0;
  addPoint(world, fagi.x, fagi.y, 'nectar');
  tryPickOrEat(fagi, world);
  assert.equal(fagi.carrying, null);
  assert.equal(world.points.length, 1);

  // After stopping at the nest and seeing it empty, that same fruit is now useful.
  fagi.x = nestObj.x;
  fagi.y = nestObj.y;
  useNest(fagi, world);
  world.points[0].x = fagi.x;
  world.points[0].y = fagi.y;
  tryPickOrEat(fagi, world);
  assert.equal(fagi.carrying?.type, 'nectar');
  assert.equal(world.points.length, 0);
});
