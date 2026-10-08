// How Fagi moves: turning, advancing, dodging, exploring and tracking a smell.
// None of this decides WHERE to go; it only carries out the movement.

import { loadSpeed } from './load.js';
import { FAGI, ENERGY, EXPLORE, WORLD, WATER, INSTINCT, MOVEMENT } from './config.js';
import { angleTo, normalizeAngle } from './vision.js';
import { statMult } from './effects.js';
import { pushOutOfBlocks, avoidanceTurn, segmentBlocked, deepBlocked, waterZone, shorePoint, poolOf, radiusOf } from './obstacles.js';
import { scentAt } from './smell.js';
import { waypointInView } from './explore.js';
import { nestOf } from './world.js';
import { fearsDeep } from './swim.js';
import { bodyOf } from './biology.js';
import { thermalFactors } from './thermal.js';
import { lifeSpeed } from './lifecycle.js';
import { healthSpeed } from './health.js';
import { saltSpeed } from './taste.js';

// Dynamic crosswind zigzag sweep when searching actively or tracking
export function zigzagHeading(fagi, baseAngle, time) {
  const freq = MOVEMENT?.zigzagFreq ?? 2.2;
  const amp = MOVEMENT?.zigzagAmp ?? 0.35;
  return normalizeAngle(baseAngle + Math.sin(time * freq) * amp);
}

export function turnTowards(fagi, targetAngle, dt) {
  const diff = normalizeAngle(targetAngle - fagi.angle);
  // Turning keeps pace with speed: that way the turning radius doesn't grow with buffs.
  const turnSpeed = FAGI.turnSpeed * statMult(fagi, 'speed');
  const step = Math.min(Math.abs(diff), turnSpeed * dt);
  fagi.angle = normalizeAngle(fagi.angle + Math.sign(diff) * step);
}

// How much the ground she's on slows her down: nothing when dry, the mud of the shallows, and deep water,
// where surface tension traps her and she barely moves forward flailing.
// With her antennae over deep water she moves forward probing, and soaked she's weighed down
// until she dries. When she senses a front coming, she hurries.
function drag(world, fagi) {
  const zone = waterZone(world, fagi.x, fagi.y);
  let f = !zone ? 1 : zone.deep ? WATER.swimSpeed : WATER.wadeSpeed;
  if (zone?.deep) return f;
  if (fagi.probing) f *= WATER.probeSpeed;
  if (fagi.wet > 0) f *= 1 - (1 - WATER.wetSpeed) * (fagi.wet / WATER.dryTime);
  // She notices the pressure dropping: instinct to hurry (INSTINCT.pressureHaste).
  if (fagi.pressureFalling) f *= 1 + INSTINCT.pressureHaste * fagi.pressure;
  // TODO(climate): snow, rime and frozen mud are only painted (climate-sprite.js,
  // mud-sprite.js). Making them slow her (deep snow slower, frozen mud firmer,
  // dried crust easier) would change the preregistered worlds, so it waits
  // for a sim-side ground state that batch runs can switch off.
  // Heavy ground (world.mud, research worlds only): it slows whoever crosses it,
  // but repeated passage compacts and paves trails over time (niche construction).
  for (const m of world.mud ?? []) {
    const d = Math.hypot(fagi.x - m.x, fagi.y - m.y);
    if (d <= m.r) {
      m.tread = (m.tread ?? 0) + 0.05;
      const paved = Math.min(0.45, (m.tread / 40) * (1 - m.speed));
      f *= (m.speed + paved);
    }
  }
  return f;
}

// Whoever has already learned what deep water is doesn't set a foot in it: the antennae touch
// the water and she stops at the edge. Planning the detour (headingOf, below) avoids
// getting this far most of the time; this covers what the plan doesn't see, like
// the turning radius when brushing the shore.
//
// It only stops her: the heading is still decided by whoever was deciding it. If the reflex
// turned too, it could contradict the plan (the plan turns inwards
// to go back, the reflex turns her to face the other way again) and
// she'd get stuck on the shore. If she still keeps bumping for a while, she turns
// around outwards: she never stays there forever.
function brakeAtEdge(fagi, world, before, dt) {
  if (!fearsDeep(fagi)) return;
  const now = waterZone(world, fagi.x, fagi.y);
  if (!now?.deep || waterZone(world, before.x, before.y)?.deep) {
    fagi.edgeStuck = 0;
    return;
  }
  fagi.x = before.x;
  fagi.y = before.y;
  fagi.edgeStuck = (fagi.edgeStuck ?? 0) + dt;
  if (fagi.edgeStuck > WATER.edgeGiveUp) {
    fagi.angle = Math.atan2(before.y - now.pool.y, before.x - now.pool.x);
    fagi.edgeStuck = 0;
  }
}

