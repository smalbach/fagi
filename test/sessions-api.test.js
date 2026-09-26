import test from 'node:test';
import assert from 'node:assert/strict';
import { SKIP, montar, cliente } from './helpers/server.js';

async function usuarios(app) {
  const admin = cliente(app);
  await admin.post('/api/auth/register', { email: 'admin@fagi.test', password: 'clave-de-admin-123' });
  const aprobar = async (email) => {
    const c = cliente(app);
    const r = await c.post('/api/auth/register', { email, password: 'una-clave-larga' });
    await admin.post(`/api/admin/users/${r.body.user.id}/approve`);
    return c;
  };
  return { admin, ana: await aprobar('ana@fagi.test'), leo: await aprobar('leo@fagi.test') };
}

test('events are stored once per seq and read back in order', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const { ana } = await usuarios(app);

  const { body } = await ana.post('/api/sessions');
  const id = body.session.id;
  const lote = [
    { seq: 0, t: 0, type: 'session_start', config: { 'Fagi.speed': 60 }, world: { width: 100, height: 100 } },
    { seq: 1, t: 0, type: 'obj_add', id: 1, what: 'nido', x: 10, y: 20, r: 30 },
    { seq: 2, t: 4.5, type: 'point_add', id: 7, x: 1, y: 2 },
  ];
  // Un evento sin sus campos obligatorios tumba el lote entero.
  const r = await ana.post(`/api/sessions/${id}/events`, { events: lote });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /point_add\.what/);

  lote[2] = { seq: 2, t: 4.5, type: 'point_add', id: 7, what: 'baya', x: 1, y: 2, from: 3 };
  assert.equal((await ana.post(`/api/sessions/${id}/events`, { events: lote })).body.inserted, 3);
  // Reintento del mismo lote: no duplica.
  assert.equal((await ana.post(`/api/sessions/${id}/events`, { events: lote })).body.inserted, 0);

  const leidos = (await ana.get(`/api/sessions/${id}/events`)).body.events;
  assert.deepEqual(leidos.map((e) => e.seq), [0, 1, 2]);
  assert.deepEqual(leidos[1], lote[1]);
  assert.deepEqual(leidos[2], lote[2]);
  assert.equal((await ana.get(`/api/sessions/${id}/events?from=1`)).body.events.length, 1);

  const fin = await ana.post(`/api/sessions/${id}/end`, { reason: 'death', age: 4.5, summary: { cause: 'hunger' } });
  assert.equal(fin.body.session.endReason, 'death');
  const lista = (await ana.get('/api/sessions')).body.sessions;
  assert.equal(lista.length, 1);
  assert.equal(lista[0].events, 3);
  assert.equal(lista[0].duration, 4.5);
});

test('sessions are private to their owner, visible to admin', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const { admin, ana, leo } = await usuarios(app);
  const id = (await ana.post('/api/sessions')).body.session.id;

  assert.equal((await leo.get(`/api/sessions/${id}`)).status, 404);
  assert.equal((await leo.get(`/api/sessions/${id}/events`)).status, 404);
  assert.equal((await leo.del(`/api/sessions/${id}`)).status, 404);
  assert.equal((await leo.get('/api/sessions')).body.sessions.length, 0);

  assert.equal((await admin.get(`/api/sessions/${id}`)).status, 200);
  assert.equal((await admin.get('/api/sessions?all=1')).body.sessions.length, 1);
  // El admin puede mirar, pero no escribir en la sesión de otro.
  assert.equal((await admin.post(`/api/sessions/${id}/events`, { events: [] })).status, 403);

  assert.equal((await ana.del(`/api/sessions/${id}`)).status, 200);
  assert.equal((await ana.get(`/api/sessions/${id}`)).status, 404);
});

test('an exported session imports as a new session', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const { ana, leo } = await usuarios(app);
  const events = [
    { seq: 0, t: 0, type: 'session_start', config: {}, world: { width: 100, height: 100 } },
    { seq: 1, t: 2, type: 'fagi_death', cause: 'thirst' },
  ];
  const r = await leo.post('/api/sessions/import', { session: { id: 'x', endReason: 'death', ageFinal: 2 }, events });
  assert.equal(r.status, 201);
  const copia = (await leo.get(`/api/sessions/${r.body.session.id}/events`)).body.events;
  assert.deepEqual(copia, events);
  assert.equal((await ana.get('/api/sessions')).body.sessions.length, 0);
});
