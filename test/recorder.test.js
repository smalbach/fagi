import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { generateMap } from '../src/mapgen.js';
import { step } from '../src/simulation.js';
import { addObject, addPoint, createWorld, nestOf, removeObject } from '../src/world.js';
import { isTree } from '../src/obstacles.js';
import { createRecorder } from '../src/recorder/recorder.js';
import { createPlayer } from '../src/recorder/replay.js';
import { invalidEvent } from '../src/recorder/events.js';
import { createNarrator, narrate } from '../src/narrator.js';

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

// Lo que se ve del mundo en un instante, en una forma fácil de comparar.
function photo(world) {
  const nestObj = nestOf(world);
  return {
    objects: world.objects.map((o) => [o.id, o.type, Math.round(o.x), Math.round(o.y), o.r]).sort((a, b) => a[0] - b[0]),
    points: world.points.map((p) => [p.id, p.type, Math.round(p.x), Math.round(p.y)]).sort((a, b) => a[0] - b[0]),
    stock: Object.fromEntries(Object.entries(nestObj?.stock ?? {}).filter(([, n]) => n > 0)),
    pheromone: world.pheromone.length,
  };
}

// Una partida entera, grabada, con fotos del mundo real en varios instantes.
function game({ seed = 3, seconds = 400, dt = 0.05, instants = [30, 90, 180, 300, 400] } = {}) {
  return withSeed(seed, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const eventList = [];
    const rec = createRecorder(world, { send: (batch) => eventList.push(...batch) });
    world.rec = rec;
    rec.start({ config: { 'Fagi.speed': 1 } });

    const photos = [];
    const pendingList = [...instants];
    let touched = false;
    while (world.time < seconds) {
      step(world, fagi, dt);
      rec.observe(fagi);
      // A mitad de partida alguien quita un árbol y pone una baya a mano.
      if (!touched && world.time >= 60) {
        touched = true;
        removeObject(world, world.objects.find(isTree), 'user');
        addObject(world, 200, 200, 'rock', undefined, 'user');
        addPoint(world, 400, 300, 'nectar', 'user');
      }
      if (pendingList.length && world.time >= pendingList[0]) {
        pendingList.shift();
        photos.push({ t: world.time, photo: photo(world) });
      }
    }
    rec.end('test', fagi);
    return { eventList, photos, fagi, world };
  });
}

test('every recorded event is valid and seq is gapless', () => {
  const { eventList } = game({ seconds: 120 });
  assert.ok(eventList.length > 50);
  eventList.forEach((ev, i) => {
    assert.equal(invalidEvent(ev), null, JSON.stringify(ev));
    assert.equal(ev.seq, i);
  });
  assert.equal(eventList[0].type, 'session_start');
  assert.equal(eventList.at(-1).type, 'session_end');
  // El mapa de partida sale entero, con su nido y sus coordenadas.
  const initials = eventList.filter((e) => e.type === 'obj_add' && e.source === 'setup');
  assert.ok(initials.some((e) => e.what === 'nest'));
  // Cada fruta que cae dice de qué árbol vino.
  const fruits = eventList.filter((e) => e.type === 'point_add' && e.from !== 'user');
  assert.ok(fruits.length > 0);
  assert.ok(fruits.every((e) => Number.isInteger(e.from)));
  // Lo que se hizo a mano queda marcado como del usuario.
  assert.ok(eventList.some((e) => e.type === 'obj_remove' && e.source === 'user'));
  assert.ok(eventList.some((e) => e.type === 'point_add' && e.from === 'user'));
});

test('replay rebuilds the world exactly at any recorded instant', () => {
  const { eventList, photos } = game();
  assert.equal(photos.length, 5);
  assert.ok(photos.some(({ photo: f }) => f.pheromone > 0 && Object.keys(f.stock).length), 'hay feromona y despensa que comparar');
  const player = createPlayer(eventList, { checkpointEvery: 30 });
  for (const { t, photo: realOne } of photos) {
    player.seek(t);
    assert.deepEqual(photo(player.world), realOne, `t=${t.toFixed(2)}`);
  }
  // Hacia atrás (desde un punto de control) da lo mismo que hacia delante.
  for (const { t, photo: realOne } of [...photos].reverse()) {
    player.seek(t);
    assert.deepEqual(photo(player.world), realOne, `atrás t=${t.toFixed(2)}`);
  }
});

