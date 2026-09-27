// Escalón 1, sobrevivir ahora: calmar el hambre y la sed, que son lo que mata.

import { FAGI, BRAIN, CARRY, NEEDS, HUNGER, THIRST } from '../config.js';
import { statMult } from '../effects.js';
import { waterZone, shorePoint, radiusOf } from '../obstacles.js';
import { pct, reasonOf, pantryIntent } from './common.js';
import { pursue } from './provide.js';

// Atrapada en el hondo: lo primero es salir, por la orilla más cercana. Es
// instinto, no aprendido; lo aprendido es no volver a meterse (swim.js).
export function leaveWater(fagi, world) {
  const zone = waterZone(world, fagi.x, fagi.y);
  if (!zone?.deep) return null;
  const shore = shorePoint(zone.pool, radiusOf(zone.pool), fagi, -FAGI.radius);
  return {
    action: 'swimOut',
    reason: reasonOf('reason.swimOut'),
    target: { x: shore.x, y: shore.y },
    targetKind: 'shore',
    trailKey: null,
  };
}

// Ya está en el agua y le queda sed: no se mueve de ahí.
export function drink(fagi, world, ctx) {
  if (!fagi.drinking || fagi.thirst <= 0) return null;
  return { action: 'drink', reason: reasonOf('reason.drinking', { thirst: pct(ctx.thirstU) }) };
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
export function eatCarriedFood(fagi) {
  if (!fagi.carrying || fagi.hunger < CARRY.eatBelow) return null;
  return {
    action: 'eatCarried',
    reason: reasonOf('reason.seekFood', { n: 1, score: '∞' }),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Con hambre o sed de verdad, atender eso va antes que descansar o trabajar.
export function urgency(fagi, world, ctx, dt) {
  const risk = needAtRisk(fagi, ctx);
  if (!risk) return null;

  // Las reservas existen precisamente para no apostar la vida persiguiendo una
  // fuente incierta cuando el hambre ya es crítica.
  if (risk.kind === 'food') {
    const pantry = pantryIntent(fagi, ctx);
    if (pantry) return pantry;
  }
  const resource = pursue(fagi, world, ctx, dt, risk.kind);
  if (resource) return resource;

  if (risk.kind === 'water') return seekWaterNear(fagi, ctx);
  // Para hambre dejamos continuar: la siguiente regla puede usar la despensa.
  return null;
}

// Si no sabe dónde hay agua, cualquier objetivo de comida es una distracción
// fatal: limpia el objetivo y busca terreno nuevo hasta encontrarla.
// Primero vuelve a casa y desde allí explora. Una vez en el nido, esa vuelta
// ya está hecha hasta que beba: si no, al dar un paso fuera la volvía a
// mandar al nido, y se quedaba en la puerta yendo y viniendo hasta morir.
function seekWaterNear(fagi, ctx) {
  if (ctx.inNest) fagi.homeSearched = true;
  if (ctx.nest && !ctx.inNest && !fagi.homeSearched) {
    return {
      action: 'searchWaterNearHome',
      reason: reasonOf('reason.explore'),
      target: ctx.nest,
      targetKind: 'nest',
      trailKey: null,
    };
  }
  return {
    action: 'explore',
    reason: reasonOf('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Con hambre, sin nada a la vista y con reservas en casa: a comer de ellas.
// Va justo detrás de perseguir lo que percibe, porque es la otra forma de
// calmar el hambre: para eso se almacenó.
export function goToPantry(fagi, world, ctx) {
  const reachableFood = ctx.ranked.some(
    (candidate) => candidate.kind === 'food' && candidate.score > BRAIN.minScore
  );
  if (!ctx.nest || ctx.inNest || reachableFood) return null;
  if (fagi.hunger < CARRY.eatBelow) return null;
  return pantryIntent(fagi, ctx);
}
