// La gramática del código que Fagi escribe sola.
//
// Una regla es un objeto de datos, nunca una función: por eso se puede
// imprimir como una línea de JavaScript real (`rule('id', {...})`) y volver a
// leer sin `eval`, solo con una expresión regular y `JSON.parse`. `rule()` es
// el único portero: valida la forma antes de dejarla entrar, tanto si la
// escribe el aprendiz (synth.js) como si la trae un archivo importado.

const ALCANCES = ['eat', 'store', 'pursue'];
const VEREDICTOS = ['avoid', 'prefer'];
const ETAPAS = ['corta', 'media', 'larga'];
const ID_VALIDO = /^[a-z0-9-]{1,64}$/;

function fail(msg) {
  throw new Error(`regla inválida: ${msg}`);
}

function esNumero(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function validarPorque(because) {
  if (!Array.isArray(because)) fail('"because" debe ser una lista');
  if (because.length > 12) fail('"because" tiene demasiadas sensaciones');
  for (const s of because) {
    if (!s || typeof s.sense !== 'string' || s.sense.length > 40) fail('sensación sin "sense" válido');
    if (!esNumero(s.v)) fail('sensación sin "v" numérico');
  }
}

// rule(id, spec) → la regla ya validada, o lanza con un motivo legible.
// spec: { on, when:{key}, verdict, weight, because, learnedAt, revisedAt?,
//         tries, stage, retired?, retiredAt? }
export function rule(id, spec) {
  if (typeof id !== 'string' || !ID_VALIDO.test(id)) fail(`id "${id}" fuera de forma`);
  if (!spec || typeof spec !== 'object') fail('falta el cuerpo de la regla');

  const { on, when, verdict, weight, because, learnedAt, revisedAt, tries, stage, retired, retiredAt, ...resto } = spec;
  const sobran = Object.keys(resto);
  if (sobran.length) fail(`campos desconocidos: ${sobran.join(', ')}`);

  if (!Array.isArray(on) || on.length === 0 || on.some((a) => !ALCANCES.includes(a))) {
    fail(`"on" debe ser una lista no vacía dentro de ${ALCANCES.join('|')}`);
  }
  if (!when || typeof when.key !== 'string' || !when.key || when.key.length > 80) {
    fail('"when.key" debe ser un texto no vacío');
  }
  if (!VEREDICTOS.includes(verdict)) fail(`"verdict" debe ser ${VEREDICTOS.join('|')}`);
  if (!esNumero(weight)) fail('"weight" debe ser numérico');
  validarPorque(because);
  if (!esNumero(learnedAt)) fail('"learnedAt" debe ser numérico');
  if (revisedAt !== undefined && !esNumero(revisedAt)) fail('"revisedAt" debe ser numérico');
  if (!Number.isInteger(tries) || tries < 0) fail('"tries" debe ser un entero ≥ 0');
  if (!ETAPAS.includes(stage)) fail(`"stage" debe ser ${ETAPAS.join('|')}`);
  if (retired !== undefined && typeof retired !== 'boolean') fail('"retired" debe ser booleano');
  if (retiredAt !== undefined && !esNumero(retiredAt)) fail('"retiredAt" debe ser numérico');

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
  const { id, ...resto } = r;
  const linea = `rule('${id}', ${JSON.stringify(resto)})`;
  return r.retired ? `// retirada ${r.retiredAt.toFixed(1)}s: ${linea}` : linea;
}

const LINEA_REGLA = /^(?:\/\/ retirada [\d.]+s: )?rule\('([a-z0-9-]{1,64})',\s*(\{.*\})\)$/;
const LINEA_MEMORIA = /^export const memoria = (\{.*\});$/;

// El módulo completo, tal y como se exporta y se enseña en el panel.
export function renderModule(rules, facts, { age } = {}) {
  const activas = rules.filter((r) => !r.retired);
  const retiradas = rules.filter((r) => r.retired);
  const cabecera = `// Código aprendido por Fagi · edad ${(age ?? 0).toFixed(1)}s · ` +
    `${activas.length} regla(s) activa(s), ${retiradas.length} retirada(s)\n` +
    `// Generado por src/learned/dsl.js. Se importa sin eval: cada línea es JSON.\n`;
  const cuerpo = [...activas, ...retiradas].map((r) => '  ' + renderRule(r)).join(',\n');
  const lineaRules = cuerpo ? `export default [\n${cuerpo},\n];` : 'export default [];';
  const lineaMemoria = `export const memoria = ${JSON.stringify({ facts })};`;
  return `${cabecera}import { rule } from './dsl.js';\n\n${lineaRules}\n${lineaMemoria}\n`;
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
  let vistoMemoria = false;

  for (const linea of text.split('\n')) {
    // renderModule separa las reglas con comas de lista (una por línea, la
    // última incluida); se quita para que quede el `rule(...)` exacto.
    const l = linea.trim().replace(/,\s*$/, '');
    if (!l) continue;

    const m = LINEA_REGLA.exec(l);
    if (m) {
      const [, id, json] = m;
      let spec;
      try { spec = JSON.parse(json); } catch { throw new Error(`línea de regla con JSON inválido: ${l.slice(0, 60)}`); }
      rules.push(rule(id, spec));
      continue;
    }

    const mm = LINEA_MEMORIA.exec(l);
    if (mm) {
      let datos;
      try { datos = JSON.parse(mm[1]); } catch { throw new Error('la línea de memoria trae JSON inválido'); }
      if (datos && typeof datos === 'object' && datos.facts && typeof datos.facts === 'object') {
        facts = datos.facts;
        vistoMemoria = true;
      }
    }
    // Cualquier otra línea (comentarios, import, export default [ ... ]) se ignora.
  }

  if (!vistoMemoria && rules.length === 0) throw new Error('no se reconoce ninguna regla ni memoria en el archivo');
  return { rules, facts };
}
