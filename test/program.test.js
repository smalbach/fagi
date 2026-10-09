import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { THIRST } from '../src/config.js';
import {
  TIERS, BEHAVIORS, INNATE, line, createProgram, programOf, holds, renderProgram, parseProgram,
} from '../src/program.js';
import { REPERTOIRE, decide } from '../src/decision.js';
import { createFagi } from '../src/fagi.js';
import { createWorld } from '../src/world.js';
import { perceive } from '../src/perception.js';
import { exportText, importText } from '../src/learned/store.js';
import { SCENARIOS, trace, traceApart, fingerprintsFor, recordingKey } from '../scripts/trace.js';

const FIXTURE = JSON.parse(readFileSync(new URL('./fixtures/decisions.json', import.meta.url), 'utf8'));

// This machine's fingerprints (scripts/trace.js): the last bit of floating
// point differs between processors and Node versions, and a traced life
// amplifies it, so each machine is held to the set recorded on it.
const RECORDED = fingerprintsFor(FIXTURE);
const NONE = RECORDED ? false
  : `no fingerprints recorded for ${recordingKey()}: from a commit you trust, node scripts/trace.js --write`;

// A line she wrote herself, for the tests that need one.
const own = (id, spec) => line(id, { source: 'self', learnedAt: 10, ...spec });
// The same line with something changed (a line's id is not part of its body).
const edited = ({ id, ...spec }, change) => line(id, { ...spec, ...change });

test('she is born with the hierarchy as it stood: every behavior once, tier after tier', () => {
  const p = createProgram();
  assert.deepEqual(p.lines.map((l) => l.do).sort(), [...BEHAVIORS].sort());
  const tiers = p.lines.map((l) => TIERS.indexOf(l.tier));
  assert.ok(tiers.every((t, i) => t >= 0 && (i === 0 || t >= tiers[i - 1])), 'tiers out of order');
  assert.ok(p.lines.every((l) => l.source === 'born' && l.learnedAt === 0 && !l.if && l.id === l.do));
});

test('every behavior a program can name has a function behind it, and none is left unnamed', () => {
  assert.deepEqual(Object.keys(REPERTOIRE).sort(), [...BEHAVIORS].sort());
});

test('the gatekeeper lets in only what the grammar says', () => {
  const ok = { tier: 'endure', do: 'shelter', source: 'self', learnedAt: 3 };
  assert.deepEqual(own('a', { tier: 'endure', do: 'shelter' }), { id: 'a', tier: 'endure', do: 'shelter', source: 'self', learnedAt: 10 });
  // The conditions come out in the grammar's order, whatever order they came in.
  assert.deepEqual(Object.keys(line('a', { ...ok, if: { raining: false, thirstBelow: 0.45 } }).if), ['thirstBelow', 'raining']);
  const refused = [
    ['bad id', 'has space', ok],
    ['id starting with a digit', '1a', ok],
    ['unknown tier', 'a', { ...ok, tier: 'thrive' }],
    ['a behavior she cannot do', 'a', { ...ok, do: 'fly' }],
    ['code instead of a behavior', 'a', { ...ok, do: 'process.exit' }],
    ['unknown field', 'a', { ...ok, run: 'x' }],
    ['unknown condition', 'a', { ...ok, if: { hungry: true } }],
    ['a level off the steps', 'a', { ...ok, if: { hungerFrom: 0.5 } }],
    ['a flag that is not true or false', 'a', { ...ok, if: { dark: 1 } }],
    ['no hunger is both', 'a', { ...ok, if: { hungerFrom: 0.55, hungerBelow: 0.35 } }],
    ['an if that says nothing', 'a', { ...ok, if: {} }],
    ['unknown source', 'a', { ...ok, source: 'god' }],
    ['no learnedAt', 'a', { tier: 'endure', do: 'shelter', source: 'self' }],
    ['a why too long', 'a', { ...ok, why: 'x'.repeat(161) }],
  ];
  for (const [what, id, spec] of refused) assert.throws(() => line(id, spec), /invalid line/, what);
  assert.throws(() => createProgram([...INNATE, INNATE[0]]), /two lines/);
});

