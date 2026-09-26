// Un backend de verdad: manda la observación por HTTP y espera una intención
// de vuelta, con un límite de tiempo estricto. `fetch` se puede inyectar (los
// tests no tocan la red); por defecto usa el global del entorno.

import { BACKEND } from '../config.js';

export function createHttpBackend({ url, fetch = globalThis.fetch }) {
  return {
    name: 'http',
    async decide(observation) {
      const controller = new AbortController();
      const limite = setTimeout(() => controller.abort(), BACKEND.timeout * 1000);
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
        return null;   // se cae, tarda o contesta basura: decide el instinto
      } finally {
        clearTimeout(limite);
      }
    },
  };
}
