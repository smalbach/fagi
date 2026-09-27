// Qué percibe Fagi en este instante y cómo lo puntúa.
//
// Junta en UNA lista todo lo perseguible: comida vista, comida olida y el agua.
// Cada candidato lleva por qué sentido entró, para que quien decida lo sepa.

import { FAGI, BRAIN, THIRST, HUNGER, ENERGY, MEMORY, TREE, NEST, RAIN } from './config.js';
import { seenPoints, seesObject, viewRangeOf, distanceTo } from './vision.js';
import { smelledPoints, smellsObject, aromaOf, scentStrengthOfObject } from './smell.js';
import { isWater, isTree, radiusOf, waterZone } from './obstacles.js';
import { fearsDeep } from './swim.js';
import { choose, learn } from './brain.js';
import { nestOf, stockCount } from './world.js';
import { followPheromone } from './pheromone.js';
import { nestUnder } from './nest.js';
import { rememberPlace, recallPlace, forgetPlace, waterPlaceKind, peekWeight } from './memory.js';

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

// Ver agua la memoriza y confirma dónde está. Si no la ve, se queda con lo que
// recuerda, que es cada vez más impreciso (memory.js lo va difuminando).
//
// Recuerda dos sitios aparte: el lago ('agua'), que no se seca, y el último
// charco de lluvia que vio ('charco'), que sí. Que un charco se haya secado no
// lo sabe hasta que va, mira donde lo recordaba y no lo ve: entonces lo olvida,
// le toca buscar agua otra vez y aprende que de un charco no hay que fiarse
// tanto (creencia 'charco'; beber de uno la sube, needs.js) y cuánto tardan en
// secarse (brain.puddleLife).
function rememberWater(fagi, world, visible, range) {
  if (visible) {
    const kind = waterPlaceKind(visible);
    const before = recallPlace(fagi.brain, kind);
    rememberPlace(fagi.brain, kind, visible, fagi.age);
    if (!before || before.ref !== visible) fagi.waterFound = (fagi.waterFound ?? 0) + 1;
  }

  const lake = recallPlace(fagi.brain, 'water');
  if (lake && !world.objects.includes(lake.ref)) forgetPlace(fagi.brain, 'water');   // lo quitaron del mapa

  const puddle = recallPlace(fagi.brain, 'puddle');
  const near = puddle && Math.hypot(puddle.x - fagi.x, puddle.y - fagi.y) < range * 0.6;
  if (puddle && near && !world.objects.includes(puddle.ref)) {
    // Cuánto hacía que lo vio: con eso aprende cuánto suele durar un charco.
    const age = fagi.age - puddle.lastAt;
    const life = fagi.brain.puddleLife;
    fagi.brain.puddleLife = life == null ? age : life + RAIN.puddleLifeRate * (age - life);
    forgetPlace(fagi.brain, 'puddle');
    fagi.puddleGone = (fagi.puddleGone ?? 0) + 1;
    learn(fagi.brain, 'puddle', -RAIN.puddleLesson, fagi.age);
  }

  // De lo que recuerda, lo que quede más cerca. Un sitio con poca confianza no
  // se descarta: entra en la lista y que decida la puntuación. Si aprendió que
  // los charcos se secan, uno recordado le parece tanto más lejos.
  //
  // Y si ya ha encontrado charcos secos, sabe más o menos cuánto duran: uno
  // visto hace más de eso lo da por seco mientras tenga otra agua que recordar.
  let places = ['water', 'puddle'].map((k) => recallPlace(fagi.brain, k)).filter(Boolean);
  const life = fagi.brain.puddleLife;
  const expired = (p) => p.ref?.type === 'puddle' && life != null && fagi.age - p.lastAt > life;
  if (places.length > 1) places = places.filter((p) => !expired(p));
  const wariness = 1 + Math.max(0, -peekWeight(fagi.brain, 'puddle'));
  const farness = (p) => distanceTo(fagi, p) * (p.ref?.type === 'puddle' ? wariness : 1);
  const placeOf = places.sort((a, b) => farness(a) - farness(b))[0] ?? null;
  return { pool: visible ?? placeOf, place: placeOf };
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

// Lo que empuja a una obrera a salir a por comida: su hambre o lo que le falta
// a la despensa según la recuerda (fagi.pantry), lo que sea mayor.
function forageNeed(fagi, hungerU) {
  const missing = 1 - Math.min(1, stockCount(fagi.pantry) / NEST.full);
  return Math.max(hungerU, NEST.forageDrive * missing);
}

function buildCandidates(fagi, world, {
  hungerU, thirstU, range, visible, pool, place: placeOf, visibleSource, source, smelledSource, sourceStrength,
}) {
  const nestObj = nestOf(world);
  const forage = forageNeed(fagi, hungerU);
  // Si algo entra por los dos sentidos, manda la vista (es más precisa).
  const byRef = new Map();
  // Lo que flota en el hondo no se persigue si ya sabe lo que es meterse ahí.
  const fears = fearsDeep(fagi);
  const add = (c) => {
    if (fears && c.kind === 'food' && waterZone(world, c.ref.x, c.ref.y)?.deep) return;
    const already = byRef.get(c.ref);
    if (!already || (already.via === 'smell' && c.via === 'sight')) byRef.set(c.ref, c);
  };

  const seen = seenPoints(fagi, world.points, world);
  for (const { point, dist } of seen) {
    add({ key: point.type, kind: 'food', ref: point, dist, range, urgency: hungerU, via: 'sight', penalty: 0 });
  }

  const smelledOnes = smelledPoints(fagi, world);
  for (const { point, force } of smelledOnes) {
    // Por el olfato no sabe a qué distancia está: solo si huele fuerte o flojo.
    const aroma = aromaOf(fagi, point.type);
    add({ key: point.type, kind: 'food', ref: point, dist: (1 - force) * aroma, range: aroma,
          urgency: hungerU, via: 'smell', penalty: BRAIN.smellPenalty, force });
  }

  if (smelledSource && !visibleSource) {
    const aroma = aromaOf(fagi, TREE.fruit);
    add({
      key: TREE.fruit, kind: 'food', ref: smelledSource,
      dist: (1 - sourceStrength) * aroma, range: aroma,
      urgency: hungerU, via: 'smell', penalty: BRAIN.smellPenalty,
      force: sourceStrength, source: true,
    });
  }


  // Un árbol visto se recuerda como fuente renovable. Se persigue su zona solo
  // cuando no estamos ya bajo su copa; allí mandan los frutos concretos. Tira
  // de ella el hambre propia o la de la colonia, la que sea mayor.
  if (source && forage > 0.15 && (!smelledSource || visibleSource)) {
    const realOne = visibleSource ?? source.ref;
    const dist = Math.max(0, distanceTo(fagi, source) - radiusOf(realOne));
    if (dist > FAGI.eatRadius * 2) {
      const via = visibleSource ? 'sight' : 'memory';
      const doubt = via === 'memory' ? (source.error ?? 0) / MEMORY.placeErrorMax : 0;
      add({
        key: TREE.fruit, kind: 'food', ref: source, dist,
        range: via === 'sight' ? range : MEMORY.travelRange,
        urgency: forage, via, source: true,
        penalty: via === 'sight' ? 0 : BRAIN.smellPenalty * (1 + doubt),
      });
    }
  }

  // Su propio rastro bajo las antenas, en el sentido que se aleja del nido.
  // Es un candidato más: si seguirlo merece la pena lo dice lo aprendido
  // (la creencia 'feromona'), no una regla. Está justo debajo: distancia 0.
  if (nestObj && forage > 0) {
    const mark = followPheromone(world, fagi, Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y), true);
    if (mark) {
      add({ key: 'pheromone', kind: 'trail', ref: mark, dist: 0, range: 1,
            urgency: forage, via: 'antennae', penalty: 0 });
    }
  }

  // Sin sed apenas, el agua ni entra en la lista: no da vueltas al charco por gusto.
  if (pool && !fagi.drinking && thirstU > THIRST.ignoreBelow) {
    const realOne = visible ?? pool.ref;
    // Al agua se le mide la distancia al borde: un charco grande se alcanza antes.
    const d = Math.max(0, distanceTo(fagi, pool) - radiusOf(realOne));
    // Sin verla, si recuerda bien dónde está va de memoria, derecha; solo si el
    // recuerdo ya está difuminado se fía más de la nariz y sigue la estela.
    const fuzzy = (pool.error ?? 0) > range / 2;
    const via = visible ? 'sight' : (fuzzy && smellsObject(fagi, realOne, world) ? 'smell' : 'memory');
    // Ir de memoria penaliza el doble: no lo percibe Y puede estar equivocada
    // sobre dónde estaba, tanto más cuanto más tiempo lleve sin verlo.
    const placeDoubt = via === 'memory' ? (pool.error ?? 0) / MEMORY.placeErrorMax : 0;
    // La distancia se mide contra lo que toque: lo que ve, contra su vista; lo
    // que huele, contra el alcance del olor; lo que recuerda, contra lo que le
    // parece razonable caminar.
    //
    // Aunque la siga por el olor, sigue recordando más o menos dónde está:
    // olerla no puede alejarla. Sin esto, al entrar en la estela el agua
    // recordada puntuaba de golpe mucho peor, la soltaba, salía de la estela y
    // volvía a por ella, en bucle, hasta morir de sed a 250 px del lago.
    //
    // Y lo mismo con la vista: un charco pequeño se ve de cerca, y si verlo lo
    // midiese contra la vista puntuaba peor que recordarlo. Lo soltaba al
    // verlo, se daba la vuelta, lo recordaba y volvía, sin llegar nunca.
    const scaleOf = via === 'smell' ? (placeOf ? MEMORY.travelRange : aromaOf(fagi, 'water'))
      : via === 'memory' ? MEMORY.travelRange
      : placeOf ? Math.max(range, MEMORY.travelRange) : range;
    add({ key: 'water', kind: 'water', ref: pool, dist: d, range: scaleOf,
          urgency: thirstU, via,
          penalty: via === 'sight' ? 0 : BRAIN.smellPenalty + placeDoubt * BRAIN.smellPenalty });
  }

  return { candidates: [...byRef.values()], seen, smelledOnes };
}

// Foto completa de la situación, lista para que las reglas decidan sobre ella.
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
    energyU: fagi.energy / ENERGY.max,
    nest: nestOf(world), source, visibleSource,
    inNest: Boolean(nestUnder(fagi, world)),
    waterPlace: placeOf,
    smellsWater: Boolean(pool) && smellsObject(fagi, visible ?? pool.ref, world),
  };
}
