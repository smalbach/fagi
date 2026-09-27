// El lago entero: la foto si ya ha cargado y, si no, el lienzo quieto con lo
// vivo encima.

import { seedFor, cacheSprite, detail, stamp } from '../sprite-kit.js';
import { realisticLakeReady, drawRealisticLake } from './realistic.js';
import { paintLake } from './still.js';
import { surface } from './surface.js';
import { reeds } from './reeds.js';

const lakes = new Map();       // clave: semilla|radio|detalle

export function drawLake(ctx, o, spec, r, wind, now) {
  if (realisticLakeReady()) {
    drawRealisticLake(ctx, o, r, wind, now);
    return;
  }
  const z = detail();
  const seedOf = seedFor(o);
  const img = cacheSprite(lakes, `${seedOf}|${Math.round(r)}|${z}`,
    () => paintLake(seedOf, Math.round(r), spec.color, z), 24);
  stamp(ctx, img, o.x, o.y, z);

  surface(ctx, o, r, seedOf, wind, now);
  reeds(ctx, o, r, seedOf, wind, now);
}
