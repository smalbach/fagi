// Her program: what she tries, in order, each time she decides.
//
// The order used to be code: the RULES list of decision.js, a hierarchy only a
// person could change. Now it is data she carries (fagi.brain.program): one
// line per behavior, printed as a line of real JavaScript
// (`line('drink', {...})`) and read back with JSON.parse, never eval — the
// same as her rules (learned/dsl.js) and her rules of conduct
// (learned/conduct.js). `line()` is the only gatekeeper: whoever writes a
// line — birth, she, the night, a sister, research — goes through it.
//
// A line says:
//   tier    where it stands under the one directive, survive:
//           survive | endure | provide | clues | explore. With the decision
//           point on (DECIDE), its controller is asked before the first line
//           past the reflexes (survive, endure)
//   do      one of the behaviors she is born able to do (BEHAVIORS). A behavior
//           looks at the situation and returns an intention or nothing, and it
//           keeps its own checks (nothing pressing, a known nest...) wherever
//           its line stands
//   if      optional: what else must hold for the line to be tried, all of it,
//           read from what she feels and perceives (CONDITIONS), never from
//           what the world is. The lines she is born with have none: their
//           behaviors check for themselves
// and its life: where it came from (source: born | self | night | told), when
// (learnedAt), why, and whether it was retired.
//
// She is born with INNATE: the hierarchy exactly as decision.js wrote it, in
// the same order. A program nobody edited decides as that hierarchy did, to
// the last frame (scripts/trace.js holds it against
// test/fixtures/decisions.json). What she does when no line answers is not a
// line: she explores (decision.js), so no program can leave her with nothing
// to do.
//
// This file is the grammar, what she is born with and how a line is read.
// Nothing here changes a program.

export const TIERS = ['survive', 'endure', 'provide', 'clues', 'explore'];

// What she is born able to do: every behavior in decision/, by the name her
// thought and the brain map already use. decision.js holds the function behind
// each name (REPERTOIRE) and refuses to load if the two lists differ.
// ('line' is lining the nest, the behavior; not a line of the program.)
export const BEHAVIORS = [
  'swimOut', 'drink', 'sip', 'eatCarried', 'directiveEarly', 'thermalReflex', 'urgency', 'pantry',
  'rest', 'sleep', 'huddle', 'thermal', 'shelter', 'anticipate', 'dusk', 'shelterRetreat',
  'directive', 'line', 'carry', 'thirstSearch', 'pursue', 'patrol',
  'scent', 'memory', 'zigzag',
  'taste', 'probe',
];

// The hierarchy she is born with, as it stood in decision.js: the first
// line that answers wins.
export const INNATE = [
  // 1. survive now
  { id: 'swimOut', tier: 'survive', do: 'swimOut' },
  { id: 'drink', tier: 'survive', do: 'drink' },
  { id: 'sip', tier: 'survive', do: 'sip' },                       // CONCEPT only: a thing she believes has sap, nearer than water
  { id: 'eatCarried', tier: 'survive', do: 'eatCarried' },
  { id: 'directiveEarly', tier: 'survive', do: 'directiveEarly' }, // only answers with BACKEND.authority === 1, and never if something presses that it doesn't handle
  { id: 'thermalReflex', tier: 'survive', do: 'thermalReflex' },   // THERMAL only: stress about to kill
  { id: 'urgency', tier: 'survive', do: 'urgency' },
  { id: 'pantry', tier: 'survive', do: 'pantry' },
  // 2. endure
  { id: 'rest', tier: 'endure', do: 'rest' },
  { id: 'sleep', tier: 'endure', do: 'sleep' },                    // SLEEP only
  { id: 'huddle', tier: 'endure', do: 'huddle' },                  // CONCEPT only: a thing she believes warm or cool, nearer than the nest
  { id: 'thermal', tier: 'endure', do: 'thermal' },                // THERMAL only, once she knows the nest helps
  { id: 'shelter', tier: 'endure', do: 'shelter' },
  { id: 'anticipate', tier: 'endure', do: 'anticipate' },
  { id: 'dusk', tier: 'endure', do: 'dusk' },                      // CYCLE only, once the dark means cold to her
  { id: 'shelterRetreat', tier: 'endure', do: 'shelterRetreat' },  // adaptive tactical retreat to nearby canopy
  // 3. provide
  { id: 'directive', tier: 'provide', do: 'directive' },           // only answers with BACKEND.authority === 0 (the default)
  { id: 'line', tier: 'provide', do: 'line' },                     // CONCEPT only: take a thing she believes warm home, for the nest
  { id: 'carry', tier: 'provide', do: 'carry' },
  { id: 'thirstSearch', tier: 'provide', do: 'thirstSearch' },     // only with APPETITE on
  { id: 'pursue', tier: 'provide', do: 'pursue' },
  { id: 'patrol', tier: 'provide', do: 'patrol' },                 // adaptive nest perimeter scouting
  // clues of something she already perceived and lost, from the freshest to the oldest
  { id: 'scent', tier: 'clues', do: 'scent' },
  { id: 'memory', tier: 'clues', do: 'memory' },
  { id: 'zigzag', tier: 'clues', do: 'zigzag' },                   // adaptive crosswind sweep
  // 4. explore: last night's questions come first (experiment.js)
  { id: 'taste', tier: 'explore', do: 'taste' },
  { id: 'probe', tier: 'explore', do: 'probe' },                   // CONCEPT only: touch, then nibble, a kind she has not figured out
];

