// A judge in code (CODE; docs/research/plan-codigo-cultural.md, step 1): the
// text of a function
//
//   function ground(obs, look, diary) { ... return 'eat' | 'taste' | 'carry' | 'leave'; }
//
// decides what she does with a fruit she touches; an optional
// wants(obs, look, diary) -> true | false decides whether to go to one she
// perceives (obs.innate is then her innate yes or no). The text is what a lineage
// inherits and a language model rewrites; it runs apart (node:vm), so this
// module is for Node only and the game never imports it.
//
// What it receives is plain data, copied as JSON into its own context, so it
// holds no live reference to her or the world:
//   obs   : observe(fagi) (adaptive-decision/observation.js), plus `felt`
//           (hunger minus what her stomach already holds), `target` (she came
//           for this fruit) and `innate` (what 'current' answers for it)
//   look  : { key, color, shape, smell } of the fruit
//   diary : her bites (learned/diary.js)
// Her innate answer is part of what she knows, the way the rules of conduct
// sit over her usual judgment: a text can keep it, override it or ignore it.
//
// Any failure (the text too long or not compiling, no function `ground`, an
// error, too long a run, an answer outside the four) gives that bite her
// innate answer and is counted. pantry and carried stay 'current'.
//
// No Math.random, no Date, no eval or Function, no I/O: given the text and the
// world, a life is the same every time. node:vm is not a security boundary;
// the texts come from our own runs (a local model), never from outside.

import vm from 'node:vm';

import { CODE } from '../config.js';
import { current, registerJudge } from '../decision/bite.js';
import { observe } from '../adaptive-decision/observation.js';
import { feltHunger } from '../stomach.js';
import { lookObject } from './diary.js';

export const ANSWERS = ['eat', 'taste', 'carry', 'leave'];

// The call, run inside the judge's context: arguments in as JSON text, a
// string out (anything else is null), so nothing crosses as a live object.
const CALL = new vm.Script(`(() => {
  const a = JSON.parse(__args);
  const r = ground(a.obs, a.look, a.diary);
  return typeof r === 'string' ? r : null;
})()`);
const WANTS = new vm.Script(`(() => {
  const a = JSON.parse(__args);
  const r = wants(a.obs, a.look, a.diary);
  return typeof r === 'boolean' ? r : null;
})()`);

const SETUP = `
  delete globalThis.Date;
  Math.random = undefined;
  delete globalThis.console;
`;

// A text compiled into a context of its own: { run(args) -> answer | throws }
// or { error }. Each life gets its own (see `code` below): whatever the text
// keeps in its globals is her memory in that life, never another's.
export function compile(source) {
  if (typeof source !== 'string') return { error: 'no-text' };
  if (source.length > CODE.maxChars) return { error: 'too-long' };
  try {
    const ctx = vm.createContext(Object.create(null), {
      codeGeneration: { strings: false, wasm: false },
      microtaskMode: 'afterEvaluate',
    });
    vm.runInContext(SETUP, ctx);
    vm.runInContext(source, ctx, { timeout: CODE.timeoutMs });
    if (vm.runInContext('typeof ground', ctx) !== 'function') return { error: 'no-ground' };
    const hasWants = vm.runInContext('typeof wants', ctx) === 'function';
    const call = (script) => (args) => {
      ctx.__args = JSON.stringify(args);
      return script.runInContext(ctx, { timeout: CODE.timeoutMs });
    };
    return { run: call(CALL), wants: hasWants ? call(WANTS) : null };
  } catch (e) {
    return { error: e?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'timeout' : 'compile' };
  }
}

// What a compiled text (or a text, compiled anew) answers for this fruit; on
// a failure, the innate answer and which failure it was.
export function askCode(judgeOrSource, args) {
  const j = typeof judgeOrSource === 'string' || judgeOrSource == null ? compile(judgeOrSource) : judgeOrSource;
  if (j.error) return { answer: args.obs.innate, failure: j.error };
  try {
    const r = j.run(args);
    if (!ANSWERS.includes(r)) return { answer: args.obs.innate, failure: 'answer' };
    return { answer: r, failure: null };
  } catch (e) {
    return { answer: args.obs.innate, failure: e?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'timeout' : 'error' };
  }
}

