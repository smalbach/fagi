// Minimal server that fulfils the contract in docs/decision-api.md, with no
// dependencies: node server/decision-api.example.js, and in Fagi's panel
// pick "HTTP API" with http://localhost:8787.
//
// Inside it uses the same local emulator the game ships with (src/backend/local.js),
// so it decides just like "Local emulator" — the difference is that this DOES
// cross the network, and it is the real starting point for putting an LLM in its place:
// you only need to change what the request handler does with the observation.

import { createServer } from 'node:http';
import { createLocalBackend } from '../src/backend/local.js';

const PORT = Number(process.env.PORT ?? 8787);
const backend = createLocalBackend();

async function readBody(req) {
  const chunks = [];
  for await (const t of req) chunks.push(t);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = createServer(async (req, res) => {
  // Open CORS: this is a test server on localhost, not a production one.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/decide') {
    try {
      const observation = await readBody(req);
      // THIS is where the LLM would go: pass it `observation` in the prompt and
      // return { action, targetId?, ttl?, reason? } based on its answer.
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

server.listen(PORT, () => {
  console.log(`Example Decision API listening on http://localhost:${PORT} (POST /decide)`);
});
