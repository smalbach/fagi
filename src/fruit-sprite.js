// The painted fruits. The shape of each point is not decoration: it is its
// card drawn out, so you can read at a glance what eating it does.
//
//   nectar : fleshy berry with stalk and leaf. Real food, the filling kind.
//   spark  : glass shard, edges and glints. Gives speed.
//   eye    : an eye that looks. Gives sight.
//   resin  : thick drop of amber, dripping. Stretches what was eaten.
//   toxic  : mushy mass, mold and fumes. The rotten one.
//
// And ripeness shows in the drawing, not only in the color: before rotting the
// fruit gets spotted, sags and loses its shine. Whoever looks at the map can
// see that piece has little time left without remembering when it fell.
//
// Each combination of type, radius, variant and ripeness step is painted ONCE
// on its own canvas and then just stamped.
//
// Each painter lives in its own module under `fruit-sprite/`, and what they
// share (light, shadow, volume, lustre, patches, stalk) in `fruit-sprite/common.js`.

import { POINT_TYPES, FRUIT } from './config.js';
import { ripeness } from './food.js';
import { colorByRipeness } from './colors.js';
import { canvasOf, seededRng, seedFor, cacheSprite, detail, stamp } from './sprite-kit.js';
import { berry } from './fruit-sprite/berry.js';
import { spark } from './fruit-sprite/spark.js';
import { eye } from './fruit-sprite/eye.js';
import { resin } from './fruit-sprite/resin.js';
import { rotten } from './fruit-sprite/rotten.js';

const sprites = new Map();     // key: type|radius|variant|ripeness step

const STEPS = 12;              // how many steps ripeness is rounded to
const VARIANTS = 4;           // distinct pieces per type: no two alike side by side

const PAINTERS = { nectar: berry, spark, eye, resin, toxic: rotten };
// A wild species (chemistry.js) names its painter by its shape.
const BY_SHAPE = { berry, spark, eye, resin };

export function drawFruit(ctx, p) {
  const z = detail();
  const r = Math.max(2, Math.round(POINT_TYPES[p.type].radius * z));
  const step = Math.round(ripeness(p) * STEPS);
  const img = cacheSprite(
    sprites,
    `${p.type}|${r}|${seedFor(p) % VARIANTS}|${step}`,
    () => paint(p.type, r, seedFor(p) % VARIANTS, step / STEPS),
    600
  );
  stamp(ctx, img, p.x, p.y, z);
}

function paint(type, r, variant, ripenessOf) {
  const seedOf = [...type].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const rnd = seededRng((seedOf ^ (variant * 7919)) >>> 0);
  const base = colorByRipeness(type, ripenessOf);
  // How far gone: 0 = still good, 1 = about to rot (or to fall apart, if it is
  // already the rotten one).
  const past = Math.max(0, (ripenessOf - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));

  const pad = Math.ceil(r * 1.4) + 5;
  const S = (r + pad) * 2;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  (PAINTERS[type] ?? BY_SHAPE[POINT_TYPES[type]?.painter] ?? berry)(ctx, S / 2, S / 2, r, base, rnd, past);
  return c;
}
