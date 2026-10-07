// The whole lake: the photo if it has loaded and, if not, the still canvas with
// the live parts on top.

import { naturalAppearance } from '../object-appearance.js';
import { drawBanks } from './banks.js';
import { seedFor, cacheSprite, detail, stamp } from '../sprite-kit.js';
import { realisticLakeReady, drawRealisticLake } from './realistic.js';
import { paintLake } from './still.js';
import { surface } from './surface.js';
import { reeds } from './reeds.js';

const lakes = new Map();       // key: seed|radius|detail

export function drawLake(ctx, o, spec, r, wind, now) {
  const variant = naturalAppearance(o, seedFor(o));
  if (realisticLakeReady()) {
    drawRealisticLake(ctx, o, r, wind, now);
    drawBanks(ctx, o, r, seedFor(o), variant);
    return;
  }
  const z = detail();
  const seedOf = seedFor(o);
  const img = cacheSprite(lakes, `${seedOf}|${Math.round(r)}|${z}`,
    () => paintLake(seedOf, Math.round(r), spec.color, z), 24);
  stamp(ctx, img, o.x, o.y, z);

  surface(ctx, o, r, seedOf, wind, now);
  reeds(ctx, o, r, seedOf, wind, now);
  drawBanks(ctx, o, r, seedOf, variant);
}
