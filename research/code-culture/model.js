// The language model behind the variation operator: a local Ollama model,
// fixed by name and weights' digest, called with a fixed temperature and seed
// and always through the archive (archive.js).
//
// CODE_OFFLINE=1: a key not in the archive is an error, never a call.

import { keyOf, openArchive } from './archive.js';

export const OLLAMA = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const TIMEOUT_MS = 300_000;

const digests = new Map();
export async function digestOf(model) {
  if (digests.has(model)) return digests.get(model);
  const res = await fetch(`${OLLAMA}/api/tags`);
  const tags = await res.json();
  const m = tags.models.find((x) => x.name === model || x.name === `${model}:latest`);
  if (!m) throw new Error(`model ${model} not in Ollama`);
  digests.set(model, m.digest);
  return m.digest;
}

// Ask the model (or the archive). Returns { reply, ms, cached }.
export async function ask({ model, digest, messages, temperature = 0.7, seed = 0, archive = openArchive(), think = false, numPredict = 2048 }) {
  digest ??= await digestOf(model);
  const options = { temperature, seed };
  const key = keyOf({ model, digest, messages, options });
  const hit = archive.get(key);
  if (hit) return { reply: hit.reply, ms: hit.ms, cached: true, key };
  if (process.env.CODE_OFFLINE === '1') throw new Error(`archive miss with CODE_OFFLINE=1: ${key}`);
  // A call that hangs (it happened once: 85 min) is abandoned and asked again;
  // the seed is the same, so the answer does not depend on the retry.
  let res, t0;
  for (let attempt = 1; ; attempt++) {
    t0 = Date.now();
    try {
      res = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false, think, options: { ...options, num_predict: numPredict } }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
    }
  }
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const reply = data.message?.content ?? '';
  const ms = Date.now() - t0;
  archive.put({ key, model, digest, options, messages, reply, ms, at: new Date().toISOString() });
  return { reply, ms, cached: false, key };
}
