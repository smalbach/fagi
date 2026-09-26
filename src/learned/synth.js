// El aprendiz: convierte lo que pesa una creencia en una línea de código.
//
// No inventa nada que memory.js no sepa ya: mira `weight(brain, key)` después
// de cada `learn()` y decide si hace falta escribir, revisar o retirar una
// regla. Los umbrales de entrada y salida son distintos (histéresis) para que
// una creencia rondando el límite no encienda y apague la regla cada frame.

import { LEARN } from '../config.js';
import { weight } from '../memory.js';
import { activeRule, retireRule, upsertRule } from './rules.js';

const ALCANCE = { avoid: ['eat', 'store', 'pursue'], prefer: ['eat', 'store'] };
const PREFIJO = { avoid: 'evitar', prefer: 'preferir' };
const CONTRARIO = { avoid: 'prefer', prefer: 'avoid' };

function nuevaRegla(now, key, verdict, w, because) {
  return {
    id: `${PREFIJO[verdict]}-${key}`,
    on: ALCANCE[verdict],
    when: { key },
    verdict,
    weight: Number(w.toFixed(3)),
    because,
    learnedAt: now,
    tries: 1,
    stage: 'corta',
  };
}

function marcar(brain, id, kind, key, verdict, because) {
  brain.lastRule = { n: (brain.lastRule?.n ?? 0) + 1, id, kind, key, verdict, because };
}

function because0(sensations) {
  return sensations && sensations.length ? sensations : [{ sense: 'contradiccion', v: 0 }];
}

// Se llama desde brain.js, tras CADA learn() (bocado, corrección diferida,
// muerte): así no hay ningún camino de aprendizaje que se olvide de escribir
// código. `cambio` es lo que devolvió reinforce(): {before, after, kind}.
export function synthAfterLearn(brain, key, cambio, sensations, now) {
  const rules = brain.rules;
  const w = weight(brain, key);
  const stage = cambio.after.stage;
  const tries = brain.facts[key]?.tries ?? cambio.after.tries ?? 1;

  for (const verdict of ['avoid', 'prefer']) {
    const entra = verdict === 'avoid' ? LEARN.avoidFrom : LEARN.preferFrom;
    const sale = verdict === 'avoid' ? LEARN.avoidUntil : LEARN.preferUntil;
    const signo = verdict === 'avoid' ? -1 : 1;
    const existente = activeRule(rules, key, verdict);

    if (signo * w >= entra) {
      // Retira la contraria si la hubiera: no se puede evitar y preferir lo mismo.
      const opuesta = activeRule(rules, key, CONTRARIO[verdict]);
      if (opuesta) {
        retireRule(rules, opuesta, now);
        marcar(brain, opuesta.id, 'retirada', key, opuesta.verdict, because0(sensations));
      }

      if (!existente) {
        const r = upsertRule(rules, nuevaRegla(now, key, verdict, w, sensations));
        marcar(brain, r.id, 'nueva', key, verdict, sensations);
      } else {
        const r = upsertRule(rules, {
          ...existente, weight: Number(w.toFixed(3)), because: sensations,
          revisedAt: now, tries, stage,
        });
        marcar(brain, r.id, 'revisada', key, verdict, sensations);
      }
    } else if (existente && signo * w <= sale) {
      retireRule(rules, existente, now);
      marcar(brain, existente.id, 'retirada', key, verdict, sensations);
    }
  }
}
