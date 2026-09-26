// Qué hace Fagi con lo que percibe.
//
// Hay UNA directiva: sobrevivir. De ella salen las demás, en este orden:
//
//   1. sobrevivir ahora      calmar el hambre y la sed, que son lo que mata
//   2. aguantar              sin fuerzas no se sobrevive luego: descansar
//   3. proveer               lo que no necesita ahora, al nido para después
//   4. explorar              sin necesidad y con la despensa hecha, conocer el
//                            mapa es lo único que prepara las tres anteriores
//
// La lista de reglas de abajo es esa jerarquía escrita en orden. Cada una mira
// la situación y devuelve una intención, o null si no le toca; manda la primera
// que conteste. Añadir una conducta nueva es añadir una función a la lista, en
// el escalón que le corresponda.
//
// Una intención es: { action, reason, target, targetKind, trailKey }

import { FAGI, ENERGY, BRAIN, CARRY, NEEDS, HUNGER, THIRST, BACKEND, ATTENTION } from './config.js';
import { statMult } from './effects.js';
import { verdict } from './learned/rules.js';
import { labelOf } from './i18n.js';
import { stockFull } from './world.js';
import { notice, rethink } from './attention.js';
import { waterZone, shorePoint, radiusOf } from './obstacles.js';

const pct = (u) => `${Math.round(u * 100)}%`;

// Las razones se guardan como clave + datos, nunca como frase hecha: así la
// consola las puede escribir en el idioma que esté puesto en ese momento.
const razon = (key, params) => ({ key, params });

// --- las reglas, de más urgente a menos ---

// Atrapada en el hondo: lo primero es salir, por la orilla más cercana. Es
// instinto, no aprendido; lo aprendido es no volver a meterse (swim.js).
function salirDelAgua(fagi, world) {
  const zona = waterZone(world, fagi.x, fagi.y);
  if (!zona?.deep) return null;
  const orilla = shorePoint(zona.pool, radiusOf(zona.pool), fagi, -FAGI.radius);
  return {
    action: 'swimOut',
    reason: razon('reason.swimOut'),
    target: { x: orilla.x, y: orilla.y },
    targetKind: 'shore',
    trailKey: null,
  };
}

// Ya está en el agua y le queda sed: no se mueve de ahí.
function beber(fagi, world, ctx) {
  if (!fagi.drinking || fagi.thirst <= 0) return null;
  return { action: 'drink', reason: razon('reason.drinking', { thirst: pct(ctx.thirstU) }) };
}

// Exportada: el córtex la usa para saber si una directiva externa puede
// permitirse ignorar la emergencia, o si el instinto tiene que tomar el mando.
export const apremia = (ctx) => Math.max(ctx.thirstU, ctx.hungerU) >= NEEDS.critical;

function needAtRisk(fagi, ctx) {
  const risks = [];
  if (ctx.hungerU >= NEEDS.critical) {
    const rate = HUNGER.rate * statMult(fagi, 'hungerRate');
    risks.push({ kind: 'food', seconds: rate > 0 ? (HUNGER.max - fagi.hunger) / rate : Infinity });
  }
  if (ctx.thirstU >= NEEDS.critical) {
    risks.push({ kind: 'water', seconds: THIRST.rate > 0 ? (THIRST.max - fagi.thirst) / THIRST.rate : Infinity });
  }
  return risks.sort((a, b) => a.seconds - b.seconds)[0] ?? null;
}

