// Lo que mandó la API de decisión (cortex.js), como una regla más. Según
// BACKEND.authority entra en uno de dos sitios de REGLAS.

import { BACKEND } from '../config.js';
import { reasonOf, pressing, stillInWorld } from './common.js';

// Lo que mandó la API de decisión, mientras siga vigente y su objetivo (si
// tenía uno) siga existiendo. No decide NADA por su cuenta: solo traduce
// fagi.directive a una intención, igual que cualquier otra regla.
function directive(fagi, world, ctx) {
  const d = fagi.directive;
  if (!d) return null;
  if (fagi.age >= d.until) { fagi.directive = null; return null; }
  if (d.target && !stillInWorld(world, d.target)) {
    fagi.directive = null;
    return null;
  }
  const isNestObj = ['toNest', 'pantry', 'carry'].includes(d.action);
  const target = d.target ?? (isNestObj ? ctx.nest : null);
  return {
    action: d.action,
    reason: d.reason ?? reasonOf('reason.api', { backend: d.source }),
    target,
    targetKind: d.target ? d.targetKind : (target ? 'nest' : null),
    trailKey: d.trailKey ?? null,
  };
}

// Con autoridad plena la directiva va la primera de todas, salvo que la vida
// dependa de algo que ella no atiende: entonces se aparta y manda el instinto.
export function earlyDirective(fagi, world, ctx) {
  if (BACKEND.authority !== 1) return null;
  const d = fagi.directive;
  if (d && pressing(ctx) && d.targetKind !== 'food' && d.targetKind !== 'water') return null;
  return directive(fagi, world, ctx);
}

// Con autoridad segura (la de fábrica) el instinto cubre primero lo que mata:
// beber, comer, la urgencia y la despensa. La directiva solo entra después,
// donde hoy entraban descansar/acarrear/perseguir.
export function safeDirective(fagi, world, ctx) {
  return BACKEND.authority === 0 ? directive(fagi, world, ctx) : null;
}
