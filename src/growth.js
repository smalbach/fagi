// A world that grows with its people (GROWTH). Off, nothing here runs.
//
// Two things, checked every GROWTH.every seconds:
//
//   budding : a nest at least GROWTH.budAt full sends a party (a fertile,
//             unrelated pair and more adults) to found a new nest: on free
//             ground near it (within GROWTH.reach × COLONIES.spacing, no
//             nearer than COLONIES.spacing to any nest), with water within
//             GROWTH.water and GROWTH.food trees nearer to it than to any
//             other nest. So the population is capped by the land, not by
//             the size of a nest.
//   growing : when a nest is ready to bud, there is no such ground and the
//             land already holds as many nests per base map as the map began
//             with, or the living per base map pass GROWTH.density, the map grows on its
//             right and bottom edges by GROWTH.step × the base map's side
//             (what is on the map keeps its place). The new land gets as many
//             trees, ponds and rocks per square pixel as the map began with,
//             and the trees' room (TREE.room) grows with them.
//
//   dispersal: a nest left with no unrelated male gets one from a neighbour
//             (GROWTH.disperse), so small nests founded by one pair go on.
//
// Everything is recorded (colony_found with bud, disperse, map_grow, obj_add), so a
// replay rebuilds the world as it grew.

import { GROWTH, COLONIES, LIFE, MAPGEN, OBJECT_TYPES, HABITATS, WORLD, EXPLORE } from './config.js';
import { addObject, nestsOf, record, sizeWorld } from './world.js';
import { areaOf, fits, furnishHabitat } from './mapgen.js';
import { relatedness } from './reproduction.js';
import { fertility } from './lifecycle.js';
import { widenExploreMap } from './explore.js';

const treesOf = (world) => world.objects.filter((o) => o.type === 'tree');
const homeOf = (world, f) => f.home ?? nestsOf(world)[0]?.id;

// What the map began with, per base map: kept the first time it is asked.
function startOf(world) {
  if (world.growth) return world.growth;
  const area = areaOf(world);
  const count = (type) => world.objects.filter((o) => o.type === type).length / area;
  world.growth = {
    k: world.width / WORLD.baseWidth,
    per: { tree: count('tree'), water: count('water'), rock: count('rock') },
    nests: count('nest'),
    buds: 0,
    grown: 0,
    moved: 0,
    nextAt: 0,
  };
  return world.growth;
}

const inside = (world, x, y, r) => x >= MAPGEN.margin + r && x <= world.width - MAPGEN.margin - r
  && y >= MAPGEN.margin + r && y <= world.height - MAPGEN.margin - r;

// Free ground for a nest near `from` (within GROWTH.reach × COLONIES.spacing),
// or, with `far`, anywhere on the map; null if there is none.
function siteNear(world, from, far = false) {
  const nests = nestsOf(world);
  const r = OBJECT_TYPES.nest.radius;
  const trees = treesOf(world);
  const ponds = world.objects.filter((o) => o.type === 'water');
  const near = (x, y) => nests.reduce((d, n) => Math.min(d, Math.hypot(n.x - x, n.y - y)), Infinity);
  for (let attempt = 0; attempt < 200; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const d = COLONIES.spacing * (1 + Math.random() * Math.max(0, GROWTH.reach - 1));
    const x = far ? Math.random() * world.width : from.x + Math.cos(angle) * d;
    const y = far ? Math.random() * world.height : from.y + Math.sin(angle) * d;
    if (!inside(world, x, y, r)) continue;
    if (near(x, y) < COLONIES.spacing) continue;
    if (!fits(world, x, y, r)) continue;
    if (!ponds.some((w) => Math.hypot(w.x - x, w.y - y) < GROWTH.water)) continue;
    const own = trees.filter((t) => {
      const mine = Math.hypot(t.x - x, t.y - y);
      return mine <= MAPGEN.treeMaxNestDistance && mine < near(t.x, t.y);
    }).length;
    if (own < GROWTH.food) continue;
    return { x, y };
  }
  return null;
}

// The party that leaves `source`, or null if it has no fertile unrelated pair.
function partyOf(world, colony, source) {
  const adults = colony.ants.filter((f) => f.alive && homeOf(world, f) === source.id && f.lifeStage === 'adult' && fertility(f) > 0);
  const female = adults.find((f) => f.sex === 'female');
  const male = female && adults.find((f) => f.sex === 'male' && relatedness(world.lineage, female.id, f.id) < LIFE.kinLimit);
  if (!female || !male) return null;
  return [female, male, ...adults.filter((f) => f !== female && f !== male).slice(0, Math.max(0, GROWTH.party - 2))];
}

