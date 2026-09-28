import test from 'node:test';
import assert from 'node:assert/strict';

import { CONCEPT, MAPGEN } from '../src/config.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi } from '../src/fagi.js';
import {
  createThingChemistry, affordanceOf, addThing, contact, lookKey, drawKinds, thermalOfContact, isThing, sproutThings,
} from '../src/things.js';
import { createConcepts, experience, believe, liveConcepts, conceptsOf } from '../src/concepts.js';
import { perceive } from '../src/perception.js';
import { sip, probe } from '../src/decision/things.js';
import { rng, withRng } from '../scripts/batch/random.js';

// A world whose things' texture decides: soft has sap, rough stings,
// smooth is cool, spiny is inert.
function world0() {
  const world = createWorld();
  world.rain.timer = Infinity;
  world.thingChemistry = { dim: 'texture', aff: { soft: 'sap', rough: 'sting', smooth: 'cool', spiny: 'inert' }, values: ['soft', 'rough', 'smooth', 'spiny'] };
  return world;
}
const look = (color, shape, texture) => ({ color, shape, texture });
let nextId = 1;
const stub = (l) => ({ id: nextId++, x: 0, y: 0, key: lookKey(l), look: l });

test('with CONCEPT off the map has no things; on, every kind is there and spread over what they afford', () => {
  CONCEPT.enabled = 0;
  const off = withRng(rng(7), () => { const w = createWorld(); generateMap(w); return w; });
  assert.equal(off.objects.filter(isThing).length, 0);
  CONCEPT.enabled = 1;
  const on = withRng(rng(7), () => { const w = createWorld(); generateMap(w); return w; });
  CONCEPT.enabled = 0;
  const things = on.objects.filter(isThing);
  assert.ok(things.length >= CONCEPT.kinds);
  assert.equal(new Set(things.map((o) => o.key)).size, CONCEPT.kinds);
  // The rest of the map is the same one.
  assert.deepEqual(on.objects.filter((o) => !isThing(o)).map((o) => [o.type, o.x, o.y]), off.objects.map((o) => [o.type, o.x, o.y]));
  const affs = new Set(things.map((o) => affordanceOf(on.thingChemistry, o.look)));
  assert.ok(affs.has('sap') && affs.has('sting'));
});

test('the chemistry of things always has sap and sting, and kinds are distinct looks', () => {
  for (let s = 1; s < 20; s++) {
    const chem = createThingChemistry(rng(s), ['shape', 'texture', 'color']);
    const affs = Object.values(chem.aff);
    assert.ok(affs.includes('sap') && affs.includes('sting'));
    const kinds = drawKinds(chem, 12, rng(s));
    assert.equal(new Set(kinds.map(lookKey)).size, kinds.length);
    for (const v of chem.values) assert.ok(kinds.filter((k) => k[chem.dim] === v).length >= 3);
  }
});

test('a touch or a nibble tells only what that sense can', () => {
  const world = world0();
  const c = createConcepts();
  const cool = stub(look('red', 'stone', 'smooth'));
  assert.equal(experience(c, world, cool, 'touch', 'cold', 1).settled, 'cool');
  const sap = stub(look('red', 'pod', 'soft'));
  assert.equal(experience(c, world, sap, 'touch', 'nothing', 2).settled, null);
  assert.deepEqual(c.kinds[sap.key].possible, ['sap', 'inert']);
  assert.equal(experience(c, world, sap, 'nibble', 'dry', 3).settled, null, 'a dry one teaches nothing');
  assert.equal(experience(c, world, sap, 'nibble', 'sap', 4).settled, 'sap');
});

test('the body pays and feels: sap takes thirst and dries, a sting costs energy, a cool thing cools', () => {
  CONCEPT.enabled = 1;
  const world = world0();
  const fagi = createFagi();
  const soft = addThing(world, fagi.x, fagi.y, look('red', 'pod', 'soft'));
  fagi.thirst = 50;
  assert.equal(contact(fagi, world, soft, 'nibble'), 'sap');
  assert.equal(fagi.thirst, 50 - CONCEPT.sap);
  assert.equal(contact(fagi, world, soft, 'nibble'), 'dry');
  const e = fagi.energy;
  const rough = addThing(world, fagi.x + 300, fagi.y, look('red', 'pod', 'rough'));
  assert.equal(contact(fagi, world, rough, 'touch'), 'pain');
  assert.ok(fagi.energy < e);
  world.objects = world.objects.filter((o) => o !== soft);
  addThing(world, fagi.x, fagi.y, look('blue', 'stone', 'smooth'));
  assert.equal(thermalOfContact(fagi, world), -CONCEPT.thermal);
  CONCEPT.enabled = 0;
});

