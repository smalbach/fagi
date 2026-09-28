import test from 'node:test';
import assert from 'node:assert/strict';

import { NIGHTAI, PERCEPT, CUES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { learn } from '../src/brain.js';
import { recall } from '../src/memory.js';
import { consolidate } from '../src/consolidation.js';
import { registerSpecies } from '../src/chemistry.js';
import { verdict } from '../src/learned/rules.js';
import { nightInput, validateProposal, trial, weigh, askTheNight, createNightMind } from '../src/night/index.js';
import { createHttpNight } from '../src/night/http.js';

// Poison needs red AND sour (a conjunction): red alone and sour alone each
// also come in a good fruit. And one red-sour fruit she has only seen.
function species() {
  const make = (color, shape, smell, hunger) => ({
    key: `${color}-${shape}-${smell}`,
    spec: { color: '#888', radius: 6, aroma: 100, life: 200, hunger, effects: [], traits: { color, shape, smell }, species: true },
  });
  registerSpecies([
    make('red', 'round', 'sour', 25),
    make('red', 'drop', 'sour', 25),
    make('red', 'orb', 'sweet', -35),
    make('green', 'orb', 'sour', -35),
    make('red', 'crystal', 'sour', 25),
  ]);
}

function lived() {
  const fagi = createFagi();
  learn(fagi.brain, 'red-orb-sweet', 0.7, 5);
  learn(fagi.brain, 'green-orb-sour', 0.7, 8);
  learn(fagi.brain, 'red-round-sour', -0.8, 10);
  learn(fagi.brain, 'red-orb-sweet', 0.7, 15);
  learn(fagi.brain, 'green-orb-sour', 0.7, 20);
  learn(fagi.brain, 'red-drop-sour', -0.8, 30);
  recall(fagi.brain, 'red-crystal-sour');   // seen, never tasted
  return fagi;
}

const rule = (all, verdict = 'avoid') => ({ type: 'rule', when: { all }, verdict });
const doubt = (id) => ({ type: 'doubt', rule: id });

test('the model reads what she knows and nothing else', () => {
  species();
  PERCEPT.enabled = 1;
  const fagi = lived();
  learn(fagi.brain, 'toxic', -0.9, 40);
  const input = nightInput(fagi, consolidate(fagi, { night: 1, now: 60 }));
  const text = JSON.stringify(input);
  assert.ok(!/\btoxic\b/.test(text), 'no code names');
  assert.ok(!/poison|nourishing|hunger"?:\s*25/.test(text), 'no chemistry');
  assert.deepEqual(input.seen.map((s) => s.look), ['red-crystal-sour']);
  assert.equal(input.tasted.length, 5);
  PERCEPT.enabled = 0;
  registerSpecies([]);
});

test('anything outside the grammar is rejected whole', () => {
  species();
  const fagi = lived();
  const bad = [
    null, 'avoid everything', [], { type: 'code', src: 'fagi.alive = true' },
    { type: 'rule', when: { key: 'red-round-sour' }, verdict: 'avoid' },          // about one species
    rule(['smell:rotten']),                                                          // a trait she never met
    rule(['smell:sour', 'color:red', 'shape:round', 'shape:drop']),                 // too many
    rule(['smell:sour', 'smell:sour']),
    { ...rule(['smell:sour']), weight: 9 },                                          // extra field
    { type: 'rule', when: { all: ['smell:sour'] }, verdict: 'eat it' },
    { type: 'explore', look: 'red-round-sour' },                                     // already tasted
    { type: 'explore', look: 'blue-round-sour' },                                    // never seen
    { type: 'rule', when: { all: ['smell:sour'], toString: 'x' }, verdict: 'avoid' },
  ];
  for (const p of bad) assert.ok(validateProposal(p, fagi).reject, JSON.stringify(p));
  assert.deepEqual(validateProposal(rule(['smell:sour', 'color:red']), fagi), { type: 'rule', when: { all: ['color:red', 'smell:sour'] }, verdict: 'avoid', why: '' });
  assert.equal(validateProposal({ type: 'explore', look: 'red-crystal-sour' }, fagi).key, 'red-crystal-sour');
  registerSpecies([]);
});

test('the sandbox keeps what her own experience backs and nothing else', () => {
  species();
  const fagi = lived();
  const rules = JSON.stringify(fagi.brain.rules.list);
  // By day she wrote "avoid sour" and "avoid red", though a sour and a red fruit fed her.
  const sour = trial(fagi, validateProposal(doubt('avoid-smell-sour'), fagi));
  assert.equal(sour.accept, true);
  assert.equal(sour.con, 1);
  assert.ok(sour.gain > 0);
  assert.match(trial(fagi, validateProposal(doubt('avoid-color-red-smell-sour'), fagi)).why, /nothing she lived goes against it/);
  assert.match(trial(fagi, validateProposal(rule(['color:red', 'smell:sour']), fagi)).why, /already holds it/);
  assert.match(trial(fagi, validateProposal(rule(['smell:sour'], 'prefer'), fagi)).why, /backed by 1/);
  assert.match(trial(fagi, validateProposal(rule(['shape:round']), fagi)).why, /backed by 1/);
  assert.equal(JSON.stringify(fagi.brain.rules.list), rules, 'nothing of hers changed');
  registerSpecies([]);
});

test('kept doubts retire the false rules, and the true one is left standing', () => {
  species();
  const fagi = lived();
  const blindly = (key) => verdict(fagi, 'pursue', key, { traits: key.split('-').map((v, i) => `${['color', 'shape', 'smell'][i]}:${v}`), blind: true });
  assert.equal(blindly('red-orb-sweet'), 'avoid', 'before: "avoid red" wrongly warns her off a fruit that fed her');
  const entries = weigh(fagi, 1, { proposals: [doubt('avoid-smell-sour'), doubt('avoid-color-red'), 'rm -rf /'] }, 60);
  assert.deepEqual(entries.map((e) => e.accepted), [true, true, false]);
  assert.equal(blindly('red-crystal-sour'), 'avoid', 'the conjunction still warns her');
  assert.notEqual(blindly('green-orb-sour'), 'avoid', 'a sour fruit is no longer suspect for its smell');
  assert.equal(weigh(fagi, 2, { proposals: [doubt('avoid-smell-sour')] }, 90)[0].accepted, false, 'already gone');
  registerSpecies([]);
});

test('a proposed rule the day could not write is kept as a rule from the night', () => {
  species();
  CUES.induce = 0;   // no induction by day: only one-trait rules
  const fagi = lived();
  assert.ok(!fagi.brain.rules.list.some((r) => !r.retired && r.when.all?.length === 2));
  // One at a time she gets only so far: "avoid red" can go (sour still warns
  // her off the poison), "avoid sour" then cannot (nothing would), and the pair
  // changes nothing while "avoid sour" stands.
  const alone = weigh(fagi, 1, { proposals: [doubt('avoid-color-red'), doubt('avoid-smell-sour'), rule(['color:red', 'smell:sour'])] }, 60);
  assert.deepEqual(alone.map((e) => e.accepted), [true, false, false]);
  // The pair in place of "avoid sour", as one revision, gets the rest.
  const [revision] = weigh(fagi, 1, { proposals: [{ ...rule(['color:red', 'smell:sour']), replaces: ['avoid-smell-sour'] }] }, 60);
  assert.equal(revision.accepted, true, revision.why);
  assert.equal(revision.gain, 0.25);
  const r = fagi.brain.rules.list.find((x) => x.id === revision.rule);
  assert.ok(fagi.brain.rules.list.find((x) => x.id === 'avoid-smell-sour').retired);
  assert.equal(r.source.kind, 'night');
  assert.equal(r.source.trust, NIGHTAI.trust);
  assert.equal(verdict(fagi, 'pursue', 'red-crystal-sour'), 'avoid');
  assert.notEqual(verdict(fagi, 'pursue', 'red-orb-sweet', { traits: ['color:red', 'shape:orb', 'smell:sweet'], blind: true }), 'avoid');
  CUES.induce = 2;
  registerSpecies([]);
});

test('what she then lives can retire it', () => {
  species();
  CUES.induce = 0;
  const fagi = lived();
  const [revision] = weigh(fagi, 1, { proposals: [{ ...rule(['color:red', 'smell:sour']), replaces: ['avoid-color-red', 'avoid-smell-sour'] }] }, 60);
  const id = revision.rule;
  // Tasting it after all, and good: the night was wrong about this one.
  learn(fagi.brain, 'red-crystal-sour', 0.8, 80);
  learn(fagi.brain, 'red-crystal-sour', 0.8, 100);
  assert.equal(fagi.brain.rules.list.find((x) => x.id === id).retired, true);
  CUES.induce = 2;
  registerSpecies([]);
});

test('the local mind proposes the conjunction and the questions, and the gate still decides', () => {
  species();
  NIGHTAI.enabled = 1;
  const fagi = lived();
  const report = consolidate(fagi, { night: 1, now: 60 });
  askTheNight(fagi, report, createNightMind('local'));
  const kept = fagi.nightLog.filter((e) => e.accepted);
  assert.ok(kept.some((e) => e.proposal.type === 'doubt' && e.proposal.rule === 'avoid-smell-sour'));
  assert.ok(fagi.agenda.includes('red-crystal-sour'));
  NIGHTAI.enabled = 0;
  registerSpecies([]);
});

test('a remote mind never blocks, and a late or posthumous answer changes nothing', async () => {
  species();
  NIGHTAI.enabled = 1;
  let release;
  const fetch = () => new Promise((resolve) => { release = () => resolve({ ok: true, json: async () => ({ proposals: [doubt('avoid-smell-sour')] }) }); });
  const fagi = lived();
  const report = consolidate(fagi, { night: 1, now: 60 });
  askTheNight(fagi, report, createHttpNight({ url: 'http://x', fetch }));
  assert.equal(fagi.nightLog, undefined, 'nothing yet: the frame went on');
  release();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(fagi.nightLog.filter((e) => e.accepted).length, 1);

  const dead = lived();
  askTheNight(dead, consolidate(dead, { night: 1, now: 60 }), createHttpNight({ url: 'http://x', fetch }));
  dead.alive = false;
  release();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(dead.nightLog, undefined, 'dead: nobody to tell');

  const failing = lived();
  askTheNight(failing, consolidate(failing, { night: 1, now: 60 }), createHttpNight({ url: 'http://x', fetch: async () => { throw new Error('down'); } }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(failing.nightLog.at(-1).accepted, false, 'down: the night passes with nothing proposed');
  NIGHTAI.enabled = 0;
  registerSpecies([]);
});

test('off, no model is asked anything', () => {
  species();
  NIGHTAI.enabled = 0;
  const fagi = lived();
  let asked = false;
  askTheNight(fagi, consolidate(fagi, { night: 1, now: 60 }), { propose: () => { asked = true; return { proposals: [] }; } });
  assert.equal(asked, false);
  registerSpecies([]);
});
