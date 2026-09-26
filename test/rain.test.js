import test from 'node:test';
import assert from 'node:assert/strict';

import { RAIN, WATER, FAGI, THIRST, ENERGY, HUNGER, NEST } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld, removeObject, storeInNest } from '../src/world.js';
import { updateRain, isPuddle } from '../src/rain.js';
import { waterZone } from '../src/obstacles.js';
import { dropPheromone } from '../src/pheromone.js';
import { recallPlace, recall, weight } from '../src/memory.js';
import { verdict } from '../src/learned/rules.js';
import { perceive } from '../src/perception.js';

const llover = (world) => { world.rain.timer = 0; updateRain(world, 0.01); };

test('a shower leaves shallow puddles that dry up in the sun', () => {
  const world = createWorld();
  llover(world);
  assert.equal(world.rain.on, true);
  for (let t = 0; t < RAIN.duration.max + 1; t += 0.5) updateRain(world, 0.5);
  assert.equal(world.rain.on, false);
  const charcos = world.objects.filter(isPuddle);
  assert.ok(charcos.length >= RAIN.puddles.min, `${charcos.length} charcos`);
  for (const c of charcos) assert.equal(waterZone(world, c.x, c.y).deep, false, 'en un charco siempre hace pie');

  world.rain.timer = Infinity;
  for (let t = 0; t < 2000 && world.objects.some(isPuddle); t += 1) updateRain(world, 1);
  assert.equal(world.objects.filter(isPuddle).length, 0, 'se secan todos');
});

test('rain soaks her outside the nest and washes the pheromone away faster', () => {
  const world = createWorld();
  const fagi = createFagi();
  dropPheromone(world, 100, 100, 50);
  const vida = world.pheromone[0].life;
  llover(world);
  step(world, fagi, 0.1);
  assert.equal(fagi.wet, WATER.dryTime);
  assert.ok(vida - world.pheromone[0].life >= 0.1 * RAIN.washPhero - 1e-9);
});

test('rain sends her to the nest to wait it out', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 200, fagi.y, 'nido');
  llover(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'shelter');
});

test('the air pressure drops before the rain, stays low while it rains and recovers after', () => {
  const world = createWorld();
  updateRain(world, 0.01);
  const lluvia = world.rain;
  lluvia.timer = lluvia.front = 40;
  updateRain(world, 20);
  assert.ok(Math.abs(lluvia.drop - 0.5) < 1e-9, `a mitad del frente: ${lluvia.drop}`);
  updateRain(world, 20.01);
  assert.equal(lluvia.on, true);
  updateRain(world, 1);
  assert.equal(lluvia.drop, 1);
  lluvia.left = 0;
  updateRain(world, 0.01);
  assert.equal(lluvia.on, false);
  updateRain(world, RAIN.recover / 2);
  assert.ok(lluvia.drop < 0.6 && lluvia.drop > 0.4, `recuperándose: ${lluvia.drop}`);
});

test('a naive ant with some thirst keeps working in the rain; getting soaked teaches her to shelter', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nido');
  fagi.thirst = THIRST.max * 0.35;     // tira de ella más que el instinto solo
  llover(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.notEqual(fagi.thought.action, 'shelter', 'de nacimiento no le basta');

  for (let t = 0; t < RAIN.sample * 3 && fagi.alive; t += 0.1) { fagi.thirst = THIRST.max * 0.35; step(world, fagi, 0.1); }
  assert.ok(recall(fagi.brain, 'lluvia').value < 0, 'mojarse le sienta mal');
  assert.equal(verdict(fagi, 'pursue', 'lluvia'), 'avoid', 'y lo escribe como regla');
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'shelter', 'ahora se refugia aunque tenga algo de sed');
});

test('a pressure drop means nothing until it has come before the rain; then she heads home early', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nido');
  fagi.thirst = 0;
  const frente = () => {
    updateRain(world, 0.01);
    world.rain.timer = world.rain.front = 30;
    world.rain.drop = 0;
    for (let t = 0; t < 20; t += 0.1) step(world, fagi, 0.1);
  };

  frente();
  assert.equal(fagi.pressureFalling, true, 'la nota bajar (instinto)');
  assert.notEqual(fagi.thought.action, 'shelter', 'pero no sabe qué anuncia');
  assert.equal(fagi.brain.facts.presion, undefined, 'ni siquiera cree nada de ella');
  assert.equal(fagi.brain.facts.lluvia, undefined);

  // Llueve encima y escampa: aprende la lluvia y, con ella, lo que anunciaba el
  // frente. Dos veces, para que la asociación pese.
  const calado = () => {
    world.rain.timer = 0;
    for (let t = 0; world.rain.on || t < 1; t += 0.1) {
      fagi.x = 100; fagi.y = 100;     // se queda a la intemperie
      step(world, fagi, 0.1);
    }
    for (let t = 0; t < 1; t += 0.1) step(world, fagi, 0.1);
  };
  calado();
  assert.ok(weight(fagi.brain, 'presion') < 0, 'la bajada ya significa lluvia');
  frente();
  calado();

  world.rain.drop = 0;
  fagi.pressure = 0;
  fagi.energy = ENERGY.max; fagi.resting = false; fagi.wet = 0;
  fagi.thirst = 0; fagi.hunger = 0;
  frente();
  assert.equal(world.rain.on, false, 'aún no llueve');
  assert.ok(['shelter', 'rest'].includes(fagi.thought.action), fagi.thought.action);
  assert.equal(fagi.thought.rule, 'anticipate');
});

