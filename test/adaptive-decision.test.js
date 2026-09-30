import test from 'node:test';
import assert from 'node:assert/strict';

import { enableOrganism } from '../src/organism.js';
import { set, runEpisode } from '../research/adaptive-decision/episode.js';
import { PROFILES, SEED, mapSeed } from '../research/adaptive-decision/design.js';

// This file's process only: the experimental profile of step 1.
enableOrganism();
set(PROFILES.experimental);

const short = (trace = false) => runEpisode({ seed: SEED, mapSeed: mapSeed(0), horizon: 120, trace });

test('the same seeds give the same episode', () => {
  assert.equal(short().fingerprint, short().fingerprint);
});

test('tracing only watches: the episode is the same with or without it', () => {
  const plain = short();
  const traced = short(true);
  assert.equal(traced.fingerprint, plain.fingerprint);
  assert.ok(traced.segments.length > 0);
  assert.equal(traced.segments.length, plain.decisions);
});

test('every second of control is attributed to a rule, and plan time never exceeds life', () => {
  const r = short();
  const ruled = Object.values(r.byRule).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(ruled - r.lived) < 1, `${ruled} vs ${r.lived}`);
  for (const k of ['site', 'explore']) {
    const p = r.plan[k];
    const instead = Object.values(p.instead).reduce((a, b) => a + b, 0);
    assert.ok(p.secs <= r.lived + 1e-6);
    assert.ok(Math.abs(p.followed + instead - p.secs) < 0.5, `${k}: ${p.followed} + ${instead} vs ${p.secs}`);
  }
});

test('an unknown setting is refused, not silently created', () => {
  assert.throws(() => set({ 'CHOICE.nope': 1 }), /unknown setting/);
});
