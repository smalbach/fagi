import test from 'node:test';
import assert from 'node:assert/strict';

import { MORPH, LIFE, SEX } from '../src/config.js';
import { MORPH_TRAITS, tissueLoad, morphBody, inheritMorph, founderMorph, updatePlasticity, targetOf, epigeneticMark } from '../src/morph.js';
import { bodyFor, bodyMult } from '../src/biology.js';
import { createFagi } from '../src/fagi.js';
import { createWorld, addObject, storeInNest } from '../src/world.js';
import { createColony } from '../src/colony.js';
import { foundPopulation } from '../src/reproduction.js';
import { mutate, recombine } from '../src/generations.js';
import { viewRangeOf } from '../src/vision.js';
import { discomfort } from '../src/thermal.js';
import { THERMAL } from '../src/config.js';

const ones = () => Object.fromEntries(MORPH_TRAITS.map((k) => [k, 1]));
const withMorph = (fn) => { MORPH.enabled = 1; try { return fn(); } finally { MORPH.enabled = 0; } };
// A seeded source, so the steps are the same every run.
function seeded(s = 7) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

test('today\'s Fagi is the all-ones body: every organ at 1 changes nothing', () => {
  assert.equal(tissueLoad(ones()), 1);
  for (const [k, v] of Object.entries(morphBody(ones()))) assert.ok(Math.abs(v - (k === 'heatShift' ? 0 : 1)) < 1e-12, `${k} = ${v}`);
  const plain = bodyFor(null, null);
  const all1 = withMorph(() => bodyFor(null, { cues: {}, morph: ones() }));
  for (const k of ['speed', 'energyMax', 'metabolism', 'insulation']) assert.ok(Math.abs(all1[k] - plain[k]) < 1e-12, k);
});

test('MORPH off: nobody carries organs and no gene is drawn', () => {
  const g = mutate({ cues: {}, morph: { brain: 1.5 } }, seeded());
  assert.equal(g.morph, undefined);
  const b = bodyFor(null, { cues: {}, morph: { brain: 1.5, eyes: 2 } });
  assert.equal(b.view, undefined);
  assert.equal(bodyMult({ body: b }, 'view'), 1);
});

test('a bigger brain remembers longer but costs: more burn, shorter life, slower breeding', () => {
  const big = morphBody({ ...ones(), brain: 1.4 });
  assert.ok(big.memory > 1);
  assert.ok(big.metabolism > 1 && big.drain > 1);
  assert.ok(big.life < 1);
  assert.ok(big.brood > 1);
});

test('organs cost more than linearly: doubling one costs more than twice its share', () => {
  const w = MORPH.tissue.eyes;
  const extra = tissueLoad({ ...ones(), eyes: 2 }) - 1;
  assert.ok(extra > w, `extra ${extra} vs share ${w}`);
});

test('size: more reserves, less hunger per second on the fixed scale, but each fruit relieves less', () => {
  const big = morphBody({ ...ones(), size: 1.5 });
  assert.equal(big.energyMax, 1.5);
  assert.ok(big.metabolism < 1, 'Kleiber: less burn per gram');
  assert.ok(big.drain > 1, 'more burn in all');
  assert.ok(big.digest < 1, 'the same fruit fills a bigger body less');
  assert.ok(big.speed < 1, 'heavier, slower');
});

test('genes stay inside the physical range, and children sit between their parents', () => {
  const rnd = seeded(3);
  for (let i = 0; i < 200; i++) {
    const m = inheritMorph({ ...ones(), brain: 1.9 }, { ...ones(), brain: 0.6 }, rnd);
    for (const k of MORPH_TRAITS) assert.ok(m[k] >= MORPH.range[0] && m[k] <= MORPH.range[1], `${k} ${m[k]}`);
  }
  let sum = 0;
  for (let i = 0; i < 400; i++) sum += Math.log(inheritMorph({ brain: 1.6 }, { brain: 0.8 }, rnd).brain);
  assert.ok(Math.abs(Math.exp(sum / 400) - Math.sqrt(1.6 * 0.8)) < 0.03);
});

