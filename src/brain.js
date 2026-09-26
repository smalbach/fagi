// Cerebro de Fagi: decide con lo que recuerda, y lo que recuerda vive en
// memory.js. Aquí solo se puntúa: qué le apetece más de todo lo que percibe.

import { BRAIN } from './config.js';
import { createMemory, recall, weight, curious, reinforce } from './memory.js';
import { createRules } from './learned/rules.js';
import { synthAfterLearn } from './learned/synth.js';
import { createSynapses, wire } from './synapses.js';

// El cerebro es la memoria (lo que cree) más las reglas (lo que ha escrito a
// partir de lo que cree). La memoria es la única fuente de verdad del valor;
// las reglas son la capa simbólica: existencia, alcance y explicación.
//   synapses : la huella de lo aprendido como conexiones (synapses.js).
//   lastRule : la última regla escrita, revisada o retirada. Lo lee el
//              narrador; no hace falta guardarlo en ningún otro sitio.
export function createBrain() {
  return { ...createMemory(), rules: createRules(), lastRule: null, synapses: createSynapses() };
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

// Aprender de lo que acaba de pasarle. Cada aprendizaje pasa SIEMPRE por
// synthAfterLearn: así no hace falta acordarse de sintetizar reglas en cada
// sitio que llama a learn(), y una futura fuente de aprendizaje (la que sea)
// las genera gratis con solo llamar a esta función.
export function learn(brain, key, reward, now, because = []) {
  const cambio = reinforce(brain, key, reward, now, BRAIN.learnRate);
  synthAfterLearn(brain, key, cambio, because, now);
  // Aprender también conecta: el concepto con lo que el cuerpo sintió.
  if (brain.synapses) wire(brain.synapses, key, because, now);
  return cambio;
}
