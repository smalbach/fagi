// Sign-up, login, logout, "who am I" and "forgot password". Signing up puts
// the account on the waitlist; only the ADMIN_EMAIL address starts out
// approved and as admin.

import {
  COOKIE, SESSION_DAYS, MIN_PASSWORD,
  hashPassword, verifyPassword, dummyVerify, newToken, hashToken, validEmail, publicUser,
} from '../auth.js';
import { requireUser } from '../guards.js';
import { resetEmail } from '../emails.js';

const RESET_MINUTES = 60;

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

  // Asks for a reset link by email. The answer is always the same, whether
  // the account exists or not, and the email goes out without waiting for it:
  // neither the response nor its timing reveal which emails are registered.
  app.post('/forgot', { config: limitOf }, async (req, reply) => {
    const { email, lang } = req.body ?? {};
    const emailAddr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!validEmail(emailAddr)) return reply.code(400).send({ error: 'invalid_email' });

    const { rows } = await app.db.query('SELECT id, email, status FROM users WHERE email = $1', [emailAddr]);
    const user = rows[0];
    if (!user || user.status === 'disabled') return { ok: true };

    // Never from the Host header in production: a forged one would put
    // someone else's site in the link.
    const base = app.opts.appUrl ?? (app.opts.secure ? null : `${req.protocol}://${req.host}`);
    if (!base) {
      req.log.error('APP_URL is missing: cannot build the reset link');
      return { ok: true };
    }

    const token = newToken();
    await app.db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await app.db.query(
      `INSERT INTO password_resets (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + make_interval(mins => $3))`,
      [hashToken(token), user.id, RESET_MINUTES],
    );
    // In the fragment, not the query: it never reaches the server's logs.
    const link = `${base}/jugar#reset=${token}`;
    const mail = resetEmail({ link, lang: lang === 'en' ? 'en' : 'es', minutes: RESET_MINUTES });
    Promise.resolve()
      .then(() => app.sendMail({ to: user.email, ...mail }))
      .catch((err) => req.log.error({ err }, 'could not send the reset email'));
    return { ok: true };
  });

  // Sets the new password with the emailed token. The token works once; every
  // open session closes and a new one opens here.
  app.post('/reset', { config: limitOf }, async (req, reply) => {
    const { token, password } = req.body ?? {};
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 200) {
      return reply.code(400).send({ error: 'weak_password', min: MIN_PASSWORD });
    }
    if (typeof token !== 'string' || !token) return reply.code(400).send({ error: 'invalid_token' });

    const { rows: used } = await app.db.query(
      `UPDATE password_resets SET used_at = now()
        WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
        RETURNING user_id`,
      [hashToken(token)],
    );
    if (!used[0]) return reply.code(400).send({ error: 'invalid_token' });

    const hash = await hashPassword(password);
    const { rows } = await app.db.query(
      'UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING *', [used[0].user_id, hash],
    );
    const user = rows[0];
    await app.db.query('DELETE FROM auth_sessions WHERE user_id = $1', [user.id]);
    await app.db.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [user.id]);
    if (user.status === 'disabled') return reply.code(403).send({ error: 'disabled' });
    await openSession(req, reply, user);
    return { user: publicUser(user) };
  });

  app.get('/me', { preHandler: requireUser }, async (req) => ({ user: publicUser(req.user) }));
}
