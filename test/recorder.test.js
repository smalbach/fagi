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
function foto(world) {
  const nido = nestOf(world);
  return {
    objects: world.objects.map((o) => [o.id, o.type, Math.round(o.x), Math.round(o.y), o.r]).sort((a, b) => a[0] - b[0]),
    points: world.points.map((p) => [p.id, p.type, Math.round(p.x), Math.round(p.y)]).sort((a, b) => a[0] - b[0]),
    stock: Object.fromEntries(Object.entries(nido?.stock ?? {}).filter(([, n]) => n > 0)),
    pheromone: world.pheromone.length,
  };
}

// Una partida entera, grabada, con fotos del mundo real en varios instantes.
function partida({ seed = 3, segundos = 400, dt = 0.05, instantes = [30, 90, 180, 300, 400] } = {}) {
  return withSeed(seed, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const eventos = [];
    const rec = createRecorder(world, { send: (lote) => eventos.push(...lote) });
    world.rec = rec;
    rec.start({ config: { 'Fagi.speed': 1 } });

    const fotos = [];
    const pendientes = [...instantes];
    let tocado = false;
    while (world.time < segundos) {
      step(world, fagi, dt);
      rec.observe(fagi);
      // A mitad de partida alguien quita un árbol y pone una baya a mano.
      if (!tocado && world.time >= 60) {
        tocado = true;
        removeObject(world, world.objects.find(isTree), 'user');
        addObject(world, 200, 200, 'roca', undefined, 'user');
        addPoint(world, 400, 300, 'nectar', 'user');
      }
      if (pendientes.length && world.time >= pendientes[0]) {
        pendientes.shift();
        fotos.push({ t: world.time, foto: foto(world) });
      }
    }
    rec.end('test', fagi);
    return { eventos, fotos, fagi, world };
  });
}

test('every recorded event is valid and seq is gapless', () => {
  const { eventos } = partida({ segundos: 120 });
  assert.ok(eventos.length > 50);
  eventos.forEach((ev, i) => {
    assert.equal(invalidEvent(ev), null, JSON.stringify(ev));
    assert.equal(ev.seq, i);
  });
  assert.equal(eventos[0].type, 'session_start');
  assert.equal(eventos.at(-1).type, 'session_end');
  // El mapa de partida sale entero, con su nido y sus coordenadas.
  const iniciales = eventos.filter((e) => e.type === 'obj_add' && e.source === 'setup');
  assert.ok(iniciales.some((e) => e.what === 'nido'));
  // Cada fruta que cae dice de qué árbol vino.
  const frutas = eventos.filter((e) => e.type === 'point_add' && e.from !== 'user');
  assert.ok(frutas.length > 0);
  assert.ok(frutas.every((e) => Number.isInteger(e.from)));
  // Lo que se hizo a mano queda marcado como del usuario.
  assert.ok(eventos.some((e) => e.type === 'obj_remove' && e.source === 'user'));
  assert.ok(eventos.some((e) => e.type === 'point_add' && e.from === 'user'));
});

test('replay rebuilds the world exactly at any recorded instant', () => {
  const { eventos, fotos } = partida();
  assert.equal(fotos.length, 5);
  assert.ok(fotos.some(({ foto: f }) => f.pheromone > 0 && Object.keys(f.stock).length), 'hay feromona y despensa que comparar');
  const player = createPlayer(eventos, { checkpointEvery: 30 });
  for (const { t, foto: real } of fotos) {
    player.seek(t);
    assert.deepEqual(foto(player.world), real, `t=${t.toFixed(2)}`);
  }
  // Hacia atrás (desde un punto de control) da lo mismo que hacia delante.
  for (const { t, foto: real } of [...fotos].reverse()) {
    player.seek(t);
    assert.deepEqual(foto(player.world), real, `atrás t=${t.toFixed(2)}`);
  }
});

test('replay follows Fagi along the recorded track', () => {
  const { eventos, fagi } = partida({ segundos: 90, instantes: [] });
  const player = createPlayer(eventos);
  player.seek(player.duration);
  assert.ok(Math.hypot(player.fagi.x - fagi.x, player.fagi.y - fagi.y) < 1, 'termina donde terminó');
  assert.equal(player.fagi.alive, fagi.alive);
  player.seek(0);
  const inicio = eventos.find((e) => e.type === 'track').pts[0];
  assert.ok(Math.hypot(player.fagi.x - inicio[1], player.fagi.y - inicio[2]) < 0.01);
});

