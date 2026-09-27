// Cómo se mueve Fagi: girar, avanzar, esquivar, explorar y rastrear un olor.
// Nada de esto decide A DÓNDE ir; solo ejecuta el movimiento.

import { FAGI, ENERGY, EXPLORE, WORLD, WATER, INSTINCT } from './config.js';
import { angleTo, normalizeAngle } from './vision.js';
import { statMult } from './effects.js';
import { pushOutOfBlocks, avoidanceTurn, segmentBlocked, deepBlocked, waterZone, shorePoint, poolOf, radiusOf } from './obstacles.js';
import { scentAt } from './smell.js';
import { waypointInView } from './explore.js';
import { nestOf } from './world.js';
import { fearsDeep } from './swim.js';

export function turnTowards(fagi, targetAngle, dt) {
  const diff = normalizeAngle(targetAngle - fagi.angle);
  // El giro acompaña a la velocidad: así el radio de giro no crece con los buffs.
  const turnSpeed = FAGI.turnSpeed * statMult(fagi, 'speed');
  const step = Math.min(Math.abs(diff), turnSpeed * dt);
  fagi.angle = normalizeAngle(fagi.angle + Math.sign(diff) * step);
}

// Lo que frena el suelo que pisa: nada en seco, el barro del vado, y el hondo,
// donde la tensión superficial la atrapa y apenas avanza pataleando.
// Con las antenas sobre el hondo avanza tanteando, y empapada va lastrada
// hasta secarse. Al notar que se acerca un frente, se apresura.
function drag(world, fagi) {
  const zone = waterZone(world, fagi.x, fagi.y);
  let f = !zone ? 1 : zone.deep ? WATER.swimSpeed : WATER.wadeSpeed;
  if (zone?.deep) return f;
  if (fagi.probing) f *= WATER.probeSpeed;
  if (fagi.wet > 0) f *= 1 - (1 - WATER.wetSpeed) * (fagi.wet / WATER.dryTime);
  // Nota que baja la presión: instinto de darse prisa (INSTINCT.pressureHaste).
  if (fagi.pressureFalling) f *= 1 + INSTINCT.pressureHaste * fagi.pressure;
  return f;
}

// Quien ya aprendió lo que es el hondo no pone la pata en él: las antenas tocan
// el agua y se frena en el borde. Planear el rodeo (rumbo, más abajo) evita la
// mayoría de las veces llegar hasta aquí; esto cubre lo que el plan no ve, como
// el radio de giro al rozar la orilla.
//
// Solo la frena: el rumbo lo sigue decidiendo quien lo decidía. Si el reflejo
// también girase, podría llevarle la contraria al plan (el plan gira por dentro
// para dar media vuelta, el reflejo la devuelve de cara al otro lado) y
// quedarse clavada en la orilla. Si aun así lleva un rato topando, se da la
// vuelta hacia fuera: nunca se queda ahí para siempre.
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
  // Sin energía se arrastra: no muere, pero le cuesta todo el doble.
  const weakness = fagi.energy <= 0 ? ENERGY.weakSpeed : 1;
  const speed = FAGI.speed * statMult(fagi, 'speed') * weakness * drag(world, fagi);
  const before = { x: fagi.x, y: fagi.y };
  fagi.stride += speed * dt;
  fagi.x += Math.cos(fagi.angle) * speed * dt;
  fagi.y += Math.sin(fagi.angle) * speed * dt;
  brakeAtEdge(fagi, world, before, dt);

  // Rebota en los bordes del mundo.
  if (fagi.x < FAGI.radius || fagi.x > WORLD.width - FAGI.radius) {
    fagi.x = Math.min(WORLD.width - FAGI.radius, Math.max(FAGI.radius, fagi.x));
    fagi.angle = normalizeAngle(Math.PI - fagi.angle);
  }
  if (fagi.y < FAGI.radius || fagi.y > WORLD.height - FAGI.radius) {
    fagi.y = Math.min(WORLD.height - FAGI.radius, Math.max(FAGI.radius, fagi.y));
    fagi.angle = normalizeAngle(-fagi.angle);
  }

  // Si acabó dentro de una roca, sale de ella y se desvía.
  if (pushOutOfBlocks(fagi, world)) {
    fagi.angle = normalizeAngle(fagi.angle + (Math.random() > 0.5 ? 1 : -1) * 0.9);
  }
}

// ¿Hay paso de A a B? Las rocas cortan siempre; el hondo, solo a quien ya
// aprendió a temerlo. `margin` es el cuerpo: ¿cabe, no solo un rayo?
function closed(fagi, world, bx, by, margin) {
  return segmentBlocked(world, fagi.x, fagi.y, bx, by, margin)
    || (fearsDeep(fagi) && deepBlocked(world, fagi.x, fagi.y, bx, by, margin && WATER.shallows / 2));
}

// ¿Cabe el cuerpo por ahí? Mira un trecho corto en esa dirección.
function gap(fagi, world, a) {
  const look = FAGI.radius + 34;
  return !closed(fagi, world, fagi.x + Math.cos(a) * look, fagi.y + Math.sin(a) * look, FAGI.radius);
}

// El primer rumbo libre girando desde `base` hacia `side`, a pasos de 15°.
function firstGap(fagi, world, base, side) {
  for (let k = 0; k <= 12; k++) {
    const a = base + side * k * (Math.PI / 12);
    if (gap(fagi, world, a)) return { a, k };
  }
  return null;
}

