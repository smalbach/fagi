// La gramática del código que Fagi escribe sola.
//
// Una regla es un objeto de datos, nunca una función: por eso se puede
// imprimir como una línea de JavaScript real (`rule('id', {...})`) y volver a
// leer sin `eval`, solo con una expresión regular y `JSON.parse`. `rule()` es
// el único portero: valida la forma antes de dejarla entrar, tanto si la
// escribe el aprendiz (synth.js) como si la trae un archivo importado.

import { modernKey, modernize } from '../legacy.js';

const SCOPES = ['eat', 'store', 'pursue'];
const VERDICTS = ['avoid', 'prefer'];
const STAGE_NAMES = ['short', 'medium', 'long'];
const VALID_ID = /^[a-z0-9-]{1,64}$/;

function fail(msg) {
  throw new Error(`regla inválida: ${msg}`);
}

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateBecause(because) {
  if (!Array.isArray(because)) fail('"because" debe ser una lista');
  if (because.length > 12) fail('"because" tiene demasiadas sensaciones');
  for (const s of because) {
    if (!s || typeof s.sense !== 'string' || s.sense.length > 40) fail('sensación sin "sense" válido');
    if (!isNumber(s.v)) fail('sensación sin "v" numérico');
  }
}

// rule(id, spec) → la regla ya validada, o lanza con un motivo legible.
// spec: { on, when:{key}, verdict, weight, because, learnedAt, revisedAt?,
//         tries, stage, retired?, retiredAt? }
export function rule(id, spec) {
  if (typeof id !== 'string' || !VALID_ID.test(id)) fail(`id "${id}" fuera de forma`);
  if (!spec || typeof spec !== 'object') fail('falta el cuerpo de la regla');

  const { on, when, verdict, weight, because, learnedAt, revisedAt, tries, stage, retired, retiredAt, ...rest } = spec;
  const extra = Object.keys(rest);
  if (extra.length) fail(`campos desconocidos: ${extra.join(', ')}`);

  if (!Array.isArray(on) || on.length === 0 || on.some((a) => !SCOPES.includes(a))) {
    fail(`"on" debe ser una lista no vacía dentro de ${SCOPES.join('|')}`);
  }
  if (!when || typeof when.key !== 'string' || !when.key || when.key.length > 80) {
    fail('"when.key" debe ser un texto no vacío');
  }
  if (!VERDICTS.includes(verdict)) fail(`"verdict" debe ser ${VERDICTS.join('|')}`);
  if (!isNumber(weight)) fail('"weight" debe ser numérico');
  validateBecause(because);
  if (!isNumber(learnedAt)) fail('"learnedAt" debe ser numérico');
  if (revisedAt !== undefined && !isNumber(revisedAt)) fail('"revisedAt" debe ser numérico');
  if (!Number.isInteger(tries) || tries < 0) fail('"tries" debe ser un entero ≥ 0');
  if (!STAGE_NAMES.includes(stage)) fail(`"stage" debe ser ${STAGE_NAMES.join('|')}`);
  if (retired !== undefined && typeof retired !== 'boolean') fail('"retired" debe ser booleano');
  if (retiredAt !== undefined && !isNumber(retiredAt)) fail('"retiredAt" debe ser numérico');

  return {
    id, on: [...on], when: { key: when.key }, verdict, weight,
    because: because.map((s) => ({ sense: s.sense, v: s.v })),
    learnedAt, ...(revisedAt !== undefined ? { revisedAt } : {}),
    tries, stage,
    ...(retired ? { retired: true, retiredAt: retiredAt ?? learnedAt } : {}),
  };
}

// Una línea de código por regla. Sin comas ni formato bonito: el objeto es
// JSON válido, así que se reimporta con JSON.parse sin tocar `eval`.
export function renderRule(r) {
  const { id, ...rest } = r;
  const line = `rule('${id}', ${JSON.stringify(rest)})`;
  return r.retired ? `// retired ${r.retiredAt.toFixed(1)}s: ${line}` : line;
}

const RULE_LINE = /^(?:\/\/ (?:retired|retirada) [\d.]+s: )?rule\('([a-z0-9-]{1,64})',\s*(\{.*\})\)$/;
const MEMORY_LINE = /^export const (?:memory|memoria) = (\{.*\});$/;

