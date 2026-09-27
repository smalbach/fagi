// Escalón 1, sobrevivir ahora: calmar el hambre y la sed, que son lo que mata.

import { FAGI, BRAIN, CARRY, NEEDS, HUNGER, THIRST } from '../config.js';
import { statMult } from '../effects.js';
import { waterZone, shorePoint, radiusOf } from '../obstacles.js';
import { pct, razon, pantryIntent } from './comun.js';
import { perseguir } from './proveer.js';

// Atrapada en el hondo: lo primero es salir, por la orilla más cercana. Es
// instinto, no aprendido; lo aprendido es no volver a meterse (swim.js).
export function salirDelAgua(fagi, world) {
  const zona = waterZone(world, fagi.x, fagi.y);
  if (!zona?.deep) return null;
  const orilla = shorePoint(zona.pool, radiusOf(zona.pool), fagi, -FAGI.radius);
  return {
    action: 'swimOut',
    reason: razon('reason.swimOut'),
    target: { x: orilla.x, y: orilla.y },
    targetKind: 'shore',
    trailKey: null,
  };
}

// Ya está en el agua y le queda sed: no se mueve de ahí.
export function beber(fagi, world, ctx) {
  if (!fagi.drinking || fagi.thirst <= 0) return null;
  return { action: 'drink', reason: razon('reason.drinking', { thirst: pct(ctx.thirstU) }) };
}

function needAtRisk(fagi, ctx) {
  const risks = [];
  if (ctx.hungerU >= NEEDS.critical) {
    const rate = HUNGER.rate * statMult(fagi, 'hungerRate');
    risks.push({ kind: 'food', seconds: rate > 0 ? (HUNGER.max - fagi.hunger) / rate : Infinity });
  }
  if (ctx.thirstU >= NEEDS.critical) {
    risks.push({ kind: 'water', seconds: THIRST.rate > 0 ? (THIRST.max - fagi.thirst) / THIRST.rate : Infinity });
  }
  return risks.sort((a, b) => a.seconds - b.seconds)[0] ?? null;
}

// Una ración ya transportada es el recurso más cercano posible.
export function comerCarga(fagi) {
  if (!fagi.carrying || fagi.hunger < CARRY.eatBelow) return null;
  return {
    action: 'eatCarried',
    reason: razon('reason.seekFood', { n: 1, score: '∞' }),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Con hambre o sed de verdad, atender eso va antes que descansar o trabajar.
export function urgencia(fagi, world, ctx, dt) {
  const risk = needAtRisk(fagi, ctx);
  if (!risk) return null;

  // Las reservas existen precisamente para no apostar la vida persiguiendo una
  // fuente incierta cuando el hambre ya es crítica.
  if (risk.kind === 'food') {
    const pantry = pantryIntent(fagi, ctx);
    if (pantry) return pantry;
  }
  const recurso = perseguir(fagi, world, ctx, dt, risk.kind);
  if (recurso) return recurso;

  if (risk.kind === 'water') return buscarAgua(fagi, ctx);
  // Para hambre dejamos continuar: la siguiente regla puede usar la despensa.
  return null;
}

// Si no sabe dónde hay agua, cualquier objetivo de comida es una distracción
// fatal: limpia el objetivo y busca terreno nuevo hasta encontrarla.
// Primero vuelve a casa y desde allí explora. Una vez en el nido, esa vuelta
// ya está hecha hasta que beba: si no, al dar un paso fuera la volvía a
// mandar al nido, y se quedaba en la puerta yendo y viniendo hasta morir.
function buscarAgua(fagi, ctx) {
  if (ctx.enNido) fagi.homeSearched = true;
  if (ctx.nido && !ctx.enNido && !fagi.homeSearched) {
    return {
      action: 'searchWaterNearHome',
      reason: razon('reason.explore'),
      target: ctx.nido,
      targetKind: 'nest',
      trailKey: null,
    };
  }
  return {
    action: 'explore',
    reason: razon('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Con hambre, sin nada a la vista y con reservas en casa: a comer de ellas.
// Va justo detrás de perseguir lo que percibe, porque es la otra forma de
// calmar el hambre: para eso se almacenó.
export function irADespensa(fagi, world, ctx) {
  const hayComidaAlcanzable = ctx.ranked.some(
    (candidate) => candidate.kind === 'food' && candidate.score > BRAIN.minScore
  );
  if (!ctx.nido || ctx.enNido || hayComidaAlcanzable) return null;
  if (fagi.hunger < CARRY.eatBelow) return null;
  return pantryIntent(fagi, ctx);
}
