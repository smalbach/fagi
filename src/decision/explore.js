// Escalón 4, explorar: lo que queda cuando ninguna regla contesta.

import { stockFull } from '../world.js';
import { reasonOf } from './common.js';

// Ninguna regla ha contestado: no hay necesidad que calmar ni pista que seguir.
// Entonces lo útil es conocer mapa, que es lo que hace posible todo lo demás la
// próxima vez. Olvida lo que tuviera fichado: ya no hay nada fichado.
export function exploreRule(fagi, world, ctx) {
  const full = ctx.nest && stockFull(fagi.pantry);
  return {
    action: 'explore',
    reason: full
      ? reasonOf('reason.exploreFull')
      : ctx.candidates.length
        ? reasonOf('reason.belowMin', { n: ctx.candidates.length })
        : reasonOf('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}
