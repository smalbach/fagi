// The three gauges that keep Fagi alive (or not): hunger, thirst and energy.

import { loadEffort } from './load.js';
import { HUNGER, THIRST, ENERGY, WATER, RAIN, NEST } from './config.js';
import { statMult } from './effects.js';
import { waterZone } from './obstacles.js';
import { nestUnder } from './nest.js';
import { rememberPlace, waterPlaceKind } from './memory.js';
import { snapshotBody } from './interoception.js';
import { openEpisode, closeOnDeath } from './episodes.js';
import { learn } from './brain.js';
import { hungerCause } from './appetite.js';
import { oldAge } from './lifecycle.js';
import { woundsCause } from './health.js';
import { bodyOf, energyMax } from './biology.js';
import { thermalFactors, thermalDeath } from './thermal.js';

// The turn first allows drinking, eating or using the pantry and only afterwards
// settles whether a need reached its limit. That way touching the resource at the last
// instant saves Fagi instead of killing her before she can use it.
// Sleeping in the nest she spends little and, with the humid air inside, she barely
// dries out: hunger and thirst rise much more slowly (NEST.restHunger/Thirst).
// That's why she can wait for it to clear; if the rain drags on and she gets
// hungry, she eats from the pantry (nest.js).
// Her body sets the pace too: a faster metabolism burns more, the cold burns
// reserves and the heat dries her out (thermal.js). All ones without the organism.
export function increaseNeeds(fagi, world, dt) {
  const sleeping = fagi.thought?.action === 'rest' && !fagi.swimming && Boolean(nestUnder(fagi, world));
  const metabolism = bodyOf(fagi).metabolism;
  const heat = thermalFactors(fagi);
  fagi.hunger += HUNGER.rate * statMult(fagi, 'hungerRate') * metabolism * heat.hunger * (sleeping ? NEST.restHunger : 1) * dt;
  fagi.thirst += THIRST.rate * heat.thirst * (sleeping ? NEST.restThirst : 1) * dt;
}

export function resolveVitalFailure(fagi) {
  // If both reach the limit on the same turn, report the one that overshot more
  // in proportion to its maximum. Keeps the order of the code from deciding the cause.
  // Cold or heat kill only if hunger and thirst have not already.
  const hungerOverflow = fagi.hunger / HUNGER.max;
  const thirstOverflow = fagi.thirst / THIRST.max;
  const thermal = hungerOverflow < 1 && thirstOverflow < 1 ? thermalDeath(fagi) ?? woundsCause(fagi) ?? (oldAge(fagi) ? 'age' : null) : null;
  if (hungerOverflow < 1 && thirstOverflow < 1 && !thermal) return false;

  fagi.alive = false;
  fagi.cause = thermal ?? (thirstOverflow > hungerOverflow ? 'thirst' : hungerCause(fagi));
  fagi.hunger = Math.min(fagi.hunger, HUNGER.max);
  fagi.thirst = Math.min(fagi.thirst, THIRST.max);
  // If she died with a recent bite in her body, that bite takes the blame.
  closeOnDeath(fagi);
  return true;
}

// She drinks in the shallows, where she can stand. In deep water she doesn't drink: she flails. Water never runs out.
export function drink(fagi, world, dt) {
  const zone = waterZone(world, fagi.x, fagi.y);
  const pool = zone && !zone.deep ? zone.pool : null;
  const starts = Boolean(pool) && !fagi.drinking;
  fagi.drinking = Boolean(pool);
  if (!pool) return;
  fagi.homeSearched = false;   // she found water: the next search starts at home again

  // Starting to drink opens an experience: it's judged after drinking for a while, by
  // how much thirst it really removed. Drinking without thirst teaches nothing, because she
  // feels nothing.
  if (starts) {
    const ep = openEpisode(fagi, { action: 'drink', key: 'water', before: snapshotBody(fagi) });
    ep.thirstAtStart = fagi.thirst;
    // Arriving thirsty at a puddle and finding water: puddles are useful.
    if (waterPlaceKind(pool) === 'puddle' && fagi.thirst / THIRST.max > THIRST.ignoreBelow) {
      learn(fagi.brain, 'puddle', RAIN.puddleLesson, fagi.age);
    }
  }

  // Drinking here confirms the place: she knows exactly where it is again.
  rememberPlace(fagi.brain, waterPlaceKind(pool), pool, fagi.age);

  fagi.thirst = Math.max(0, fagi.thirst - THIRST.drinkRate * dt);
  fagi.drunk += dt;
}

// She spends energy walking and recovers it standing still. In the nest she rests better.
// In deep water she flails: she spends three times as much and there's no way to rest.
export function spendEnergy(fagi, world, dt, isMoving) {
  const inNest = Boolean(nestUnder(fagi, world));

  if (fagi.swimming) {
    fagi.energy -= ENERGY.drain * WATER.swimEffort * dt;
  } else if (isMoving) {
    // In the rain, outside the nest, every drop shakes her about: it costs more.
    const drops = fagi.raining && !inNest ? RAIN.effort : 1;
    fagi.energy -= ENERGY.drain * statMult(fagi, 'speed') * drops * (bodyOf(fagi).drain ?? bodyOf(fagi).metabolism) * loadEffort(fagi) * dt;
  } else {
    fagi.energy += (inNest ? ENERGY.restNest : ENERGY.restOutside) * dt;
  }
  fagi.energy = Math.max(0, Math.min(energyMax(fagi), fagi.energy));
}
