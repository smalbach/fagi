// Escalón 2, aguantar: sin fuerzas no se sobrevive luego. Descansar y, si
// llueve o va a llover, ponerse a cubierto.

import { FAGI, ENERGY, NEEDS, THIRST } from '../config.js';
import { rainAversion, pressureAversion } from '../weather.js';
import { pct, reasonOf, pressing } from './common.js';

// Sin fuerzas no hay trabajo que valga: a descansar, mejor en el nido.
export function rest(fagi, world, ctx) {
  // El hambre y la sed matan; quedarse sin energía no. Aunque esté arrastrándose
  // (ENERGY.weakSpeed), atender lo urgente va antes que echarse.
  if (pressing(ctx)) return null;
  if (fagi.energy <= ENERGY.tired) fagi.resting = true;
  if (fagi.resting && fagi.energy >= ENERGY.rested) fagi.resting = false;
  if (!fagi.resting) return null;

  if (ctx.inNest || !ctx.nest) {
    return {
      action: 'rest',
      reason: ctx.inNest
        ? reasonOf('reason.restInNest', { energy: pct(ctx.energyU) })
        : reasonOf('reason.restOutside'),
      target: null,
      targetKind: null,
    };
  }
  return {
    action: 'toNest',
    reason: reasonOf('reason.goRest', { energy: pct(ctx.energyU) }),
    target: ctx.nest,
    targetKind: 'nest',
  };
}

// Lo que la tira hacia fuera: el hambre o la sed que tenga. Refugiarse
// compite con eso; lo que apremia, además, gana siempre (va antes en REGLAS).
//
// Y siente cómo sube la sed: si esperando se le haría crítica antes de llegar
// al agua que recuerda, sale ya. Si no, con lo aprendido pesando más que
// cualquier sed no crítica, se quedaba hasta el límite y el camino al agua lo
// hacía ya en crítico.
function jerk(fagi, ctx) {
  const pull = Math.max(ctx.thirstU, ctx.hungerU);
  if (!ctx.pool || THIRST.rate <= 0) return pull;
  const untilCritical = (NEEDS.critical * THIRST.max - fagi.thirst) / THIRST.rate;
  const journey = Math.hypot(ctx.pool.x - fagi.x, ctx.pool.y - fagi.y) / FAGI.speed;
  return untilCritical < journey * 1.5 + NEEDS.shelterMargin ? 1 : pull;
}

// Dentro del nido se queda quieta; fuera, vuelve a él.
function sheltered(ctx, reasonInside, reasonOutside) {
  if (ctx.inNest) {
    return { action: 'rest', reason: reasonOf(reasonInside), target: null, targetKind: null };
  }
  return { action: 'shelter', reason: reasonOf(reasonOutside), target: ctx.nest, targetKind: 'nest' };
}

// Llueve: a cubierto, si las ganas pueden más que lo que la tira hacia fuera.
// Las ganas son un poco de instinto y, sobre todo, lo que aprendió mojándose
// (weather.js): la primera vez sigue a lo suyo y lo paga; luego se refugia.
// Se queda en el nido hasta que escampa.
export function seekShelter(fagi, world, ctx) {
  if (!fagi.raining || !ctx.nest || pressing(ctx)) return null;
  if (rainAversion(fagi) <= jerk(fagi, ctx)) return null;
  return sheltered(ctx, 'reason.shelterIn', 'reason.shelter');
}

// Nota que la presión baja. Qué anuncia eso lo aprendió ('presion', weather.js):
// si ya sabe que detrás viene lluvia, vuelve al nido antes de que caiga.
export function anticipate(fagi, world, ctx) {
  if (!fagi.pressureFalling || !ctx.nest || pressing(ctx)) return null;
  if (pressureAversion(fagi) <= jerk(fagi, ctx)) return null;
  return sheltered(ctx, 'reason.pressureIn', 'reason.pressure');
}
