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

import { FAGI, ENERGY, BRAIN, CARRY, NEEDS, HUNGER, THIRST } from './config.js';
import { statMult } from './effects.js';
import { weight } from './memory.js';
import { labelOf } from './i18n.js';
import { followPheromone } from './pheromone.js';
import { stockFull } from './world.js';

const pct = (u) => `${Math.round(u * 100)}%`;

// Las razones se guardan como clave + datos, nunca como frase hecha: así la
// consola las puede escribir en el idioma que esté puesto en ese momento.
const razon = (key, params) => ({ key, params });

// --- las reglas, de más urgente a menos ---

// Ya está en el agua y le queda sed: no se mueve de ahí.
function beber(fagi, world, ctx) {
  if (!fagi.drinking || fagi.thirst <= 0) return null;
  return { action: 'drink', reason: razon('reason.drinking', { thirst: pct(ctx.thirstU) }) };
}

const apremia = (ctx) => Math.max(ctx.thirstU, ctx.hungerU) >= NEEDS.critical;

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
  if (risk.kind === 'water') {
    if (ctx.nido && !ctx.enNido) {
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
    ([type, amount]) => amount > 0 && weight(fagi.brain, type) >= 0
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

// Lo que lleva encima va al nido. Nada la distrae salvo comer o beber de verdad.
function acarrear(fagi, world, ctx) {
  if (!fagi.carrying || !ctx.nido || apremia(ctx)) return null;
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
  return candidato.kind === 'food' && despensaHecha(fagi, ctx);
}

// El mejor candidato de lo que ve y huele, con histéresis para no zigzaguear.
function perseguir(fagi, world, ctx, dt, onlyKind = null) {
  const { ranked, candidatos } = ctx;
  const util = (r) => !inservible(fagi, ctx, r);
  const disponibles = onlyKind
    ? ranked.filter((r) => r.kind === onlyKind && (onlyKind !== 'food' || r.value >= 0) && util(r))
    : ranked.filter(util);
  // La lista viene ordenada de mejor a peor: el primero que pase el mínimo es
  // el mejor que pasa el mínimo.
  const first = disponibles.find((r) => r.score > BRAIN.minScore);
  if (!first) return null;

  let elegido = first;
  if (fagi.target) {
    const actual = disponibles.find((r) => r.ref === fagi.target);
    if (actual && actual.score > 0 && actual.score >= first.score - BRAIN.stickiness) {
      elegido = actual;
    }
  }

  fagi.memory = FAGI.memorySec;

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

// Sin nada que percibir: tira de su propio camino marcado, alejándose del nido,
// que es hacia donde estaba la comida la última vez.
function seguirFeromona(fagi, world, ctx) {
  if (!ctx.nido) return null;
  const dNest = Math.hypot(ctx.nido.x - fagi.x, ctx.nido.y - fagi.y);
  const marca = followPheromone(world, fagi, dNest, true);
  if (!marca) return null;
  return {
    action: 'pheromone',
    reason: razon('reason.pheromone'),
    target: marca,
    targetKind: 'phero',
    trailKey: null,
  };
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

const REGLAS = [
  // 1. sobrevivir ahora
  beber,
  comerCarga,
  urgencia,
  irADespensa,
  // 2. aguantar
  descansar,
  // 3. proveer
  acarrear,
  perseguir,
  // pistas de algo que ya percibió y perdió, de la más fresca a la más vieja
  insistirEnElOlor,
  insistirDeMemoria,
  seguirFeromona,
];

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
  let intencion = null;
  for (const regla of REGLAS) {
    intencion = regla(fagi, world, ctx, dt);
    if (intencion) break;
  }
  if (!intencion) intencion = explorar(fagi, world, ctx);

  // Las claves que la intención no menciona se quedan como estaban: así una
  // regla solo tiene que hablar de lo que le importa.
  if ('target' in intencion) fagi.target = intencion.target;
  if ('targetKind' in intencion) fagi.targetKind = intencion.targetKind;
  if ('trailKey' in intencion) fagi.trailKey = intencion.trailKey;
  if (intencion.action === 'explore') fagi.memory = 0;

  fagi.thought = {
    ...ctx,
    seesPoints: ctx.seen.length,
    smellsPoints: ctx.olidos.length,
    seesWater: Boolean(ctx.visible),
    recuerdaAgua: Boolean(ctx.sitioAgua),
    carrying: fagi.carrying?.type ?? null,
    action: intencion.action,
    reason: intencion.reason,
  };
}
