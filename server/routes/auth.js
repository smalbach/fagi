// Sign-up, login, logout and "who am I". Signing up puts the account on the
// waitlist; only the ADMIN_EMAIL address starts out approved and as admin.

import {
  COOKIE, SESSION_DAYS, MIN_PASSWORD,
  hashPassword, verifyPassword, dummyVerify, newToken, hashToken, validEmail, publicUser,
} from '../auth.js';
import { requireUser } from '../guards.js';

export default async function authRoutes(app) {
  const limitOf = { rateLimit: { max: app.opts.rateLimitMax, timeWindow: '1 minute' } };

  async function openSession(req, reply, user) {
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

  app.post('/register', { config: limitOf }, async (req, reply) => {
    const { email, password, name } = req.body ?? {};
    const emailAddr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!validEmail(emailAddr)) return reply.code(400).send({ error: 'invalid_email' });
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 200) {
      return reply.code(400).send({ error: 'weak_password', min: MIN_PASSWORD });
    }
    const nameOf = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    const isAdmin = app.opts.adminEmail && emailAddr === app.opts.adminEmail;

    const hash = await hashPassword(password);
    const { rows } = await app.db.query(
      `INSERT INTO users (email, password_hash, name, status, role, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING RETURNING *`,
      [emailAddr, hash, nameOf, isAdmin ? 'approved' : 'pending', isAdmin ? 'admin' : 'user', isAdmin ? new Date() : null],
    );
    if (!rows[0]) return reply.code(409).send({ error: 'email_taken' });
    await openSession(req, reply, rows[0]);
    return reply.code(201).send({ user: publicUser(rows[0]) });
  });

  app.post('/login', { config: limitOf }, async (req, reply) => {
    const { email, password } = req.body ?? {};
    const emailAddr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const pass = typeof password === 'string' ? password : '';
    const { rows } = await app.db.query('SELECT * FROM users WHERE email = $1', [emailAddr]);
    const user = rows[0];
    const ok = user ? await verifyPassword(pass, user.password_hash) : await dummyVerify(pass);
    // Same message for an unknown email and a wrong password.
    if (!ok) return reply.code(401).send({ error: 'bad_credentials' });
    if (user.status === 'disabled') return reply.code(403).send({ error: 'disabled' });
    await openSession(req, reply, user);
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