// El módulo completo, tal y como se exporta y se enseña en el panel.
export function renderModule(rules, facts, { age, puddleLife = null, synapses = null } = {}) {
  const activeOnes = rules.filter((r) => !r.retired);
  const retiredList = rules.filter((r) => r.retired);
  const header = `// Código aprendido por Fagi · edad ${(age ?? 0).toFixed(1)}s · ` +
    `${activeOnes.length} regla(s) activa(s), ${retiredList.length} retired(s)\n` +
    `// Generado por src/learned/dsl.js. Se importa sin eval: cada línea es JSON.\n`;
  const body = [...activeOnes, ...retiredList].map((r) => '  ' + renderRule(r)).join(',\n');
  const rulesLine = body ? `export default [\n${body},\n];` : 'export default [];';
  // Además de las creencias, lo que sabe de cómo es el mundo (cuánto dura un
  // charco) y qué le hizo sentir cada cosa (las sinapsis concepto→sensación).
  // Es lo mismo que guarda el autoguardado: exportar e importar no pierde nada.
  const memoryOf = { facts };
  if (puddleLife != null) memoryOf.puddleLife = Math.round(puddleLife * 10) / 10;
  if (synapses && Object.keys(synapses).length) memoryOf.synapses = synapses;
  const memoryLine = `export const memory = ${JSON.stringify(memoryOf)};`;
  return `${header}import { rule } from './dsl.js';\n\n${rulesLine}\n${memoryLine}\n`;
}

// Lee un módulo generado y devuelve { rules, facts }. Nunca ejecuta el texto:
// busca líneas con la forma exacta de renderRule/renderModule y valida cada
// una con rule(). Cualquier cosa que no encaje se ignora o hace fallar la
// importación entera, según el caso.
export function parseModule(text) {
  if (typeof text !== 'string') throw new Error('el módulo debe ser texto');
  if (text.length > 256 * 1024) throw new Error('el módulo es demasiado grande');

  const rules = [];
  let facts = {};
  let puddleLife = null;
  let synapses = {};
  let seenMemory = false;

  for (const line of text.split('\n')) {
    // renderModule separa las reglas con comas de lista (una por línea, la
    // última incluida); se quita para que quede el `rule(...)` exacto.
    const l = line.trim().replace(/,\s*$/, '');
    if (!l) continue;

    const m = RULE_LINE.exec(l);
    if (m) {
      const [, id, json] = m;
      let spec;
      try { spec = JSON.parse(json); } catch { throw new Error(`línea de regla con JSON inválido: ${l.slice(0, 60)}`); }
      rules.push(rule(modernKey(id), modernize(spec)));
      continue;
    }

    const mm = MEMORY_LINE.exec(l);
    if (mm) {
      let data;
      try { data = modernize(JSON.parse(mm[1])); } catch { throw new Error('la línea de memoria trae JSON inválido'); }
      if (data && typeof data === 'object' && data.facts && typeof data.facts === 'object') {
        facts = data.facts;
        if (typeof data.puddleLife === 'number' && Number.isFinite(data.puddleLife) && data.puddleLife > 0) {
          puddleLife = data.puddleLife;
        }
        synapses = validateSynapses(data.synapses);
        seenMemory = true;
      }
    }
    // Cualquier otra línea (comentarios, import, export default [ ... ]) se ignora.
  }

  if (!seenMemory && rules.length === 0) throw new Error('no se reconoce ninguna regla ni memoria en el archivo');
  return { rules, facts, puddleLife, synapses };
}

// Solo entran conexiones concepto→sensación con forma sana; el resto se ignora.
function validateSynapses(syn) {
  const outside = {};
  if (!syn || typeof syn !== 'object') return outside;
  for (const [id, s] of Object.entries(syn).slice(0, 500)) {
    if (!s || typeof s !== 'object') continue;
    const { a, b, w, n } = s;
    if (typeof a !== 'string' || typeof b !== 'string' || a.length > 80 || b.length > 80) continue;
    if (id !== `${a}>${b}` || !a.startsWith('key:') || !b.startsWith('feel:')) continue;
    if (!isNumber(w) || w < -1 || w > 1) continue;
    outside[id] = { a, b, kind: 'feel', w, n: isNumber(n) ? n : 0 };
  }
  return outside;
}
