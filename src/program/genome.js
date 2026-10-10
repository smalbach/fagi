// A behavioral genome is a base snapshot plus experience-backed revisions.
// There is no random mutation or deletion here. Unreviewed live suggestions
// (for example crisis templates) never enter the journal automatically.

import { createProgram, programOf, line, validateIf } from '../program.js';
import { qnorm } from './evidence.js';

const VERSION = 1;
const FORMAT = 'fagi-behavior';
const copy = (value) => structuredClone(value);
const fail = (message) => { throw new Error(`invalid behavioral genome: ${message}`); };
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const number = (value) => typeof value === 'number' && Number.isFinite(value);

function fields(value, names, label) {
  if (!object(value) || Object.keys(value).some((k) => !names.includes(k))) fail(`${label} has unknown fields`);
}

function validateEvidence(e) {
  fields(e, ['kind', 'observer', 'at', 'baseline', 'alternative', 'condition', 'baselineCount', 'alternativeCount',
    'improvement', 'standardError', 'minSupport', 'margin', 'alpha', 'strictness', 'comparisons', 'references'], 'evidence');
  if (e.kind !== 'observed-comparison' || typeof e.observer !== 'string' || !e.observer || !number(e.at) || e.at < 0) fail('evidence needs an observer and time');
  if (typeof e.baseline !== 'string' || typeof e.alternative !== 'string' || e.baseline === e.alternative) fail('evidence needs two different behaviors');
  if (!object(e.condition)) fail('evidence needs a condition');
  if (Object.keys(e.condition).length) validateIf(e.condition);
  for (const k of ['baselineCount', 'alternativeCount', 'minSupport', 'comparisons']) {
    if (!Number.isSafeInteger(e[k]) || e[k] < 1) fail(`invalid ${k}`);
  }
  if (e.baselineCount < e.minSupport || e.alternativeCount < e.minSupport) fail('insufficient observed support');
  if (!number(e.improvement) || !number(e.standardError) || e.standardError < 0 || !number(e.margin) || e.margin < 0
    || !number(e.alpha) || e.alpha <= 0 || e.alpha >= 0.5 || !number(e.strictness) || e.strictness < 0) fail('invalid uncertainty');
  const threshold = Math.max(e.margin, qnorm(1 - e.alpha / Math.max(1, e.comparisons ** e.strictness)) * e.standardError);
  if (!(e.improvement > threshold)) fail('the observed improvement does not clear uncertainty');
  if (!Array.isArray(e.references) || e.references.length > 32) fail('invalid episode references');
  for (const r of e.references) {
    fields(r, ['who', 'at', 'toldBy'], 'episode reference');
    if (typeof r.who !== 'string' || !number(r.at) || r.at < 0 || (r.toldBy !== undefined && typeof r.toldBy !== 'string')) fail('invalid episode reference');
  }
}

function applyRevision(lines, change) {
  fields(change, ['operation', 'rule', 'before', 'evidence'], 'revision');
  if (!['upsert', 'retire'].includes(change.operation)) fail('unsupported revision');
  validateEvidence(change.evidence);
  if (!object(change.rule)) fail('missing rule');
  const { id, ...spec } = change.rule;
  const rule = line(id, spec);
  if (rule.chain) fail('compound behavior needs its own outcome evidence');
  const e = change.evidence;
  if (rule.from !== e.alternative || rule.over !== e.baseline
    || JSON.stringify(rule.if ?? {}) !== JSON.stringify(Object.keys(e.condition).length ? validateIf(e.condition) : {})) fail('evidence does not match the rule');
  const index = lines.findIndex((l) => l.id === id);
  if (change.operation === 'retire') {
    if (index < 0 || lines[index].retired || !rule.retired || change.before !== undefined) fail('retirement needs a live rule');
    const previous = lines[index];
    if (previous.do !== rule.do || previous.from !== rule.from || previous.over !== rule.over
      || JSON.stringify(previous.if ?? {}) !== JSON.stringify(rule.if ?? {})) fail('retirement cannot rewrite a rule');
    lines[index] = rule;
    return;
  }
  if (rule.retired || rule.source !== 'self' || change.before !== rule.over) fail('invalid learned insertion');
  const anchor = lines.find((l) => l.id === change.before && !l.retired);
  const from = lines.find((l) => l.id === rule.from && !l.retired);
  if (!anchor || anchor.tier === 'survive' || !from || from.do !== rule.do || from.tier !== rule.tier) fail('insertion has no matching behavior and anchor');
  if (index >= 0 && (!lines[index].retired || lines[index].source === 'born')) fail('an insertion cannot overwrite a live or base rule');
  if (index >= 0) lines.splice(index, 1);
  lines.splice(lines.findIndex((l) => l.id === change.before), 0, rule);
}

