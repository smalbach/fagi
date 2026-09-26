// Guardas para las rutas. Devuelven la respuesta de error o nada si pasa.
export async function requireUser(req, reply) {
  if (!req.user) return reply.code(401).send({ error: 'unauthenticated' });
}

export async function requireApproved(req, reply) {
  if (!req.user) return reply.code(401).send({ error: 'unauthenticated' });
  if (req.user.status !== 'approved') return reply.code(403).send({ error: 'not_approved', status: req.user.status });
}

export async function requireAdmin(req, reply) {
  if (!req.user) return reply.code(401).send({ error: 'unauthenticated' });
  if (req.user.role !== 'admin' || req.user.status !== 'approved') return reply.code(403).send({ error: 'forbidden' });
}
