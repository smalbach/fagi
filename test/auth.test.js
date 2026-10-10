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

test('forgot password: emailed one-time link sets a new password', { skip: SKIP }, async (t) => {
  const sent = [];
  const { app, close } = await mount({ appUrl: 'https://fagi.example/', mailer: async (m) => { sent.push(m); } });
  t.after(close);
  const c = client(app);
  await c.post('/api/auth/register', { email: 'mia@fagi.test', password: 'old-long-password' });

  // Same answer for an existing email and an unknown one; only the first gets mail.
  const known = await c.post('/api/auth/forgot', { email: 'MIA@fagi.test', lang: 'en' });
  const unknown = await c.post('/api/auth/forgot', { email: 'nobody@fagi.test' });
  assert.equal(known.status, 200);
  assert.deepEqual(known.body, unknown.body);
  await new Promise((r) => setImmediate(r));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'mia@fagi.test');
  assert.match(sent[0].subject, /Reset/);
  const token = sent[0].text.match(/https:\/\/fagi\.example\/jugar#reset=([\w-]+)/)?.[1];
  assert.ok(token);

  assert.equal((await c.post('/api/auth/reset', { token, password: 'short' })).status, 400);
  assert.equal((await c.post('/api/auth/reset', { token: 'not-a-token', password: 'new-long-password' })).body.error, 'invalid_token');

  // The reset closes the old sessions and opens a new one.
  const other = client(app);
  await other.post('/api/auth/login', { email: 'mia@fagi.test', password: 'old-long-password' });
  const ok = await c.post('/api/auth/reset', { token, password: 'new-long-password' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.email, 'mia@fagi.test');
  assert.equal((await c.get('/api/auth/me')).status, 200);
  assert.equal((await other.get('/api/auth/me')).status, 401);

  // The link works once; the old password no longer does.
  assert.equal((await c.post('/api/auth/reset', { token, password: 'third-long-password' })).status, 400);
  assert.equal((await other.post('/api/auth/login', { email: 'mia@fagi.test', password: 'old-long-password' })).status, 401);
  assert.equal((await other.post('/api/auth/login', { email: 'mia@fagi.test', password: 'new-long-password' })).status, 200);
});

test('forgot password: a newer link replaces the older one', { skip: SKIP }, async (t) => {
  const sent = [];
  const { app, close } = await mount({ appUrl: 'https://fagi.example', mailer: async (m) => { sent.push(m); } });
  t.after(close);
  const c = client(app);
  await c.post('/api/auth/register', { email: 'teo@fagi.test', password: 'old-long-password' });
  await c.post('/api/auth/forgot', { email: 'teo@fagi.test' });
  await c.post('/api/auth/forgot', { email: 'teo@fagi.test' });
  await new Promise((r) => setImmediate(r));
  const [first, second] = sent.map((m) => m.text.match(/#reset=([\w-]+)/)[1]);
  assert.match(sent[0].subject, /Restablece/);
  assert.equal((await c.post('/api/auth/reset', { token: first, password: 'new-long-password' })).status, 400);
  assert.equal((await c.post('/api/auth/reset', { token: second, password: 'new-long-password' })).status, 200);
});