test('kinds that afford the same are grouped by what they share, and the concept predicts a new kind', () => {
  const world = world0();
  const c = createConcepts();
  const out = [];
  for (const l of [look('red', 'pod', 'soft'), look('blue', 'shell', 'soft')]) {
    const o = stub(l);
    experience(c, world, o, 'touch', 'nothing', 1);
    out.push(experience(c, world, o, 'nibble', 'sap', 2));
  }
  assert.equal(out[1].formed.length, 1);
  assert.deepEqual(out[1].formed[0].all, ['texture:soft']);
  const novel = believe(c, look('green', 'stone', 'soft'));
  assert.equal(novel.aff, 'sap');
  assert.notEqual(novel.via, 'self');
  // She lives it: the concept got it right.
  const o = stub(look('green', 'stone', 'soft'));
  experience(c, world, o, 'touch', 'nothing', 3);
  const r = experience(c, world, o, 'nibble', 'sap', 4);
  assert.deepEqual(r.scored, { hit: true, id: novel.via, retired: false });
});

test('a concept that new kinds contradict stops predicting', () => {
  const world = world0();
  const c = createConcepts();
  // Two soft pods had sap: the concept says soft pods.
  for (const l of [look('red', 'pod', 'soft'), look('blue', 'pod', 'soft')]) {
    const o = stub(l);
    experience(c, world, o, 'touch', 'nothing', 1);
    experience(c, world, o, 'nibble', 'sap', 2);
  }
  const concept = liveConcepts(c)[0];
  assert.deepEqual(concept.all, ['shape:pod', 'texture:soft']);
  // A world where it does not hold: new soft pods are cold. The first one is a
  // miss; with as many against as for, the description no longer stands.
  const first = experience(c, world, stub(look('green', 'pod', 'soft')), 'touch', 'cold', 3);
  assert.equal(first.scored.hit, false);
  experience(c, world, stub(look('yellow', 'pod', 'soft')), 'touch', 'cold', 4);
  assert.ok(concept.retired);
  assert.notEqual(believe(c, look('orange', 'pod', 'soft')).aff, 'sap');
});

test('a concept kept alive by its exceptions but still missing is retired, and not formed again', () => {
  const world = world0();
  const c = createConcepts();
  for (const l of [look('red', 'pod', 'soft'), look('blue', 'stone', 'soft'), look('purple', 'shell', 'soft')]) {
    const o = stub(l);
    experience(c, world, o, 'touch', 'nothing', 1);
    experience(c, world, o, 'nibble', 'sap', 2);
  }
  const concept = liveConcepts(c).find((x) => x.aff === 'sap');
  assert.deepEqual(concept.all, ['texture:soft']);
  // Cold soft tufts: each miss becomes an exception, but the next one is missed again.
  for (const color of ['green', 'yellow', 'orange']) {
    experience(c, world, stub(look(color, 'tuft', 'soft')), 'touch', 'cold', 3);
  }
  // The third soft kind was already a prediction it got right: 1 of 3.
  assert.equal(concept.hits, 1);
  assert.equal(concept.misses, 2);
  assert.equal(concept.why, 'fails');
  assert.ok(c.blocked.includes('sap:texture:soft'));
});

test('without generalizing (the ablation) nothing is predicted for a new kind', () => {
  CONCEPT.generalize = 0;
  const world = world0();
  const c = createConcepts();
  for (const l of [look('red', 'pod', 'soft'), look('blue', 'shell', 'soft')]) {
    const o = stub(l);
    experience(c, world, o, 'touch', 'nothing', 1);
    experience(c, world, o, 'nibble', 'sap', 2);
  }
  assert.equal(liveConcepts(c).length, 0);
  assert.equal(believe(c, look('green', 'stone', 'soft')).aff, null);
  CONCEPT.generalize = 1;
});

test('thirsty, she goes to a thing she believes has sap when it is nearer than the water; she does not probe what she trusts stings', () => {
  CONCEPT.enabled = 1;
  const world = world0();
  const fagi = createFagi();
  fagi.angle = 0;
  const c = conceptsOf(fagi);
  for (const l of [look('red', 'pod', 'soft'), look('blue', 'shell', 'soft'), look('red', 'pod', 'rough'), look('blue', 'shell', 'rough')]) {
    const o = stub(l);
    experience(c, world, o, 'touch', l.texture === 'rough' ? 'pain' : 'nothing', 1);
    if (l.texture === 'soft') experience(c, world, o, 'nibble', 'sap', 2);
  }
  const novelSap = addThing(world, fagi.x + 60, fagi.y, look('green', 'stone', 'soft'));
  addThing(world, fagi.x + 40, fagi.y + 10, look('yellow', 'tuft', 'rough'));
  fagi.thirst = 60;
  const ctx = perceive(fagi, world);
  const intent = sip(fagi, world, ctx);
  assert.equal(intent?.target, novelSap);
  assert.equal(intent.reason.key, 'reason.sip.concept');
  fagi.thirst = 0;
  // Calm: she probes the new soft one, never the rough one a concept says stings.
  const p = probe(fagi, world, perceive(fagi, world));
  assert.equal(p?.target, novelSap);
  CONCEPT.enabled = 0;
});

