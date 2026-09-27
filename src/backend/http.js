// A real backend: sends the observation over HTTP and waits for an intention
// back, with a strict time limit. `fetch` can be injected (the tests don't
// touch the network); by default it uses the environment's global.

import { BACKEND } from '../config.js';

export function createHttpBackend({ url, fetch = globalThis.fetch }) {
  return {
    name: 'http',
    async decide(observation) {
      const controller = new AbortController();
      const limitOf = setTimeout(() => controller.abort(), BACKEND.timeout * 1000);
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(observation),
          signal: controller.signal,
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;   // down, slow or answering garbage: instinct decides
      } finally {
        clearTimeout(limitOf);
      }
    },
  };
}
