// Lo que mandó la API de decisión (cortex.js), como una regla más. Según
// BACKEND.authority entra en uno de dos sitios de REGLAS.

import { BACKEND } from '../config.js';
import { razon, apremia, sigueEnElMundo } from './comun.js';

// Lo que mandó la API de decisión, mientras siga vigente y su objetivo (si
// tenía uno) siga existiendo. No decide NADA por su cuenta: solo traduce
// fagi.directive a una intención, igual que cualquier otra regla.
function directiva(fagi, world, ctx) {
  const d = fagi.directive;
  if (!d) return null;
  if (fagi.age >= d.until) { fagi.directive = null; return null; }
  if (d.target && !sigueEnElMundo(world, d.target)) {
    fagi.directive = null;
    return null;
  }
  const esNido = ['toNest', 'pantry', 'carry'].includes(d.action);
  const target = d.target ?? (esNido ? ctx.nido : null);
  return {
    action: d.action,
    reason: d.reason ?? razon('reason.api', { backend: d.source }),
    target,
    targetKind: d.target ? d.targetKind : (target ? 'nest' : null),
    trailKey: d.trailKey ?? null,
  };
}

// Con autoridad plena la directiva va la primera de todas, salvo que la vida
// dependa de algo que ella no atiende: entonces se aparta y manda el instinto.
export function directivaTemprano(fagi, world, ctx) {
  if (BACKEND.authority !== 1) return null;
  const d = fagi.directive;
  if (d && apremia(ctx) && d.targetKind !== 'food' && d.targetKind !== 'water') return null;
  return directiva(fagi, world, ctx);
}

// Con autoridad segura (la de fábrica) el instinto cubre primero lo que mata:
// beber, comer, la urgencia y la despensa. La directiva solo entra después,
// donde hoy entraban descansar/acarrear/perseguir.
export function directivaSegura(fagi, world, ctx) {
  return BACKEND.authority === 0 ? directiva(fagi, world, ctx) : null;
}
