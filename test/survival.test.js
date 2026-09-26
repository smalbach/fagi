import test from 'node:test';
import assert from 'node:assert/strict';

import { MAPGEN, NEST, POINT_TYPES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat, tryPickOrEat } from '../src/feeding.js';
import { generateMap } from '../src/mapgen.js';
import { step } from '../src/simulation.js';
import { smelledPoints } from '../src/smell.js';
import { isTree, isWater } from '../src/obstacles.js';
import { useNest } from '../src/nest.js';
import { addObject, addPoint, createWorld, nestOf, nestStock, storeInNest, updateNest } from '../src/world.js';

function seededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function withSeed(seed, fn) {
  const original = Math.random;
  Math.random = seededRandom(seed);
  try { return fn(); } finally { Math.random = original; }
}

test('the generated world contains every renewable survival resource', () => {
  withSeed(1, () => {
    const world = createWorld();
    generateMap(world);
    assert.ok(nestOf(world));
    assert.equal(world.objects.filter(isWater).length, MAPGEN.pools);
    assert.equal(world.objects.filter(isTree).length, MAPGEN.trees);
    const tree = world.objects.find(isTree);
    assert.ok(Math.hypot(tree.x - nestOf(world).x, tree.y - nestOf(world).y) >= MAPGEN.treeMinNestDistance);
  });
});

test('a scent trail is attributed only to the source that emitted it', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.x = 300;
  fagi.y = 300;
  addPoint(world, 100, 100, 'nectar');
  addPoint(world, 1000, 700, 'nectar');
  const [smelled, distant] = world.points;
  smelled.trail = { nodes: [{ x: 300, y: 300 }], originX: 100, originY: 100 };
  distant.trail = { nodes: [{ x: 1000, y: 700 }], originX: 1000, originY: 700 };

  const detected = smelledPoints(fagi, world);
  assert.deepEqual(detected.map(({ point }) => point), [smelled]);
});

test('food and water can save Fagi during the last viable turn', () => {
  const waterWorld = createWorld();
  const drinking = createFagi();
  addObject(waterWorld, drinking.x, drinking.y, 'agua');
  drinking.thirst = 99.99;
  step(waterWorld, drinking, 0.05);
  assert.equal(drinking.alive, true);
  assert.ok(drinking.thirst < 100);

  const foodWorld = createWorld();
  const eating = createFagi();
  addPoint(foodWorld, eating.x, eating.y, 'nectar');
  eating.hunger = 99.99;
  step(foodWorld, eating, 0.05);
  assert.equal(eating.alive, true);
  assert.ok(eating.hunger < 100);
});

test('a hungry Fagi eats the ration she is already carrying', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 60;
  fagi.carrying = { type: 'nectar' };
  step(world, fagi, 0.01);
  assert.equal(fagi.carrying, null);
  assert.ok(fagi.hunger < 60);
});

test('critical decisions use remaining lifetime, not the largest percentage', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.hunger = 80; // 14.3 seconds left
  fagi.thirst = 70; // 13.6 seconds left
  addPoint(world, fagi.x + 20, fagi.y, 'nectar');
  addObject(world, fagi.x + 100, fagi.y, 'agua');

  step(world, fagi, 0.01);
  assert.equal(fagi.thought.action, 'seekWater');
});

test('one bad experience is enough: it does not eat that again merely by walking over it', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');            // it feels it: more hunger, slower legs
  assert.equal(fagi.eaten, 1);
  assert.ok(fagi.brain.facts.toxico.value < 0);

  fagi.target = { x: fagi.x + 100, y: fagi.y, type: 'nectar' };
  addPoint(world, fagi.x, fagi.y, 'toxico');
  tryPickOrEat(fagi, world);
  assert.equal(fagi.eaten, 1);
  assert.equal(world.points.length, 1);
});

