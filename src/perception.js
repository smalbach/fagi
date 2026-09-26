// Qué percibe Fagi en este instante y cómo lo puntúa.
//
// Junta en UNA lista todo lo perseguible: comida vista, comida olida y el agua.
// Cada candidato lleva por qué sentido entró, para que quien decida lo sepa.

import { FAGI, BRAIN, THIRST, HUNGER, ENERGY, MEMORY, TREE } from './config.js';
import { seenPoints, seesObject, viewRangeOf, distanceTo } from './vision.js';
import { smelledPoints, smellsObject, aromaOf, scentStrengthOfObject } from './smell.js';
import { isWater, isTree, radiusOf } from './obstacles.js';
import { choose } from './brain.js';
import { nestOf } from './world.js';
import { nestUnder } from './nest.js';
import { rememberPlace, recallPlace, forgetPlace } from './memory.js';

// El charco visible más cercano. El agua no se aprende: es instinto.
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

// Ver un charco lo memoriza y confirma dónde está. Si no lo ve, se queda con
// lo que recuerda, que es cada vez más impreciso (memory.js lo va difuminando).
function rememberWater(fagi, world, visible) {
  if (visible) {
    const antes = recallPlace(fagi.brain, 'agua');
    rememberPlace(fagi.brain, 'agua', visible, fagi.age);
    if (!antes) fagi.waterFound = (fagi.waterFound ?? 0) + 1;
  }

  const sitio = recallPlace(fagi.brain, 'agua');
  if (sitio && !world.objects.includes(sitio.ref)) {
    forgetPlace(fagi.brain, 'agua');   // ese charco ya no existe
    return { pool: null, sitio: null };
  }
  // Un sitio recordado con poca confianza no se descarta: entra en la lista y
  // que decida la puntuación. Con sed de verdad se va igual, aunque dude.
  return { pool: visible ?? sitio, sitio };
}

function rememberFoodSource(fagi, world) {
  const visible = nearestVisible(fagi, world, isTree);
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

function buildCandidates(fagi, world, {
  hungerU, thirstU, range, visible, pool, visibleSource, source, smelledSource, sourceStrength,
}) {
  // Si algo entra por los dos sentidos, manda la vista (es más precisa).
  const porRef = new Map();
  const add = (c) => {
    const ya = porRef.get(c.ref);
    if (!ya || (ya.via === 'olfato' && c.via === 'vista')) porRef.set(c.ref, c);
  };

  const seen = seenPoints(fagi, world.points, world);
  for (const { point, dist } of seen) {
    add({ key: point.type, kind: 'food', ref: point, dist, range, urgency: hungerU, via: 'vista', penalty: 0 });
  }

  const olidos = smelledPoints(fagi, world);
  for (const { point, fuerza } of olidos) {
    // Por el olfato no sabe a qué distancia está: solo si huele fuerte o flojo.
    const aroma = aromaOf(fagi, point.type);
    add({ key: point.type, kind: 'food', ref: point, dist: (1 - fuerza) * aroma, range: aroma,
          urgency: hungerU, via: 'olfato', penalty: BRAIN.smellPenalty, fuerza });
  }

  if (smelledSource && !visibleSource) {
    const aroma = aromaOf(fagi, TREE.fruit);
    add({
      key: TREE.fruit, kind: 'food', ref: smelledSource,
      dist: (1 - sourceStrength) * aroma, range: aroma,
      urgency: hungerU, via: 'olfato', penalty: BRAIN.smellPenalty,
      fuerza: sourceStrength, source: true,
    });
  }


  // Un árbol visto se recuerda como fuente renovable. Se persigue su zona solo
  // cuando no estamos ya bajo su copa; allí mandan los frutos concretos.
  if (source && hungerU > 0.15 && (!smelledSource || visibleSource)) {
    const real = visibleSource ?? source.ref;
    const dist = Math.max(0, distanceTo(fagi, source) - radiusOf(real));
    if (dist > FAGI.eatRadius * 2) {
      const via = visibleSource ? 'vista' : 'memoria';
      const duda = via === 'memoria' ? (source.error ?? 0) / MEMORY.placeErrorMax : 0;
      add({
        key: TREE.fruit, kind: 'food', ref: source, dist,
        range: via === 'vista' ? range : MEMORY.travelRange,
        urgency: hungerU, via, source: true,
        penalty: via === 'vista' ? 0 : BRAIN.smellPenalty * (1 + duda),
      });
    }
  }

  // Sin sed apenas, el agua ni entra en la lista: no da vueltas al charco por gusto.
  if (pool && !fagi.drinking && thirstU > THIRST.ignoreBelow) {
    const real = visible ?? pool.ref;
    // Al agua se le mide la distancia al borde: un charco grande se alcanza antes.
    const d = Math.max(0, distanceTo(fagi, pool) - radiusOf(real));
    const via = visible ? 'vista' : (smellsObject(fagi, real, world) ? 'olfato' : 'memoria');
    // Ir de memoria penaliza el doble: no lo percibe Y puede estar equivocada
    // sobre dónde estaba, tanto más cuanto más tiempo lleve sin verlo.
    const dudaSitio = via === 'memoria' ? (pool.error ?? 0) / MEMORY.placeErrorMax : 0;
    // La distancia se mide contra lo que toque: lo que ve, contra su vista; lo
    // que huele, contra el alcance del olor; lo que recuerda, contra lo que le
    // parece razonable caminar.
    const escala = via === 'olfato' ? aromaOf(fagi, 'agua')
      : via === 'memoria' ? MEMORY.travelRange
      : range;
    add({ key: 'agua', kind: 'water', ref: pool, dist: d, range: escala,
          urgency: thirstU, via,
          penalty: via === 'vista' ? 0 : BRAIN.smellPenalty + dudaSitio * BRAIN.smellPenalty });
  }

  return { candidatos: [...porRef.values()], seen, olidos };
}

// Foto completa de la situación, lista para que las reglas decidan sobre ella.
export function perceive(fagi, world) {
  const thirstU = fagi.thirst / THIRST.max;
  const hungerU = fagi.hunger / HUNGER.max;
  const range = viewRangeOf(fagi);
  const visible = nearestWater(fagi, world);
  const { pool, sitio } = rememberWater(fagi, world, visible);
  const {
    visible: visibleSource, source, smelled: smelledSource, strength: sourceStrength,
  } = rememberFoodSource(fagi, world);

  const { candidatos, seen, olidos } =
    buildCandidates(fagi, world, {
      hungerU, thirstU, range, visible, pool, visibleSource, source, smelledSource, sourceStrength,
    });
  const { best, ranked } = choose(fagi.brain, candidatos);

  return {
    thirstU, hungerU, range, visible, pool, candidatos, seen, olidos, best, ranked,
    energyU: fagi.energy / ENERGY.max,
    nido: nestOf(world), source, visibleSource,
    enNido: Boolean(nestUnder(fagi, world)),
    sitioAgua: sitio,
    smellsWater: Boolean(pool) && smellsObject(fagi, visible ?? pool.ref, world),
  };
}