export function advance(fagi, world, dt) {
  // Without energy she drags herself: she doesn't die, but everything costs her double.
  const weakness = fagi.energy <= 0 ? ENERGY.weakSpeed : 1;
  // Her own legs (biology.js) and the cold stiffening them (thermal.js).
  const body = bodyOf(fagi).speed * thermalFactors(fagi).speed * lifeSpeed(fagi) * healthSpeed(fagi) * saltSpeed(fagi);
  let speed = FAGI.speed * statMult(fagi, 'speed') * weakness * drag(world, fagi) * body * loadSpeed(fagi);
  if (fagi.cautious) speed *= (MOVEMENT?.crawlSpeed ?? 0.5);
  else if (fagi.sprinting) speed *= (MOVEMENT?.sprintMult ?? 1.35);
  const before = { x: fagi.x, y: fagi.y };
  fagi.stride += speed * dt;
  fagi.x += Math.cos(fagi.angle) * speed * dt;
  fagi.y += Math.sin(fagi.angle) * speed * dt;
  brakeAtEdge(fagi, world, before, dt);

  // Bounces off the edges of the world.
  if (fagi.x < FAGI.radius || fagi.x > WORLD.width - FAGI.radius) {
    fagi.x = Math.min(WORLD.width - FAGI.radius, Math.max(FAGI.radius, fagi.x));
    fagi.angle = normalizeAngle(Math.PI - fagi.angle);
  }
  if (fagi.y < FAGI.radius || fagi.y > WORLD.height - FAGI.radius) {
    fagi.y = Math.min(WORLD.height - FAGI.radius, Math.max(FAGI.radius, fagi.y));
    fagi.angle = normalizeAngle(-fagi.angle);
  }

  // If she ended up inside a rock, she gets out of it and veers off.
  if (pushOutOfBlocks(fagi, world)) {
    fagi.angle = normalizeAngle(fagi.angle + (Math.random() > 0.5 ? 1 : -1) * 0.9);
  }
}

// Is there a way from A to B? Rocks always block; deep water, only for whoever has already
// learned to fear it. `margin` is the body: does it fit, not just a ray?
function closed(fagi, world, bx, by, margin) {
  return segmentBlocked(world, fagi.x, fagi.y, bx, by, margin)
    || (fearsDeep(fagi) && deepBlocked(world, fagi.x, fagi.y, bx, by, margin && WATER.shallows / 2));
}

// Does the body fit through there? Looks a short stretch in that direction.
function gap(fagi, world, a) {
  const look = FAGI.radius + 34;
  return !closed(fagi, world, fagi.x + Math.cos(a) * look, fagi.y + Math.sin(a) * look, FAGI.radius);
}

// The first free heading turning from `base` towards `side`, in 15° steps.
function firstGap(fagi, world, base, side) {
  for (let k = 0; k <= 12; k++) {
    const a = base + side * k * (Math.PI / 12);
    if (gap(fagi, world, a)) return { a, k };
  }
  return null;
}

// Going around. If the straight line to the target crosses a rock, she picks a side on bumping into it
// (the one that clears the way sooner) and KEEPS it until she has the target in
// sight again. Deciding the side every frame made her go back and forth along a
// wall without ever reaching its end. That's how ants skirt an obstacle.
function headingOf(fagi, world, target) {
  // To water she goes to the nearest shore, not the center: drinking happens from the shallows.
  const pool = poolOf(target);
  const meta = pool ? shorePoint(target, radiusOf(pool), fagi, WATER.shallows * 0.3) : target;
  const direct = angleTo(fagi, meta);
  if (!closed(fagi, world, meta.x, meta.y, FAGI.radius)) {
    fagi.detour = null;
    return direct;
  }
  if (fagi.detour?.target !== target) {
    const left = firstGap(fagi, world, direct, -1);
    const right = firstGap(fagi, world, direct, 1);
    const side = !left ? 1 : !right ? -1 : left.k < right.k ? -1 : 1;
    fagi.detour = { target, side };
  }
  return firstGap(fagi, world, direct, fagi.detour.side)?.a ?? null;
}

export function moveToward(fagi, world, target, dt) {
  // Going around the rock wins over going straight. If there's still no gap, the
  // usual dodge, which at least gets her out of there.
  const goal = headingOf(fagi, world, target);
  const dodge = goal == null ? avoidanceTurn(fagi, world, fearsDeep(fagi)) || 1 : 0;
  turnTowards(fagi, goal ?? fagi.angle + dodge * 0.9, dt);
  // She's already on top of the point she was chasing: the turning radius is smaller than
  // eatRadius, so moving on would mean orbiting it without ever touching it.
  // She stops. For water and the nest there's no braking: entering them already settles what
  // she was going to do. Nor if there's a rock to dodge: first get out of it.
  const above = fagi.targetKind === 'food' && world.points.includes(target)
    && Math.hypot(target.x - fagi.x, target.y - fagi.y) <= FAGI.eatRadius;
  if (dodge === 0 && above) return;
  advance(fagi, world, dt);
}