test('with CONCEPT off the brain never carries concepts', () => {
  const world = createWorld();
  const fagi = createFagi();
  perceive(fagi, world);
  assert.equal(fagi.brain.concepts, undefined);
  assert.equal(MAPGEN.species, 0);
});

test('new kinds sprout later, looks never on the map before', () => {
  CONCEPT.enabled = 1;
  const world = withRng(rng(11), () => { const w = createWorld(); generateMap(w); return w; });
  const before = new Set(world.thingKinds);
  const n = world.objects.filter(isThing).length;
  world.time = CONCEPT.lateAt - 1;
  withRng(rng(12), () => sproutThings(world));
  assert.equal(world.lateKinds, undefined, 'not yet');
  world.time = CONCEPT.lateAt;
  withRng(rng(12), () => sproutThings(world));
  CONCEPT.enabled = 0;
  assert.equal(world.lateKinds.length, CONCEPT.lateKinds);
  assert.ok(world.lateKinds.every((k) => !before.has(k)));
  assert.ok(world.objects.filter(isThing).length > n);
});

test('a surprise makes her doubt what she knew and look at it again; in a steady world nothing does', () => {
  const world = world0();
  const c = createConcepts();
  const old = stub(look('red', 'stone', 'smooth'));
  experience(c, world, old, 'touch', 'cold', 1);
  assert.equal(believe(c, old.look).confidence, 1);
  // Much later, a kind she knew feels different: surprise.
  c.now = 1000;
  const sap = stub(look('red', 'pod', 'soft'));
  experience(c, world, sap, 'touch', 'nothing', 1000);
  experience(c, world, sap, 'nibble', 'sap', 1000);
  assert.equal(c.surprises, 0, 'learning something new is no surprise');
  const changed = stub(look('red', 'pod', 'soft'));
  const r = experience(c, world, changed, 'touch', 'cold', 1001);
  assert.ok(r.surprised);
  assert.ok(believe(c, old.look).confidence < CONCEPT.trust, 'she doubts even what she knew');
  assert.ok(c.kinds[old.key].stale, 'and will look at it again');
  // Looking again starts it afresh.
  experience(c, world, old, 'touch', 'cold', 1002);
  assert.ok(!c.kinds[old.key].stale);
  assert.equal(c.kinds[old.key].possible.join(), 'cool');
  // It fades.
  c.now = 1001 + CONCEPT.calm * 6;
  assert.ok(believe(c, old.look).confidence > 0.95);
});

test('without volatility (the ablation) a surprise changes nothing she believes', () => {
  CONCEPT.surprise = 0;
  const world = world0();
  const c = createConcepts();
  const old = stub(look('red', 'stone', 'smooth'));
  experience(c, world, old, 'touch', 'cold', 1);
  const k = stub(look('red', 'pod', 'soft'));
  experience(c, world, k, 'touch', 'nothing', 500);
  experience(c, world, k, 'nibble', 'sap', 500);
  experience(c, world, k, 'touch', 'cold', 501);
  CONCEPT.surprise = 0.6;
  assert.equal(c.surprises, 1);
  assert.equal(believe(c, old.look).confidence, 1);
  assert.ok(!c.kinds[old.key].stale);
});

test('seeing a sister stung by a thing teaches that kind without touching it; her own touch outweighs it', async () => {
  const { createColony } = await import('../src/colony.js');
  const { socialize } = await import('../src/social.js');
  CONCEPT.enabled = 1;
  const world = world0();
  const colony = createColony(3);
  const [a, b, far] = colony.ants;
  b.x = a.x + 30; b.y = a.y;
  far.x = a.x + 2000; far.y = a.y;
  const spiny = addThing(world, a.x, a.y, look('red', 'pod', 'rough'));
  a.lastThing = { n: 1, id: spiny.id, key: spiny.key, act: 'touch', felt: 'pain' };
  socialize(colony, world, 10);
  const seen = believe(conceptsOf(b), spiny.look);
  assert.equal(seen.aff, 'sting');
  assert.equal(seen.via, 'saw');
  assert.equal(seen.confidence, CONCEPT.seen);
  assert.equal(far.brain.concepts?.kinds[spiny.key], undefined, 'too far to see it');
  // A cool touch cannot be seen.
  const cool = addThing(world, a.x, a.y, look('red', 'pod', 'smooth'));
  a.lastThing = { n: 2, id: cool.id, key: cool.key, act: 'touch', felt: 'cold' };
  socialize(colony, world, 11);
  assert.equal(believe(conceptsOf(b), cool.look).aff, null);
  // What she lives replaces what she watched.
  experience(conceptsOf(b), world, spiny, 'touch', 'nothing', 12);
  assert.deepEqual(conceptsOf(b).kinds[spiny.key].possible, ['sap', 'inert']);
  CONCEPT.enabled = 0;
});