test('with MORPH on, clonal and sexual children inherit organs', () => {
  withMorph(() => {
    const rnd = seeded(5);
    assert.ok(mutate({ cues: {}, morph: ones() }, rnd).morph);
    assert.ok(recombine({ cues: {}, morph: ones() }, { cues: {}, morph: ones() }, rnd).morph);
  });
});

test('her eyes reach her sight', () => {
  const f = createFagi();
  const base = viewRangeOf(f);
  withMorph(() => { f.body = bodyFor(f.sex, { cues: {} }, { ...ones(), eyes: 1.44 }); });
  assert.ok(Math.abs(viewRangeOf(f) / base - 1.2) < 1e-9);
});

test('founders of a breeding population get organs a little apart', () => {
  LIFE.enabled = 1; SEX.enabled = 1;
  try {
    withMorph(() => {
      const world = createWorld();
      const nest = addObject(world, 400, 400, 'nest');
      storeInNest(nest, 'nectar');
      const colony = createColony(4);
      world.colony = colony;
      foundPopulation(world, colony);
      for (const f of colony.ants) {
        assert.ok(f.genome.morph && f.morph);
        assert.ok(f.body.view > 0 && f.energy > 0);
      }
      const brains = colony.ants.map((f) => f.morph.brain);
      assert.ok(new Set(brains).size > 1, 'not all the same');
    });
  } finally { LIFE.enabled = 0; SEX.enabled = 0; }
  assert.ok(founderMorph(seeded()).brain > 0);
});

// --- plasticity --------------------------------------------------------------


function grown(morph = ones()) {
  const f = createFagi();
  f.genome = { cues: {}, morph: { ...morph } };
  f.morph = { ...morph };
  f.lifeStage = 'adult';
  return f;
}
function live(f, seconds, { moving = false, out = false, dark = false } = {}) {
  f.moving = moving;
  f.dark = dark;
  for (let t = 0; t < seconds; t += 1) updatePlasticity(f, out, 1);
}

test('used as typical, every organ stays as inherited', () => {
  const P = MORPH.plastic;
  for (const o of MORPH_TRAITS) assert.equal(targetOf(o, P.ref), 1);
});

test('plasticity off, or MORPH off: she carries exactly what she inherited', () => {
  const f = grown();
  live(f, 3000, { moving: true, out: true });
  assert.deepEqual(f.morph, ones(), 'MORPH off');
  withMorph(() => {
    MORPH.plastic.enabled = 0;
    try { live(f, 3000, { moving: true, out: true }); } finally { MORPH.plastic.enabled = 1; }
  });
  assert.deepEqual(f.morph, ones(), 'plasticity off');
});

test('walking all day builds muscle, a still life wastes it, never past the limit', () => {
  withMorph(() => {
    const walker = grown();
    live(walker, 6000, { moving: true, out: true });
    const still = grown();
    live(still, 6000, { moving: false, out: false });
    assert.ok(walker.morph.muscle > 1.1, `walker ${walker.morph.muscle}`);
    assert.ok(still.morph.muscle < 0.9, `still ${still.morph.muscle}`);
    const P = MORPH.plastic;
    assert.ok(walker.morph.muscle <= 1 + P.max + 1e-9 && still.morph.muscle >= 1 - P.max - 1e-9);
    assert.equal(walker.genome.morph.muscle, 1, 'her genes do not change');
  });
});

test('eyes waste in the dark; growing an organ costs hunger', () => {
  withMorph(() => {
    const blind = grown();
    live(blind, 6000, { out: true, dark: true });
    assert.ok(blind.morph.eyes < 0.9);
    const f = grown();
    f.hunger = 0;
    live(f, 600, { moving: true, out: true });
    assert.ok(f.hunger > 0);
  });
});

test('a grown body keeps its size; a young one is sized by how well she is fed', () => {
  withMorph(() => {
    const adult = grown();
    adult.hunger = 95;
    live(adult, 3000);
    assert.equal(adult.morph.size, 1);
    const young = grown();
    young.lifeStage = 'juvenile';
    young.hunger = 90;
    live(young, 3000);
    assert.ok(young.morph.size < 1);
  });
});