// The same for wants(obs, look, diary): go to a fruit she sees or smells?
// A text without it keeps her innate answer, with no failure.
export function askWants(j, args) {
  if (j.error || !j.wants) return { answer: args.obs.innate, failure: null };
  try {
    const r = j.wants(args);
    if (typeof r !== 'boolean') return { answer: args.obs.innate, failure: 'answer' };
    return { answer: r, failure: null };
  } catch (e) {
    return { answer: args.obs.innate, failure: e?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'timeout' : 'error' };
  }
}

export function argsOf(fagi, p, innate) {
  return {
    obs: { ...observe(fagi), felt: feltHunger(fagi), target: fagi.target === p, innate },
    look: lookObject(p.type),
    diary: fagi.diary ?? [],
  };
}

// Her record of the judge in one life (CODE, research).
function tally(fagi, answer, failure) {
  const t = (fagi.codeJudge ??= { calls: 0, failures: {}, answers: {}, overrides: 0 });   // ground; wants apart
  t.calls += 1;
  t.answers[answer] = (t.answers[answer] ?? 0) + 1;
  if (failure) t.failures[failure] = (t.failures[failure] ?? 0) + 1;
  return t;
}

// Her own compiled text, made anew when the text changes.
function ownJudge(fagi) {
  if (fagi.codeRun?.source !== CODE.source) fagi.codeRun = { source: CODE.source, judge: compile(CODE.source) };
  return fagi.codeRun.judge;
}

export const code = {
  ground(fagi, p) {
    const innate = current.ground(fagi, p);
    if (!CODE.source) { tally(fagi, innate, null); return innate; }
    const { answer, failure } = askCode(ownJudge(fagi), argsOf(fagi, p, innate));
    const t = tally(fagi, answer, failure);
    if (answer !== innate) t.overrides += 1;
    return answer;
  },
  // A candidate she perceives (perception.js): the text's wants() if it has one.
  wants(fagi, c) {
    const innate = current.wants(fagi, c);
    if (!CODE.source) return innate;
    const j = ownJudge(fagi);
    if (!j.wants) return innate;
    const { answer, failure } = askWants(j, { ...argsOf(fagi, c.ref, innate), look: lookObject(c.key) });
    const t = (fagi.codeJudge ??= { calls: 0, failures: {}, answers: {}, overrides: 0 });
    const w = (t.wants ??= { calls: 0, failures: 0, overrides: 0 });
    w.calls += 1;
    if (failure) w.failures += 1;
    if (answer !== innate) w.overrides += 1;
    return answer;
  },
  pantry: current.pantry,
  carried: current.carried,
};

registerJudge('code', code);

// The seed text: what she has always done (the same lives as 'current').
export const SEED_SOURCE = `function ground(obs, look, diary) {
  // What she has always done with a fruit she touches.
  return obs.innate;
}`;

// The caution heuristic (learned/conduct.js CAUTION_LINES) written as text:
// leave a kind that harmed her at least as often as it fed her; taste a kind
// she never bit while her hunger is below 75; otherwise as always. wants()
// says the same of a fruit she perceives, as the 'learned' judge does.
export const CAUTION_SOURCE = `function record(look, diary) {
  let harms = 0, fed = 0;
  for (const b of diary) if (b.key === look.key) { if (b.harmed) harms++; else fed++; }
  return { harms, fed, mostly: harms > 0 && harms >= fed, novel: harms + fed === 0 };
}
function ground(obs, look, diary) {
  const r = record(look, diary);
  if (r.mostly) return 'leave';
  if (r.novel && obs.hunger < 75) return 'taste';
  return obs.innate;
}
function wants(obs, look, diary) {
  const r = record(look, diary);
  if (r.mostly) return false;
  if (r.novel && obs.hunger < 75) return true;
  return obs.innate;
}`;
