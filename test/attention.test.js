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

// Un mundo vacío con Fagi en medio, mirando a la derecha, sin necesidades.
function tranquila() {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  return { world, fagi };
}

function correr(world, fagi, segundos, dt = 0.05) {
  for (let t = 0; t < segundos; t += dt) step(world, fagi, dt);
}

// Pone algo a un lado de su rumbo, dentro del cono de visión.
function alCostado(fagi, grados, dist) {
  const a = fagi.angle + (grados * Math.PI) / 180;
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

  // Al llegar al final del tramo, traza otro con lo que ve entonces.
  const primero = fagi.exploreLegs;
  correr(world, fagi, 8);
  assert.ok(fagi.exploreLegs > primero + 1, 'keeps deciding new legs as it walks');
});

test('something new at its side mid-leg makes it reconsider and go for it', () => {
  const { world, fagi } = tranquila();
  fagi.hunger = 40;                  // con ganas, sin llegar a apurarse
  correr(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');

  const p = alCostado(fagi, -40, 120);
  addPoint(world, p.x, p.y, 'nectar');
  const fruta = world.points[world.points.length - 1];
  step(world, fagi, 0.05);

  assert.equal(fagi.thought.action, 'seekFood');
  assert.equal(fagi.target, fruta);
  assert.equal(fagi.rethink.what, 'nectar');
  assert.equal(fagi.rethink.side, 'left');
  assert.equal(fagi.rethink.changed, true);
  assert.equal(fagi.rethink.forNew, true);
  assert.equal(fagi.rethink.from, 'explore');
});

test('something new that is no use now is weighed and the leg goes on', () => {
  const { world, fagi } = tranquila();
  addObject(world, fagi.x - 300, fagi.y, 'nido');
  fagi.pantry = { nectar: NEST.full };   // cree tener la despensa llena
  correr(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');

  const p = alCostado(fagi, 35, 110);
  addPoint(world, p.x, p.y, 'nectar');
  step(world, fagi, 0.05);

  assert.equal(fagi.thought.action, 'explore');
  assert.equal(fagi.rethink.what, 'nectar');
  assert.equal(fagi.rethink.side, 'right');
  assert.equal(fagi.rethink.changed, false);
  assert.equal(fagi.rethink.why, 'notUseful');

  // Visto ya, no vuelve a contar como nuevo en el frame siguiente.
  const n = fagi.rethink.n;
  step(world, fagi, 0.05);
  assert.equal(fagi.rethink.n, n);
});

test('carrying home, water in sight with some thirst is worth a detour', () => {
  const { world, fagi } = tranquila();
  addObject(world, fagi.x - 350, fagi.y, 'nido');
  fagi.carrying = { type: 'nectar', age: 0 };
  fagi.thirst = 40;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'carry');

  addObject(world, fagi.x + 30, fagi.y + 140, 'agua');   // al costado
  fagi.angle = Math.PI / 2;                              // gira y lo ve
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'seekWater');
  assert.equal(fagi.thought.reason.key, 'reason.detourWater');
  assert.equal(fagi.rethink.forNew, true);
});

test('with a directive in force, something new makes it ask the API again', () => {
  const antes = BACKEND.enabled;
  BACKEND.enabled = 1;
  try {
    const { world, fagi } = tranquila();
    let llamadas = 0;
    const cortex = createCortex({ name: 'stub', decide: () => { llamadas++; return new Promise(() => {}); } });
    cortex.inflight = false;
    fagi.directive = { action: 'explore', until: 999, source: 'stub' };
    fagi.age = 10;

    const ctx = perceive(fagi, world);
    ctx.nuevas = notice(fagi, ctx);
    updateCortex(cortex, fagi, world, ctx, 0.05);
    assert.equal(llamadas, 0, 'nothing new, directive in force: no need to ask');

    const p = alCostado(fagi, 20, 100);
    addPoint(world, p.x, p.y, 'nectar');
    cortex.seenKeys.add('nectar');     // no es un tipo nuevo: es una fruta nueva
    fagi.age = 13;
    const ctx2 = perceive(fagi, world);
    ctx2.nuevas = notice(fagi, ctx2);
    assert.equal(ctx2.nuevas.length, 1);
    updateCortex(cortex, fagi, world, ctx2, 0.05);
    assert.equal(llamadas, 1);
  } finally {
    BACKEND.enabled = antes;
  }
});

// Marca todo el mapa mental como conocido salvo alrededor de (x, y).
function soloDesconocido(fagi, x, y) {
  fagi.explored.fill(EXPLORE.visitMax);
  const cols = Math.ceil(WORLD.width / EXPLORE.cell);
  fagi.explored[Math.floor(y / EXPLORE.cell) * cols + Math.floor(x / EXPLORE.cell)] = 0;
}

test('back to exploring, the unfinished leg competes with new ones on the same terms', () => {
  const { world, fagi } = tranquila();

  // El tramo viejo acaba fuera de su vista, en lo único que no conoce: lo
  // retoma aunque tenga que girar, porque lo que ve ya lo conoce.
  const viejo = alCostado(fagi, 90, 200);
  soloDesconocido(fagi, viejo.x, viejo.y);
  const a = waypointInView(fagi, fagi.explored, null, world, { ...viejo, inView: true });
  assert.equal(a.resumed, true);
  assert.ok(a.score > a.rival);

  // El tramo viejo queda a la espalda, en terreno ya conocido, y lo que tiene
  // delante no lo conoce: traza uno nuevo.
  const atras = alCostado(fagi, 180, 150);
  fagi.explored.fill(EXPLORE.visitMax);
  const cols = Math.ceil(WORLD.width / EXPLORE.cell);
  const delante = alCostado(fagi, 0, 180);
  fagi.explored[Math.floor(delante.y / EXPLORE.cell) * cols + Math.floor(delante.x / EXPLORE.cell)] = 0;
  const b = waypointInView(fagi, fagi.explored, null, world, { ...atras, inView: true });
  assert.equal(b.resumed, false);
  assert.ok(b.score > b.rival);
});

test('after a detour it decides whether to resume the leg, and says so', () => {
  const { world, fagi } = tranquila();
  fagi.hunger = 40;
  correr(world, fagi, 0.5);
  assert.equal(fagi.thought.action, 'explore');
  const tramo = { ...fagi.exploreTarget };

  const p = alCostado(fagi, -30, 60);
  addPoint(world, p.x, p.y, 'nectar');
  let pasos = 0;
  while (world.points.length && pasos++ < 200) step(world, fagi, 0.05);   // va, y se la come o la carga
  fagi.carrying = null;
  fagi.hunger = 0;
  correr(world, fagi, 0.2);

  assert.equal(fagi.thought.action, 'explore');
  assert.ok(fagi.legChoice, 'weighed resuming against a new leg');
  const retomado = fagi.exploreTarget.x === tramo.x && fagi.exploreTarget.y === tramo.y;
  assert.equal(fagi.legChoice.resumed, retomado);
});
