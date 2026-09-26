import test from 'node:test';
import assert from 'node:assert/strict';

import { BACKEND } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { perceive } from '../src/perception.js';
import { observe } from '../src/observation.js';
import { ACCIONES_VALIDAS, createBackend, validateIntention } from '../src/backend/index.js';
import { createLocalBackend } from '../src/backend/local.js';
import { createHttpBackend } from '../src/backend/http.js';
import { createCortex, updateCortex } from '../src/cortex.js';
import { decide } from '../src/decision.js';
import { addObject, addPoint, createWorld } from '../src/world.js';

function mundoConComida() {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;   // mirando a la comida: createFagi() la hace nacer con ángulo al azar
  addPoint(world, fagi.x + 40, fagi.y, 'nectar');
  addObject(world, fagi.x + 200, fagi.y, 'agua');
  fagi.hunger = 40;
  const ctx = perceive(fagi, world);
  return { world, fagi, ctx };
}

test('observe() only ever sends JSON — no live references leak through', () => {
  const { world, fagi, ctx } = mundoConComida();
  const { observation } = observe(fagi, world, ctx);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(observation)));
  for (const c of observation.candidates) assert.equal(typeof c.id, 'number');
});

test('the local emulator answers a valid intention using only the JSON it was given', async () => {
  const { world, fagi, ctx } = mundoConComida();
  const { observation } = observe(fagi, world, ctx);
  const roundTripped = JSON.parse(JSON.stringify(observation));   // exactamente lo que cruzaría la red

  const backend = createLocalBackend();
  const intent = await backend.decide(roundTripped);
  assert.ok(ACCIONES_VALIDAS.has(intent.action));
  const valida = validateIntention(intent, observation);
  assert.ok(valida, 'the emulator produced something validateIntention rejects');
});

test('validateIntention rejects an action outside the enum or a target that was never offered', () => {
  const { world, fagi, ctx } = mundoConComida();
  const { observation } = observe(fagi, world, ctx);

  assert.equal(validateIntention({ action: 'flyAway', targetId: 1 }, observation), null);
  assert.equal(validateIntention({ action: 'seekFood', targetId: 999999 }, observation), null);
  assert.equal(validateIntention(null, observation), null);

  const real = observation.candidates[0];
  const ok = validateIntention({ action: 'seekFood', targetId: real.id, ttl: 999 }, observation);
  assert.ok(ok);
  assert.equal(ok.ttl, BACKEND.maxTtl);   // el ttl se recorta, nunca se acepta tal cual
});

test('the http backend posts the observation and returns a validated-later intention', async () => {
  let visto = null;
  const fakeFetch = async (url, opts) => {
    visto = { url, body: JSON.parse(opts.body) };
    return { ok: true, json: async () => ({ action: 'explore' }) };
  };
  const backend = createHttpBackend({ url: 'http://example.test', fetch: fakeFetch });
  const result = await backend.decide({ candidates: [] });
  assert.equal(result.action, 'explore');
  assert.equal(visto.url, 'http://example.test/decide');
  assert.deepEqual(visto.body, { candidates: [] });
});

test('the http backend gives up on a slow server and returns null instead of hanging', async () => {
  // Un fetch de verdad rechaza cuando se aborta la señal; el falso tiene que
  // hacer lo mismo o la prueba se queda colgada para siempre, igual que un
  // backend real haría si el cliente no respetara el AbortSignal. El timeout
  // se acorta para que la prueba no tarde los 2s de fábrica.
  const antes = BACKEND.timeout;
  BACKEND.timeout = 0.02;
  try {
    const slowFetch = (url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
    const backend = createHttpBackend({ url: 'http://example.test', fetch: slowFetch });
    const result = await backend.decide({ candidates: [] });
    assert.equal(result, null);
  } finally {
    BACKEND.timeout = antes;
  }
});

test('the http backend returns null on a network error or a bad response', async () => {
  const backend1 = createHttpBackend({ url: 'http://example.test', fetch: async () => { throw new Error('offline'); } });
  assert.equal(await backend1.decide({}), null);

  const backend2 = createHttpBackend({ url: 'http://example.test', fetch: async () => ({ ok: false }) });
  assert.equal(await backend2.decide({}), null);
});

test('the cortex asks fire-and-forget, applies a valid answer as a TTL-bound directive', async () => {
  const { world, fagi, ctx } = mundoConComida();
  BACKEND.enabled = 1;
  try {
    let entregado;
    const backend = { name: 'test', decide: async (obs) => { entregado = obs; return { action: 'explore' }; } };
    const cortex = createCortex(backend);
    fagi.cortex = cortex;

    updateCortex(cortex, fagi, world, ctx, 0.05);
    assert.equal(cortex.calls, 1);
    await null; await null;   // deja correr los microtasks de la promesa

    assert.ok(fagi.directive);
    assert.equal(fagi.directive.action, 'explore');
    assert.equal(fagi.directive.source, 'test');
    assert.ok(entregado.candidates);

    decide(fagi, world, ctx, 0.05);
    assert.equal(fagi.thought.action, 'explore');
  } finally {
    BACKEND.enabled = 0;
  }
});

test('a stale answer that arrives after Fagi died or reset is discarded', async () => {
  const { world, fagi, ctx } = mundoConComida();
  BACKEND.enabled = 1;
  try {
    let resolver;
    const backend = { name: 'lenta', decide: () => new Promise((res) => { resolver = res; }) };
    const cortex = createCortex(backend);
    fagi.cortex = cortex;

    updateCortex(cortex, fagi, world, ctx, 0.05);
    assert.equal(cortex.calls, 1);
    fagi.alive = false;              // muere mientras la respuesta está en vuelo
    resolver({ action: 'explore' });
    await null; await null;

    assert.equal(fagi.directive, null);
  } finally {
    BACKEND.enabled = 0;
  }
});

test('minInterval throttles how often the cortex is allowed to ask', () => {
  const { world, fagi, ctx } = mundoConComida();
  BACKEND.enabled = 1;
  try {
    const backend = { name: 'contador', decide: async () => null };
    const cortex = createCortex(backend);
    updateCortex(cortex, fagi, world, ctx, 0.05);
    const llamadasTrasLaPrimera = cortex.calls;
    updateCortex(cortex, fagi, world, ctx, 0.05);   // mismo instante, casi: no ha pasado minInterval
    assert.equal(cortex.calls, llamadasTrasLaPrimera);
  } finally {
    BACKEND.enabled = 0;
  }
});