test('a puddle found dry makes her trust puddles less', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const charco = addObject(world, fagi.x + 60, fagi.y, 'charco', 15);
  step(world, fagi, 0.05);
  removeObject(world, charco, 'dried');
  step(world, fagi, 0.05);
  assert.ok(recall(fagi.brain, 'charco').value < 0);
});

test('she only learns a remembered puddle is gone when she goes back and looks', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const charco = addObject(world, fagi.x + 60, fagi.y, 'charco', 15);
  fagi.thirst = 5;
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'charco'), 'lo ve y lo recuerda');

  removeObject(world, charco, 'dried');
  fagi.x -= 400;                      // lejos: no sabe que se ha secado
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'charco'));
  fagi.x += 400;                      // vuelve y mira
  step(world, fagi, 0.05);
  assert.equal(recallPlace(fagi.brain, 'charco'), null);
  assert.equal(fagi.puddleGone, 1);
});

test('antennae feel the water before the body gets in, and she slows to probe', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const R = 44;
  // El borde del hondo, justo al alcance de las antenas.
  addObject(world, fagi.x + FAGI.radius + WATER.probeReach + (R - WATER.vado) - 2, fagi.y, 'agua');
  step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.equal(fagi.probing, true);
  assert.ok(fagi.brain.synapses['sense:antenas>key:hondo']);
});

test('after deep water she stays soaked and slow until she dries', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'agua');
  for (let t = 0; t < 20 && (fagi.swimming || t === 0); t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.ok(fagi.wet > WATER.dryTime - 0.2, 'sale empapada');
  for (let t = 0; t < WATER.dryTime + 0.5; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.wet, 0, 'y se seca');
});

test('seeing a remembered puddle never makes it look worse than remembering it', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.thirst = THIRST.max * 0.4;
  addObject(world, fagi.x + 115, fagi.y, 'charco', 12);   // al límite de la vista
  const agua = () => perceive(fagi, world).ranked.find((c) => c.kind === 'water');
  const vista = agua();
  assert.equal(vista.via, 'vista');
  fagi.angle = Math.PI;               // se da la vuelta: ya solo lo recuerda
  const memoria = agua();
  assert.equal(memoria.via, 'memoria');
  assert.ok(vista.score >= memoria.score, `vista ${vista.score} < memoria ${memoria.score}`);
});

test('sleeping in the nest out of the rain, hunger and thirst rise far slower, and she eats from the pantry', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nido = addObject(world, fagi.x, fagi.y, 'nido');
  llover(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'rest');
  const h0 = fagi.hunger, s0 = fagi.thirst;
  for (let i = 0; i < 100; i++) step(world, fagi, 0.1);
  assert.ok(fagi.thirst - s0 < THIRST.rate * 10 * NEST.restThirst + 1e-6, `sed ${fagi.thirst - s0}`);
  assert.ok(fagi.hunger - h0 < HUNGER.rate * 10 * NEST.restHunger + 1e-6, `hambre ${fagi.hunger - h0}`);

  // La lluvia se alarga y le entra hambre: come de lo guardado sin salir.
  storeInNest(nido, 'nectar'); storeInNest(nido, 'nectar');
  fagi.hunger = HUNGER.max * 0.5;
  step(world, fagi, 0.1);
  assert.equal(nido.stock.nectar, 1);
  assert.ok(fagi.hunger < HUNGER.max * 0.5);
});

test('what it learned about weather goes into its code: rules only about pursuing, and how long a puddle lasts', async () => {
  const { exportText, importText } = await import('../src/learned/store.js');
  const { learn } = await import('../src/brain.js');
  const fagi = createFagi();
  for (let i = 0; i < 3; i++) learn(fagi.brain, 'lluvia', -0.8, i * 20);
  fagi.brain.puddleLife = 180;
  const regla = fagi.brain.rules.list.find((r) => r.id === 'evitar-lluvia');
  assert.deepEqual(regla.on, ['pursue'], 'la lluvia no se come');

  const texto = exportText(fagi);
  const otra = createFagi();
  importText(otra, texto);
  assert.equal(otra.brain.puddleLife, 180);
  assert.equal(verdict(otra, 'pursue', 'lluvia'), 'avoid');
});
