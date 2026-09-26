// Monta el servidor contra una base de datos de pruebas limpia. Sin
// DATABASE_URL_TEST los tests de servidor se saltan: no hay Postgres que
// levantar a mano en cada máquina.

import { createPool, migrate } from '../../server/db.js';
import { buildApp } from '../../server/app.js';

export const DB_URL = process.env.DATABASE_URL_TEST;
export const SKIP = DB_URL ? false : 'sin DATABASE_URL_TEST';

export async function montar() {
  const pool = createPool(DB_URL);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(pool);
  const app = await buildApp({ pool, adminEmail: 'admin@fagi.test', rateLimitMax: 1000 });
  return { app, pool, async cerrar() { await app.close(); await pool.end(); } };
}

// Un cliente con su propia cookie, como un navegador.
export function cliente(app) {
  let cookie = '';
  async function pedir(method, url, body) {
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
    get: (url) => pedir('GET', url),
    post: (url, body = {}) => pedir('POST', url, body),
    del: (url) => pedir('DELETE', url),
  };
}
