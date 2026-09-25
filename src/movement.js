// Cómo se mueve Fagi: girar, avanzar, esquivar, explorar y rastrear un olor.
// Nada de esto decide A DÓNDE ir; solo ejecuta el movimiento.

import { FAGI, ENERGY, EXPLORE, WORLD } from './config.js';
import { angleTo, normalizeAngle } from './vision.js';
import { statMult } from './effects.js';
import { pushOutOfBlocks, avoidanceTurn } from './obstacles.js';
import { scentAt } from './smell.js';
import { exploreTarget } from './explore.js';
import { nestOf } from './world.js';

export function turnTowards(fagi, targetAngle, dt) {
  const diff = normalizeAngle(targetAngle - fagi.angle);
  // El giro acompaña a la velocidad: así el radio de giro no crece con los buffs.
  const turnSpeed = FAGI.turnSpeed * statMult(fagi, 'speed');
  const step = Math.min(Math.abs(diff), turnSpeed * dt);
  fagi.angle = normalizeAngle(fagi.angle + Math.sign(diff) * step);
}

export function advance(fagi, world, dt) {
  // Sin energía se arrastra: no muere, pero le cuesta todo el doble.
  const flojera = fagi.energy <= 0 ? ENERGY.weakSpeed : 1;
  const speed = FAGI.speed * statMult(fagi, 'speed') * flojera;
  fagi.stride += speed * dt;
  fagi.x += Math.cos(fagi.angle) * speed * dt;
  fagi.y += Math.sin(fagi.angle) * speed * dt;

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

export function moveToward(fagi, world, target, dt) {
  // Esquivar una roca manda sobre ir hacia el objetivo.
  const dodge = avoidanceTurn(fagi, world);
  const goal = dodge !== 0 ? fagi.angle + dodge * 0.9 : angleTo(fagi, target);
  turnTowards(fagi, goal, dt);
  // Ya está encima del punto que perseguía: el radio de giro es menor que
  // eatRadius, así que seguir avanzando sería orbitarlo sin llegar a tocarlo.
  // Se para. Al agua y al nido no se les frena: entrar en ellos ya resuelve lo
  // que iba a hacer. Y si hay roca que esquivar, tampoco: primero salir de ella.
  const encima = fagi.targetKind === 'food' && world.points.includes(target)
    && Math.hypot(target.x - fagi.x, target.y - fagi.y) <= FAGI.eatRadius;
  if (dodge === 0 && encima) return;
  advance(fagi, world, dt);
}

// Explorar: se elige una casilla poco conocida y se va a ella como a cualquier
// otro objetivo, esquivando rocas por el camino. Se cambia de casilla al
// pisarla, o cuando lleva demasiado tiempo intentándolo.
export function explore(fagi, world, dt) {
  const destino = fagi.exploreTarget;
  fagi.exploreTimer -= dt;
  const llegó = destino && Math.hypot(destino.x - fagi.x, destino.y - fagi.y) <= EXPLORE.reach;

  if (!destino || llegó || fagi.exploreTimer <= 0) {
    fagi.exploreTarget = exploreTarget(fagi, fagi.explored, nestOf(world));
    fagi.exploreTimer = EXPLORE.giveUp;
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

  const aqui = scentAt(fagi, world, key, fagi.x, fagi.y);
  const izq = scentAt(fagi, world, key, fagi.x + nx * d, fagi.y + ny * d);
  const der = scentAt(fagi, world, key, fagi.x - nx * d, fagi.y - ny * d);

  // Mira también hacia delante: el hilo serpentea, así que no basta el viento.
  const frente = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle) * d, fagi.y + Math.sin(fagi.angle) * d);
  const frenteIzq = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle - 0.7) * d, fagi.y + Math.sin(fagi.angle - 0.7) * d);
  const frenteDer = scentAt(fagi, world, key,
    fagi.x + Math.cos(fagi.angle + 0.7) * d, fagi.y + Math.sin(fagi.angle + 0.7) * d);

  let goal;
  if (aqui > 0 || izq > 0 || der > 0 || frente > 0 || frenteIzq > 0 || frenteDer > 0) {
    // Dentro del rastro: hacia donde el olor sube. Si empata, contra el viento,
    // que es de donde viene lo que huele.
    const opciones = [
      { a: fagi.angle, v: frente },
      { a: fagi.angle - 0.7, v: frenteIzq },
      { a: fagi.angle + 0.7, v: frenteDer },
      { a: upwind, v: Math.max(izq, der, aqui) * 0.9 },
    ];
    const mejor = opciones.reduce((m, o) => (o.v > m.v ? o : m));
    const lado = izq - der;
    const correccion = Math.max(-0.5, Math.min(0.5, lado * 2));
    goal = normalizeAngle((mejor.v > aqui ? mejor.a : upwind) + correccion);
    fagi.trailMemory = FAGI.trailMemory;
    if (lado !== 0) fagi.castSide = Math.sign(lado);
    fagi.lastScent = { x: fagi.x, y: fagi.y };  // aquí olía: punto al que volver
    fagi.tracking = 'en el rastro';
  } else {
    fagi.trailMemory -= dt;
    const vuelta = fagi.lastScent
      ? Math.hypot(fagi.lastScent.x - fagi.x, fagi.lastScent.y - fagi.y)
      : 0;

    if (fagi.lastScent && vuelta > 45) {
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

  const dodge = avoidanceTurn(fagi, world);
  if (dodge !== 0) goal = fagi.angle + dodge * 0.9;
  turnTowards(fagi, goal, dt);
  advance(fagi, world, dt);
  return aqui;
}

