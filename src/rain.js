// The rain. Every so often a short shower falls and leaves puddles
// on the ground. Puddles are real water (you can drink from them) but
// shallow —she can always stand there— and they don't last: the sun shrinks them until
// they dry up. Whoever remembers a puddle has to go looking for water again when
// she gets there and it's gone (perception.js).
//
// While it rains, moreover, the water erases the pheromone (pheromone.js) and soaks
// whoever is out in the open (swim.js).
//
// Before each shower the front arrives: the air pressure drops for
// RAIN.front seconds, stays low while it rains and recovers when it clears
// (rain.drop: 0 = normal, 1 = lowest). It's the signal Fagi can
// notice (weather.js); that it announces water she has to learn.

import { RAIN, WORLD, MAPGEN } from './config.js';
import { addObject, removeObject, record } from './world.js';
import { radiusOf } from './obstacles.js';

const between = ({ min, max }) => min + Math.random() * (max - min);

// The first shower is drawn on the first step, not when creating the world: that way creating
// the world doesn't use up randomness and the map comes out the same with the same seed.
export function createRain() {
  return { on: false, timer: null, front: 0, drop: 0, left: 0, pending: 0, spawnIn: 0, n: 0 };
}

export const isPuddle = (o) => o.type === 'puddle';

// A free spot for a puddle: inside the map and not overlapping anything else.
function freeSpot(world, r) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
    const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
    const collides = world.objects.some((o) => Math.hypot(o.x - x, o.y - y) < r + radiusOf(o) + 6);
    if (!collides) return { x, y };
  }
  return null;
}

function newPuddle(world) {
  const [min, max] = RAIN.puddleRadius;
  const r = Math.round(min + Math.random() * (max - min));
  const place = freeSpot(world, r);
  if (place) addObject(world, place.x, place.y, 'puddle', r, 'rain');
}

// Draws the next shower and how far ahead of it the front comes.
function next(rain) {
  rain.timer = between(RAIN.every);
  rain.front = Math.min(rain.timer, between(RAIN.front));
}

// Starts raining now (the normal clock, or the settings button).
export function startRain(world) {
  const rain = (world.rain ??= createRain());
  if (rain.on) return;
  rain.on = true;
  rain.n += 1;
  rain.left = between(RAIN.duration);
  // Puddles don't appear all at once: they form while it falls.
  rain.pending = Math.round(between(RAIN.puddles));
  rain.spawnIn = rain.left / (rain.pending + 1);
  record(world, 'rain', { on: true });
}

export function updateRain(world, dt) {
  const rain = (world.rain ??= createRain());

  if (!rain.on) {
    if (rain.timer == null) next(rain);
    rain.timer -= dt;
    // After it clears the pressure rises little by little; as the front approaches, it drops.
    const front = rain.front > 0 ? Math.max(0, 1 - rain.timer / rain.front) : 0;
    const returns = Math.max(0, rain.drop - dt / Math.max(1e-6, RAIN.recover));
    rain.drop = Math.min(1, Math.max(front, returns));
    if (rain.timer <= 0) startRain(world);
  } else {
    rain.drop = 1;
    rain.left -= dt;
    rain.spawnIn -= dt;
    if (rain.pending > 0 && rain.spawnIn <= 0) {
      newPuddle(world);
      rain.pending -= 1;
      rain.spawnIn = rain.left / (rain.pending + 1);
    }
    if (rain.left <= 0) {
      rain.on = false;
      next(rain);
      record(world, 'rain', { on: false });
    }
  }

  // While raining, puddles grow; in the sun, they shrink until they dry up.
  const max = RAIN.puddleRadius[1] * 1.3;
  // `size` keeps the fine count; `r`, what's seen and recorded, is in whole px.
  for (const o of [...world.objects]) {
    if (!isPuddle(o)) continue;
    o.size = (o.size ?? o.r) + (rain.on ? RAIN.grow : -RAIN.evaporate) * dt;
    o.size = Math.min(max, o.size);
    if (o.size < RAIN.minRadius) { removeObject(world, o, 'dried'); continue; }
    const r = Math.round(o.size);
    if (r !== o.r) { o.r = r; record(world, 'obj_resize', { id: o.id, r }); }
  }
}
