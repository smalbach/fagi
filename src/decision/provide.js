// Escalón 3, proveer: lo que no necesita ahora, al nido para después. Y
// perseguir lo que percibe, que es también como se calma el hambre y la sed.

import { FAGI, BRAIN, ATTENTION } from '../config.js';
import { verdict } from '../learned/rules.js';
import { labelOf } from '../i18n.js';
import { pct, reasonOf, pressing, pantryDone } from './common.js';

// Lo que lleva encima va al nido. Lo único que la aparta del camino, sin
// llegar a apurarse, es ver agua cerca con algo de sed: beber ahora, de paso,
// sale más barato que volver luego. La comida no la desvía: ya lleva una.
export function carry(fagi, world, ctx) {
  if (!fagi.carrying || !ctx.nest || pressing(ctx)) return null;
  const water = ctx.thirstU >= ATTENTION.opportunisticThirst
    && ctx.ranked.find((r) => r.kind === 'water' && r.via === 'sight' && r.score > BRAIN.minScore);
  if (water) {
    return {
      action: 'seekWater',
      reason: reasonOf('reason.detourWater', { thirst: pct(ctx.thirstU), what: labelOf(fagi.carrying.type) }),
      target: water.ref,
      targetKind: 'water',
      trailKey: null,
    };
  }
  return {
    action: 'carry',
    reason: reasonOf('reason.carry', { what: labelOf(fagi.carrying.type) }),
    target: ctx.nest,
    targetKind: 'nest',
  };
}

function useless(fagi, ctx, candidate) {
  return (candidate.kind === 'food' || candidate.kind === 'trail') && pantryDone(fagi, ctx);
}

// El mejor candidato de lo que ve y huele, con histéresis para no zigzaguear.
// Nunca elige perseguir comida que ya aprendió a evitar: si lo hiciera, la
// puntuación (que no sabe de reglas, solo de creencia+urgencia+distancia)
// podría seguir prefiriéndola sobre cualquier otra cosa, y entonces caminaría
// hasta ella, la rechazaría al tocarla, y volvería a elegirla el frame
// siguiente porque nada más puntúa mejor: quieta junto al fruto para siempre.
export function pursue(fagi, world, ctx, dt, onlyKind = null) {
  const chosen = pickCandidate(fagi, ctx, onlyKind);
  if (!chosen) return null;

  fagi.memory = FAGI.memorySec;
  return intentToward(fagi, ctx, chosen);
}

function pickCandidate(fagi, ctx, onlyKind) {
  const { ranked } = ctx;
  const canPursue = (r) => !useless(fagi, ctx, r)
    && (r.kind !== 'food' || verdict(fagi, 'pursue', r.key) !== 'avoid');
  // El rastro propio lleva a comida (o eso cree): cuenta cuando se busca comida.
  const ofType = (r) => !onlyKind || r.kind === onlyKind || (onlyKind === 'food' && r.kind === 'trail');
  const available = ranked.filter((r) => ofType(r) && canPursue(r));
  // La lista viene ordenada de mejor a peor: el primero que pase el mínimo es
  // el mejor que pasa el mínimo.
  const first = available.find((r) => r.score > BRAIN.minScore);
  const current = fagi.target ? available.find((r) => r.ref === fagi.target) : null;

  // La histéresis vale también para el mínimo: lo que ya persigue no se suelta
  // hasta caer `stickiness` por debajo. Si no, un objetivo que ronda el mínimo
  // (el agua que recuerda, a media distancia) se coge y se suelta cada frame.
  let chosen = first;
  if (current && current.score > 0) {
    const holds = first ? current.score >= first.score - BRAIN.stickiness
      : current.score > BRAIN.minScore - BRAIN.stickiness;
    if (holds) chosen = current;
  }
  return chosen;
}

function intentToward(fagi, ctx, chosen) {
  // Su propio rastro: la siguiente marca, alejándose del nido.
  if (chosen.kind === 'trail') {
    return {
      action: 'pheromone',
      reason: reasonOf('reason.pheromone'),
      target: chosen.ref,
      targetKind: 'phero',
      trailKey: null,
    };
  }

  // Lo huele pero no lo ve: no sabe dónde está, así que sigue el rastro.
  if (chosen.via === 'smell') {
    fagi.trailMemory = FAGI.trailMemory;
    return {
      action: 'track',
      reason: chosen.kind === 'water'
        ? reasonOf('reason.trackWater', { thirst: pct(ctx.thirstU) })
        : reasonOf('reason.trackFood', {
            what: labelOf(chosen.key),
            strength: `${Math.round((chosen.force ?? 0) * 100)}%`,
          }),
      target: chosen.ref,
      targetKind: 'scent',
      trailKey: chosen.key,
    };
  }

  if (chosen.kind === 'water') {
    return {
      action: 'seekWater',
      reason: reasonOf('reason.seekWater', {
        thirst: pct(ctx.thirstU),
        how: reasonOf(chosen.via === 'sight' ? 'water.sees' : 'water.remembers'),
        score: chosen.score.toFixed(2),
      }),
      target: chosen.ref,
      targetKind: 'water',
    };
  }

  return {
    action: 'seekFood',
    reason: reasonOf('reason.seekFood', { n: ctx.candidates.length, score: chosen.score.toFixed(2) }),
    target: chosen.ref,
    targetKind: 'food',
    trailKey: null,
  };
}
