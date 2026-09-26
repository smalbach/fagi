// Registro, login, logout y "quién soy". Registrarse deja la cuenta en lista
// de espera; solo el email de ADMIN_EMAIL nace aprobado y como admin.

import {
  COOKIE, SESSION_DAYS, MIN_PASSWORD,
  hashPassword, verifyPassword, dummyVerify, newToken, hashToken, validEmail, publicUser,
} from '../auth.js';
import { requireUser } from '../guards.js';

export default async function authRoutes(app) {
  const limite = { rateLimit: { max: app.opts.rateLimitMax, timeWindow: '1 minute' } };

  async function abrirSesion(req, reply, user) {
    const token = newToken();
    await app.db.query(
      `INSERT INTO auth_sessions (token_hash, user_id, expires_at, user_agent)
       VALUES ($1, $2, now() + make_interval(days => $3), $4)`,
      [hashToken(token), user.id, SESSION_DAYS, String(req.headers['user-agent'] ?? '').slice(0, 300)],
    );
    reply.setCookie(COOKIE, token, {
      path: '/', httpOnly: true, sameSite: 'lax', secure: app.opts.secure, maxAge: SESSION_DAYS * 86400,
    });
  }

  app.post('/register', { config: limite }, async (req, reply) => {
    const { email, password, name } = req.body ?? {};
    const correo = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!validEmail(correo)) return reply.code(400).send({ error: 'invalid_email' });
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 200) {
      return reply.code(400).send({ error: 'weak_password', min: MIN_PASSWORD });
    }
    const nombre = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    const esAdmin = app.opts.adminEmail && correo === app.opts.adminEmail;

    const hash = await hashPassword(password);
    const { rows } = await app.db.query(
      `INSERT INTO users (email, password_hash, name, status, role, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING RETURNING *`,
      [correo, hash, nombre, esAdmin ? 'approved' : 'pending', esAdmin ? 'admin' : 'user', esAdmin ? new Date() : null],
    );
    if (!rows[0]) return reply.code(409).send({ error: 'email_taken' });
    await abrirSesion(req, reply, rows[0]);
    return reply.code(201).send({ user: publicUser(rows[0]) });
  });

  app.post('/login', { config: limite }, async (req, reply) => {
    const { email, password } = req.body ?? {};
    const correo = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const pass = typeof password === 'string' ? password : '';
    const { rows } = await app.db.query('SELECT * FROM users WHERE email = $1', [correo]);
    const user = rows[0];
    const ok = user ? await verifyPassword(pass, user.password_hash) : await dummyVerify(pass);
    // Mismo mensaje para email desconocido y contraseña mala.
    if (!ok) return reply.code(401).send({ error: 'bad_credentials' });
    if (user.status === 'disabled') return reply.code(403).send({ error: 'disabled' });
    await abrirSesion(req, reply, user);
    return { user: publicUser(user) };
  });

  app.post('/logout', async (req, reply) => {
    const token = req.cookies?.[COOKIE];
    if (token) await app.db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)]);
    reply.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/me', { preHandler: requireUser }, async (req) => ({ user: publicUser(req.user) }));
}
