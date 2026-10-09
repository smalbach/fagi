// Mounts the server against a clean test database. Without
// DATABASE_URL_TEST the server tests are skipped: there is no Postgres to
// bring up by hand on every machine.

import { createPool, migrate } from '../../server/db.js';
import { buildApp } from '../../server/app.js';

export const DB_URL = process.env.DATABASE_URL_TEST;
export const SKIP = DB_URL ? false : 'no DATABASE_URL_TEST';

export async function mount(opts = {}) {
  const pool = createPool(DB_URL);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(pool);
  const app = await buildApp({ pool, adminEmail: 'admin@fagi.test', rateLimitMax: 1000, mailer: async () => {}, ...opts });
  return { app, pool, async close() { await app.close(); await pool.end(); } };
}

// A client with its own cookie, like a browser.
export function client(app) {
  let cookie = '';
  async function request(method, url, body) {
    const res = await app.inject({
      method, url,
      headers: { ...(cookie ? { cookie } : {}), ...(method !== 'GET' ? { 'x-fagi': '1' } : {}) },
      ...(body !== undefined ? { payload: body } : {}),
    });
    const set = res.cookies.find((c) => c.name === 'fagi_sid');
    if (set) cookie = set.value ? `fagi_sid=${set.value}` : '';
    return { status: res.statusCode, body: res.body ? res.json() : null };
  }
  return {
    get: (url) => request('GET', url),
    post: (url, body = {}) => request('POST', url, body),
    del: (url) => request('DELETE', url),
  };
}
