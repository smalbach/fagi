// Generates the map: pools and rocks scattered at random, without overlapping each other
// and leaving free the spot where Fagi spawns.

import { WORLD, MAPGEN, OBJECT_TYPES, CONCEPT, POINT_TYPES, COLONIES, HABITATS } from './config.js';
import { addObject, record } from './world.js';
import { createChemistry, createSpecies, registerSpecies } from './chemistry.js';
import { radiusOf } from './obstacles.js';
import { placeThings } from './things.js';
import { assignHabitats, habitatOfNest } from './habitats.js';

// How many base maps fit in this one (MAPGEN.size² on a scaled map).
export const areaOf = (world) => Math.max(1, (world.width * world.height) / (WORLD.baseWidth * WORLD.baseHeight));

function fits(world, x, y, r) {
  for (const o of world.objects) {
    // The REAL radius of the one already placed: some rocks are fatter than their type.
    const or = radiusOf(o);
    if (Math.hypot(o.x - x, o.y - y) < r + or + MAPGEN.minGap) return false;
  }
  return true;
}

// scaleOf = [min, max] over the type's radius. Without it, all the same size.
function place(world, type, count, scaleOf = null) {
  const base = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;

  for (let n = 0; n < count; n++) {
    // Retries a few times; if the map is full, this one is skipped.
    for (let attemptOf = 0; attemptOf < 40; attemptOf++) {
      // The size is drawn on each attempt: if the big one doesn't fit, another gets in.
      // Squared, so there are many small ones and few boulders: if
      // half were huge, they'd cover the map and Fagi wouldn't find the water.
      const t = Math.random() ** 2;
      const r = scaleOf
        ? Math.round(base * (scaleOf[0] + t * (scaleOf[1] - scaleOf[0])))
        : base;
      const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
      const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
      if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue; // Fagi's spot
      if (!fits(world, x, y, r)) continue;
      addObject(world, x, y, type, r, 'map');
      break;
    }
  }
}

// The essential resources spawn in a ring around Fagi: not underneath
// her, but close enough that she can discover them before dying.
function placeNearSpawn(world, type, count, minDistance, maxDistance) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let attemptOf = 0; attemptOf < count * 80 && placed < count; attemptOf++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    if (x < MAPGEN.margin + r || x > WORLD.width - MAPGEN.margin - r) continue;
    if (y < MAPGEN.margin + r || y > WORLD.height - MAPGEN.margin - r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type, undefined, 'map');
    placed++;
  }
  if (placed < count) place(world, type, count - placed);
}

// `inside`: only spots wholly inside the map. The preregistered maps (one nest,
// the species ring) were drawn without it and keep it off, number for number.
function placeFarFrom(world, type, count, origin, minDistance, maxDistance, preferredAngle, spread = 1.2, inside = false) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let attempt = 0; attempt < count * 240 && placed < count; attempt++) {
    // Favors the side opposite the nest relative to the spawn point: it matches
    // exploration that moves away from home, without revealing the exact position.
    const angle = preferredAngle + (Math.random() - 0.5) * spread;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = origin.x + Math.cos(angle) * distance;
    const y = origin.y + Math.sin(angle) * distance;
    // Inside the map: off its edge she could see it and never reach it.
    if (inside && (x < MAPGEN.margin + r || x > WORLD.width - MAPGEN.margin - r)) continue;
    if (inside && (y < MAPGEN.margin + r || y > WORLD.height - MAPGEN.margin - r)) continue;
    if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type, undefined, 'map');
    placed++;
  }
  return placed;
}

// placeFarFrom, and if they don't all fit on the side asked for (a nest near
// the edge of the map), any side, then nearer: a nest is never left without
// its water or its trees.
function placeAround(world, type, count, origin, minDistance, maxDistance, preferredAngle, spread) {
  let placed = placeFarFrom(world, type, count, origin, minDistance, maxDistance, preferredAngle, spread, true);
  if (placed < count) placed += placeFarFrom(world, type, count - placed, origin, minDistance, maxDistance, 0, Math.PI * 2, true);
  if (placed < count) placed += placeFarFrom(world, type, count - placed, origin, minDistance * 0.6, maxDistance, 0, Math.PI * 2, true);
  return placed;
}

// A map with its own chemistry: one tree per wild species, spread all around
// the nest so that she meets them one by one, not all at once.
// `chemistry`: impose one instead of drawing it (generations in batch keep the
// same chemistry across maps, until it changes on purpose).
function placeSpecies(world, nest, chemistry = null) {
  const chem = chemistry ?? createChemistry(Math.random, { family: MAPGEN.family });
  const species = createSpecies(chem, MAPGEN.species);
  registerSpecies(species);
  world.chemistry = chem;
  world.species = species;
  const start = Math.random() * Math.PI * 2;
  species.forEach(({ key }, i) => {
    const angle = start + (i / species.length) * Math.PI * 2;
    const placed = placeFarFrom(
      world, 'tree', 1, nest, MAPGEN.speciesMinDistance, MAPGEN.speciesMaxDistance, angle, 0.6,
    );
    if (!placed) return;
    const tree = world.objects.at(-1);
    tree.fruit = key;
    record(world, 'obj_fruit', { id: tree.id, what: key });
  });
}

