// El contrato de la API de decisión: quien la implemente solo tiene que
// cumplir esto. `decide(observation, {signal})` recibe el JSON de
// observation.js y devuelve una intención, o null si prefiere que decida el
// instinto. Nunca puede tardar para siempre: `signal` es el AbortSignal del
// límite de tiempo.
//
//   Intention = { action, targetId?, ttl?, reason? }
//
// `action` tiene que ser una de las que ya entiende decide.js (act() en
// fagi.js sabe ejecutar exactamente estas). `targetId` tiene que ser el id de
// alguno de los candidatos que se le mandaron: nombrar algo que no estaba en
// la observación no vale. `ttl` son los segundos que la directiva sigue
// valiendo si no llega otra antes.

import { BACKEND } from '../config.js';
import { createLocalBackend } from './local.js';
import { createHttpBackend } from './http.js';

export const ACCIONES_VALIDAS = new Set([
  'seekFood', 'seekWater', 'track', 'explore', 'toNest', 'pantry', 'rest', 'carry',
]);

// Valida y recorta lo que devolvió la API contra la observación que se le
// mandó. Cualquier cosa rara devuelve null: mejor sin directiva que con una
// que apunte a un fantasma.
export function validateIntention(intention, observation) {
  if (!intention || typeof intention !== 'object') return null;
  if (!ACCIONES_VALIDAS.has(intention.action)) return null;

  const necesitaObjetivo = !['explore', 'rest', 'toNest', 'pantry'].includes(intention.action);
  if (necesitaObjetivo) {
    const existe = observation.candidates.some((c) => c.id === intention.targetId);
    if (!existe) return null;
  }

  const ttl = Number.isFinite(intention.ttl) ? intention.ttl : BACKEND.ttl;
  return {
    action: intention.action,
    targetId: intention.targetId ?? null,
    ttl: Math.min(BACKEND.maxTtl, Math.max(1, ttl)),
    reason: intention.reason ?? null,
  };
}

// 'none' -> nadie decide, manda el instinto entero. 'local' -> el emulador de
// abajo. 'http' -> un servidor de verdad, mismo contrato.
export function createBackend(kind, { url, fetch } = {}) {
  if (kind === 'local') return createLocalBackend();
  if (kind === 'http' && url) return createHttpBackend({ url, fetch });
  return null;
}
