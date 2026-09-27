// Arranque del servidor: aplica migraciones pendientes, sirve dist/ (el juego
// ya construido) y la API bajo /api. Mismo origen para las dos cosas, así la
// cookie de login funciona sin CORS.
//
//   DATABASE_URL=postgres://... ADMIN_EMAIL=tu@correo npm start

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPool, migrate } from './db.js';
import { buildApp } from './app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT ?? 8787);

const pool = createPool();
const applied = await migrate(pool);
if (applied.length) console.log(`Migraciones aplicadas: ${applied.join(', ')}`);

const app = await buildApp({ pool, staticDir: path.join(root, 'dist'), logger: true });
await app.listen({ host: '0.0.0.0', port });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await app.close(); await pool.end(); process.exit(0); });
}
