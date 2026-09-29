// What Fagi perceives at this instant and how she scores it.
//
// Gathers into ONE list everything chaseable: food seen, food smelled and the water.
// Each candidate carries which sense it came in through, so whoever decides knows it.

import { FAGI, BRAIN, THIRST, HUNGER, ENERGY, MEMORY, TREE, NEST, RAIN, CONCEPT, SOURCES } from './config.js';
import { seenPoints, seesObject, viewRangeOf, distanceTo } from './vision.js';
import { smelledPoints, smellsObject, aromaOf, scentStrengthOfObject } from './smell.js';
import { isWater, isTree, radiusOf, waterZone } from './obstacles.js';
import { fearsDeep } from './swim.js';
import { choose, learn } from './brain.js';
import { perceivedCues } from './learned/cues.js';
import { nestOf } from './world.js';
import { edibleCount } from './learned/rules.js';
import { habit } from './habits.js';
import { followPheromone } from './pheromone.js';
import { nestUnder } from './nest.js';
import { rememberPlace, recallPlace, forgetPlace, waterPlaceKind, peekWeight } from './memory.js';
import { energyMax } from './biology.js';
import { isThing, isDry } from './things.js';
import { conceptsOf, noteSeen } from './concepts.js';
import { saltUrge } from './taste.js';

// The nearest visible pool. Water isn't learned: it's instinct.
function nearestWater(fagi, world) {
  let best = null;
  let bestDist = Infinity;
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    if (!seesObject(fagi, o, radiusOf(o), world)) continue;
    const d = distanceTo(fagi, o);
    if (d < bestDist) { bestDist = d; best = o; }
  }
  return best;
}

function nearestVisible(fagi, world, predicate) {
  let best = null;
  let bestDist = Infinity;
  for (const object of world.objects) {
    if (!predicate(object) || !seesObject(fagi, object, radiusOf(object), world)) continue;
    const dist = distanceTo(fagi, object);
    if (dist < bestDist) { bestDist = dist; best = object; }
  }
  return best;
}

// Seeing water memorizes it and confirms where it is. If she doesn't see it, she keeps what
// she remembers, which gets less and less precise (memory.js keeps blurring it).
//
// She remembers two places separately: the lake ('water'), which doesn't dry up, and the last
// rain puddle she saw ('puddle'), which does. That a puddle has dried up she doesn't
// know until she goes, looks where she remembered it and doesn't see it: then she forgets it,
// has to look for water again and learns that a puddle shouldn't be trusted
// that much (belief 'puddle'; drinking from one raises it, needs.js) and how long they take to
// dry up (brain.puddleLife).
function rememberWater(fagi, world, visible, range) {
  if (visible) {
    const kind = waterPlaceKind(visible);
    const before = recallPlace(fagi.brain, kind);
    rememberPlace(fagi.brain, kind, visible, fagi.age);
    if (!before || before.ref !== visible) fagi.waterFound = (fagi.waterFound ?? 0) + 1;
  }

  const lake = recallPlace(fagi.brain, 'water');
  if (lake && !world.objects.includes(lake.ref)) forgetPlace(fagi.brain, 'water');   // it was removed from the map

  const puddle = recallPlace(fagi.brain, 'puddle');
  const near = puddle && Math.hypot(puddle.x - fagi.x, puddle.y - fagi.y) < range * 0.6;
  if (puddle && near && !world.objects.includes(puddle.ref)) {
    // How long since she saw it: from that she learns how long a puddle usually lasts.
    const age = fagi.age - puddle.lastAt;
    const life = fagi.brain.puddleLife;
    fagi.brain.puddleLife = life == null ? age : life + RAIN.puddleLifeRate * (age - life);
    forgetPlace(fagi.brain, 'puddle');
    fagi.puddleGone = (fagi.puddleGone ?? 0) + 1;
    learn(fagi.brain, 'puddle', -RAIN.puddleLesson, fagi.age);
  }

  // Of what she remembers, whatever is closest. A place with little confidence isn't
  // discarded: it goes on the list and the score decides. If she learned that
  // puddles dry up, a remembered one seems that much farther away.
  //
  // And if she has already found dry puddles, she knows roughly how long they last: one
  // seen longer ago than that she takes as dry as long as she has other water to remember.
  let places = ['water', 'puddle'].map((k) => recallPlace(fagi.brain, k)).filter(Boolean);
  const life = fagi.brain.puddleLife;
  const expired = (p) => p.ref?.type === 'puddle' && life != null && fagi.age - p.lastAt > life;
  if (places.length > 1) places = places.filter((p) => !expired(p));
  const wariness = 1 + Math.max(0, -peekWeight(fagi.brain, 'puddle'));
  const farness = (p) => distanceTo(fagi, p) * (p.ref?.type === 'puddle' ? wariness : 1);
  const placeOf = places.sort((a, b) => farness(a) - farness(b))[0] ?? null;
  return { pool: visible ?? placeOf, place: placeOf };
}

