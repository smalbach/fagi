import test from 'node:test';
import assert from 'node:assert/strict';
import { MORPH } from '../src/config.js';
import { jumpMorph, MORPH_TRAITS } from '../src/morph.js';

const seq = (xs) => { let i = 0; return () => xs[i++ % xs.length]; };
const ones = () => Object.fromEntries(MORPH_TRAITS.map((k) => [k, 1]));

test('no chance, no leap and nothing drawn', () => {
  let draws = 0;
  assert.equal(jumpMorph(ones(), () => { draws++; return 0; }), null);
  assert.equal(draws, 0);
});

test('a leap moves 1-3 organs within the range, and the sham control draws the same and changes nothing', () => {
  const saved = structuredClone(MORPH.jump);
  try {
    Object.assign(MORPH.jump, { chance: 1, genes: [2, 2], factor: [2, 2], up: 1 });
    const draws = [0.1, 0.5, 0, 0.3, 0.2, 0.5, 0.4];
    const m = ones();
    const leapt = jumpMorph(m, seq(draws));
    assert.equal(Object.keys(leapt).length, 2);
    for (const [k, f] of Object.entries(leapt)) { assert.equal(f, 2); assert.equal(m[k], 2); }
    MORPH.jump.sham = 1;
    const s = ones();
    assert.deepEqual(jumpMorph(s, seq(draws)), leapt);
    assert.deepEqual(s, ones());
  } finally { MORPH.jump = saved; }
});
