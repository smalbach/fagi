// Sesiones grabadas: crear, añadir lotes de eventos, cerrar, listar, leer,
// importar y borrar. Cada usuario ve solo las suyas; un admin, todas.

import { requireApproved } from '../guards.js';
import { invalidEvent, EVENT_VERSION } from '../../src/recorder/events.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LOTE = 5000;

function fila(s) {
  return {
    id: s.id, userId: s.user_id, email: s.email, startedAt: s.started_at, endedAt: s.ended_at,
    version: s.version, endReason: s.end_reason, duration: s.duration, ageFinal: s.age_final,
    summary: s.summary, events: s.events,
  };
}

// Inserta un lote en una sola consulta. Repetir un lote (reintento tras un
// fallo de red) no duplica nada: la clave es (session_id, seq).
async function insertarEventos(db, sessionId, eventos) {
  if (!eventos.length) return 0;
  const seq = [], t = [], type = [], objId = [], x = [], y = [], data = [];
  for (const ev of eventos) {
    const { seq: s, t: tt, type: ty, ...resto } = ev;
    seq.push(s); t.push(tt); type.push(ty);
    objId.push(Number.isInteger(resto.id) ? resto.id : null);
    x.push(typeof resto.x === 'number' ? resto.x : null);
    y.push(typeof resto.y === 'number' ? resto.y : null);
    data.push(JSON.stringify(resto));
  }
  const { rowCount } = await db.query(
    `INSERT INTO session_events (session_id, seq, t, type, obj_id, x, y, data)
     SELECT $1, * FROM unnest($2::int[], $3::float8[], $4::text[], $5::int[], $6::float8[], $7::float8[], $8::jsonb[])
     ON CONFLICT (session_id, seq) DO NOTHING`,
    [sessionId, seq, t, type, objId, x, y, data],
  );
  await db.query(
    'UPDATE sessions SET duration = GREATEST(duration, $2) WHERE id = $1',
    [sessionId, Math.max(...t)],
  );
  return rowCount;
}

function validarLote(eventos) {
  if (!Array.isArray(eventos)) return 'events_not_array';
  if (eventos.length > MAX_LOTE) return 'too_many_events';
  for (const ev of eventos) {
    const motivo = invalidEvent(ev);
    if (motivo) return `invalid_event:${motivo}`;
  }
  return null;
}

export default async function sessionRoutes(app) {
  app.addHook('preHandler', requireApproved);

  // La sesión, si existe y quien pregunta puede verla.
  async function propia(req, reply) {
    if (!UUID.test(req.params.id)) { reply.code(404).send({ error: 'not_found' }); return null; }
    const { rows } = await app.db.query('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
    const s = rows[0];
    if (!s || (s.user_id !== req.user.id && req.user.role !== 'admin')) {
      reply.code(404).send({ error: 'not_found' });
      return null;
    }
    return s;
  }

  app.post('/', async (req, reply) => {
    const { rows } = await app.db.query(
      'INSERT INTO sessions (user_id, version) VALUES ($1, $2) RETURNING *',
      [req.user.id, EVENT_VERSION],
    );
    return reply.code(201).send({ session: fila(rows[0]) });
  });

  app.get('/', async (req) => {
    const todas = req.query?.all === '1' && req.user.role === 'admin';
    const { rows } = await app.db.query(
      `SELECT s.*, u.email, (SELECT count(*)::int FROM session_events e WHERE e.session_id = s.id) AS events
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE $1 OR s.user_id = $2
        ORDER BY s.started_at DESC LIMIT 200`,
      [todas, req.user.id],
    );
    return { sessions: rows.map(fila) };
  });

  app.get('/:id', async (req, reply) => {
    const s = await propia(req, reply);
    if (!s) return reply;
    return { session: fila(s) };
  });

  app.post('/:id/events', async (req, reply) => {
    const s = await propia(req, reply);
    if (!s) return reply;
    if (s.user_id !== req.user.id) return reply.code(403).send({ error: 'forbidden' });
    const eventos = req.body?.events;
    const motivo = validarLote(eventos);
    if (motivo) return reply.code(400).send({ error: motivo });
    const nuevos = await insertarEventos(app.db, s.id, eventos);
    return { inserted: nuevos };
  });

  app.post('/:id/end', async (req, reply) => {
    const s = await propia(req, reply);
    if (!s) return reply;
    if (s.user_id !== req.user.id) return reply.code(403).send({ error: 'forbidden' });
    const { reason, age, summary } = req.body ?? {};
    const { rows } = await app.db.query(
      `UPDATE sessions SET ended_at = COALESCE(ended_at, now()), end_reason = $2,
              age_final = $3, summary = $4::jsonb
        WHERE id = $1 RETURNING *`,
      [s.id, String(reason ?? 'end').slice(0, 40), Number.isFinite(age) ? age : null, JSON.stringify(summary ?? {})],
    );
    return { session: fila(rows[0]) };
  });

  app.get('/:id/events', async (req, reply) => {
    const s = await propia(req, reply);
    if (!s) return reply;
    const desde = Number(req.query?.from);
    const hasta = Number(req.query?.to);
    const { rows } = await app.db.query(
      `SELECT seq, t, type, data FROM session_events
        WHERE session_id = $1 AND ($2::float8 IS NULL OR t >= $2) AND ($3::float8 IS NULL OR t <= $3)
        ORDER BY seq`,
      [s.id, Number.isFinite(desde) ? desde : null, Number.isFinite(hasta) ? hasta : null],
    );
    return { events: rows.map((r) => ({ ...r.data, seq: r.seq, t: r.t, type: r.type })) };
  });

  // Una sesión exportada (.json) entra como sesión nueva del que la importa.
  app.post('/import', { bodyLimit: 30 * 1024 * 1024 }, async (req, reply) => {
    const eventos = req.body?.events;
    if (!Array.isArray(eventos) || !eventos.length) return reply.code(400).send({ error: 'no_events' });
    for (const ev of eventos) {
      const motivo = invalidEvent(ev);
      if (motivo) return reply.code(400).send({ error: `invalid_event:${motivo}` });
    }
    const origen = req.body?.session ?? {};
    const client = await app.db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO sessions (user_id, version, ended_at, end_reason, age_final, summary)
         VALUES ($1, $2, now(), $3, $4, $5::jsonb) RETURNING *`,
        [req.user.id, EVENT_VERSION, String(origen.endReason ?? 'imported').slice(0, 40),
          Number.isFinite(origen.ageFinal) ? origen.ageFinal : null,
          JSON.stringify({ ...(origen.summary ?? {}), importedFrom: typeof origen.id === 'string' ? origen.id : null })],
      );
      for (let i = 0; i < eventos.length; i += MAX_LOTE) {
        await insertarEventos(client, rows[0].id, eventos.slice(i, i + MAX_LOTE));
      }
      await client.query('COMMIT');
      return reply.code(201).send({ session: fila(rows[0]) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete('/:id', async (req, reply) => {
    const s = await propia(req, reply);
    if (!s) return reply;
    await app.db.query('DELETE FROM sessions WHERE id = $1', [s.id]);
    return { ok: true };
  });
}
