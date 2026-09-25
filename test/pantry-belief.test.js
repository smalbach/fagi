import test from 'node:test';
import assert from 'node:assert/strict';

import { NEST, POINT_TYPES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { useNest } from '../src/nest.js';
import { tryPickOrEat } from '../src/feeding.js';
import { addObject, addPoint, createWorld, stockFull, storeInNest, updateNest } from '../src/world.js';

// Un nido lleno, lejos de donde está Fagi.
function llenarNido(world, x = 900, y = 900) {
  const nido = addObject(world, x, y, 'nido');
  for (let i = 0; i < NEST.full; i++) storeInNest(nido, 'nectar');
  return nido;
}

test('mirar la despensa es lo que la mete en la cabeza de Fagi', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nido = llenarNido(world, fagi.x, fagi.y);

  // Todavía no ha entrado: el nido está lleno y ella no lo sabe.
  assert.deepEqual(fagi.pantry, {});
  assert.equal(stockFull(fagi.pantry), false);

  useNest(fagi, world);
  assert.equal(fagi.pantry.nectar, nido.stock.nectar);
  assert.equal(stockFull(fagi.pantry), true);
});

test('lo que se echa a perder estando fuera no se entera hasta volver', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nido = llenarNido(world, fagi.x, fagi.y);
  useNest(fagi, world);             // lo vio lleno
  fagi.x += 600;                    // y se fue

  // Se pierde TODO mientras está lejos.
  updateNest(world, POINT_TYPES.nectar.life * NEST.keepFactor);
  assert.equal(nido.stock.nectar, 0);

  // El mundo cambió; su recuerdo no. Sigue creyendo la despensa hecha.
  assert.equal(fagi.pantry.nectar, NEST.full);
  assert.equal(stockFull(fagi.pantry), true);

  // Vuelve a casa y ahí sí se entera.
  fagi.x = nido.x;
  fagi.y = nido.y;
  useNest(fagi, world);
  assert.equal(fagi.pantry.nectar ?? 0, 0);
  assert.equal(stockFull(fagi.pantry), false);
});

test('creyendo la despensa hecha no recoge, aunque el nido esté vacío', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nido = llenarNido(world, fagi.x, fagi.y);
  useNest(fagi, world);
  fagi.x += 600;
  fagi.y += 600;
  updateNest(world, POINT_TYPES.nectar.life * NEST.keepFactor);

  // Se topa con fruta sin hambre: con la despensa (que cree) hecha, la deja.
  fagi.hunger = 0;
  addPoint(world, fagi.x, fagi.y, 'nectar');
  tryPickOrEat(fagi, world);
  assert.equal(fagi.carrying, null);
  assert.equal(world.points.length, 1);

  // Tras pasar por el nido y ver el vacío, esa misma fruta ya le sirve.
  fagi.x = nido.x;
  fagi.y = nido.y;
  useNest(fagi, world);
  world.points[0].x = fagi.x;
  world.points[0].y = fagi.y;
  tryPickOrEat(fagi, world);
  assert.equal(fagi.carrying?.type, 'nectar');
  assert.equal(world.points.length, 0);
});
