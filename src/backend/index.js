// The decision API contract: whoever implements it only has to honor
// this. `decide(observation, {signal})` receives the JSON from
// observation.js and returns an intention, or null if it would rather let
// instinct decide. It can never take forever: `signal` is the AbortSignal for
// the time limit.
//
//   Intention = { action, targetId?, ttl?, reason? }
//
// `action` must be one that decide.js already understands (act() in
// fagi.js knows how to execute exactly these). `targetId` must be the id of
// one of the candidates it was sent: naming something that wasn't in the
// observation doesn't count. `ttl` is how many seconds the directive stays
// valid if no other one arrives first.

import { BACKEND } from '../config.js';
import { createLocalBackend } from './local.js';
import { createHttpBackend } from './http.js';

export const VALID_ACTIONS = new Set([
  'seekFood', 'seekWater', 'track', 'explore', 'toNest', 'pantry', 'rest', 'carry',
]);

// Validates and clamps what the API returned against the observation it was
// sent. Anything odd returns null: better no directive than one that
// points at a ghost.
export function validateIntention(intention, observation) {
  if (!intention || typeof intention !== 'object') return null;
  if (!VALID_ACTIONS.has(intention.action)) return null;

  const needsTarget = !['explore', 'rest', 'toNest', 'pantry'].includes(intention.action);
  if (needsTarget) {
    const exists = observation.candidates.some((c) => c.id === intention.targetId);
    if (!exists) return null;
  }

  const ttl = Number.isFinite(intention.ttl) ? intention.ttl : BACKEND.ttl;
  return {
    action: intention.action,
    targetId: intention.targetId ?? null,
    ttl: Math.min(BACKEND.maxTtl, Math.max(1, ttl)),
    reason: intention.reason ?? null,
  };
}

// 'none' -> nobody decides, instinct runs everything. 'local' -> the emulator
// below. 'http' -> a real server, same contract.
export function createBackend(kind, { url, fetch } = {}) {
  if (kind === 'local') return createLocalBackend();
  if (kind === 'http' && url) return createHttpBackend({ url, fetch });
  return null;
}
