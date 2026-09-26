// Cómo se mueve Fagi: girar, avanzar, esquivar, explorar y rastrear un olor.
// Nada de esto decide A DÓNDE ir; solo ejecuta el movimiento.

import { FAGI, ENERGY, EXPLORE, WORLD, WATER } from './config.js';
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
// hasta secarse.
function arrastre(world, fagi) {
  const zona = waterZone(world, fagi.x, fagi.y);
  let f = !zona ? 1 : zona.deep ? WATER.swimSpeed : WATER.wadeSpeed;
  if (zona?.deep) return f;
  if (fagi.probing) f *= WATER.probeSpeed;
  if (fagi.wet > 0) f *= 1 - (1 - WATER.wetSpeed) * (fagi.wet / WATER.dryTime);
  return f;
}

// Quien ya aprendió lo que es el hondo no pone la pata en él: las antenas tocan
// el agua y se frena en el borde, girando a lo largo de la orilla. Planear el
// rodeo (rumbo, más abajo) evita la mayoría de las veces llegar hasta aquí;
// esto cubre lo que el plan no ve, como el radio de giro al rozar la orilla.
function frenarEnElBorde(fagi, world, antes) {
  if (!fearsDeep(fagi)) return;
  const ahora = waterZone(world, fagi.x, fagi.y);
  if (!ahora?.deep || waterZone(world, antes.x, antes.y)?.deep) return;
  fagi.x = antes.x;
  fagi.y = antes.y;
  // Sigue la orilla: se queda con la parte del rumbo que no apunta al agua.
  const nx = antes.x - ahora.pool.x;
  const ny = antes.y - ahora.pool.y;
  const cruz = Math.cos(fagi.angle) * ny - Math.sin(fagi.angle) * nx;
  fagi.angle = normalizeAngle(Math.atan2(ny, nx) + (cruz >= 0 ? -1 : 1) * Math.PI / 2);
}

export function advance(fagi, world, dt) {
  // Sin energía se arrastra: no muere, pero le cuesta todo el doble.
  const flojera = fagi.energy <= 0 ? ENERGY.weakSpeed : 1;
  const speed = FAGI.speed * statMult(fagi, 'speed') * flojera * arrastre(world, fagi);
  const antes = { x: fagi.x, y: fagi.y };
  fagi.stride += speed * dt;
  fagi.x += Math.cos(fagi.angle) * speed * dt;
  fagi.y += Math.sin(fagi.angle) * speed * dt;
  frenarEnElBorde(fagi, world, antes);

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
function cerrado(fagi, world, bx, by, margin) {
  return segmentBlocked(world, fagi.x, fagi.y, bx, by, margin)
    || (fearsDeep(fagi) && deepBlocked(world, fagi.x, fagi.y, bx, by, margin && WATER.vado / 2));
}

// ¿Cabe el cuerpo por ahí? Mira un trecho corto en esa dirección.
function hueco(fagi, world, a) {
  const look = FAGI.radius + 34;
  return !cerrado(fagi, world, fagi.x + Math.cos(a) * look, fagi.y + Math.sin(a) * look, FAGI.radius);
}

// El primer rumbo libre girando desde `base` hacia `side`, a pasos de 15°.
function primerHueco(fagi, world, base, side) {
  for (let k = 0; k <= 12; k++) {
    const a = base + side * k * (Math.PI / 12);
    if (hueco(fagi, world, a)) return { a, k };
  }
  return null;
}

// Rodear. Si la recta al objetivo cruza una roca, elige un lado al toparse
// (el que antes deja paso) y lo MANTIENE hasta volver a tener el objetivo a la
// vista. Decidir el lado en cada frame la hacía ir y venir a lo largo de un
// muro sin llegar nunca a su final. Así bordean las hormigas un obstáculo.
function rumbo(fagi, world, target) {
  // Al agua se va a la orilla más cercana, no al centro: se bebe desde el vado.
  const pool = poolOf(target);
  const meta = pool ? shorePoint(target, radiusOf(pool), fagi, WATER.vado * 0.3) : target;
  const directo = angleTo(fagi, meta);
  if (!cerrado(fagi, world, meta.x, meta.y, FAGI.radius)) {
    fagi.detour = null;
    return directo;
  }
  if (fagi.detour?.target !== target) {
    const izq = primerHueco(fagi, world, directo, -1);
    const der = primerHueco(fagi, world, directo, 1);
    const side = !izq ? 1 : !der ? -1 : izq.k < der.k ? -1 : 1;
    fagi.detour = { target, side };
  }
  return primerHueco(fagi, world, directo, fagi.detour.side)?.a ?? null;
}

export function moveToward(fagi, world, target, dt) {
  // Rodear la roca manda sobre ir en línea recta. Si ni así hay hueco, el
  // esquive de siempre, que al menos la saca de ahí.
  const goal = rumbo(fagi, world, target);
  const dodge = goal == null ? avoidanceTurn(fagi, world, fearsDeep(fagi)) || 1 : 0;
  turnTowards(fagi, goal ?? fagi.angle + dodge * 0.9, dt);
  // Ya está encima del punto que perseguía: el radio de giro es menor que
  // eatRadius, así que seguir avanzando sería orbitarlo sin llegar a tocarlo.
  // Se para. Al agua y al nido no se les frena: entrar en ellos ya resuelve lo
  // que iba a hacer. Y si hay roca que esquivar, tampoco: primero salir de ella.
  const encima = fagi.targetKind === 'food' && world.points.includes(target)
    && Math.hypot(target.x - fagi.x, target.y - fagi.y) <= FAGI.eatRadius;
  if (dodge === 0 && encima) return;
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
  const destino = fagi.exploreTarget;
  fagi.exploreTimer -= dt;
  const llegó = destino && Math.hypot(destino.x - fagi.x, destino.y - fagi.y)
    <= (destino.inView ? EXPLORE.waypointReach : EXPLORE.reach);
  const tapado = destino?.inView && cerrado(fagi, world, destino.x, destino.y, 0);
  const vale = destino && !llegó && !tapado && fagi.exploreTimer > 0;

  if (!vale || fagi.exploreResume) {
    const previo = fagi.exploreResume && vale && destino.inView ? destino : null;
    fagi.exploreTarget = waypointInView(fagi, fagi.explored, nestOf(world), world, previo);
    fagi.exploreLegs = (fagi.exploreLegs ?? 0) + 1;
    fagi.exploreTimer = EXPLORE.giveUp;
    if (previo) {
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

  const dodge = avoidanceTurn(fagi, world, fearsDeep(fagi));
  if (dodge !== 0) goal = fagi.angle + dodge * 0.9;
  turnTowards(fagi, goal, dt);
  advance(fagi, world, dt);
  return aqui;
}

