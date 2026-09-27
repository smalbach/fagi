// Escalón 4, explorar: lo que queda cuando ninguna regla contesta.

import { stockFull } from '../world.js';
import { razon } from './comun.js';

// Ninguna regla ha contestado: no hay necesidad que calmar ni pista que seguir.
// Entonces lo útil es conocer mapa, que es lo que hace posible todo lo demás la
// próxima vez. Olvida lo que tuviera fichado: ya no hay nada fichado.
export function explorar(fagi, world, ctx) {
  const lleno = ctx.nido && stockFull(fagi.pantry);
  return {
    action: 'explore',
    reason: lleno
      ? razon('reason.exploreFull')
      : ctx.candidatos.length
        ? razon('reason.belowMin', { n: ctx.candidatos.length })
        : razon('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}
