// The archive of model calls (docs/research/plan-codigo-cultural.md, step 2):
// every call to the language model is kept under the hash of what decides its
// answer (model and its weights' digest, messages, temperature, seed). Asking
// again reads the archive; the model is only called for keys never seen. So a
// campaign repeats byte for byte with the model off, and anyone can check it.
//
// One JSON line per call, appended: { key, model, digest, options, messages, reply, ms, at }.

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const ARCHIVE = 'research/results/code-culture/archive.jsonl';

export const keyOf = ({ model, digest, messages, options }) =>
  createHash('sha256').update(JSON.stringify([model, digest, messages, options.temperature, options.seed])).digest('hex');

export function openArchive(file = ARCHIVE) {
  const rows = new Map();
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) if (line) { const r = JSON.parse(line); rows.set(r.key, r); }
  }
  return {
    file,
    get: (key) => rows.get(key) ?? null,
    put(row) {
      mkdirSync(dirname(file), { recursive: true });
      appendFileSync(file, `${JSON.stringify(row)}\n`);
      rows.set(row.key, row);
    },
    size: () => rows.size,
  };
}
