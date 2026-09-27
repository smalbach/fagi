import test from 'node:test';
import assert from 'node:assert/strict';
import { SKIP, mount, client } from './helpers/server.js';

async function users(app) {
  const admin = client(app);
  await admin.post('/api/auth/register', { email: 'admin@fagi.test', password: 'clave-de-admin-123' });
  const approveUser = async (email) => {
    const c = client(app);
    const r = await c.post('/api/auth/register', { email, password: 'una-clave-long' });
    await admin.post(`/api/admin/users/${r.body.user.id}/approve`);
    return c;
  };
  return { admin, ana: await approveUser('ana@fagi.test'), leo: await approveUser('leo@fagi.test') };
}

test('events are stored once per seq and read back in order', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);
  const { ana } = await users(app);

  const { body } = await ana.post('/api/sessions');
  const id = body.session.id;
  const batch = [
    { seq: 0, t: 0, type: 'session_start', config: { 'Fagi.speed': 60 }, world: { width: 100, height: 100 } },
    { seq: 1, t: 0, type: 'obj_add', id: 1, what: 'nest', x: 10, y: 20, r: 30 },
    { seq: 2, t: 4.5, type: 'point_add', id: 7, x: 1, y: 2 },
  ];
  // Un evento sin sus campos obligatorios tumba el lote entero.
  const r = await ana.post(`/api/sessions/${id}/events`, { events: batch });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /point_add\.what/);

  batch[2] = { seq: 2, t: 4.5, type: 'point_add', id: 7, what: 'baya', x: 1, y: 2, from: 3 };
  assert.equal((await ana.post(`/api/sessions/${id}/events`, { events: batch })).body.inserted, 3);
  // Reintento del mismo lote: no duplica.
  assert.equal((await ana.post(`/api/sessions/${id}/events`, { events: batch })).body.inserted, 0);

  const readList = (await ana.get(`/api/sessions/${id}/events`)).body.events;
  assert.deepEqual(readList.map((e) => e.seq), [0, 1, 2]);
  assert.deepEqual(readList[1], batch[1]);
  assert.deepEqual(readList[2], batch[2]);
  assert.equal((await ana.get(`/api/sessions/${id}/events?from=1`)).body.events.length, 1);

  const end = await ana.post(`/api/sessions/${id}/end`, { reason: 'death', age: 4.5, summary: { cause: 'hunger' } });
  assert.equal(end.body.session.endReason, 'death');
  const list = (await ana.get('/api/sessions')).body.sessions;
  assert.equal(list.length, 1);
  assert.equal(list[0].events, 3);
  assert.equal(list[0].duration, 4.5);
});

test('sessions are private to their owner, visible to admin', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);
  const { admin, ana, leo } = await users(app);
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
  const { app, close } = await mount();
  t.after(close);
  const { ana, leo } = await users(app);
  const events = [
    { seq: 0, t: 0, type: 'session_start', config: {}, world: { width: 100, height: 100 } },
    { seq: 1, t: 2, type: 'fagi_death', cause: 'thirst' },
  ];
  const r = await leo.post('/api/sessions/import', { session: { id: 'x', endReason: 'death', ageFinal: 2 }, events });
  assert.equal(r.status, 201);
  const copy = (await leo.get(`/api/sessions/${r.body.session.id}/events`)).body.events;
  assert.deepEqual(copy, events);
  assert.equal((await ana.get('/api/sessions')).body.sessions.length, 0);
});
