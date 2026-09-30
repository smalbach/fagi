import test from 'node:test';
import assert from 'node:assert/strict';

import { DECIDE } from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { register } from '../src/decision/point.js';
import { set, runEpisode } from '../research/adaptive-decision/episode.js';
import { PROFILES, SEED, mapSeed, isReflex } from '../research/adaptive-decision/design.js';

// This file's process only: step 1b's profiles.
enableOrganism();
set(PROFILES.experimental);

function withDecide(settings, fn) {
  const saved = { ...DECIDE };
  Object.assign(DECIDE, settings);
  try { return fn(); } finally { Object.assign(DECIDE, saved); }
}

const episode = (horizon = 300) => runEpisode({ seed: SEED + 3, mapSeed: mapSeed(3), horizon });

test('off by default, and off nothing answers from the decision point', () => {
  assert.equal(DECIDE.enabled, 0);
  const r = episode();
  assert.ok(!Object.keys(r.byRule).some((k) => k.startsWith('decide.')));
});

test('on, the learned choice decides and the same seeds give the same episode', () => {
  withDecide({ enabled: 1 }, () => {
    const a = episode();
    const b = episode();
    assert.equal(a.fingerprint, b.fingerprint);
    assert.ok(Object.keys(a.byRule).some((k) => k.startsWith('decide.')), JSON.stringify(a.byRule));
  });
});

test('on, a plan is followed whenever no reflex and no thirst takes over', () => {
  withDecide({ enabled: 1 }, () => {
    const r = episode(900);
    const p = r.plan.site;
    const reflex = Object.entries(p.instead).filter(([k]) => isReflex(k)).reduce((a, [, v]) => a + v, 0);
    assert.ok(p.secs > 0);
    assert.ok(p.followed / (p.secs - reflex) > 0.7, JSON.stringify(p));
  });
});

test('a registered controller is obeyed, and an unknown one is refused', () => {
  register('restful', () => ({ kind: 'rest' }));
  withDecide({ enabled: 1, controller: 'restful' }, () => {
    const r = episode(60);
    assert.ok((r.byRule['decide.rest'] ?? 0) > 0, JSON.stringify(r.byRule));
  });
  withDecide({ enabled: 1, controller: 'nobody' }, () => {
    assert.throws(() => episode(60), /unknown controller/);
  });
});