// Rodear. Si la recta al objetivo cruza una roca, elige un lado al toparse
// (el que antes deja paso) y lo MANTIENE hasta volver a tener el objetivo a la
// vista. Decidir el lado en cada frame la hacía ir y venir a lo largo de un
// muro sin llegar nunca a su final. Así bordean las hormigas un obstáculo.
function headingOf(fagi, world, target) {
  // Al agua se va a la orilla más cercana, no al centro: se bebe desde el vado.
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
  // Rodear la roca manda sobre ir en línea recta. Si ni así hay hueco, el
  // esquive de siempre, que al menos la saca de ahí.
  const goal = headingOf(fagi, world, target);
  const dodge = goal == null ? avoidanceTurn(fagi, world, fearsDeep(fagi)) || 1 : 0;
  turnTowards(fagi, goal ?? fagi.angle + dodge * 0.9, dt);
  // Ya está encima del punto que perseguía: el radio de giro es menor que
  // eatRadius, así que seguir avanzando sería orbitarlo sin llegar a tocarlo.
  // Se para. Al agua y al nido no se les frena: entrar en ellos ya resuelve lo
  // que iba a hacer. Y si hay roca que esquivar, tampoco: primero salir de ella.
  const above = fagi.targetKind === 'food' && world.points.includes(target)
    && Math.hypot(target.x - fagi.x, target.y - fagi.y) <= FAGI.eatRadius;
  if (dodge === 0 && above) return;
  advance(fagi, world, dt);
}

// Explorar por tramos: va a un punto que ve (explore.js/waypointInView) y, al
// llegar, elige el siguiente con lo que tenga delante entonces. El tramo se
// replantea antes si una roca se cruza en medio o si lleva demasiado.
//
// Si vuelve a explorar después de que algo la apartara (fagi.exploreResume),
// el tramo que dejó a medias entra en la decisión como una opción más, contra
// los puntos que ve ahora. Si ya no vale (lo alcanzó, se tapó o lo abandonó
// por tiempo), no entra.
export function explore(fagi, world, dt) {
  const destination = fagi.exploreTarget;
  fagi.exploreTimer -= dt;
  const arrived = destination && Math.hypot(destination.x - fagi.x, destination.y - fagi.y)
    <= (destination.inView ? EXPLORE.waypointReach : EXPLORE.reach);
  const covered = destination?.inView && closed(fagi, world, destination.x, destination.y, 0);
  const valid = destination && !arrived && !covered && fagi.exploreTimer > 0;

  if (!valid || fagi.exploreResume) {
    const prior = fagi.exploreResume && valid && destination.inView ? destination : null;
    fagi.exploreTarget = waypointInView(fagi, fagi.explored, nestOf(world), world, prior);
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

// Rastrear un olor (anemotaxis, como un insecto de verdad):
//   1. avanza CONTRA el viento, que es de donde viene lo que huele;
//   2. compara la concentración a un lado y otro y se corrige hacia la más fuerte,
//      así se pega al hilo de olor en vez de cruzarlo;
//   3. si lo pierde, barre en zigzag perpendicular al viento hasta recuperarlo.
export function trackScent(fagi, world, key, dt) {
  const wind = world.wind;
  const upwind = normalizeAngle(wind.angle + Math.PI);
  const nx = -Math.sin(wind.angle);   // perpendicular al viento
  const ny = Math.cos(wind.angle);
  const d = FAGI.probe;

  const here = scentAt(fagi, world, key, fagi.x, fagi.y);
  const left = scentAt(fagi, world, key, fagi.x + nx * d, fagi.y + ny * d);
  const right = scentAt(fagi, world, key, fagi.x - nx * d, fagi.y - ny * d);

  // Mira también hacia delante: el hilo serpentea, así que no basta el viento.
  const front = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle) * d, fagi.y + Math.sin(fagi.angle) * d);
  const frontLeft = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle - 0.7) * d, fagi.y + Math.sin(fagi.angle - 0.7) * d);
  const frontRight = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle + 0.7) * d, fagi.y + Math.sin(fagi.angle + 0.7) * d);

  let goal;
  if (here > 0 || left > 0 || right > 0 || front > 0 || frontLeft > 0 || frontRight > 0) {
    // Dentro del rastro: hacia donde el olor sube. Si empata, contra el viento,
    // que es de donde viene lo que huele.
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
    fagi.lastScent = { x: fagi.x, y: fagi.y };  // aquí olía: punto al que volver
    fagi.tracking = 'en el rastro';
  } else {
    fagi.trailMemory -= dt;
    const turnBack = fagi.lastScent
      ? Math.hypot(fagi.lastScent.x - fagi.x, fagi.lastScent.y - fagi.y)
      : 0;

    if (fagi.lastScent && turnBack > 45) {
      // Se ha salido del hilo: vuelve al último sitio donde olía algo.
      goal = Math.atan2(fagi.lastScent.y - fagi.y, fagi.lastScent.x - fagi.x);
      fagi.tracking = 'vuelve a donde olía';
    } else {
      // Ya está en la zona: barre de lado a lado cruzando el viento, como una
      // polilla que ha perdido el rastro.
      fagi.castTimer -= dt;
      if (fagi.castTimer <= 0) {
        fagi.castSide *= -1;
        fagi.castTimer = FAGI.castEvery;
      }
      goal = normalizeAngle(upwind + fagi.castSide * FAGI.castTurn);
      fagi.tracking = 'barriendo, lo perdió';
    }
  }

  const dodge = avoidanceTurn(fagi, world, fearsDeep(fagi));
  if (dodge !== 0) goal = fagi.angle + dodge * 0.9;
  turnTowards(fagi, goal, dt);
  advance(fagi, world, dt);
  return here;
}