// Dispersal (GROWTH.disperse): a nest whose fertile females have no unrelated
// male gets one from the nearest nest that has one to spare, as males leave
// their nest to breed in many species. Without it a nest founded by one pair
// is all siblings once the founders die, and dies out (kin rule, LIFE.kinLimit).
function disperse(world, colony) {
  const nests = nestsOf(world);
  const fertile = (f) => f.alive && f.lifeStage === 'adult' && fertility(f) > 0;
  const by = {};
  for (const f of colony.ants) if (fertile(f)) (by[homeOf(world, f)] ??= []).push(f);
  const unrelated = (a, b) => relatedness(world.lineage, a.id, b.id) < LIFE.kinLimit;
  for (const nest of nests) {
    const here = by[nest.id] ?? [];
    const females = here.filter((f) => f.sex === 'female');
    if (!females.length) continue;
    if (females.some((f) => here.some((m) => m.sex === 'male' && unrelated(f, m)))) continue;
    const from = nests.filter((n) => n !== nest && (by[n.id] ?? []).filter((m) => m.sex === 'male').length >= 2)
      .sort((a, b) => Math.hypot(a.x - nest.x, a.y - nest.y) - Math.hypot(b.x - nest.x, b.y - nest.y));
    for (const n of from) {
      const male = by[n.id].find((m) => m.sex === 'male' && females.some((f) => unrelated(f, m)));
      if (!male) continue;
      male.home = nest.id;
      male.pantry = {};
      by[n.id].splice(by[n.id].indexOf(male), 1);
      here.push(male);
      world.growth.moved += 1;
      record(world, 'disperse', { id: male.id, from: n.id, to: nest.id });
      break;
    }
  }
}

function bud(world, colony, source, site, party) {
  const nest = addObject(world, site.x, site.y, 'nest', undefined, 'sim');
  if (HABITATS.enabled && HABITATS.kinds?.length) {
    nest.habitat = HABITATS.kinds[Math.floor(Math.random() * HABITATS.kinds.length)];
    furnishHabitat(world, nest);
  }
  for (const f of party) { f.home = nest.id; f.pantry = {}; }
  world.growth.buds += 1;
  colony.life.founded = (colony.life.founded ?? 0) + 1;
  record(world, 'colony_found', { from: source.id, to: nest.id, female: party[0].id, male: party[1].id, party: party.length, bud: true, habitat: nest.habitat ?? null });
  return nest;
}

// Places `count` things of `type` on the new land (outside the old w × h).
function placeOnNew(world, type, count, oldW, oldH, scale = null) {
  const base = OBJECT_TYPES[type].radius;
  let placed = 0;
  for (let attempt = 0; attempt < count * 60 && placed < count; attempt++) {
    const t = Math.random() ** 2;
    const r = scale ? Math.round(base * (scale[0] + t * (scale[1] - scale[0]))) : base;
    const x = MAPGEN.margin + r + Math.random() * (world.width - 2 * (MAPGEN.margin + r));
    const y = MAPGEN.margin + r + Math.random() * (world.height - 2 * (MAPGEN.margin + r));
    if (x < oldW && y < oldH) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type, r, 'sim');
    placed++;
  }
  return placed;
}

// Draws a whole number of things for a fractional expectation.
const draw = (v) => Math.floor(v) + (Math.random() < v - Math.floor(v) ? 1 : 0);

export function growMap(world) {
  const g = startOf(world);
  if (g.k + GROWTH.step > GROWTH.max + 1e-9) return false;
  const oldW = world.width;
  const oldH = world.height;
  const oldCols = Math.ceil(oldW / EXPLORE.cell);
  const before = areaOf(world);
  g.k += GROWTH.step;
  sizeWorld(world, g.k);
  const added = areaOf(world) - before;
  const trees = placeOnNew(world, 'tree', draw(g.per.tree * added), oldW, oldH);
  placeOnNew(world, 'water', draw(g.per.water * added), oldW, oldH, [0.45, 1.6]);
  placeOnNew(world, 'rock', draw(g.per.rock * added), oldW, oldH, MAPGEN.rockScale);
  if (world.treeRoom != null) world.treeRoom += trees;
  for (const f of world.colony?.ants ?? []) if (f.alive && f.explored) f.explored = widenExploreMap(f.explored, oldCols);
  g.grown += 1;
  record(world, 'map_grow', { width: world.width, height: world.height, k: g.k });
  return true;
}

// Once per step from updateLife (reproduction.js), with GROWTH on.
export function updateGrowth(world, colony) {
  if (!GROWTH.enabled) return;
  const g = startOf(world);
  if (world.time < g.nextAt) return;
  g.nextAt = world.time + GROWTH.every;
  if (GROWTH.disperse) disperse(world, colony);
  const living = colony.ants.filter((f) => f.alive);
  if (living.length / areaOf(world) > GROWTH.density) growMap(world);
  const count = {};
  for (const f of living) { const h = homeOf(world, f); count[h] = (count[h] ?? 0) + 1; }
  for (const source of nestsOf(world)) {
    if ((count[source.id] ?? 0) < GROWTH.budAt * LIFE.maxPopulation) continue;
    const party = partyOf(world, colony, source);
    if (!party) continue;
    let site = siteNear(world, source) ?? siteNear(world, source, true);
    // No ground left: the map grows, but only once the land holds as many
    // nests as the map began with per base map (no growing into empty land).
    if (!site && nestsOf(world).length / areaOf(world) >= g.nests && growMap(world)) site = siteNear(world, source) ?? siteNear(world, source, true);
    if (!site) continue;
    bud(world, colony, source, site, party);
    count[source.id] -= party.length;
  }
}
