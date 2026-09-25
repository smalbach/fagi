// Cerebro de Fagi: decide con lo que recuerda, y lo que recuerda vive en
// memory.js. Aquí solo se puntúa: qué le apetece más de todo lo que percibe.

import { BRAIN } from './config.js';
import { createMemory, recall, weight, curious, reinforce } from './memory.js';

export function createBrain() {
  return createMemory();
}

// Candidato: { key, kind, ref, dist, range, urgency }
//   urgency = la necesidad que ESE candidato calmaría (hambre o sed).
//
// Devuelve la lista ordenada de mejor a peor con el desglose de la suma,
// que es justo lo que enseña la consola.
export function evaluate(brain, candidates) {
  return candidates.map((c) => {
    const r = recall(brain, c.key);
    // Lo que sabe pesa por lo que se fía de ello: un recuerdo sin confianza
    // apenas tira, y entonces vuelve la curiosidad y lo prueba otra vez.
    const sabido = weight(brain, c.key);
    const curiosidad = curious(brain, c.key, BRAIN.curiosityTries) ? BRAIN.curiosityBonus : 0;
    // Las ganas van con la necesidad: saciado, lo que sabe bueno tira poco de él.
    const ganas = BRAIN.baseInterest + (1 - BRAIN.baseInterest) * c.urgency;
    const near = -BRAIN.distanceWeight * (c.dist / c.range);
    const penalty = -(c.penalty ?? 0); // olerlo sin verlo da posición imprecisa

    return {
      ...c,
      value: r.value,
      confidence: r.confidence,
      stage: r.stage,
      score: sabido * ganas + curiosidad + c.urgency + near + penalty,
      parts: {
        creencia: sabido * ganas, curiosidad, necesidad: c.urgency,
        distancia: near, ...(penalty ? { olfato: penalty } : {}),
      },
    };
  }).sort((a, b) => b.score - a.score);
}

// El mejor candidato, si pasa el mínimo. Lo marginal no le mueve del sitio.
export function choose(brain, candidates) {
  const ranked = evaluate(brain, candidates);
  const best = ranked[0];
  return { best: best && best.score > BRAIN.minScore ? best : null, ranked };
}

// Aprender de lo que acaba de pasarle.
export function learn(brain, key, reward, now) {
  return reinforce(brain, key, reward, now, BRAIN.learnRate);
}