test('does not get stuck retargeting food it already learned to avoid, with nothing else around', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.thirst = 0;

  // Ya lo aprendió en una vida anterior (o hace un minuto): tiene la regla,
  // y dos bocados agotan la curiosidad (BRAIN.curiosityTries=2), así que un
  // tercer encuentro ya no es "probar otra vez", es un rechazo de verdad.
  // Empieza sin hambre para que los dos bocados de +25 no la maten (0→50).
  fagi.hunger = 0;
  eat(fagi, 'toxico');
  eat(fagi, 'toxico');
  assert.equal(fagi.hunger, 50);   // urgente pero por debajo de NEEDS.critical: tier "proveer", no "urgencia"
  assert.ok(fagi.brain.rules.list.some((r) => r.id === 'evitar-toxico' && !r.retired));

  // Lo único que hay para comer es otro tóxico, justo delante.
  addPoint(world, fagi.x + 30, fagi.y, 'toxico');

  // Primero se acerca (eso es normal); lo que no puede pasar es que se quede
  // clavada ahí para siempre, re-eligiéndolo y rechazándolo cada frame. Se
  // compara la segunda mitad del tramo con la primera: si de verdad sigue su
  // vida, la segunda mitad también se mueve. Si se congeló junto al fruto,
  // la segunda mitad no avanza nada.
  for (let t = 0; t < 1 && fagi.alive; t += 0.05) step(world, fagi, 0.05);
  const xMid = fagi.x, yMid = fagi.y;
  for (let t = 0; t < 1 && fagi.alive; t += 0.05) step(world, fagi, 0.05);

  assert.notEqual(fagi.target, world.points[0]);
  assert.ok(
    Math.hypot(fagi.x - xMid, fagi.y - yMid) > 5,
    'Fagi froze in place: stuck retargeting the toxic fruit it already refuses to eat',
  );
});

test('the pantry never serves food that sat badly with it', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');
  addObject(world, fagi.x, fagi.y, 'nido').stock.toxico = 2;
  fagi.hunger = 90;

  useNest(fagi, world);
  assert.equal(fagi.hunger, 90);
  assert.equal(nestOf(world).stock.toxico, 2);
});

test('stored food lasts NEST.keepFactor times longer, then spoils away', () => {
  const world = createWorld();
  const nido = addObject(world, 200, 200, 'nido');
  const vida = POINT_TYPES.nectar.life;
  storeInNest(nido, 'nectar');

  // A la vida que tendría en el suelo todavía sigue guardado.
  updateNest(world, vida);
  assert.equal(nido.stock.nectar, 1);

  // Justo antes de cumplir su vida larga (vida × keepFactor) aguanta...
  updateNest(world, vida * NEST.keepFactor - vida - 1);
  assert.equal(nido.stock.nectar, 1);

  // ...y al cumplirla se echa a perder y desaparece de las reservas.
  updateNest(world, 1);
  assert.equal(nido.stock.nectar, 0);
  assert.equal(nestStock(nido), 0);
  assert.equal(nido.spoiled, 1);
});

test('the pantry serves the oldest ration first', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nido = addObject(world, fagi.x, fagi.y, 'nido');
  storeInNest(nido, 'nectar', POINT_TYPES.nectar.life - 1); // a punto de pasarse
  storeInNest(nido, 'nectar', 0);                           // recién cogida
  fagi.hunger = 90;

  useNest(fagi, world);
  assert.equal(nido.stock.nectar, 1);
  assert.deepEqual(nido.ages.nectar, [0]);
});

test('survival regression across deterministic generated worlds', () => {
  let survivors = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const alive = withSeed(seed, () => {
      const world = createWorld();
      const fagi = createFagi();
      generateMap(world);
      for (let elapsed = 0; elapsed < 180 && fagi.alive; elapsed += 0.05) {
        step(world, fagi, 0.05);
      }
      return fagi.alive;
    });
    if (alive) survivors++;
  }
  assert.ok(survivors >= 18, `expected at least 18/20 survivors, got ${survivors}`);
});
