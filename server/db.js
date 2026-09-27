// Postgres: un pool y las migraciones. Las migraciones son los .sql de
// migrations/ en orden alfabético; cada una se aplica una sola vez y queda
// apuntada en schema_migrations.
//
//   node server/db.js migrate

import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export function createPool(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Falta DATABASE_URL');
  // Railway (y casi cualquier Postgres gestionado) pide SSL fuera de su red.
  const ssl = /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
  return new pg.Pool({ connectionString: url, ssl, max: 10 });
}

export async function migrate(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const applied = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migración ${file} falló: ${err.message}`);
    } finally {
      client.release();
    }
  }
  return applied;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === 'migrate') {
  const pool = createPool();
  migrate(pool)
    .then((applied) => console.log(applied.length ? `Aplicadas: ${applied.join(', ')}` : 'Nada que migrar'))
    .catch((err) => { console.error(err.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