// With SOURCES a tree is a food source to her only once she has seen fruit
// lying around it: then she remembers it, and which fruit it was.
function learnSources(fagi, world) {
  const known = (fagi.brain.sources ??= {});
  for (const { point } of seenPoints(fagi, world.points, world)) {
    for (const o of world.objects) {
      if (!isTree(o) || Math.hypot(o.x - point.x, o.y - point.y) > radiusOf(o) * SOURCES.near) continue;
      if (!known[o.id]) fagi.brain.lastSource = { n: (fagi.brain.lastSource?.n ?? 0) + 1, id: o.id, fruit: point.type };
      known[o.id] = { fruit: point.type, x: o.x, y: o.y, at: fagi.age };
    }
  }
  return known;
}

function rememberFoodSource(fagi, world) {
  const known = SOURCES.enabled ? learnSources(fagi, world) : null;
  const isSource = known ? (o) => isTree(o) && Boolean(known[o.id]) : isTree;
  const visible = nearestVisible(fagi, world, isSource);
  let smelled = null;
  let strength = 0;
  for (const object of world.objects) {
    if (!isTree(object)) continue;
    const current = scentStrengthOfObject(fagi, object, world);
    if (current > strength) { smelled = object; strength = current; }
  }
  if (visible) rememberPlace(fagi.brain, 'foodSource', visible, fagi.age);
  const place = recallPlace(fagi.brain, 'foodSource');
  if (place && !world.objects.includes(place.ref)) {
    forgetPlace(fagi.brain, 'foodSource');
    return { visible: null, source: null, smelled, strength };
  }
  return { visible, source: visible ?? place, smelled, strength };
}

// What pushes a worker to go out for food: her hunger or what the pantry
// is missing as she remembers it (fagi.pantry), whichever is greater.
// What a tree drops: its own species on a map with chemistry, nectar otherwise.
// With SOURCES, what she has seen lying under it.
const fruitOf = (tree, fagi = null) => (SOURCES.enabled && fagi
  ? fagi.brain.sources?.[tree?.id]?.fruit ?? tree?.fruit ?? TREE.fruit
  : tree?.fruit ?? TREE.fruit);

function forageNeed(fagi, hungerU) {
  const missing = 1 - Math.min(1, edibleCount(fagi, fagi.pantry) / habit(fagi, 'reserve'));
  return Math.max(hungerU, NEST.forageDrive * missing);
}

