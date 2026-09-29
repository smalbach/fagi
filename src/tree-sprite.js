// The painted tree. Three canvases, each one painted ONCE:
//
//   · the trunk, with its roots, its bark and the branches growing from it;
//   · the crown, which is leaf;
//   · and the branch tips again, to paint them ON TOP of the crown.
//
// That third canvas is what makes the tree read as wood with leaves and not as
// a green blot: the branches peek out between the leaves, with the same stroke
// and in the same place as the ones below, because both come from the same
// skeleton (branchesOf). They are kept apart because they do different things
// when drawn: the trunk is fixed in the ground, and the crown and its branches
// move with the wind.
//
// Everything you see tells what the tree does:
//
//   · The crown leans downwind. The wind is what carries the scents, so
//     looking at any tree tells you which way the fruit's trail goes without
//     opening any panel.
//   · The coming fruit is seen ripening as it hangs from the crown: it grows
//     and takes on color as the countdown runs out. When it is whole, it falls.
//   · As it dries it loses leaves, fades toward brown and its branches show: an
//     old tree can be recognized before it falls.
//
// The crown sits on the upper half: below it the bole stays in view, which is
// what tells you it is a tree and not a bush. Everything fits inside the
// object's radius: what you see is the tree that is there.

// And the tree looks like its fruit (tree-sprite/forms.js): the fruit's shape
// decides the kind of tree —broadleaf, conifer, palm or willow— and its color
// tints the leaves and the flowers.

// The pieces live in tree-sprite/: the branch skeleton, the trunk and its
// foot, the crown (procedural and photographic), the wind and the fruit. Here
// we only keep the already painted canvases and decide what is stamped where.

import { TREE, POINT_TYPES } from './config.js';
import { treeAge, isBare } from './trees.js';
import { cacheSprite, detail, stamp, seedFor } from './sprite-kit.js';
import { paintTrunk } from './tree-sprite/trunk.js';
import { paintBranches } from './tree-sprite/branches.js';
import { paintCrown } from './tree-sprite/crown.js';
import { realisticCrownLoaded, stampRealisticCrown } from './tree-sprite/realistic-crown.js';
import { swayOf } from './tree-sprite/wind.js';
import { fruitsOf } from './tree-sprite/fruits.js';
import { formOf, foliageOf, hasBranches, paintForm } from './tree-sprite/forms.js';

const trunks = new Map();     // key: seed|radius|form|dryness step
const crowns = new Map();       // key: seed|radius|form|fruit color|dryness step
const branchings = new Map();     // the tips that go over the leaves

const STEPS = 8;               // steps dryness is rounded to

export function drawTree(ctx, o, spec, r, wind, now) {
  // With the camera close the tree is painted with more pixels instead of
  // stretching the old one: the radius is multiplied by the detail scale.
  const z = detail();
  const seedOf = seedFor(o);
  const R = Math.round(r * z);
  const step = Math.round(treeAge(o) * STEPS);
  const dry = step / STEPS;

  // What it bears decides what it is. The editor may change the fruit's
  // shape or color live: both go in the keys, so the tree repaints with it.
  const fruit = POINT_TYPES[o.fruit ?? TREE.fruit];
  const form = formOf(fruit);
  const color = fruit?.color ?? spec.color;

  const trunk = cacheSprite(trunks, `${seedOf}|${R}|${form}|${step}`,
    () => paintTrunk(seedOf, R, dry, form), 120);
  stamp(ctx, trunk, o.x, o.y, z);

  // The crown is loose from the trunk: it leans downwind and breathes with it.
  // The branches peeking through the leaves move with it, as they should.
  const v = swayOf(wind, now, r, seedOf, dry);
  if (form === 'broadleaf' && realisticCrownLoaded()) {
    stampRealisticCrown(ctx, o, r, v, dry, seedOf, fruit ? color : null);
  } else {
    const crown = cacheSprite(crowns, `${seedOf}|${R}|${form}|${color}|${step}`,
      () => (form === 'broadleaf'
        ? paintCrown(seedOf, R, foliageOf(form, color, 0), dry, fruit ? color : null)
        : paintForm(form, seedOf, R, color, dry)), 120);
    stamp(ctx, crown, o.x + v.x, o.y + v.y, z);
    if (hasBranches(form)) {
      const tips = cacheSprite(branchings, `${seedOf}|${R}|${step}`,
        () => paintBranches(seedOf, R, dry), 120);
      stamp(ctx, tips, o.x + v.x, o.y + v.y, z);
    }
  }
  // A seasonal tree resting between crops (FORAGE) hangs nothing.
  if (!isBare(o)) fruitsOf(ctx, o, r, v, dry, form);
}