test('her program prints as JavaScript and reads back the same, without running anything', () => {
  const p = createProgram([
    ...INNATE.slice(0, 3),
    { id: 'shelter-early', tier: 'endure', if: { pressureFalling: true, thirstBelow: 0.45 }, do: 'shelter', source: 'self', learnedAt: 812.4, why: 'rain came after the drop, three times' },
  ]);
  p.lines[1] = edited(p.lines[1], { retired: true, retiredAt: 900 });
  const text = renderProgram(p);
  assert.match(text, /^ {2}\/\/ retired 900\.0s: line\('drink'/m);
  assert.deepEqual(parseProgram(text).lines, p.lines);
  assert.throws(() => parseProgram('nothing here'));
  assert.throws(() => parseProgram("line('a', {\"tier\":\"survive\",\"do\":\"process.exit\",\"source\":\"self\",\"learnedAt\":0})"), /invalid line/);
  assert.throws(() => parseProgram(`${text}\n${text}`), /share an id/);
});

test('a condition reads what she feels and perceives', () => {
  const l = own('a', { tier: 'endure', do: 'shelter', if: { thirstFrom: 0.45, raining: false } });
  assert.equal(holds(l, { raining: false }, { thirstU: 0.5 }), true);
  assert.equal(holds(l, { raining: false }, { thirstU: 0.4 }), false);
  assert.equal(holds(l, { raining: true }, { thirstU: 0.5 }), false);
  const e = own('b', { tier: 'endure', do: 'rest', if: { energyBelow: 0.25, inNest: true } });
  assert.equal(holds(e, {}, { energyU: 0.2, inNest: true }), true);
  assert.equal(holds(e, {}, { energyU: 0.2, inNest: false }), false);
  assert.equal(holds(createProgram().lines[0], {}, {}), true);   // a born line asks nothing
});

// On an empty map, drinking and thirsty: the line 'drink' is the first to answer.
function drinking(thirst) {
  const world = createWorld();
  const fagi = createFagi();
  fagi.drinking = true;
  fagi.thirst = THIRST.max * thirst;
  const decideNow = () => { decide(fagi, world, perceive(fagi, world), 0.05); return fagi.thought; };
  return { fagi, decideNow };
}

test('she walks her program: the first line that answers wins, and it says which it was', () => {
  const { decideNow } = drinking(0.3);
  const th = decideNow();
  assert.equal(th.rule, 'drink');
  assert.equal(th.line, 'drink');
  assert.equal(th.tier, 'survive');
});

test('a line whose if does not hold now, or a retired one, is passed over', () => {
  const { fagi, decideNow } = drinking(0.3);
  const p = programOf(fagi);
  const i = p.lines.findIndex((l) => l.id === 'drink');
  const born = p.lines[i];
  p.lines[i] = edited(born, { if: { thirstFrom: 0.65 } });
  assert.notEqual(decideNow().rule, 'drink');
  fagi.thirst = THIRST.max * 0.7;
  assert.equal(decideNow().rule, 'drink');
  p.lines[i] = edited(born, { retired: true, retiredAt: 1 });
  assert.notEqual(decideNow().rule, 'drink');
});

test('the order is hers: moved to the end, drinking loses to the urgency of thirst', () => {
  const { fagi, decideNow } = drinking(0.7);
  assert.equal(decideNow().rule, 'drink');
  const p = programOf(fagi);
  const i = p.lines.findIndex((l) => l.id === 'drink');
  p.lines.push(...p.lines.splice(i, 1));
  assert.equal(decideNow().rule, 'urgency');
});

test('the learned-code module carries her program, and importing it still reads what she learned', () => {
  const fagi = createFagi();
  const text = exportText(fagi);
  assert.match(text, /^export const program = \[$/m);
  assert.deepEqual(parseProgram(text).lines, createProgram().lines);
  assert.doesNotThrow(() => importText(createFagi(), text));
});

// The fingerprints were recorded from decision.js's written RULES, before her
// program existed (scripts/trace.js). If every scenario differs at once on a
// new machine or Node, look at its floating point before looking at her.
for (const name of Object.keys(SCENARIOS)) {
  test(`a program nobody edited decides as the written hierarchy did, frame by frame: ${name}`, { skip: NONE }, () => {
    const was = RECORDED.scenarios[name];
    assert.ok(was, `no fingerprint recorded for ${name}: node scripts/trace.js --write`);
    const now = traceApart(name);
    if (now.digest !== was.digest) {
      const k = now.checkpoints.findIndex((c, j) => JSON.stringify(c) !== JSON.stringify(was.checkpoints[j]));
      const where = k >= 0 ? JSON.stringify({ was: was.checkpoints[k], now: now.checkpoints[k] }) : 'within the last minute';
      assert.fail(`${name}: she no longer decides as recorded (${RECORDED.key}); first apart ${where}`);
    }
    assert.equal(now.steps, was.steps);
  });
}

// Watching herself must change nothing she does (program/imagine.js): with
// PROGRAM.watch = 2 she imagines, at every look, every line below the one that
// acted, sisters tell each other their moments (program/share.js), and every
// traced life is still the one recorded.
for (const name of Object.keys(SCENARIOS)) {
  test(`imagining every line, and telling it, changes nothing she does: ${name}`, { skip: NONE }, () => {
    const now = traceApart(name, ['PROGRAM.watch=2', 'PROGRAM.share=1']);
    assert.equal(now.digest, RECORDED.scenarios[name].digest);
  });
}

// The fingerprint is not blind: carrying before pursuing is a choice that
// changes her life, and swapping those two lines shows.
test('the fingerprint notices a program that decides otherwise', { skip: NONE }, () => {
  const i = INNATE.findIndex((l) => l.id === 'carry');
  const j = INNATE.findIndex((l) => l.id === 'pursue');
  [INNATE[i], INNATE[j]] = [INNATE[j], INNATE[i]];
  try {
    assert.notEqual(trace(SCENARIOS.classic).digest, RECORDED.scenarios.classic.digest);
  } finally {
    [INNATE[i], INNATE[j]] = [INNATE[j], INNATE[i]];
  }
});