function buildCandidates(fagi, world, {
  hungerU, thirstU, range, visible, pool, place: placeOf, visibleSource, source, smelledSource, sourceStrength,
}) {
  const nestObj = nestOf(world);
  const forage = forageNeed(fagi, hungerU);
  // If something comes in through both senses, sight wins (it's more precise).
  const byRef = new Map();
  // What floats in deep water isn't chased if she already knows what going in there means.
  const fears = fearsDeep(fagi);
  const add = (c) => {
    if (fears && c.kind === 'food' && waterZone(world, c.ref.x, c.ref.y)?.deep) return;
    const already = byRef.get(c.ref);
    if (!already || (already.via === 'smell' && c.via === 'sight')) byRef.set(c.ref, c);
  };

  const seen = seenPoints(fagi, world.points, world);
  for (const { point, dist } of seen) {
    // Hunger pulls her to food; salt hunger, to what she knows tastes salty (taste.js).
    add({ key: point.type, kind: 'food', ref: point, dist, range, urgency: Math.max(hungerU, saltUrge(fagi, point.type)), via: 'sight', penalty: 0,
          cues: perceivedCues(point.type, 'sight') });
  }

  const smelledOnes = smelledPoints(fagi, world);
  for (const { point, force } of smelledOnes) {
    // By smell she doesn't know how far away it is: only whether it smells strong or faint.
    const aroma = aromaOf(fagi, point.type);
    add({ key: point.type, kind: 'food', ref: point, dist: (1 - force) * aroma, range: aroma,
          urgency: hungerU, via: 'smell', penalty: BRAIN.smellPenalty, force,
          cues: perceivedCues(point.type, 'smell') });
  }

  if (smelledSource && !visibleSource) {
    const fruit = fruitOf(smelledSource);
    const aroma = aromaOf(fagi, fruit);
    add({
      key: fruit, kind: 'food', ref: smelledSource, cues: perceivedCues(fruit, 'smell'),
      dist: (1 - sourceStrength) * aroma, range: aroma,
      urgency: hungerU, via: 'smell', penalty: BRAIN.smellPenalty,
      force: sourceStrength, source: true,
    });
  }


  // A tree she has seen is remembered as a renewable source. Its area is chased only
  // when we're not already under its crown; there the actual fruits take over. What
  // pulls her there is her own hunger or the colony's, whichever is greater.
  if (source && forage > 0.15 && (!smelledSource || visibleSource)) {
    const realOne = visibleSource ?? source.ref;
    const dist = Math.max(0, distanceTo(fagi, source) - radiusOf(realOne));
    if (dist > FAGI.eatRadius * 2) {
      const via = visibleSource ? 'sight' : 'memory';
      const doubt = via === 'memory' ? (source.error ?? 0) / MEMORY.placeErrorMax : 0;
      const fruit = fruitOf(realOne, fagi);
      add({
        key: fruit, kind: 'food', ref: source, dist, cues: perceivedCues(fruit, via),
        range: via === 'sight' ? range : MEMORY.travelRange,
        urgency: forage, via, source: true,
        penalty: via === 'sight' ? 0 : BRAIN.smellPenalty * (1 + doubt),
      });
    }
  }

  // Her own trail under the antennae, in the direction leading away from the nest.
  // It's one more candidate: whether following it is worth it is said by what she has learned
  // (the belief 'pheromone'), not by a rule. It's right underneath: distance 0.
  if (nestObj && forage > 0) {
    const mark = followPheromone(world, fagi, Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y), true);
    if (mark) {
      add({ key: 'pheromone', kind: 'trail', ref: mark, dist: 0, range: 1,
            urgency: forage, via: 'antennae', penalty: 0 });
    }
  }

  // With barely any thirst, water doesn't even make the list: she doesn't circle the pool for fun.
  if (pool && !fagi.drinking && thirstU > THIRST.ignoreBelow) {
    const realOne = visible ?? pool.ref;
    // For water the distance is measured to the edge: a big pool is reached sooner.
    const d = Math.max(0, distanceTo(fagi, pool) - radiusOf(realOne));
    // Without seeing it, if she remembers well where it is she goes from memory, straight there; only if the
    // memory is already blurred does she trust her nose more and follow the plume.
    const fuzzy = (pool.error ?? 0) > range / 2;
    const via = visible ? 'sight' : (fuzzy && smellsObject(fagi, realOne, world) ? 'smell' : 'memory');
    // Going from memory is penalized double: she doesn't perceive it AND she may be wrong
    // about where it was, all the more the longer she's gone without seeing it.
    const placeDoubt = via === 'memory' ? (pool.error ?? 0) / MEMORY.placeErrorMax : 0;
    // The distance is measured against whatever applies: what she sees, against her sight; what
    // she smells, against the reach of the smell; what she remembers, against what she
    // finds reasonable to walk.
    //
    // Even if she follows it by smell, she still remembers roughly where it is:
    // smelling it can't push it farther away. Without this, on entering the plume the remembered
    // water suddenly scored much worse, she dropped it, left the plume and
    // came back for it, in a loop, until she died of thirst 250 px from the lake.
    //
    // And the same with sight: a small pool is seen from close up, and if seeing it
    // measured it against sight it scored worse than remembering it. She dropped it on
    // seeing it, turned around, remembered it and came back, never getting there.
    const scaleOf = via === 'smell' ? (placeOf ? MEMORY.travelRange : aromaOf(fagi, 'water'))
      : via === 'memory' ? MEMORY.travelRange
      : placeOf ? Math.max(range, MEMORY.travelRange) : range;
    add({ key: 'water', kind: 'water', ref: pool, dist: d, range: scaleOf,
          urgency: thirstU, via,
          penalty: via === 'sight' ? 0 : BRAIN.smellPenalty + placeDoubt * BRAIN.smellPenalty });
  }

  return { candidates: [...byRef.values()], seen, smelledOnes };
}

// The things she sees (things.js): only how they look, and whether they look
// dry. Seeing one is enough for its kind to exist for her, and for her to
// remember where it was.
function seeThings(fagi, world) {
  const concepts = conceptsOf(fagi);
  const out = [];
  for (const o of world.objects) {
    if (!isThing(o) || !o.look || !seesObject(fagi, o, radiusOf(o), world)) continue;
    const dry = isDry(world, o);
    noteSeen(concepts, o, dry, fagi.age);
    out.push({ ref: o, key: o.key, look: o.look, dist: distanceTo(fagi, o), dry });
  }
  return out.sort((a, b) => a.dist - b.dist);
}

// Full snapshot of the situation, ready for the rules to decide on.
export function perceive(fagi, world) {
  const thirstU = fagi.thirst / THIRST.max;
  const hungerU = fagi.hunger / HUNGER.max;
  const range = viewRangeOf(fagi);
  const visible = nearestWater(fagi, world);
  const { pool, place: placeOf } = rememberWater(fagi, world, visible, range);
  const {
    visible: visibleSource, source, smelled: smelledSource, strength: sourceStrength,
  } = rememberFoodSource(fagi, world);

  const { candidates, seen, smelledOnes } =
    buildCandidates(fagi, world, {
      hungerU, thirstU, range, visible, pool, place: placeOf, visibleSource, source, smelledSource, sourceStrength,
    });
  const { best, ranked } = choose(fagi.brain, candidates);

  return {
    thirstU, hungerU, range, visible, pool, candidates, seen, smelledOnes, best, ranked,
    energyU: fagi.energy / energyMax(fagi),
    nest: nestOf(world), source, visibleSource,
    inNest: Boolean(nestUnder(fagi, world)),
    waterPlace: placeOf,
    smellsWater: Boolean(pool) && smellsObject(fagi, visible ?? pool.ref, world),
    things: CONCEPT.enabled ? seeThings(fagi, world) : null,
  };
}
