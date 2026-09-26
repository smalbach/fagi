// Panel de admin: ver la lista de espera y aprobar, rechazar o desactivar.

import { requireAdmin } from '../guards.js';
import { publicUser } from '../auth.js';

const ESTADOS = new Set(['pending', 'approved', 'rejected', 'disabled']);
const ACCIONES = { approve: 'approved', reject: 'rejected', disable: 'disabled' };

export default async function adminRoutes(app) {
  app.addHook('preHandler', requireAdmin);

  app.get('/users', async (req) => {
    const estado = ESTADOS.has(req.query?.status) ? req.query.status : null;
    const { rows } = await app.db.query(
      `SELECT u.*, (SELECT count(*)::int FROM sessions s WHERE s.user_id = u.id) AS sessions
         FROM users u
        WHERE $1::text IS NULL OR u.status = $1
        ORDER BY u.created_at DESC LIMIT 500`,
      [estado],
    );
    return { users: rows.map((u) => ({ ...publicUser(u), createdAt: u.created_at, approvedAt: u.approved_at, sessions: u.sessions })) };
  });

  app.post('/users/:id/:accion', async (req, reply) => {
    const nuevo = ACCIONES[req.params.accion];
    if (!nuevo) return reply.code(404).send({ error: 'not_found' });
    if (req.params.id === req.user.id) return reply.code(400).send({ error: 'self' });
    const { rows } = await app.db.query(
      `UPDATE users SET status = $2,
              approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE approved_at END,
              approved_by = CASE WHEN $2 = 'approved' THEN $3::uuid ELSE approved_by END
        WHERE id = $1::uuid RETURNING *`,
      [req.params.id, nuevo, req.user.id],
    ).catch(() => ({ rows: [] }));
    if (!rows[0]) return reply.code(404).send({ error: 'not_found' });
    // Quien deja de estar aprobado pierde las sesiones abiertas.
    if (nuevo !== 'approved') await app.db.query('DELETE FROM auth_sessions WHERE user_id = $1', [rows[0].id]);
    return { user: publicUser(rows[0]) };
  });
}
