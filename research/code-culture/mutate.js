// The variation operator (docs/research/plan-codigo-cultural.md, step 2): a
// language model rewrites a judge in code (src/learned/code-judge.js).
//
//   zero-shot : it writes a judge from the description of the problem alone,
//               no life behind it (what the model already knows)
//   revise    : it rewrites a judge from her diary (what one life taught)
//
// Two vocabularies:
//   plain : her actions, fields and traits by their names
//   blind : neutral names (a1..a4, n1.., t1..t3 with values v1..), so what
//           the model writes can only come from the diary, not from what
//           "poison" or "taste" mean to it. A blind text is wrapped in an
//           adapter (blindWrap) that translates in and out inside the judge.
//
// A proposal is kept only if it compiles and answers the shape cases (one
// fruit of each sort she meets) with no failure; otherwise the parent stays.

import { compile, askCode, askWants, ANSWERS } from '../../src/learned/code-judge.js';
import { CODE } from '../../src/config.js';
import { TRAITS } from '../../src/chemistry.js';
import { ask } from './model.js';

// v1: the smoke run (3 worlds) changed the signature in 2 of 12 texts and
// wrote one too long. v2 fixes the signature and asks for short code.
export const PROMPT_VERSION = 2;

// ---- plain -----------------------------------------------------------------

const PLAIN_SYSTEM = `You write the decision code of a foraging ant called Fagi, in plain JavaScript.

When she touches a fruit, your function ground(obs, look, diary) decides what she does. Return exactly one string:
- 'eat': eat the whole fruit
- 'taste': take a small trial bite (a fraction of a fruit; small benefit, small harm)
- 'carry': take it home to the pantry (only if she is not carrying something)
- 'leave': leave it
Optionally, wants(obs, look, diary) returns true or false: walk toward a fruit she sees or smells?

obs: { hunger: 0..100 (100 = she starves to death; it rises over time), felt: hunger minus what her stomach already holds, hungerMax: 100, age: seconds, carrying: kind or null, pantry: { kind: count }, target: true if she came for this fruit, innate: what she would do by instinct (a string in ground, a boolean in wants) }
look: { key, color, shape, smell } of the fruit; key names its species.
diary: her past bites in this life, oldest first: { key, color, shape, smell, at, portion, novel, before, after, harmed }. before/after are her hunger around the bite; harmed is true when hunger went UP after it (a poisonous fruit).

The world: several fruit species; some feed her, some are poisonous. Species that share traits may share chemistry. Which traits are poisonous can change without warning. A poisonous bite costs hunger and health; not eating starves her.

Rules for the code: keep the exact signatures ground(obs, look, diary) and wants(obs, look, diary), all three parameters in that order even if unused; plain functions, no Date, no Math.random, no require, no I/O, deterministic. Keep it short: at most ${CODE.maxChars - 1500} characters, comments included. You may define helper functions.

Answer with one \`\`\`js code block, then one line starting with WHY: that says in a sentence what the code does and why.`;

// One bite as she wrote it, short.
const bitePlain = (b) => `t=${Math.round(b.at)} ${b.key} portion ${b.portion} hunger ${b.before}->${b.after}${b.harmed ? ' HARMED' : ''}${b.novel ? ' (first of its kind)' : ''}`;

// ---- blind -----------------------------------------------------------------

const ACT = { eat: 'a1', taste: 'a2', carry: 'a3', leave: 'a4' };
const TRAIT_NAMES = { color: 't1', shape: 't2', smell: 't3' };
const valueCode = (trait, v) => `v${TRAITS[trait].indexOf(v) + 1}`;

const BLIND_SYSTEM = `You write the decision code of an agent, in plain JavaScript.

When the agent is at an item, your function decide(x, y, z) chooses one option. Return exactly one of the strings 'a1', 'a2', 'a3', 'a4'.
Optionally, approach(x, y, z) returns true or false: move toward an item it detects?

x: { n1: a level 0..100 (at 100 the agent dies; it rises over time), n2: n1 minus a pending amount, n3: time alive in seconds, n4: true if the agent came for this item, n5: the agent's default choice (an option string in decide, a boolean in approach) }
y: { k, t1, t2, t3 } of the item; k names its kind; t1..t3 are traits with values v1, v2, ...
z: past uses of option a1 or a2 in this life, oldest first: { k, t1, t2, t3, at, amount, first, before, after }. before/after are n1 around the use.

Rules for the code: keep the exact signatures decide(x, y, z) and approach(x, y, z), all three parameters in that order even if unused; plain functions, no Date, no Math.random, no require, no I/O, deterministic. Keep it short: at most ${CODE.maxChars - 2000} characters, comments included. You may define helper functions.

Answer with one \`\`\`js code block, then one line starting with WHY: that says in a sentence what the code does and why.`;

const blindLook = (l) => ({ k: `${valueCode('color', l.color)}${valueCode('shape', l.shape)}${valueCode('smell', l.smell)}`.replaceAll('v', ''), t1: valueCode('color', l.color), t2: valueCode('shape', l.shape), t3: valueCode('smell', l.smell) });
const biteBlind = (b) => { const y = blindLook(b); return `t=${Math.round(b.at)} k=${y.k} t1=${y.t1} t2=${y.t2} t3=${y.t3} amount ${b.portion} n1 ${b.before}->${b.after}${b.novel ? ' (first of its k)' : ''}`; };

