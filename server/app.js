// La aplicación Fastify, sin escuchar en ningún puerto: index.js la arranca y
// los tests la usan con app.inject(), contra una base de datos de pruebas.

import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { COOKIE, hashToken } from './auth.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import sessionRoutes from './routes/sessions.js';

export async function buildApp({ pool, adminEmail = process.env.ADMIN_EMAIL, secure = process.env.NODE_ENV === 'production', staticDir, logger = false, rateLimitMax = 10 } = {}) {
  const app = Fastify({ logger, bodyLimit: 1024 * 1024, trustProxy: true });
  app.decorate('db', pool);
  app.decorate('opts', { adminEmail: adminEmail?.toLowerCase() ?? null, secure, rateLimitMax });

  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  // Anti-CSRF: toda petición que cambia algo tiene que llevar una cabecera
  // propia. Un formulario o un <img> de otra web no puede ponerla, y un fetch
  // de otro origen con ella necesita un preflight CORS que aquí nadie aprueba.
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers['x-fagi'] !== '1') {
      return reply.code(403).send({ error: 'csrf' });
    }
  });

  // Quién es: se resuelve una vez por petición a partir de la cookie.
  app.decorateRequest('user', null);
  app.addHook('preHandler', async (req) => {
    const token = req.cookies?.[COOKIE];
    if (!token) return;
    const { rows } = await pool.query(
      `SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
    req.user = rows[0] ?? null;
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(sessionRoutes, { prefix: '/api/sessions' });

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || !staticDir) return reply.code(404).send({ error: 'not_found' });
    // Todo lo que no es API ni archivo es la app: la pantalla la decide el front.
    return reply.sendFile('index.html');
  });

  if (staticDir && existsSync(staticDir)) {
    await app.register(fastifyStatic, { root: staticDir, wildcard: false });
  }

  return app;
}
