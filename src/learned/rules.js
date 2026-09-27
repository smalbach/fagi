// El conjunto de reglas que Fagi lleva escritas en la cabeza. Vive en
// `fagi.brain.rules`, junto a las creencias de `memory.js` de las que salen.
//
// Aquí no se decide NADA de contenido: eso lo hace `synth.js`, mirando lo que
// pesa cada creencia. Este archivo solo guarda la lista, la consulta
// (`verdict`) y la mantiene sana: una regla que lanza un error al evaluarse se
// pone en cuarentena y deja de contar, para que un fallo de una regla nunca
// tumbe el fotograma.

import { BRAIN, LEARN } from '../config.js';
import { curious } from '../memory.js';

export function createRules() {
  return { list: [], seq: 0, quarantined: new Set() };
}

function liveRules(rules) {
  return rules.list.filter((r) => !r.retired && !rules.quarantined.has(r.id));
}

export function activeRule(rules, key, verdict) {
  return liveRules(rules).find((r) => r.when.key === key && r.verdict === verdict) ?? null;
}

export function retiredRule(rules, key, verdict) {
  return rules.list.find((r) => r.retired && r.when.key === key && r.verdict === verdict) ?? null;
}

export function upsertRule(rules, r) {
  const i = rules.list.findIndex((x) => x.id === r.id);
  if (i === -1) rules.list.push(r); else rules.list[i] = r;
  rules.quarantined.delete(r.id);
  rules.seq += 1;
  return r;
}

export function retireRule(rules, r, age) {
  if (!r || r.retired) return r;
  const retiredOne = { ...r, retired: true, retiredAt: age };
  upsertRule(rules, retiredOne);
  // Historial acotado: se descartan las retiradas más viejas, no las activas.
  const retiredList = rules.list.filter((x) => x.retired).sort((a, b) => a.retiredAt - b.retiredAt);
  const extra = retiredList.length - LEARN.maxRetired;
  if (extra > 0) {
    const outside = new Set(retiredList.slice(0, extra).map((x) => x.id));
    rules.list = rules.list.filter((x) => !outside.has(x.id));
  }
  return retiredOne;
}

export function quarantine(rules, id) {
  rules.quarantined.add(id);
  rules.seq += 1;
}

// ¿Qué dicen las reglas aprendidas sobre usar `key` para `scope`? 'avoid',
// 'prefer' o null si no hay ninguna que se pronuncie. Cada regla se evalúa
// aislada: una que lanza se pone en cuarentena y no vuelve a contar hasta que
// se la reescriba.
export function verdict(fagi, scope, key, { deliberate = false } = {}) {
  const rules = fagi.brain.rules;
  let result = null;
  for (const r of liveRules(rules)) {
    try {
      if (r.on.includes(scope) && r.when.key === key) {
        if (r.verdict === 'avoid') result = 'avoid';
        else if (r.verdict === 'prefer' && result === null) result = 'prefer';
      }
    } catch {
      quarantine(rules, r.id);
    }
  }
  // La curiosidad es instinto, no una regla: probar a propósito algo que se
  // cree malo sigue permitido mientras no se haya agotado la curiosidad.
  if (result === 'avoid' && scope === 'eat' && deliberate && curious(fagi.brain, key, BRAIN.curiosityTries)) {
    return null;
  }
  return result;
}
