import test from 'node:test';
import assert from 'node:assert/strict';
import { SKIP, mount, client } from './helpers/server.js';

test('accounts wait for admin approval before using sessions', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);

  const admin = client(app);
  const r0 = await admin.post('/api/auth/register', { email: 'admin@fagi.test', password: 'admin-password-123' });
  assert.equal(r0.status, 201);
  assert.equal(r0.body.user.role, 'admin');
  assert.equal(r0.body.user.status, 'approved');

  // Signing up leaves the account waiting: it can identify itself but not play.
  const ana = client(app);
  const r1 = await ana.post('/api/auth/register', { email: 'Ana@Fagi.test', password: 'a-long-password', name: 'Ana' });
  assert.equal(r1.status, 201);
  assert.equal(r1.body.user.status, 'pending');
  assert.equal(r1.body.user.email, 'ana@fagi.test');
  assert.equal((await ana.get('/api/auth/me')).body.user.status, 'pending');
  assert.equal((await ana.get('/api/sessions')).status, 403);
  assert.equal((await ana.get('/api/admin/users')).status, 403);

  // The admin sees her on the waitlist and approves her.
  const pendingList = await admin.get('/api/admin/users?status=pending');
  assert.deepEqual(pendingList.body.users.map((u) => u.email), ['ana@fagi.test']);
  const ok = await admin.post(`/api/admin/users/${r1.body.user.id}/approve`);
  assert.equal(ok.body.user.status, 'approved');
  assert.equal((await ana.get('/api/sessions')).status, 200);

  // Disabling cuts off open sessions and login.
  await admin.post(`/api/admin/users/${r1.body.user.id}/disable`);
  assert.equal((await ana.get('/api/sessions')).status, 401);
  const r2 = await ana.post('/api/auth/login', { email: 'ana@fagi.test', password: 'a-long-password' });
  assert.equal(r2.status, 403);
});

test('login errors do not reveal which emails exist', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);
  const c = client(app);
  await c.post('/api/auth/register', { email: 'leo@fagi.test', password: 'another-long-password' });
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/auth/me')).status, 401);

  const bad = await c.post('/api/auth/login', { email: 'leo@fagi.test', password: 'not-this-password' });
  const nobody = await c.post('/api/auth/login', { email: 'nobody@fagi.test', password: 'not-this-password' });
  assert.equal(bad.status, 401);
  assert.deepEqual(bad.body, nobody.body);

  const good = await c.post('/api/auth/login', { email: 'LEO@fagi.test', password: 'another-long-password' });
  assert.equal(good.status, 200);
  assert.equal((await c.get('/api/auth/me')).body.user.email, 'leo@fagi.test');
});

test('register validates input and rejects duplicates', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);
  const c = client(app);
  assert.equal((await c.post('/api/auth/register', { email: 'not-an-email', password: 'a-long-password' })).status, 400);
  assert.equal((await c.post('/api/auth/register', { email: 'a@fagi.test', password: 'short' })).status, 400);
  assert.equal((await c.post('/api/auth/register', { email: 'a@fagi.test', password: 'a-long-password' })).status, 201);
  assert.equal((await c.post('/api/auth/register', { email: 'A@fagi.test', password: 'a-long-password' })).status, 409);
});

test('mutations without the app header are rejected', { skip: SKIP }, async (t) => {
  const { app, close } = await mount();
  t.after(close);
  const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'x@fagi.test', password: 'a-long-password' } });
  assert.equal(res.statusCode, 403);
});
