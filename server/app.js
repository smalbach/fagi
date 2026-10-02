// The Fastify application, not listening on any port: index.js starts it and
// the tests use it through app.inject(), against a test database.

import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync, readFileSync } from 'node:fs';
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

  // Anti-CSRF: every request that changes something must carry a custom
  // header. A form or an <img> on another site cannot set it, and a cross-origin
  // fetch with it needs a CORS preflight that nobody approves here.
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers['x-fagi'] !== '1') {
      return reply.code(403).send({ error: 'csrf' });
    }
  });

  // Who the user is: resolved once per request from the cookie.
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

  // Which version the server runs, to check what is in production.
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const commit = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const startedAt = new Date().toISOString();
  app.get('/api/version', async () => ({ version, commit, startedAt }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(sessionRoutes, { prefix: '/api/sessions' });

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || !staticDir) return reply.code(404).send({ error: 'not_found' });
    // The research site is its own page (dist/investigacion/index.html).
    if (req.url.split('?')[0] === '/investigacion') return reply.redirect('/investigacion/', 301);
    // Anything that is neither API nor a file is the app: the front end picks the screen.
    return reply.sendFile('index.html');
  });

  if (staticDir && existsSync(staticDir)) {
    await app.register(fastifyStatic, { root: staticDir, wildcard: false });
  }

  return app;
}