test('replay follows Fagi along the recorded track', () => {
  const { eventList, fagi } = game({ seconds: 90, instants: [] });
  const player = createPlayer(eventList);
  player.seek(player.duration);
  assert.ok(Math.hypot(player.fagi.x - fagi.x, player.fagi.y - fagi.y) < 1, 'termina donde terminó');
  assert.equal(player.fagi.alive, fagi.alive);
  player.seek(0);
  const start = eventList.find((e) => e.type === 'track').pts[0];
  assert.ok(Math.hypot(player.fagi.x - start[1], player.fagi.y - start[2]) < 0.01);
});

test('replay traces the same curves Fagi walked live', () => {
  withSeed(11, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const eventList = [];
    const rec = createRecorder(world, { send: (batch) => eventList.push(...batch) });
    world.rec = rec;
    rec.start({ config: {} });
    const alive = [];
    while (world.time < 120 && fagi.alive) {
      step(world, fagi, 1 / 60);
      rec.observe(fagi);
      alive.push([world.time, fagi.x, fagi.y]);
    }
    rec.end('test', fagi);
    const player = createPlayer(eventList);
    let worst = 0;
    for (const [t, x, y] of alive) {
      player.seek(t);
      worst = Math.max(worst, Math.hypot(player.fagi.x - x, player.fagi.y - y));
    }
    assert.ok(worst < 1, `se aparta ${worst.toFixed(2)} px`);
    const points = player.track.length / world.time;
    assert.ok(points < 10, `${points.toFixed(1)} puntos por segundo`);
  });
});

test('replay shows what Fagi thought, believed and logged', () => {
  withSeed(5, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const narrator = createNarrator();
    const eventList = [];
    const rec = createRecorder(world, { send: (batch) => eventList.push(...batch) });
    world.rec = rec;
    rec.start({ config: {} });
    const photos = [];
    let nextOne = 20;
    while (world.time < 200 && fagi.alive) {
      step(world, fagi, 0.05);
      const lines = narrate(narrator, fagi);
      rec.observe(fagi, lines);
      if (world.time >= nextOne) {
        nextOne += 20;
        photos.push({
          t: world.time,
          beliefs: Object.keys(fagi.brain.facts).sort(),
          rules: fagi.brain.rules.list.map((r) => r.id),
          foods: fagi.eaten,
          log: lines.slice(-5).map((l) => JSON.stringify([l.tag, l.text, l.detail])),
        });
      }
    }
    rec.end('test', fagi, narrator.lines);
    assert.ok(eventList.some((e) => e.type === 'mind'));
    assert.ok(eventList.some((e) => e.type === 'log'));
    for (const e of eventList) assert.equal(invalidEvent(e), null, JSON.stringify(e).slice(0, 80));

    const player = createPlayer(eventList);
    for (const f of [...photos, ...[...photos].reverse()]) {
      player.seek(f.t);
      const pf = player.fagi;
      assert.deepEqual(Object.keys(pf.brain.facts).sort(), f.beliefs, `creencias t=${f.t.toFixed(1)}`);
      assert.deepEqual(pf.brain.rules.list.map((r) => r.id), f.rules, `reglas t=${f.t.toFixed(1)}`);
      assert.equal(pf.eaten, f.foods, `comidas t=${f.t.toFixed(1)}`);
      assert.ok(pf.thought?.action, 'piensa algo');
      assert.ok(Array.isArray(pf.thought.ranked));
      assert.deepEqual(player.log.slice(-5).map((l) => JSON.stringify([l.tag, l.text, l.detail])), f.log, `console t=${f.t.toFixed(1)}`);
    }
    const perSecond = JSON.stringify(eventList.filter((e) => e.type === 'mind')).length / world.time;
    // Con la red neuronal y el mapa mental dentro: sigue siendo poco. Varía
    // con la partida (1900-2800 según la semilla), así que el tope deja margen.
    assert.ok(perSecond < 3200, `mente: ${Math.round(perSecond)} bytes/s`);
  });
});

test('nothing is recorded after the session ends', () => {
  const world = createWorld();
  const eventList = [];
  const rec = createRecorder(world, { send: (l) => eventList.push(...l) });
  world.rec = rec;
  rec.start({ config: {} });
  rec.end('user', createFagi());
  const n = eventList.length;
  addPoint(world, 1, 1, 'nectar');
  rec.flush();
  assert.equal(eventList.length, n);
});