// Una ración ya transportada es el recurso más cercano posible.
function comerCarga(fagi) {
  if (!fagi.carrying || fagi.hunger < CARRY.eatBelow) return null;
  return {
    action: 'eatCarried',
    reason: razon('reason.seekFood', { n: 1, score: '∞' }),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

// Con hambre o sed de verdad, atender eso va antes que descansar o trabajar.
function urgencia(fagi, world, ctx, dt) {
  const risk = needAtRisk(fagi, ctx);
  if (!risk) return null;

  // Las reservas existen precisamente para no apostar la vida persiguiendo una
  // fuente incierta cuando el hambre ya es crítica.
  if (risk.kind === 'food') {
    const pantry = pantryIntent(fagi, ctx);
    if (pantry) return pantry;
  }
  const recurso = perseguir(fagi, world, ctx, dt, risk.kind);
  if (recurso) return recurso;

  // Si no sabe dónde hay agua, cualquier objetivo de comida es una distracción
  // fatal: limpia el objetivo y busca terreno nuevo hasta encontrarla.
  // Primero vuelve a casa y desde allí explora. Una vez en el nido, esa vuelta
  // ya está hecha hasta que beba: si no, al dar un paso fuera la volvía a
  // mandar al nido, y se quedaba en la puerta yendo y viniendo hasta morir.
  if (risk.kind === 'water') {
    if (ctx.enNido) fagi.homeSearched = true;
    if (ctx.nido && !ctx.enNido && !fagi.homeSearched) {
      return {
        action: 'searchWaterNearHome',
        reason: razon('reason.explore'),
        target: ctx.nido,
        targetKind: 'nest',
        trailKey: null,
      };
    }
    return {
      action: 'explore',
      reason: razon('reason.explore'),
      target: null,
      targetKind: null,
      trailKey: null,
    };
  }
  // Para hambre dejamos continuar: la siguiente regla puede usar la despensa.
  return null;
}

function pantryIntent(fagi, ctx) {
  if (!ctx.nido || ctx.enNido) return null;
  // Lo que cree tener guardado. Si se equivoca, lo descubre al llegar: entrar
  // en el nido reescribe fagi.pantry y la siguiente decisión ya es la buena.
  const hay = Object.entries(fagi.pantry).some(
    ([type, amount]) => amount > 0 && verdict(fagi, 'eat', type) !== 'avoid'
  );
  if (!hay) return null;
  return {
    action: 'pantry',
    reason: razon('reason.pantry', { hunger: pct(ctx.hungerU) }),
    target: ctx.nido,
    targetKind: 'nest',
    trailKey: null,
  };
}

// Sin fuerzas no hay trabajo que valga: a descansar, mejor en el nido.
function descansar(fagi, world, ctx) {
  // El hambre y la sed matan; quedarse sin energía no. Aunque esté arrastrándose
  // (ENERGY.weakSpeed), atender lo urgente va antes que echarse.
  if (apremia(ctx)) return null;
  if (fagi.energy <= ENERGY.tired) fagi.resting = true;
  if (fagi.resting && fagi.energy >= ENERGY.rested) fagi.resting = false;
  if (!fagi.resting) return null;

  if (ctx.enNido || !ctx.nido) {
    return {
      action: 'rest',
      reason: ctx.enNido
        ? razon('reason.restInNest', { energy: pct(ctx.energyU) })
        : razon('reason.restOutside'),
      target: null,
      targetKind: null,
    };
  }
  return {
    action: 'toNest',
    reason: razon('reason.goRest', { energy: pct(ctx.energyU) }),
    target: ctx.nido,
    targetKind: 'nest',
  };
}

// Llueve: a cubierto. Una gota pesa como ella, la empapa y le borra el rastro;
// las obreras se meten en el nido hasta que escampa. Lo que apremia va antes:
// con sed de verdad, la lluvia no la para (y hasta deja charcos donde beber).
function refugiarse(fagi, world, ctx) {
  if (!world.rain?.on || !ctx.nido || apremia(ctx)) return null;
  if (ctx.enNido) {
    return { action: 'rest', reason: razon('reason.shelterIn'), target: null, targetKind: null };
  }
  return { action: 'shelter', reason: razon('reason.shelter'), target: ctx.nido, targetKind: 'nest' };
}

// Lo que lleva encima va al nido. Lo único que la aparta del camino, sin
// llegar a apurarse, es ver agua cerca con algo de sed: beber ahora, de paso,
// sale más barato que volver luego. La comida no la desvía: ya lleva una.
function acarrear(fagi, world, ctx) {
  if (!fagi.carrying || !ctx.nido || apremia(ctx)) return null;
  const agua = ctx.thirstU >= ATTENTION.opportunisticThirst
    && ctx.ranked.find((r) => r.kind === 'water' && r.via === 'vista' && r.score > BRAIN.minScore);
  if (agua) {
    return {
      action: 'seekWater',
      reason: razon('reason.detourWater', { thirst: pct(ctx.thirstU), what: labelOf(fagi.carrying.type) }),
      target: agua.ref,
      targetKind: 'water',
      trailKey: null,
    };
  }
  return {
    action: 'carry',
    reason: razon('reason.carry', { what: labelOf(fagi.carrying.type) }),
    target: ctx.nido,
    targetKind: 'nest',
  };
}

// Comida que no puede ni comerse ni guardarse: con la despensa hecha y sin
// hambre, perseguirla no lleva a ninguna parte. Es exactamente el caso en que
// antes se quedaba orbitando un fruto que ya no podía recoger.
function despensaHecha(fagi, ctx) {
  if (fagi.hunger >= CARRY.eatBelow || fagi.carrying) return false;
  return Boolean(ctx.nido) && stockFull(fagi.pantry);
}

function inservible(fagi, ctx, candidato) {
  return (candidato.kind === 'food' || candidato.kind === 'trail') && despensaHecha(fagi, ctx);
}

// El mejor candidato de lo que ve y huele, con histéresis para no zigzaguear.
// Nunca elige perseguir comida que ya aprendió a evitar: si lo hiciera, la
// puntuación (que no sabe de reglas, solo de creencia+urgencia+distancia)
// podría seguir prefiriéndola sobre cualquier otra cosa, y entonces caminaría
// hasta ella, la rechazaría al tocarla, y volvería a elegirla el frame
// siguiente porque nada más puntúa mejor: quieta junto al fruto para siempre.
function perseguir(fagi, world, ctx, dt, onlyKind = null) {
  const { ranked, candidatos } = ctx;
  const puedePerseguir = (r) => !inservible(fagi, ctx, r)
    && (r.kind !== 'food' || verdict(fagi, 'pursue', r.key) !== 'avoid');
  // El rastro propio lleva a comida (o eso cree): cuenta cuando se busca comida.
  const delTipo = (r) => !onlyKind || r.kind === onlyKind || (onlyKind === 'food' && r.kind === 'trail');
  const disponibles = ranked.filter((r) => delTipo(r) && puedePerseguir(r));
  // La lista viene ordenada de mejor a peor: el primero que pase el mínimo es
  // el mejor que pasa el mínimo.
  const first = disponibles.find((r) => r.score > BRAIN.minScore);
  const actual = fagi.target ? disponibles.find((r) => r.ref === fagi.target) : null;

  // La histéresis vale también para el mínimo: lo que ya persigue no se suelta
  // hasta caer `stickiness` por debajo. Si no, un objetivo que ronda el mínimo
  // (el agua que recuerda, a media distancia) se coge y se suelta cada frame.
  let elegido = first;
  if (actual && actual.score > 0) {
    const aguanta = first ? actual.score >= first.score - BRAIN.stickiness
      : actual.score > BRAIN.minScore - BRAIN.stickiness;
    if (aguanta) elegido = actual;
  }
  if (!elegido) return null;

  fagi.memory = FAGI.memorySec;

  // Su propio rastro: la siguiente marca, alejándose del nido.
  if (elegido.kind === 'trail') {
    return {
      action: 'pheromone',
      reason: razon('reason.pheromone'),
      target: elegido.ref,
      targetKind: 'phero',
      trailKey: null,
    };
  }

  // Lo huele pero no lo ve: no sabe dónde está, así que sigue el rastro.
  if (elegido.via === 'olfato') {
    fagi.trailMemory = FAGI.trailMemory;
    return {
      action: 'track',
      reason: elegido.kind === 'water'
        ? razon('reason.trackWater', { thirst: pct(ctx.thirstU) })
        : razon('reason.trackFood', {
            what: labelOf(elegido.key),
            strength: `${Math.round((elegido.fuerza ?? 0) * 100)}%`,
          }),
      target: elegido.ref,
      targetKind: 'scent',
      trailKey: elegido.key,
    };
  }

  if (elegido.kind === 'water') {
    return {
      action: 'seekWater',
      reason: razon('reason.seekWater', {
        thirst: pct(ctx.thirstU),
        how: razon(elegido.via === 'vista' ? 'water.sees' : 'water.remembers'),
        score: elegido.score.toFixed(2),
      }),
      target: elegido.ref,
      targetKind: 'water',
    };
  }

  return {
    action: 'seekFood',
    reason: razon('reason.seekFood', { n: candidatos.length, score: elegido.score.toFixed(2) }),
    target: elegido.ref,
    targetKind: 'food',
    trailKey: null,
  };
}

// Con hambre, sin nada a la vista y con reservas en casa: a comer de ellas.
// Va justo detrás de perseguir lo que percibe, porque es la otra forma de
// calmar el hambre: para eso se almacenó.
function irADespensa(fagi, world, ctx) {
  const hayComidaAlcanzable = ctx.ranked.some(
    (candidate) => candidate.kind === 'food' && candidate.score > BRAIN.minScore
  );
  if (!ctx.nido || ctx.enNido || hayComidaAlcanzable) return null;
  if (fagi.hunger < CARRY.eatBelow) return null;
  return pantryIntent(fagi, ctx);
}

// Perdió el olor que seguía: no lo abandona de golpe, lo busca barriendo.
function insistirEnElOlor(fagi, world, ctx, dt) {
  if (!fagi.trailKey || fagi.trailMemory <= 0) return null;
  // El agua siempre merece el rastro; un olor a comida, no si no hay dónde
  // ponerla: trackScent revive trailMemory dentro de la estela, así que sin
  // esta salida se quedaría rastreando el mismo fruto para siempre.
  if (fagi.trailKey !== 'agua' && despensaHecha(fagi, ctx)) return null;
  return {
    action: 'track',
    reason: razon('reason.lostTrail', {
      what: labelOf(fagi.trailKey),
      sec: { dur: fagi.trailMemory, precise: true },
    }),
    targetKind: 'scent',
    trailKey: fagi.trailKey,
  };
}

// Lo que mandó la API de decisión, mientras siga vigente y su objetivo (si
// tenía uno) siga existiendo. No decide NADA por su cuenta: solo traduce
// fagi.directive a una intención, igual que cualquier otra regla.
function directiva(fagi, world, ctx) {
  const d = fagi.directive;
  if (!d) return null;
  if (fagi.age >= d.until) { fagi.directive = null; return null; }
  if (d.target && !(world.points.includes(d.target) || world.objects.includes(d.target))) {
    fagi.directive = null;
    return null;
  }
  const esNido = ['toNest', 'pantry', 'carry'].includes(d.action);
  const target = d.target ?? (esNido ? ctx.nido : null);
  return {
    action: d.action,
    reason: d.reason ?? razon('reason.api', { backend: d.source }),
    target,
    targetKind: d.target ? d.targetKind : (target ? 'nest' : null),
    trailKey: d.trailKey ?? null,
  };
}

// Con autoridad plena la directiva va la primera de todas, salvo que la vida
// dependa de algo que ella no atiende: entonces se aparta y manda el instinto.
function directivaTemprano(fagi, world, ctx) {
  if (BACKEND.authority !== 1) return null;
  const d = fagi.directive;
  if (d && apremia(ctx) && d.targetKind !== 'food' && d.targetKind !== 'water') return null;
  return directiva(fagi, world, ctx);
}

// Con autoridad segura (la de fábrica) el instinto cubre primero lo que mata:
// beber, comer, la urgencia y la despensa. La directiva solo entra después,
// donde hoy entraban descansar/acarrear/perseguir.
function directivaSegura(fagi, world, ctx) {
  return BACKEND.authority === 0 ? directiva(fagi, world, ctx) : null;
}

// Lo tenía fichado y lo perdió de vista (pasó de largo, quedó tras una roca).
function insistirDeMemoria(fagi, world, ctx, dt) {
  const sigueAhi = fagi.target && (
    world.points.includes(fagi.target) || world.objects.includes(fagi.target)
  );
  if (!sigueAhi || fagi.memory <= 0) return null;
  fagi.memory -= dt;
  return {
    action: 'memory',
    reason: razon('reason.memory', { sec: { dur: fagi.memory, precise: true } }),
    target: fagi.target,
    targetKind: fagi.targetKind,
  };
}

// Cada regla con su escalón y un nombre: el mapa del cerebro enseña cuál
// contestó (el nombre de la función no sirve, se pierde al minificar).
const REGLAS = [
  // 1. sobrevivir ahora
  ['survive', 'swimOut', salirDelAgua],
  ['survive', 'drink', beber],
  ['survive', 'eatCarried', comerCarga],
  ['survive', 'directiveEarly', directivaTemprano],   // solo contesta con BACKEND.authority === 1, y nunca si apremia sin atenderlo
  ['survive', 'urgency', urgencia],
  ['survive', 'pantry', irADespensa],
  // 2. aguantar
  ['endure', 'rest', descansar],
  ['endure', 'shelter', refugiarse],
  // 3. proveer
  ['provide', 'directive', directivaSegura],     // solo contesta con BACKEND.authority === 0 (de fábrica)
  ['provide', 'carry', acarrear],
  ['provide', 'pursue', perseguir],
  // pistas de algo que ya percibió y perdió, de la más fresca a la más vieja
  ['clues', 'scent', insistirEnElOlor],
  ['clues', 'memory', insistirDeMemoria],
];

// Los escalones en orden, para quien quiera dibujar la jerarquía.
export const ESCALONES = ['survive', 'endure', 'provide', 'clues', 'explore'];

// Ninguna regla ha contestado: no hay necesidad que calmar ni pista que seguir.
// Entonces lo útil es conocer mapa, que es lo que hace posible todo lo demás la
// próxima vez. Olvida lo que tuviera fichado: ya no hay nada fichado.
function explorar(fagi, world, ctx) {
  const lleno = ctx.nido && stockFull(fagi.pantry);
  return {
    action: 'explore',
    reason: lleno
      ? razon('reason.exploreFull')
      : ctx.candidatos.length
        ? razon('reason.belowMin', { n: ctx.candidatos.length })
        : razon('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}

export function decide(fagi, world, ctx, dt) {
  // Lo que acaba de entrar en lo que percibe (fagi.js lo mira antes, para que
  // el córtex también se entere). Las reglas deciden igual en cada frame; lo
  // nuevo hace que se anote si ese frame cambió el plan o no.
  const nuevas = ctx.nuevas ?? notice(fagi, ctx);
  const antes = { action: fagi.thought?.action ?? null, target: fagi.target };
  let intencion = null;
  let quien = null;
  for (const [escalon, nombre, regla] of REGLAS) {
    intencion = regla(fagi, world, ctx, dt);
    if (intencion) { quien = { tier: escalon, rule: nombre }; break; }
  }
  if (!intencion) { intencion = explorar(fagi, world, ctx); quien = { tier: 'explore', rule: 'explore' }; }

  // Las claves que la intención no menciona se quedan como estaban: así una
  // regla solo tiene que hablar de lo que le importa.
  if ('target' in intencion) fagi.target = intencion.target;
  if ('targetKind' in intencion) fagi.targetKind = intencion.targetKind;
  if ('trailKey' in intencion) fagi.trailKey = intencion.trailKey;
  if (intencion.action === 'explore') fagi.memory = 0;
  // Vuelve a explorar después de otra cosa: el tramo que dejó a medias no se
  // retoma ni se tira por norma. Al moverse (movement.js/explore) decide entre
  // él y lo que vea ahora, con la misma cuenta.
  if (intencion.action === 'explore' && antes.action !== 'explore') fagi.exploreResume = true;
  rethink(fagi, nuevas, antes, intencion, ctx.ranked);

  fagi.thought = {
    ...ctx,
    seesPoints: ctx.seen.length,
    smellsPoints: ctx.olidos.length,
    seesWater: Boolean(ctx.visible),
    recuerdaAgua: Boolean(ctx.sitioAgua),
    carrying: fagi.carrying?.type ?? null,
    action: intencion.action,
    reason: intencion.reason,
    news: nuevas.map((c) => c.key),
    rethink: fagi.rethink,
    tier: quien.tier,
    rule: quien.rule,
  };
}