// --- inheritance of what was lived --------------------------------------------

test('darwin: a daughter starts from her genes, whatever her parents lived', () => {
  withMorph(() => {
    const mom = grown({ ...ones(), muscle: 1 });
    mom.morph.muscle = 1.2;
    const g = recombine(mom.genome, mom.genome, seeded(9));
    assert.equal(g.epi, undefined);
    assert.equal(g.plastic, undefined);
  });
});

test('baldwin: the capacity to change is a gene, inherited and paid for', () => {
  withMorph(() => {
    MORPH.inherit = 1;
    try {
      const g = recombine({ cues: {}, morph: ones(), plastic: 1.5 }, { cues: {}, morph: ones(), plastic: 1.5 }, seeded(11));
      assert.ok(Math.abs(g.plastic - 1.5) < 0.5);
      // More plastic, more strongly she follows her use.
      const use = { ...MORPH.plastic.ref, move: 0.7 };
      assert.ok(targetOf('muscle', use, 2) > targetOf('muscle', use, 1));
      // And keeping it costs resting burn.
      const cheap = bodyFor(null, { cues: {}, morph: ones(), plastic: 1 });
      const dear = bodyFor(null, { cues: {}, morph: ones(), plastic: 2 });
      assert.ok(dear.metabolism > cheap.metabolism);
    } finally { MORPH.inherit = 0; }
  });
});

test('epigenetic: a daughter starts where her parents lived toward, and the mark fades', () => {
  withMorph(() => {
    MORPH.inherit = 2;
    try {
      const mom = grown(); mom.morph.muscle = 1.2;
      const dad = grown(); dad.morph.muscle = 1.2;
      const mark = epigeneticMark(mom, dad);
      assert.ok(mark.muscle > 1 && mark.muscle < 1.2, `mark ${mark.muscle}`);
      // A daughter who lives as typical passes on less than she got.
      const girl = grown(); girl.epi = { ...mark }; girl.morph.muscle = 1 * mark.muscle;
      const next = epigeneticMark(girl, girl);
      assert.ok(next.muscle < mark.muscle && next.muscle > 1);
    } finally { MORPH.inherit = 0; }
  });
});

test('a bigger body keeps its warmth better (Bergmann)', () => {
  assert.ok(morphBody({ ...ones(), size: 1.5 }).insulation > 1);
  assert.equal(morphBody(ones()).insulation, 1);
});

test('a bigger body suffers heat sooner (its tracheae fall short), a smaller one later', () => {
  const big = morphBody({ ...ones(), size: 1.3 });
  const small = morphBody({ ...ones(), size: 0.8 });
  assert.ok(big.heatShift < 0 && small.heatShift > 0);
  assert.equal(morphBody(ones()).heatShift, 0);
  const t = THERMAL.safeMax + 1;
  assert.equal(discomfort(t, small.heatShift).kind, null);
  assert.equal(discomfort(t, big.heatShift).kind, 'heat');
});

test('a life like most lives leaves the organ as born: only use past "enough" moves it', () => {
  const P = MORPH.plastic;
  const near = { ...P.ref, move: P.ref.move * (1 + P.enough * 0.9) };
  assert.equal(targetOf('muscle', near), 1);
  const far = { ...P.ref, move: P.ref.move * (1 + P.enough + 0.2) };
  assert.ok(Math.abs(targetOf('muscle', far) - (1 + P.amp.muscle * 0.2)) < 1e-9);
});

test('temperature-size rule: a juvenile raised warm grows smaller, cold bigger, near typical as born', () => {
  withMorph(() => {
    const P = MORPH.plastic;
    const raise = (temp) => { const f = grown(); f.lifeStage = 'juvenile'; f.hunger = (1 - P.ref.fed) * 100; f.temperature = temp; live(f, 4000); return f.morph.size; };
    assert.ok(raise(P.warm + 8) < 0.9);
    assert.ok(raise(P.warm - 8) > 1.1);
    assert.ok(Math.abs(raise(P.warm + P.enoughWarm * 0.5) - 1) < 1e-6);
  });
});
