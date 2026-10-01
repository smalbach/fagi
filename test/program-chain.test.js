import test from 'node:test';
import assert from 'node:assert/strict';

import { line, renderProgram, parseProgram, createProgram, holds } from '../src/program.js';
import { executeLine } from '../src/decision.js';
import { createFagi } from '../src/fagi.js';
import { createWorld } from '../src/world.js';

test('line() accepts valid macro routine chains and rejects malformed ones', () => {
  const valid = line('macro-shelter-rest', {
    tier: 'endure',
    do: 'shelterRetreat',
    chain: ['shelterRetreat', 'rest'],
    source: 'self',
    learnedAt: 15,
  });
  assert.deepEqual(valid.chain, ['shelterRetreat', 'rest']);

  // Malformed: not an array
  assert.throws(() => line('invalid-1', {
    tier: 'endure', do: 'shelterRetreat', chain: 'rest', source: 'self', learnedAt: 0,
  }), /chain/);

  // Malformed: less than 2 steps
  assert.throws(() => line('invalid-2', {
    tier: 'endure', do: 'shelterRetreat', chain: ['rest'], source: 'self', learnedAt: 0,
  }), /chain/);

  // Malformed: unknown behavior
  assert.throws(() => line('invalid-3', {
    tier: 'endure', do: 'shelterRetreat', chain: ['rest', 'teleport'], source: 'self', learnedAt: 0,
  }), /chain/);
});

test('macro routine chains serialize and parse losslessly', () => {
  const p = createProgram([
    {
      id: 'tactical-shelter-chain',
      tier: 'endure',
      if: { raining: true, energyBelow: 0.35 },
      do: 'shelterRetreat',
      chain: ['shelterRetreat', 'rest'],
      source: 'self',
      learnedAt: 42.5,
      why: 'retreat to canopy then rest',
    },
  ]);
  const text = renderProgram(p);
  assert.match(text, /"chain":\["shelterRetreat","rest"\]/);
  const parsed = parseProgram(text);
  assert.deepEqual(parsed.lines[0].chain, ['shelterRetreat', 'rest']);
  assert.deepEqual(parsed.lines[0].if, { energyBelow: 0.35, raining: true });
});

test('executeLine steps through a chain falling back when a behavior cannot act', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.energy = 10;
  const ctx = { hungerU: 0.1, thirstU: 0.1, energyU: 0.1, inNest: true, seen: [], smelledOnes: [] };

  // Tactical shelter retreat returns null when it's not raining or dark
  fagi.raining = false;
  fagi.dark = false;

  const chainedLine = line('shelter-then-rest', {
    tier: 'endure',
    do: 'shelterRetreat',
    chain: ['shelterRetreat', 'rest'],
    source: 'self',
    learnedAt: 10,
  });

  // Since shelterRetreat returns null, it falls through to rest!
  const res = executeLine(chainedLine, fagi, world, ctx, 0.05);
  assert.ok(res, 'should have executed the second step in the chain');
  assert.equal(res.step, 'rest');
  assert.equal(res.intent.action, 'rest');
});