// The adapter around a blind text: it renames what goes in and what comes out.
export function blindWrap(text) {
  const values = JSON.stringify(TRAITS);
  return `${text}
const __ACT = ${JSON.stringify(Object.fromEntries(Object.entries(ACT).map(([k, v]) => [v, k])))};
const __CODE = ${JSON.stringify(ACT)};
const __TR = ${values};
function __v(t, v) { return 'v' + (__TR[t].indexOf(v) + 1); }
function __y(l) { const y = { t1: __v('color', l.color), t2: __v('shape', l.shape), t3: __v('smell', l.smell) }; y.k = (y.t1 + y.t2 + y.t3).split('v').join(''); return y; }
function __z(d) { return d.map((b) => Object.assign(__y(b), { at: b.at, amount: b.portion, first: b.novel, before: b.before, after: b.after })); }
function __x(o, innate) { return { n1: o.hunger, n2: o.felt, n3: o.age, n4: o.target, n5: innate }; }
function ground(obs, look, diary) { return __ACT[decide(__x(obs, __CODE[obs.innate]), __y(look), __z(diary))]; }
function wants(obs, look, diary) { if (typeof approach !== 'function') return obs.innate; return approach(__x(obs, obs.innate), __y(look), __z(diary)); }`;
}

// ---- prompts ---------------------------------------------------------------

function userPrompt({ kind, parentText, diary, blind, reasons }) {
  const lines = (diary ?? []).slice(-30).map(blind ? biteBlind : bitePlain);
  const goal = blind ? 'Keep n1 low and keep the agent alive as long as possible.' : 'Help her live long and eat well.';
  if (kind === 'zero-shot') return `Write the code. ${goal}`;
  return [
    'Her current code:', '```js', parentText, '```',
    // Step 4, format 'reasons': why the code is as it is, as her mother told it.
    ...(reasons ? [`Why her code is as it is, as her mother told her: ${reasons}`] : []),
    lines.length ? `${blind ? 'What happened in this life' : 'Her diary of this life'} (oldest first):\n${lines.join('\n')}` : 'Nothing happened yet in this life.',
    `Rewrite the code to do better. ${goal} Keep what works.`,
  ].join('\n');
}

export function messagesOf(req) {
  return [
    { role: 'system', content: req.blind ? BLIND_SYSTEM : PLAIN_SYSTEM },
    { role: 'user', content: userPrompt(req) },
  ];
}

// ---- reading a reply -------------------------------------------------------

export function parseReply(reply) {
  const m = reply.match(/```(?:js|javascript)?\s*\n([\s\S]*?)```/);
  const why = reply.match(/WHY:\s*(.+)/)?.[1]?.trim() ?? null;
  return { text: m ? m[1].trim() : null, why };
}

// The shape cases: a fruit never bitten, one that harmed her, one that fed
// her, each at low and high hunger, carrying or not.
const SHAPE = (() => {
  const look = { key: 'red-round-sweet', color: 'red', shape: 'round', smell: 'sweet' };
  const other = { key: 'blue-drop-sharp', color: 'blue', shape: 'drop', smell: 'sharp' };
  const bite = (l, before, after) => ({ ...l, at: 100, portion: 1, novel: false, before, after, harmed: after > before });
  const obs = (hunger, innate, carrying = null) => ({ age: 500, hunger, felt: hunger, hungerMax: 100, carrying, pantry: {}, meal: null, target: false, innate });
  return [
    { obs: obs(20, 'carry'), look, diary: [] },
    { obs: obs(70, 'eat'), look, diary: [] },
    { obs: obs(60, 'eat'), look, diary: [bite(look, 50, 70)] },
    { obs: obs(60, 'eat', 'nectar'), look: other, diary: [bite(look, 50, 70), bite(other, 60, 20)] },
  ];
})();

// Does a full judge text (already wrapped if blind) hold its shape?
export function shapeOf(source) {
  const j = compile(source);
  if (j.error) return { ok: false, failure: j.error };
  for (const a of SHAPE) {
    const r = askCode(j, a);
    if (r.failure) return { ok: false, failure: r.failure };
    if (!ANSWERS.includes(r.answer)) return { ok: false, failure: 'answer' };
    // wants() too, when the text has it (it is asked far more often).
    const w = askWants(j, { ...a, obs: { ...a.obs, innate: true } });
    if (w.failure) return { ok: false, failure: `wants-${w.failure}` };
  }
  return { ok: true, failure: null };
}

// One call of the operator. Returns { source, text, why, ok, failure, ms, cached, key }:
// `source` is what the judge runs (the parent's if the proposal fails).
export async function rewrite(req, { model, temperature = 0.7, seed = 0, archive, think = false }) {
  const messages = messagesOf(req);
  const { reply, ms, cached, key } = await ask({ model, messages, temperature, seed, archive, think });
  const { text, why } = parseReply(reply);
  if (!text) return { source: req.parentSource ?? null, text: null, why, ok: false, failure: 'no-code', ms, cached, key };
  const source = req.blind ? blindWrap(text) : text;
  const shape = shapeOf(source);
  return { source: shape.ok ? source : req.parentSource ?? null, text, why, ok: shape.ok, failure: shape.failure, ms, cached, key };
}

// The seed text in the blind vocabulary: the agent's default, always.
export const SEED_BLIND = `function decide(x, y, z) {
  return x.n5;
}
function approach(x, y, z) {
  return x.n5;
}`;
