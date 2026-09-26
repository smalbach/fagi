// Servidor mínimo que cumple el contrato de docs/decision-api.md, sin
// dependencias: node server/decision-api.example.js, y en el panel de Fagi
// se elige "API HTTP" con http://localhost:8787.
//
// Por dentro usa el mismo emulador local que trae el juego (src/backend/local.js),
// así que decide igual que "Emulador local" — la diferencia es que esto SÍ
// cruza la red, y es el punto de partida real para poner un LLM en su lugar:
// solo hay que cambiar qué hace handleDecide() con la observación.

import { createServer } from 'node:http';
import { createLocalBackend } from '../src/backend/local.js';

const PUERTO = Number(process.env.PORT ?? 8787);
const backend = createLocalBackend();

async function leerCuerpo(req) {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  return JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}');
}

const server = createServer(async (req, res) => {
  // CORS abierto: es un servidor de prueba en localhost, no de producción.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/decide') {
    try {
      const observation = await leerCuerpo(req);
      // AQUÍ es donde iría el LLM: pasarle `observation` en el prompt y
      // devolver { action, targetId?, ttl?, reason? } a partir de su respuesta.
      const intention = await backend.decide(observation);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(intention ?? {}));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e?.message ?? e) }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PUERTO, () => {
  console.log(`Decision API de ejemplo escuchando en http://localhost:${PUERTO} (POST /decide)`);
});
