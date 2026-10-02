// Fagi's drawing. It only paints: it knows nothing about rules or decisions.
//
// Fagi is an ant, and she is drawn as one: three real parts —gaster,
// mesosoma and head— joined by the petiole, the waist only ants have and
// what gives them away most from above. Six three-segment legs that walk
// in a tripod gait, elbowed antennae —scape and funiculus, like real ones—
// and a green leaf on her back, which gives her character and doubles as
// the logo.
//
// Everything else reads from the state she is in: a female has a fuller
// gaster, a male is slimmer, darker and longer in the antennae; a starving
// ant's gaster shrinks; the cold draws her legs in and hot ground puts her on
// stilts; asleep in the open she folds legs and antennae and stops rocking; a
// juvenile is small and an old one fades; dead she is grey with curled legs.
//
// She is painted with strokes, not a stored image: the camera zooms her up to
// four times and a stretched ant would show before anything else.
//
// The light is the SAME as the ground's, the rock's and the tree's: top left
// of the world. Since the body turns, inside the drawing the light has to
// turn the opposite way (`localLight`), or when she turned around the shine
// would follow her and read as plastic.
//
// Each part lives in its own module under `fagi-sprite/`; here they are just
// assembled in order.

import { CASTES } from './config.js';
import { casteOf } from './castes.js';
import { mix } from './sprite-kit.js';
import { SKIN, SKIN_MALE, DEAD, LEAF, DEAD_LEAF } from './fagi-sprite/palette.js';
import { localLight, shadow } from './fagi-sprite/light.js';
import { drawLegs } from './fagi-sprite/legs.js';
import { drawBody } from './fagi-sprite/body.js';
import { drawAntennas } from './fagi-sprite/antennae.js';
import { drawCarried } from './fagi-sprite/cargo.js';

export { ellipse } from './fagi-sprite/stroke.js';

// Is she asleep out in the open? (In the nest she is not drawn at all.)
const asleep = (fagi) => fagi.alive && fagi.thought?.action === 'rest';

export function drawFagi(ctx, fagi) {
  const alive = fagi.alive;
  const old = alive && fagi.lifeStage === 'senescent';
  const skin = fagi.sex === 'male' ? SKIN_MALE : SKIN;
  const c = !alive ? DEAD : old ? faded(skin) : skin;
  const leaf = !alive ? DEAD_LEAF : old ? faded(LEAF) : LEAF;
  const sleeping = asleep(fagi);
  const step = alive && !sleeping ? fagi.stride * 0.07 : 0;
  const cold = alive && fagi.thermalFeel === 'cold';
  const hot = alive && fagi.thermalFeel === 'heat';

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x is forward

  // The world's light, seen from inside the body.
  const L = localLight(fagi.angle);

  shadow(ctx, L, alive, hot ? 1.5 : 1);

  // The cold makes her draw in a little; a juvenile is smaller.
  const size = (cold ? 0.94 : 1) * (fagi.lifeStage === 'juvenile' ? 0.72 : 1);
  ctx.scale(size, size);

  // Walking is not just moving the legs: the body pitches with each tripod. Very
  // little —half a degree— but it is what separates walking from sliding.
  const wobble = step ? Math.sin(step) * 0.035 : 0;
  ctx.rotate(wobble);

  const pose = { fold: sleeping ? 1 : cold ? 0.5 : 0, stilt: hot ? 1 : 0 };
  drawLegs(ctx, step, c, L, alive, pose);
  drawBody(ctx, c, leaf, L, alive, gasterFill(fagi));
  drawAntennas(ctx, fagi, step, c, L, alive, sleeping);
  if (fagi.carrying) drawCarried(ctx, fagi.carrying.type, L);

  if (CASTES.enabled && fagi.casteProfile) {
    const caste = casteOf(fagi);
    ctx.save();
    ctx.fillStyle = caste.color;
    ctx.shadowColor = caste.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(1.8, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (fagi.justLearnedCode > 0) {
    ctx.save();
    ctx.strokeStyle = '#8fd93d';
    ctx.lineWidth = 2;
    ctx.globalAlpha = Math.min(1, fagi.justLearnedCode / 3);
    ctx.beginPath();
    const r = 20 + (3.0 - fagi.justLearnedCode) * 6;
    ctx.arc(-2, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// How full the gaster is drawn: a female's is broader, a male's slimmer, and
// hunger empties it.
function gasterFill(fagi) {
  const sex = fagi.sex === 'female' ? 1.06 : fagi.sex === 'male' ? 0.92 : 1;
  const empty = fagi.alive ? Math.min(1, (fagi.hunger ?? 0) / 100) * 0.14 : 0;
  return { x: sex * (1 - empty * 0.5), y: sex * (1 - empty) };
}

function faded(colors) {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, mix(v, '#9aa0a6', 0.35)]));
}
