// Lo que comparten las reglas de decision.js: cómo se escribe una razón, cuándo
// apremia lo que mata y las preguntas que se hacen varios escalones.

import { NEEDS, CARRY } from '../config.js';
import { verdict } from '../learned/rules.js';
import { stockFull } from '../world.js';

export const pct = (u) => `${Math.round(u * 100)}%`;

// Las razones se guardan como clave + datos, nunca como frase hecha: así la
// consola las puede escribir en el idioma que esté puesto en ese momento.
export const razon = (key, params) => ({ key, params });

// El hambre o la sed ya son críticas. decision.js la reexporta para el córtex.
export const apremia = (ctx) => Math.max(ctx.thirstU, ctx.hungerU) >= NEEDS.critical;

// Lo que tenía fichado (un punto de comida o un objeto del mapa) sigue ahí.
export const sigueEnElMundo = (world, ref) => world.points.includes(ref) || world.objects.includes(ref);

// Comida que no puede ni comerse ni guardarse: con la despensa hecha y sin
// hambre, perseguirla no lleva a ninguna parte. Es exactamente el caso en que
// antes se quedaba orbitando un fruto que ya no podía recoger.
export function despensaHecha(fagi, ctx) {
  if (fagi.hunger >= CARRY.eatBelow || fagi.carrying) return false;
  return Boolean(ctx.nido) && stockFull(fagi.pantry);
}

export function pantryIntent(fagi, ctx) {
  if (!ctx.nido || ctx.enNido) return null;
  // Lo que cree tener guardado. Si se equivoca, lo descubre al llegar: entrar
  // en el nido reescribe fagi.pantry y la siguiente decisión ya es la buena.
  const hay = Object.entries(fagi.pantry).some(
    ([type, amount]) => amount > 0 && verdict(fagi, 'eat', type) !== 'avoid'
  );
  if (!hay) return null;
  return {
    action: 'pantry',
    reason: razon('reason.pantry', { hunger: pct(ctx.hungerU) }),
    target: ctx.nido,
    targetKind: 'nest',
    trailKey: null,
  };
}
