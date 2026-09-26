// Arranque del servidor: aplica migraciones pendientes, sirve dist/ (el juego
// ya construido) y la API bajo /api. Mismo origen para las dos cosas, así la
// cookie de login funciona sin CORS.
//
//   DATABASE_URL=postgres://... ADMIN_EMAIL=tu@correo npm start

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPool, migrate } from './db.js';
import { buildApp } from './app.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT ?? 8787);

const pool = createPool();
const aplicadas = await migrate(pool);
if (aplicadas.length) console.log(`Migraciones aplicadas: ${aplicadas.join(', ')}`);

const app = await buildApp({ pool, staticDir: path.join(raiz, 'dist'), logger: true });
await app.listen({ host: '0.0.0.0', port });

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.once(senal, async () => { await app.close(); await pool.end(); process.exit(0); });
}
