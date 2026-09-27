// Server startup: applies pending migrations, serves dist/ (the already built
// game) and the API under /api. Same origin for both, so the login cookie
// works without CORS.
//
//   DATABASE_URL=postgres://... ADMIN_EMAIL=you@example.com npm start

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPool, migrate } from './db.js';
import { buildApp } from './app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT ?? 8787);

const pool = createPool();
const applied = await migrate(pool);
if (applied.length) console.log(`Migrations applied: ${applied.join(', ')}`);

const app = await buildApp({ pool, staticDir: path.join(root, 'dist'), logger: true });
await app.listen({ host: '0.0.0.0', port });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await app.close(); await pool.end(); process.exit(0); });
}