// What a line's `if` may ask, all of it about her:
//   hungerFrom, hungerBelow, thirstFrom, thirstBelow, energyFrom, energyBelow:
//     one of LEVELS, as a share of the need's top (energy: of her own maximum)
//   carrying, inNest, dark, raining, pressureFalling: true or false
// Levels are steps, not any number: a line can only be moved from one to the
// next, and the grammar stays a list that can be counted.
export const LEVELS = [0.1, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.9];
const NEEDS = ['hunger', 'thirst', 'energy'];
const FLAGS = ['carrying', 'inNest', 'dark', 'raining', 'pressureFalling'];
export const CONDITIONS = [...NEEDS.flatMap((n) => [`${n}From`, `${n}Below`]), ...FLAGS];

// The situation as a line reads it: each need as a share of its top, and the
// flags. The same reading is kept with every moment she notes
// (program/watch.js), so a condition can be asked again of her past.
export function featuresOf(fagi, ctx) {
  return {
    hunger: ctx.hungerU, thirst: ctx.thirstU, energy: ctx.energyU,
    carrying: Boolean(fagi.carrying), inNest: Boolean(ctx.inNest), dark: Boolean(fagi.dark),
    raining: Boolean(fagi.raining), pressureFalling: Boolean(fagi.pressureFalling),
  };
}

// Does a situation meet a condition? All of it must hold.
export function meets(cond, f) {
  for (const n of NEEDS) {
    if (cond[`${n}From`] != null && !(f[n] >= cond[`${n}From`])) return false;
    if (cond[`${n}Below`] != null && !(f[n] < cond[`${n}Below`])) return false;
  }
  for (const flag of FLAGS) if (cond[flag] != null && f[flag] !== cond[flag]) return false;
  return true;
}

// Every condition of a single clause the grammar allows: one need at one
// step, either way, or one flag, either way.
export const CLAUSES = [
  ...NEEDS.flatMap((n) => LEVELS.flatMap((v) => [{ [`${n}From`]: v }, { [`${n}Below`]: v }])),
  ...FLAGS.flatMap((flag) => [{ [flag]: true }, { [flag]: false }]),
];

// A condition as it goes into a line's id: thirstBelow45, notRaining.
export function condId(cond) {
  return Object.entries(cond).map(([k, v]) => (typeof v === 'boolean'
    ? (v ? k : `not${k[0].toUpperCase()}${k.slice(1)}`)
    : `${k}${Math.round(v * 100)}`)).join('-');
}

// The line a line grew out of, all the way back: a born line is its own root.
export const rootOf = (l) => l.from ?? l.id;

const SOURCES = ['born', 'self', 'night', 'told'];
const VALID_ID = /^[A-Za-z][A-Za-z0-9-]{0,63}$/;

function fail(msg) {
  throw new Error(`invalid line of her program: ${msg}`);
}
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateIf(cond) {
  if (!cond || typeof cond !== 'object' || Array.isArray(cond)) fail('"if" must be an object');
  const extra = Object.keys(cond).filter((k) => !CONDITIONS.includes(k));
  if (extra.length) fail(`unknown conditions: ${extra.join(', ')}`);
  // Built in the order of CONDITIONS, so the same line always prints the same.
  const out = {};
  for (const need of NEEDS) {
    for (const k of [`${need}From`, `${need}Below`]) {
      if (cond[k] === undefined) continue;
      if (!LEVELS.includes(cond[k])) fail(`"${k}" must be one of ${LEVELS.join(', ')}`);
      out[k] = cond[k];
    }
    if (out[`${need}From`] != null && out[`${need}Below`] != null && out[`${need}From`] >= out[`${need}Below`]) {
      fail(`no ${need} is both`);
    }
  }
  for (const flag of FLAGS) {
    if (cond[flag] === undefined) continue;
    if (typeof cond[flag] !== 'boolean') fail(`"${flag}" must be true or false`);
    out[flag] = cond[flag];
  }
  if (!Object.keys(out).length) fail('"if" must say something');
  return out;
}

// line(id, spec) → the validated line, or throws with a readable reason.
// spec: { tier, do, if?, source, learnedAt, from?, over?, why?, retired?, retiredAt? }
//   from: the line it grew out of, when she wrote it from one (program/learn.js)
//   over: the line it was put in front of
const otherId = (v, id) => typeof v === 'string' && VALID_ID.test(v) && v !== id;

