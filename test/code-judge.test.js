import test from 'node:test';
import assert from 'node:assert/strict';

import { CODE, DECIDE } from '../src/config.js';
import { askCode, compile, SEED_SOURCE, CAUTION_SOURCE } from '../src/learned/code-judge.js';
import { createFagi } from '../src/fagi.js';
import { noteBite, lookObject } from '../src/learned/diary.js';
import { enableOrganism } from '../src/organism.js';
import { set, runEpisode } from '../research/adaptive-decision/episode.js';
import { FOOD, GROUPS } from '../research/adaptive-decision/design.js';

const args = (over = {}) => ({
  obs: { hunger: 50, felt: 50, innate: 'carry', target: false, ...over.obs },
  look: { key: 'nectar', color: 'red', shape: 'round', smell: 'sweet', ...over.look },
  diary: over.diary ?? [],
});
const fn = (body) => `function ground(obs, look, diary) { ${body} }`;

test('a valid text answers, and the seed text answers what she always did', () => {
  assert.deepEqual(askCode(fn("return 'eat';"), args()), { answer: 'eat', failure: null });
  assert.deepEqual(askCode(SEED_SOURCE, args()), { answer: 'carry', failure: null });
});

test('every failure gives the innate answer and says which failure it was', () => {
  const cases = {
    compile: 'function ground( {',
    'no-ground': 'function judge() { return "eat"; }',
    error: fn('throw new Error("x");'),
    timeout: fn('while (true) {}'),
    answer: fn("return 'run';"),
    'too-long': fn(`return 'eat'; // ${'x'.repeat(CODE.maxChars)}`),
  };
  for (const [failure, source] of Object.entries(cases)) {
    assert.deepEqual(askCode(source, args()), { answer: 'carry', failure }, failure);
  }
  // An object that would turn into a valid answer is still not one.
  assert.equal(askCode(fn("return { toString: () => 'eat' };"), args()).failure, 'answer');
});

test('the text cannot reach out of its context', () => {
  const tries = [
    "return typeof require === 'undefined' ? 'leave' : 'eat';",
    "return typeof process === 'undefined' ? 'leave' : 'eat';",
    "return typeof Date === 'undefined' ? 'leave' : 'eat';",
    "return typeof Math.random === 'undefined' ? 'leave' : 'eat';",
    // The arguments' constructor is this context's own, not the host's.
    "return obs.constructor.constructor('return typeof process')() === 'object' ? 'eat' : 'leave';",
    "return eval('1') === 1 ? 'eat' : 'leave';",
  ];
  for (const body of tries) {
    const r = askCode(fn(body), args());
    assert.ok(r.answer === 'leave' || r.failure === 'error', body);
    assert.notEqual(r.answer, 'eat', body);
  }
  // What it changes in its arguments never reaches her diary.
  const diary = [{ key: 'nectar', harmed: false }];
  askCode(fn("diary[0].harmed = true; diary.push({}); return 'eat';"), args({ diary }));
  assert.deepEqual(diary, [{ key: 'nectar', harmed: false }]);
});

test('what a text keeps in its globals stays in one compiled copy (one life)', () => {
  const source = fn("globalThis.n = (globalThis.n ?? 0) + 1; return globalThis.n > 1 ? 'leave' : 'eat';");
  const life = compile(source);
  assert.equal(askCode(life, args()).answer, 'eat');
  assert.equal(askCode(life, args()).answer, 'leave');
  // Another life starts from nothing.
  assert.equal(askCode(compile(source), args()).answer, 'eat');
});

test('the diary keeps plain data of each bite, novelty past its own length', () => {
  const was = { ...CODE };
  CODE.enabled = 1; CODE.diary = 2;
  const fagi = createFagi();
  noteBite(fagi, { key: 'nectar', portion: 1, before: 50, after: 20 });
  noteBite(fagi, { key: 'toxic', portion: 0.3, before: 40, after: 60 });
  noteBite(fagi, { key: 'toxic', portion: 1, before: 30, after: 50 });
  noteBite(fagi, { key: 'nectar', portion: 1, before: 50, after: 20 });
  Object.assign(CODE, was);
  assert.equal(fagi.diary.length, 2);
  assert.deepEqual(fagi.diary.map((b) => [b.key, b.novel, b.harmed]), [['toxic', false, true], ['nectar', false, false]]);
  assert.deepEqual(Object.keys(lookObject('nectar')).sort(), ['color', 'key', 'shape', 'smell']);
});

test('the caution text leaves what mostly harmed her and tastes what she never bit', () => {
  const harmed = [{ key: 'nectar', harmed: true }];
  assert.equal(askCode(CAUTION_SOURCE, args({ diary: harmed })).answer, 'leave');
  assert.equal(askCode(CAUTION_SOURCE, args()).answer, 'taste');
  assert.equal(askCode(CAUTION_SOURCE, args({ obs: { hunger: 80 } })).answer, 'carry');
});

test('with the seed text, a life is the same one as with the current judge', () => {
  const life = (sets) => {
    enableOrganism();
    set(FOOD);
    set(sets);
    const r = runEpisode({ seed: GROUPS.dev2.seed, mapSeed: GROUPS.dev2.map(0), horizon: 600 });
    return r.fingerprint;
  };
  const was = { ...CODE, eat: DECIDE.eat };
  const a = life({ 'DECIDE.eat': 'current' });
  const b = life({ 'DECIDE.eat': 'code', 'CODE.enabled': 1, 'CODE.source': SEED_SOURCE });
  set({ 'DECIDE.eat': was.eat, 'CODE.enabled': was.enabled, 'CODE.source': was.source });
  assert.equal(b, a);
});

test('wants() is optional: without it, her innate yes or no', () => {
  const j = compile(fn("return 'eat';"));
  assert.equal(j.wants, null);
  const w = compile(CAUTION_SOURCE);
  const a = (diary, hunger = 50) => ({ obs: { hunger, innate: true }, look: { key: 'nectar' }, diary });
  assert.equal(w.wants(a([{ key: 'nectar', harmed: true }])), false);
  assert.equal(w.wants(a([], 80)), true);
});