test('replay traces the same curves Fagi walked live', () => {
  withSeed(11, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const eventos = [];
    const rec = createRecorder(world, { send: (lote) => eventos.push(...lote) });
    world.rec = rec;
    rec.start({ config: {} });
    const vivo = [];
    while (world.time < 120 && fagi.alive) {
      step(world, fagi, 1 / 60);
      rec.observe(fagi);
      vivo.push([world.time, fagi.x, fagi.y]);
    }
    rec.end('test', fagi);
    const player = createPlayer(eventos);
    let peor = 0;
    for (const [t, x, y] of vivo) {
      player.seek(t);
      peor = Math.max(peor, Math.hypot(player.fagi.x - x, player.fagi.y - y));
    }
    assert.ok(peor < 1, `se aparta ${peor.toFixed(2)} px`);
    const puntos = player.track.length / world.time;
    assert.ok(puntos < 10, `${puntos.toFixed(1)} puntos por segundo`);
  });
});

test('replay shows what Fagi thought, believed and logged', () => {
  withSeed(5, () => {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    const narrador = createNarrator();
    const eventos = [];
    const rec = createRecorder(world, { send: (lote) => eventos.push(...lote) });
    world.rec = rec;
    rec.start({ config: {} });
    const fotos = [];
    let siguiente = 20;
    while (world.time < 200 && fagi.alive) {
      step(world, fagi, 0.05);
      const lineas = narrate(narrador, fagi);
      rec.observe(fagi, lineas);
      if (world.time >= siguiente) {
        siguiente += 20;
        fotos.push({
          t: world.time,
          creencias: Object.keys(fagi.brain.facts).sort(),
          reglas: fagi.brain.rules.list.map((r) => r.id),
          comidas: fagi.eaten,
          log: lineas.slice(-5).map((l) => JSON.stringify([l.tag, l.text, l.detail])),
        });
      }
    }
    rec.end('test', fagi, narrador.lines);
    assert.ok(eventos.some((e) => e.type === 'mind'));
    assert.ok(eventos.some((e) => e.type === 'log'));
    for (const e of eventos) assert.equal(invalidEvent(e), null, JSON.stringify(e).slice(0, 80));

    const player = createPlayer(eventos);
    for (const f of [...fotos, ...[...fotos].reverse()]) {
      player.seek(f.t);
      const pf = player.fagi;
      assert.deepEqual(Object.keys(pf.brain.facts).sort(), f.creencias, `creencias t=${f.t.toFixed(1)}`);
      assert.deepEqual(pf.brain.rules.list.map((r) => r.id), f.reglas, `reglas t=${f.t.toFixed(1)}`);
      assert.equal(pf.eaten, f.comidas, `comidas t=${f.t.toFixed(1)}`);
      assert.ok(pf.thought?.action, 'piensa algo');
      assert.ok(Array.isArray(pf.thought.ranked));
      assert.deepEqual(player.log.slice(-5).map((l) => JSON.stringify([l.tag, l.text, l.detail])), f.log, `consola t=${f.t.toFixed(1)}`);
    }
    const porSegundo = JSON.stringify(eventos.filter((e) => e.type === 'mind')).length / world.time;
    // Con la red neuronal y el mapa mental dentro: sigue siendo poco. Varía
    // con la partida (1900-2800 según la semilla), así que el tope deja margen.
    assert.ok(porSegundo < 3200, `mente: ${Math.round(porSegundo)} bytes/s`);
  });
});

test('nothing is recorded after the session ends', () => {
  const world = createWorld();
  const eventos = [];
  const rec = createRecorder(world, { send: (l) => eventos.push(...l) });
  world.rec = rec;
  rec.start({ config: {} });
  rec.end('user', createFagi());
  const n = eventos.length;
  addPoint(world, 1, 1, 'nectar');
  rec.flush();
  assert.equal(eventos.length, n);
});