// The trees of the fruit the person made (custom-fruits.js): as many of each
// as they asked for, anywhere on the map. There are none outside the game.
function placeCustomTrees(world) {
  for (const [key, spec] of Object.entries(POINT_TYPES)) {
    if (!spec.custom) continue;
    for (let i = 0; i < (spec.tree?.count ?? 0); i++) {
      const before = world.objects.length;
      place(world, 'tree', 1);
      if (world.objects.length === before) break;
      const tree = world.objects.at(-1);
      tree.fruit = key;
      record(world, 'obj_fruit', { id: tree.id, what: key });
    }
  }
}

// More colonies (COLONIES.count): each further nest a site like the first,
// with its own water close and its own trees at the same distances, the
// nests at least COLONIES.spacing apart. Draws nothing with one colony.
function placeColonies(world, first) {
  const nests = [first];
  const r = OBJECT_TYPES.nest.radius;
  for (let n = 1; n < COLONIES.count; n++) {
    for (let attempt = 0; attempt < 400; attempt++) {
      const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
      const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
      if (nests.some((o) => Math.hypot(o.x - x, o.y - y) < COLONIES.spacing)) continue;
      if (!fits(world, x, y, r)) continue;
      const nest = addObject(world, x, y, 'nest', undefined, 'map');
      nests.push(nest);
      const away = Math.atan2(y - first.y, x - first.x);
      placeAround(world, 'water', 1, nest, 120, 220, away + Math.PI / 2, Math.PI);
      placeAround(world, 'tree', MAPGEN.trees, nest, MAPGEN.treeMinNestDistance, MAPGEN.treeMaxNestDistance, away, 2.4);
      break;
    }
  }
}

// Habitats (HABITATS): each nest gets its own, and a 'toxic' one gets its
// poisonous trees close by, nearer than its good tree. Draws nothing off.
function placeHabitats(world) {
  if (!HABITATS.enabled) return;
  assignHabitats(world);
  for (const nest of world.objects.filter((o) => o.type === 'nest')) {
    const h = habitatOfNest(world, nest);
    if (!h?.trees) continue;
    const [near, far] = h.near ?? [150, 260];
    for (let i = 0; i < h.trees; i++) {
      if (!placeFarFrom(world, 'tree', 1, nest, near, far, Math.random() * Math.PI * 2, Math.PI * 2, true)) break;
      const tree = world.objects.at(-1);
      tree.fruit = 'toxic';
      record(world, 'obj_fruit', { id: tree.id, what: 'toxic' });
    }
  }
}

export function generateMap(world, { chemistry = null } = {}) {
  // The nest goes first and close to where Fagi spawns: it's her starting point.
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  const ang = Math.random() * Math.PI * 2;
  const nest = addObject(world, cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90, 'nest', undefined, 'map');

  // One water source close enough to find before dying of thirst; any
  // others anywhere, of assorted sizes.
  placeNearSpawn(world, 'water', Math.min(1, MAPGEN.pools), 175, 240);
  place(world, 'water', Math.max(0, MAPGEN.pools - 1), [0.45, 1.6]);
  if (MAPGEN.species > 0) {
    placeSpecies(world, nest, chemistry);
  } else {
    registerSpecies([]);
    world.chemistry = null;
    world.species = [];
    placeFarFrom(
      world, 'tree', MAPGEN.trees, nest,
      MAPGEN.treeMinNestDistance, MAPGEN.treeMaxNestDistance, ang + Math.PI,
    );
  }
  placeColonies(world, nest);
  placeHabitats(world);
  placeCustomTrees(world);
  // A bigger map keeps the same rocks per square pixel; density scales it.
  const rockDensity = MAPGEN.density ?? 1;
  place(world, 'rock', Math.round(MAPGEN.rocks * areaOf(world) * rockDensity), MAPGEN.rockScale);
  // Last, so that with CONCEPT on the rest of the map is the same one.
  if (CONCEPT.enabled) placeThings(world);

  // Mud patches and natural hazard zones when enabled in settings
  if (MAPGEN.hazards && (MAPGEN.mudPatches ?? 0) > 0) {
    world.mud ??= [];
    for (let i = 0; i < (MAPGEN.mudPatches ?? 3); i++) {
      const mx = MAPGEN.margin + 60 + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + 60));
      const my = MAPGEN.margin + 60 + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + 60));
      if (Math.hypot(mx - cx, my - cy) > MAPGEN.spawnClear) {
        world.mud.push({ x: mx, y: my, r: 40 + Math.random() * 30, speed: 0.55 });
      }
    }
  }
}
