import test from 'node:test';
import assert from 'node:assert/strict';

import { SCIENCE, EXPERIMENT } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { agendaFrom, answered, hypothesisOf } from '../src/experiment.js';
import { cuesOf } from '../src/learned/cues.js';

const on = (fn) => { SCIENCE.enabled = 1; EXPERIMENT.enabled = 1; try { return fn(); } finally { SCIENCE.enabled = 0; EXPERIMENT.enabled = 0; } };
function sheKnows(f, ...keys) { for (const k of keys) f.brain.facts[k] = { value: 0, tries: 0, confidence: 0 }; }
const report = (...keys) => ({ night: 3, questions: keys.map((key) => ({ kind: 'taste', key })) });

test('off: the agenda is as before, most asked first, no hypotheses', () => {
  const f = createFagi();
  sheKnows(f, 'nectar', 'toxic');
  assert.deepEqual(agendaFrom(f, report('toxic', 'nectar')), ['toxic', 'nectar']);
  assert.equal(f.hypotheses, undefined);
});

test('each question carries what her traits predict, and a fruit that looks harmful goes after a safe one', () => {
  on(() => {
    const f = createFagi();
    sheKnows(f, 'nectar', 'toxic');
    // She has learned that the toxic fruit's traits harm, the nectar's feed.
    for (const c of cuesOf('toxic')) f.brain.cues[c] = { w: -0.6, n: 1 };
    for (const c of cuesOf('nectar')) f.brain.cues[c] = { w: 0.2, n: 1 };
    const agenda = agendaFrom(f, report('toxic', 'nectar'));
    assert.deepEqual(agenda, ['nectar', 'toxic']);
    assert.equal(f.hypotheses.toxic.predicts, 'harm');
    assert.ok(f.hypotheses.toxic.safety < f.hypotheses.nectar.safety);
  });
});

test('a tasted question comes back as a verdict on its prediction', () => {
  on(() => {
    const f = createFagi();
    sheKnows(f, 'toxic');
    for (const c of cuesOf('toxic')) f.brain.cues[c] = { w: 0.4, n: 1 };   // she expects it to feed
    f.agenda = agendaFrom(f, report('toxic'));
    f.lastMeal = { type: 'toxic', reward: -0.8 };
    answered(f, 'toxic');
    const v = f.verdicts.at(-1);
    assert.equal(v.verdict, 'refuted');
    assert.equal(v.predicted, 'benefit');
    assert.equal(v.night, 3);
    for (const c of cuesOf('toxic')) assert.equal(f.cueErrors[c].length, 1);
  });
});

test('a trait whose errors stay high without progress is noise: its questions go last', () => {
  on(() => {
    const f = createFagi();
    f.cueErrors = {};
    for (const c of cuesOf('toxic')) f.cueErrors[c] = Array(SCIENCE.window).fill(0.9);
    const h = hypothesisOf(f, 'toxic');
    assert.equal(h.noisy, true);
    const fresh = hypothesisOf(f, 'nectar');
    assert.ok(fresh.worth > h.worth);
  });
});
