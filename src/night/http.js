// A real night mind: POSTs the night input to `<url>/night` and expects
// `{ proposals: [...] }` back, within NIGHTAI.timeout seconds. `fetch` can be
// injected (the tests do not touch the network). Down, slow or answering
// garbage: the night passes with nothing proposed.

import { NIGHTAI } from '../config.js';

export function createHttpNight({ url, fetch = globalThis.fetch }) {
  return {
    name: 'http',
    async propose(input) {
      const controller = new AbortController();
      const limit = setTimeout(() => controller.abort(), NIGHTAI.timeout * 1000);
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/night`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      } finally {
        clearTimeout(limit);
      }
    },
  };
}