export function line(id, spec) {
  if (typeof id !== 'string' || !VALID_ID.test(id)) fail(`id "${id}" is malformed`);
  if (!spec || typeof spec !== 'object') fail('the body is missing');
  const { tier, if: cond, do: act, chain, source, learnedAt, from, over, why, retired, retiredAt, ...rest } = spec;
  const extra = Object.keys(rest);
  if (extra.length) fail(`unknown fields: ${extra.join(', ')}`);
  if (!TIERS.includes(tier)) fail(`"tier" must be ${TIERS.join('|')}`);
  if (!BEHAVIORS.includes(act)) fail(`"do" must be a behavior she is born able to do, not "${act}"`);
  if (chain !== undefined) {
    if (!Array.isArray(chain) || chain.length < 2 || chain.some((b) => !BEHAVIORS.includes(b))) {
      fail('"chain" must be an array of at least 2 valid behaviors');
    }
  }
  const when = cond === undefined ? null : validateIf(cond);
  if (!SOURCES.includes(source)) fail(`"source" must be ${SOURCES.join('|')}`);
  if (!isNumber(learnedAt)) fail('"learnedAt" must be numeric');
  if (from !== undefined && !otherId(from, id)) fail('"from" must be the id of another line');
  if (over !== undefined && !otherId(over, id)) fail('"over" must be the id of another line');
  if (why !== undefined && (typeof why !== 'string' || why.length > 160)) fail('"why" must be a short text');
  if (retired !== undefined && typeof retired !== 'boolean') fail('"retired" must be a boolean');
  if (retiredAt !== undefined && !isNumber(retiredAt)) fail('"retiredAt" must be numeric');
  return {
    id, tier, ...(when ? { if: when } : {}), do: act,
    ...(chain ? { chain } : {}),
    source, learnedAt,
    ...(from ? { from } : {}),
    ...(over ? { over } : {}),
    ...(why ? { why } : {}),
    ...(retired ? { retired: true, retiredAt: retiredAt ?? learnedAt } : {}),
  };
}

// A program: its lines in order, and a count of the changes to it (for
// whoever repaints it).
export function createProgram(lines = INNATE) {
  const seen = new Set();
  const out = lines.map(({ id, ...spec }) => {
    if (seen.has(id)) fail(`two lines are "${id}"`);
    seen.add(id);
    return line(id, { source: 'born', learnedAt: 0, ...spec });
  });
  return { lines: out, seq: 0 };
}

// Her program, made from INNATE the first time it is asked for if she was
// not born with one (a brain made by hand, in a test).
export function programOf(fagi) {
  return fagi.brain.program ?? (fagi.brain.program = createProgram());
}

// The lines she was born with, as a daughter inherits them (reproduction.js):
// born lines only, as they were at her birth. What she wrote herself, or took
// back, she learned: it does not pass through the egg.
export const innateOf = (fagi) => programOf(fagi).lines
  .filter((l) => l.source === 'born')
  .map(({ id, tier, if: cond, do: act }) => ({ id, tier, ...(cond ? { if: cond } : {}), do: act }));

// Does a line's `if` hold now? A line with none always does.
export const holds = (l, fagi, ctx) => !l.if || meets(l.if, featuresOf(fagi, ctx));

// One line of code per line of her program; the object is valid JSON.
export function renderLine(l) {
  const { id, ...rest } = l;
  const text = `line('${id}', ${JSON.stringify(rest)})`;
  return l.retired ? `// retired ${l.retiredAt.toFixed(1)}s: ${text}` : text;
}

// The program as a module, the way the learned-code panel shows it and
// exports it (learned/store.js), after what she learned.
export function renderProgram(program) {
  const all = program.lines;
  const own = all.filter((l) => l.source !== 'born').length;
  const retired = all.filter((l) => l.retired).length;
  const header = '// Her program (src/program.js): what she tries, in order, each time she decides.\n'
    + `// ${all.length} line(s): ${all.length - own} she was born with, ${own} her own, ${retired} retired. `
    + 'The first that answers wins; if none does, she explores.\n';
  // In her order, retired lines included: the order is what the program says.
  const body = all.map((l) => `  ${renderLine(l)}`).join(',\n');
  return `${header}import { line } from '../program.js';\n\nexport const program = [\n${body},\n];\n`;
}

const LINE = /^(?:\/\/ retired [\d.]+s: )?line\('([A-Za-z][A-Za-z0-9-]{0,63})',\s*(\{.*\})\)$/;

// Reads the lines of a program out of a text and validates each with line().
// It never executes the text; anything that does not have the exact shape of
// renderLine is ignored, and a line that has it but does not validate fails
// the whole read.
export function parseProgram(text) {
  if (typeof text !== 'string') throw new Error('the program must be text');
  if (text.length > 256 * 1024) throw new Error('the program is too large');
  const lines = [];
  for (const raw of text.split('\n')) {
    const m = LINE.exec(raw.trim().replace(/,\s*$/, ''));
    if (!m) continue;
    let spec;
    try { spec = JSON.parse(m[2]); } catch { fail(`invalid JSON: ${raw.trim().slice(0, 60)}`); }
    lines.push(line(m[1], spec));
  }
  if (!lines.length) throw new Error('no line of a program recognized in the text');
  if (new Set(lines.map((l) => l.id)).size !== lines.length) fail('two lines share an id');
  return { lines, seq: 0 };
}
