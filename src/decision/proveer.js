// Escalón 3, proveer: lo que no necesita ahora, al nido para después. Y
// perseguir lo que percibe, que es también como se calma el hambre y la sed.

import { FAGI, BRAIN, ATTENTION } from '../config.js';
import { verdict } from '../learned/rules.js';
import { labelOf } from '../i18n.js';
import { pct, razon, apremia, despensaHecha } from './comun.js';

// Lo que lleva encima va al nido. Lo único que la aparta del camino, sin
// llegar a apurarse, es ver agua cerca con algo de sed: beber ahora, de paso,
// sale más barato que volver luego. La comida no la desvía: ya lleva una.
export function acarrear(fagi, world, ctx) {
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

function inservible(fagi, ctx, candidato) {
  return (candidato.kind === 'food' || candidato.kind === 'trail') && despensaHecha(fagi, ctx);
}

// El mejor candidato de lo que ve y huele, con histéresis para no zigzaguear.
// Nunca elige perseguir comida que ya aprendió a evitar: si lo hiciera, la
// puntuación (que no sabe de reglas, solo de creencia+urgencia+distancia)
// podría seguir prefiriéndola sobre cualquier otra cosa, y entonces caminaría
// hasta ella, la rechazaría al tocarla, y volvería a elegirla el frame
// siguiente porque nada más puntúa mejor: quieta junto al fruto para siempre.
export function perseguir(fagi, world, ctx, dt, onlyKind = null) {
  const elegido = elegirCandidato(fagi, ctx, onlyKind);
  if (!elegido) return null;

  fagi.memory = FAGI.memorySec;
  return intencionHacia(fagi, ctx, elegido);
}

function elegirCandidato(fagi, ctx, onlyKind) {
  const { ranked } = ctx;
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
  return elegido;
}

function intencionHacia(fagi, ctx, elegido) {
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
    reason: razon('reason.seekFood', { n: ctx.candidatos.length, score: elegido.score.toFixed(2) }),
    target: elegido.ref,
    targetKind: 'food',
    trailKey: null,
  };
}
