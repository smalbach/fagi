import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKIP, montar, cliente } from './helpers/server.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('server tells which version is running', { skip: SKIP }, async (t) => {
  const { app, cerrar } = await montar();
  t.after(cerrar);
  const r = await cliente(app).get('/api/version');
  assert.equal(r.status, 200);
  assert.equal(r.body.version, version);
  assert.ok(r.body.startedAt);
});
