import test from 'node:test';
import assert from 'node:assert/strict';
import { SKIP, montar, cliente } from './helpers/server.js';

test('accounts wait for admin approval before using sessions', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);

  const admin = cliente(app);
  const r0 = await admin.post('/api/auth/register', { email: 'admin@fagi.test', password: 'clave-de-admin-123' });
  assert.equal(r0.status, 201);
  assert.equal(r0.body.user.role, 'admin');
  assert.equal(r0.body.user.status, 'approved');

  // Registrarse deja la cuenta en espera: puede identificarse pero no jugar.
  const ana = cliente(app);
  const r1 = await ana.post('/api/auth/register', { email: 'Ana@Fagi.test', password: 'una-clave-larga', name: 'Ana' });
  assert.equal(r1.status, 201);
  assert.equal(r1.body.user.status, 'pending');
  assert.equal(r1.body.user.email, 'ana@fagi.test');
  assert.equal((await ana.get('/api/auth/me')).body.user.status, 'pending');
  assert.equal((await ana.get('/api/sessions')).status, 403);
  assert.equal((await ana.get('/api/admin/users')).status, 403);

  // El admin la ve en la lista de espera y la aprueba.
  const pendientes = await admin.get('/api/admin/users?status=pending');
  assert.deepEqual(pendientes.body.users.map((u) => u.email), ['ana@fagi.test']);
  const ok = await admin.post(`/api/admin/users/${r1.body.user.id}/approve`);
  assert.equal(ok.body.user.status, 'approved');
  assert.equal((await ana.get('/api/sessions')).status, 200);

  // Desactivar corta las sesiones abiertas y el login.
  await admin.post(`/api/admin/users/${r1.body.user.id}/disable`);
  assert.equal((await ana.get('/api/sessions')).status, 401);
  const r2 = await ana.post('/api/auth/login', { email: 'ana@fagi.test', password: 'una-clave-larga' });
  assert.equal(r2.status, 403);
});

test('login errors do not reveal which emails exist', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const c = cliente(app);
  await c.post('/api/auth/register', { email: 'leo@fagi.test', password: 'otra-clave-larga' });
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/auth/me')).status, 401);

  const mala = await c.post('/api/auth/login', { email: 'leo@fagi.test', password: 'no-es-esta-clave' });
  const nadie = await c.post('/api/auth/login', { email: 'nadie@fagi.test', password: 'no-es-esta-clave' });
  assert.equal(mala.status, 401);
  assert.deepEqual(mala.body, nadie.body);

  const buena = await c.post('/api/auth/login', { email: 'LEO@fagi.test', password: 'otra-clave-larga' });
  assert.equal(buena.status, 200);
  assert.equal((await c.get('/api/auth/me')).body.user.email, 'leo@fagi.test');
});

test('register validates input and rejects duplicates', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const c = cliente(app);
  assert.equal((await c.post('/api/auth/register', { email: 'no-es-email', password: 'una-clave-larga' })).status, 400);
  assert.equal((await c.post('/api/auth/register', { email: 'a@fagi.test', password: 'corta' })).status, 400);
  assert.equal((await c.post('/api/auth/register', { email: 'a@fagi.test', password: 'una-clave-larga' })).status, 201);
  assert.equal((await c.post('/api/auth/register', { email: 'A@fagi.test', password: 'una-clave-larga' })).status, 409);
});

test('mutations without the app header are rejected', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'x@fagi.test', password: 'una-clave-larga' } });
  assert.equal(res.statusCode, 403);
});