// Validate and reconstruct independently of whichever base ships with a future
// release. Retired entries stay present, so descendants cannot resurrect them.
export function validateProgramGenome(value) {
  fields(value, ['format', 'version', 'base', 'changes'], 'genome');
  if (value.format !== FORMAT || value.version !== VERSION || !Array.isArray(value.base) || !Array.isArray(value.changes)) fail('unsupported format or version');
  const genome = copy(value);
  const lines = createProgram(genome.base).lines;
  if (lines.some((l) => l.source !== 'born')) fail('the base must contain born rules');
  for (const change of genome.changes) applyRevision(lines, change);
  return { genome, lines };
}

// The same genome passing on only the revisions `keep` accepts. A revision that
// no longer applies once others are left out (a retirement of a dropped line, an
// insertion anchored on one) is left out too, so the result always validates.
export function filterProgramGenome(value, keep) {
  const genome = validateProgramGenome(value).genome;
  const changes = [];
  for (const change of genome.changes) {
    if (!keep(change)) continue;
    try { validateProgramGenome({ ...genome, changes: [...changes, change] }); } catch { continue; }
    changes.push(change);
  }
  return { ...genome, changes };
}

function baseOf(fagi) {
  return { format: FORMAT, version: VERSION,
    base: copy(programOf(fagi).lines.filter((l) => l.source === 'born')), changes: [] };
}

// Called only after the learner's evidence gate accepts a revision. Cultural
// lines and template-generated crisis lines are not admitted merely by existing.
export function recordRevision(fagi, operation, rule, evidence, before) {
  if (!evidence || rule.chain) return false;
  const program = programOf(fagi);
  const genome = copy(program.heredity ?? baseOf(fagi));
  if (operation === 'retire') {
    const previous = validateProgramGenome(genome).lines.find((l) => l.id === rule.id);
    if (!genome.changes.some((c) => c.rule.id === rule.id) || !previous || previous.retired) return false;
    // A transient suggestion may reuse an id without entering the genome.
    if (previous.do !== rule.do || previous.from !== rule.from || previous.over !== rule.over
      || previous.tier !== rule.tier || JSON.stringify(previous.if ?? {}) !== JSON.stringify(rule.if ?? {})) return false;
  }
  genome.changes.push({ operation, rule: copy(rule), ...(before ? { before } : {}), evidence: copy(evidence) });
  program.heredity = validateProgramGenome(genome).genome;
  fagi.genome = { ...(fagi.genome ?? { cues: {} }), program: copy(program.heredity) };
  return true;
}

export function captureProgramGenome(fagi) {
  return validateProgramGenome(programOf(fagi).heredity ?? baseOf(fagi)).genome;
}

export function programFromGenome(value) {
  const { genome, lines } = validateProgramGenome(value);
  const revised = new Set(genome.changes.map((c) => c.rule.id));
  return {
    lines: lines.map((l) => revised.has(l.id) ? { ...l, source: 'inherited', learnedAt: 0 } : l),
    seq: 0, heredity: genome,
  };
}

// Version 1 is a data-only English JSON document, conventionally saved as .fagi.
// It is not JavaScript and is never evaluated. The temporal DSL is a later step.
export function renderProgramGenome(value) {
  return `${JSON.stringify(validateProgramGenome(value).genome, null, 2)}\n`;
}

export function parseProgramGenome(text) {
  if (typeof text !== 'string') fail('expected text');
  if (text.length > 4 * 1024 * 1024) fail('document exceeds 4 MiB');
  let value;
  try { value = JSON.parse(text); } catch { fail('expected a JSON data document'); }
  return validateProgramGenome(value).genome;
}
