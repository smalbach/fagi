// Habitats (HABITATS): each nest's surroundings are a place of their own.
//
// In nature a population adapts to where it lives: the same species is bigger
// on a cold mountain, warier where poison grows, stronger where food is
// scarce. For that to happen in the game, the colonies cannot all live in one
// world. With HABITATS on, every nest gets a habitat when the map is made
// (HABITATS.kinds, in order, one per nest):
//
//   cold   : the air around the nest is `cold` °C colder (a shaded hollow);
//   lean   : the trees nearest the nest bear `fruit` × their rate (poor soil),
//            so its colony must reach other trees, farther and shared;
//   toxic  : `trees` trees of poisonous fruit grow close to the nest, nearer
//            than its good tree, so what is at hand is not what feeds.
//
// Where one habitat ends and the next begins is soft: the air at a point takes
// each nest's cold weighted by how near it is (1/d²), so walking from one nest
// to another the temperature changes gradually. A tree belongs to the habitat
// of its nearest nest.
//
// Off (or one nest without a habitat) nothing changes: no draw, no degree.

import { HABITATS } from './config.js';
import { nestsOf } from './world.js';

const NONE = Object.freeze({ name: null, cold: 0, fruit: 1, trees: 0 });

export function habitatSpec(name) {
  if (!name) return NONE;
  return { ...NONE, ...(HABITATS[name] ?? {}), name };
}

// Gives each nest its habitat, dealt at random from the map's own stream:
// which nest is the first one (where the founders start) says nothing about
// where it lives.
export function assignHabitats(world) {
  if (!HABITATS.enabled || !HABITATS.kinds?.length) return;
  const nests = nestsOf(world);
  const deck = nests.map((_, i) => HABITATS.kinds[i % HABITATS.kinds.length]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  nests.forEach((nest, i) => { nest.habitat = deck[i]; });
}

export function habitatOfNest(world, nest) {
  if (!HABITATS.enabled || !nest?.habitat) return null;
  return habitatSpec(nest.habitat);
}

function nearestNest(world, x, y) {
  let best = null;
  let bd = Infinity;
  for (const n of nestsOf(world)) {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// °C the habitat takes off the air at (x, y): each nest's cold, weighted by
// 1/d² (a nest's own spot is all its own).
export function coldAt(world, x, y) {
  if (!HABITATS.enabled) return 0;
  let w = 0;
  let c = 0;
  for (const n of nestsOf(world)) {
    if (!n.habitat) continue;
    const d2 = (n.x - x) ** 2 + (n.y - y) ** 2;
    if (d2 < 1) return habitatSpec(n.habitat).cold;
    const k = 1 / d2;
    w += k;
    c += k * habitatSpec(n.habitat).cold;
  }
  return w ? c / w : 0;
}

// What a tree bears, × its rate, in the habitat of its nearest nest. Worked
// out once per tree (trees do not move).
export function fruitRateOf(world, tree) {
  if (!HABITATS.enabled) return 1;
  if (tree.habitatFruit == null) {
    const n = nearestNest(world, tree.x, tree.y);
    tree.habitatFruit = n?.habitat ? habitatSpec(n.habitat).fruit : 1;
  }
  return tree.habitatFruit;
}
