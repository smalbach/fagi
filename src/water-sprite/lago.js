// El lago entero: la foto si ya ha cargado y, si no, el lienzo quieto con lo
// vivo encima.

import { semillaDe, cacheSprite, detalle, estampar } from '../sprite-kit.js';
import { lagoRealistaListo, dibujarLagoRealista } from './realista.js';
import { pintarLago } from './quieto.js';
import { superficie } from './superficie.js';
import { juncos } from './juncos.js';

const lagos = new Map();       // clave: semilla|radio|detalle

export function drawLake(ctx, o, spec, r, wind, ahora) {
  if (lagoRealistaListo()) {
    dibujarLagoRealista(ctx, o, r, wind, ahora);
    return;
  }
  const z = detalle();
  const semilla = semillaDe(o);
  const img = cacheSprite(lagos, `${semilla}|${Math.round(r)}|${z}`,
    () => pintarLago(semilla, Math.round(r), spec.color, z), 24);
  estampar(ctx, img, o.x, o.y, z);

  superficie(ctx, o, r, semilla, wind, ahora);
  juncos(ctx, o, r, semilla, wind, ahora);
}