// Exploring in legs: she goes to a point she sees (explore.js/waypointInView) and, on
// arriving, picks the next one from whatever is in front of her then. The leg is
// reconsidered earlier if a rock gets in the way or if it's taking too long.
//
// If she goes back to exploring after something pulled her away (fagi.exploreResume),
// the leg she left half done enters the decision as one more option, against
// the points she sees now. If it's no longer valid (she reached it, it got blocked or she gave it up
// after too long), it doesn't enter.
export function explore(fagi, world, dt) {
  const destination = fagi.exploreTarget;
  fagi.exploreTimer -= dt;
  const arrived = destination && Math.hypot(destination.x - fagi.x, destination.y - fagi.y)
    <= (destination.inView ? EXPLORE.waypointReach : EXPLORE.reach);
  const covered = destination?.inView && closed(fagi, world, destination.x, destination.y, 0);
  const valid = destination && !arrived && !covered && fagi.exploreTimer > 0;

  if (!valid || fagi.exploreResume) {
    const prior = fagi.exploreResume && valid && destination.inView ? destination : null;
    fagi.exploreTarget = waypointInView(fagi, fagi.explored, nestOf(world, fagi), world, prior);
    fagi.exploreLegs = (fagi.exploreLegs ?? 0) + 1;
    fagi.exploreTimer = EXPLORE.giveUp;
    if (prior) {
      const e = fagi.exploreTarget;
      fagi.legChoice = { n: (fagi.legChoice?.n ?? 0) + 1, resumed: e.resumed, score: e.score, rival: e.rival };
    }
    fagi.exploreResume = false;
  }
  moveToward(fagi, world, fagi.exploreTarget, dt);
}

// Tracking a smell (anemotaxis, like a real insect):
//   1. she moves AGAINST the wind, which is where what she smells comes from;
//   2. she compares the concentration on one side and the other and corrects towards the stronger one,
//      so she sticks to the scent thread instead of crossing it;
//   3. if she loses it, she sweeps in a zigzag perpendicular to the wind until she gets it back.
export function trackScent(fagi, world, key, dt) {
  const wind = world.wind;
  const upwind = normalizeAngle(wind.angle + Math.PI);
  const nx = -Math.sin(wind.angle);   // perpendicular to the wind
  const ny = Math.cos(wind.angle);
  const d = FAGI.probe;

  const here = scentAt(fagi, world, key, fagi.x, fagi.y);
  const left = scentAt(fagi, world, key, fagi.x + nx * d, fagi.y + ny * d);
  const right = scentAt(fagi, world, key, fagi.x - nx * d, fagi.y - ny * d);

  // She also looks ahead: the thread meanders, so the wind isn't enough.
  const front = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle) * d, fagi.y + Math.sin(fagi.angle) * d);
  const frontLeft = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle - 0.7) * d, fagi.y + Math.sin(fagi.angle - 0.7) * d);
  const frontRight = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle + 0.7) * d, fagi.y + Math.sin(fagi.angle + 0.7) * d);

  let goal;
  if (here > 0 || left > 0 || right > 0 || front > 0 || frontLeft > 0 || frontRight > 0) {
    // Inside the trail: towards where the smell gets stronger. On a tie, against the wind,
    // which is where what she smells comes from.
    const options = [
      { a: fagi.angle, v: front },
      { a: fagi.angle - 0.7, v: frontLeft },
      { a: fagi.angle + 0.7, v: frontRight },
      { a: upwind, v: Math.max(left, right, here) * 0.9 },
    ];
    const best = options.reduce((m, o) => (o.v > m.v ? o : m));
    const sideOf = left - right;
    const correctionEp = Math.max(-0.5, Math.min(0.5, sideOf * 2));
    goal = normalizeAngle((best.v > here ? best.a : upwind) + correctionEp);
    fagi.trailMemory = FAGI.trailMemory;
    if (sideOf !== 0) fagi.castSide = Math.sign(sideOf);
    fagi.lastScent = { x: fagi.x, y: fagi.y };  // it smelled here: a point to come back to
    fagi.tracking = 'on the trail';
  } else {
    fagi.trailMemory -= dt;
    const turnBack = fagi.lastScent
      ? Math.hypot(fagi.lastScent.x - fagi.x, fagi.lastScent.y - fagi.y)
      : 0;

    if (fagi.lastScent && turnBack > 45) {
      // She has left the thread: she goes back to the last place where she smelled something.
      goal = Math.atan2(fagi.lastScent.y - fagi.y, fagi.lastScent.x - fagi.x);
      fagi.tracking = 'going back to where it smelled';
    } else {
      // She's already in the area: she sweeps from side to side across the wind, like a
      // moth that has lost the trail.
      fagi.castTimer -= dt;
      if (fagi.castTimer <= 0) {
        fagi.castSide *= -1;
        fagi.castTimer = FAGI.castEvery;
      }
      goal = normalizeAngle(upwind + fagi.castSide * FAGI.castTurn);
      fagi.tracking = 'sweeping, lost it';
    }
  }

  const dodge = avoidanceTurn(fagi, world, fearsDeep(fagi));
  if (dodge !== 0) goal = fagi.angle + dodge * 0.9;
  turnTowards(fagi, goal, dt);
  advance(fagi, world, dt);
  return here;
}

