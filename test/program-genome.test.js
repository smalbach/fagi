import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM, GEN, LIFE, SEX, THERMAL, CYCLE } from '../src/config.js';
import { INNATE, createProgram, programOf, line } from '../src/program.js';
import { review } from '../src/program/learn.js';
import { captureProgramGenome, programFromGenome, renderProgramGenome, parseProgramGenome } from '../src/program/genome.js';
import { createFagi } from '../src/fagi.js';
import { createColony } from '../src/colony.js';
import { createWorld, addObject, storeInNest } from '../src/world.js';
import { applyGenome, teachProgram } from '../src/generations.js';
import { updateLife, foundPopulation } from '../src/reproduction.js';
import { updateStage } from '../src/lifecycle.js';
import { decide } from '../src/decision.js';
import { perceive } from '../src/perception.js';
import { snapshot, restore, exportProgramText, importText } from '../src/learned/store.js';

const FEELS = { hunger: 0.3, thirst: 0.2, energy: 0.15, carrying: false, inNest: false, dark: false, raining: false, pressureFalling: false };
function observations(fagi, baseline = 0.4, alternative = 0.01, count = 40) {
  return Array.from({ length: count * 2 }, (_, i) => ({
    who: fagi.id ?? 1, at: i + 1, root: 'pursue', below: ['rest'], by: i % 2 ? 'rest' : null,
    f: { ...FEELS }, cost: i % 2 ? alternative : baseline,
  }));
}
function founder() {
  const fagi = createFagi();
  fagi.id = 11;
  fagi.age = 100;
  fagi.brain.program = createProgram([...INNATE.filter((l) => l.id !== 'rest'), INNATE.find((l) => l.id === 'rest')]);
  fagi.brain.watch = { moments: observations(fagi) };
  review(fagi);
  return fagi;
}
const learnedRule = (f) => programOf(f).lines.find((l) => l.from === 'rest' && l.over === 'pursue');
function childOf(parent) {
  const child = createFagi();
  child.id = (parent.id ?? 1) + 1;
  applyGenome(child, { cues: {}, program: captureProgramGenome(parent) });
  return child;
}

test('accepted experience becomes a versioned genome with observed evidence', () => {
  const f = founder();
  const g = captureProgramGenome(f);
  assert.equal(g.format, 'fagi-behavior');
  assert.equal(g.version, 1);
  assert.equal(g.changes.length, 1);
  const { evidence, operation, rule } = g.changes[0];
  assert.equal(operation, 'upsert');
  assert.equal(rule.id, learnedRule(f).id);
  assert.equal(evidence.observer, '11');
  assert.equal(evidence.baselineCount, 40);
  assert.equal(evidence.alternativeCount, 40);
  assert.ok(evidence.improvement > 0.3);
  assert.equal(evidence.references.length, 32);
  assert.deepEqual(parseProgramGenome(renderProgramGenome(g)), g);
  assert.deepEqual(f.genome.program, g);
});

test('missing data, ties, weak effects, noise, and predictions cannot retire a rule', () => {
  for (const kind of ['missing', 'tie', 'weak', 'noise', 'predicted', 'imagined']) {
    const child = childOf(founder());
    const before = captureProgramGenome(child);
    let moments = observations(child, 0.1, 0.1);
    if (kind === 'missing') moments = [];
    if (kind === 'weak') moments = observations(child, 0.1, 0.101);
    if (kind === 'noise') moments = observations(child, 0.1, 0.1, 4).map((m, i) => ({ ...m, cost: [0, 0, 0.2, 0.22][i % 4] }));
    if (kind === 'predicted' || kind === 'imagined') moments = observations(child, 0.01, 0.5).map((m) => ({ ...m, [kind]: true }));
    child.brain.watch = { moments };
    review(child);
    assert.equal(Boolean(learnedRule(child).retired), false, kind);
    assert.deepEqual(captureProgramGenome(child), before, kind);
  }
});

test('a child reevaluates an inherited rule and passes its retirement to a grandchild', () => {
  const mother = founder();
  const child = childOf(mother);
  assert.equal(learnedRule(child).source, 'inherited');
  assert.equal(child.brain.watch, undefined, 'ancestral evidence is not personal experience');
  assert.deepEqual(child.brain.facts, {});
  child.age = 120;
  child.brain.watch = { moments: observations(child, 0.01, 0.5) };
  review(child);
  assert.equal(learnedRule(child).retired, true);
  assert.equal(Boolean(learnedRule(mother).retired), false);
  const g = captureProgramGenome(child);
  assert.equal(g.changes.at(-1).operation, 'retire');
  assert.match(g.changes.at(-1).rule.why, /caused more distress/);
  assert.equal(g.changes.at(-1).evidence.observer, String(child.id));
  const grandchild = childOf(child);
  assert.equal(learnedRule(grandchild).retired, true);
  assert.equal(grandchild.brain.watch, undefined);
  teachProgram(grandchild, mother);
  assert.equal(programOf(grandchild).lines.filter((l) => l.id === learnedRule(mother).id).length, 1);
  assert.equal(learnedRule(grandchild).retired, true, 'culture cannot resurrect a retired rule');
});

test('a live inherited rule affects the actual decision walker', () => {
  const child = childOf(founder());
  const world = createWorld();
  child.energy = 10;
  child.hunger = 20;
  child.thirst = 20;
  decide(child, world, perceive(child, world), 0.05);
  assert.equal(child.thought.line, learnedRule(child).id);
  assert.equal(child.thought.rule, 'rest');
});

test('unreviewed suggestions do not enter the genome, and snapshots never alias', () => {
  const f = founder();
  programOf(f).lines.unshift(line('unreviewed-crisis', {
    tier: 'endure', do: 'rest', source: 'self', learnedAt: 100, from: 'rest', over: 'pursue',
  }));
  const genome = captureProgramGenome(f);
  assert.ok(!programFromGenome(genome).lines.some((l) => l.id === 'unreviewed-crisis'));
  const a = programFromGenome(genome);
  const b = programFromGenome(genome);
  a.lines[0].do = 'probe';
  a.heredity.changes[0].evidence.references[0].who = 'changed';
  assert.notEqual(b.lines[0].do, a.lines[0].do);
  assert.notEqual(genome.changes[0].evidence.references[0].who, 'changed');
  assert.notEqual(captureProgramGenome(f).changes[0].evidence.references[0].who, 'changed');
});

test('the data language rejects unsupported revisions and unsupported evidence', () => {
  const original = captureProgramGenome(founder());
  const invalid = [
    (g) => { g.version = 99; },
    (g) => { g.changes[0].operation = 'random-delete'; },
    (g) => { g.changes[0].evidence.kind = 'imagined'; },
    (g) => { g.changes[0].evidence.improvement = 0; },
    (g) => { g.changes[0].evidence.alternativeCount = 0; },
    (g) => { g.changes[0].rule.do = 'drink'; },
    (g) => { g.changes[0].rule.chain = ['rest', 'sleep']; },
    (g) => { g.changes[0].before = 'missing'; },
    (g) => { g.changes[0].rule.id = 'sleep'; },
    (g) => { g.run = 'process.exit()'; },
  ];
  for (const change of invalid) {
    const g = structuredClone(original);
    change(g);
    assert.throws(() => parseProgramGenome(JSON.stringify(g)), /invalid behavioral genome/);
  }
  assert.throws(() => parseProgramGenome('process.exit()'), /JSON/);
});

test('behavior files and saved learning preserve revisions; rejected imports are atomic', () => {
  const mother = founder();
  const text = exportProgramText(mother);
  const child = createFagi();
  importText(child, text);
  assert.deepEqual(captureProgramGenome(child), captureProgramGenome(mother));
  assert.equal(child.brain.watch, undefined);
  const recovered = createFagi();
  restore(recovered, snapshot(mother));
  assert.deepEqual(captureProgramGenome(recovered), captureProgramGenome(mother));
  const before = structuredClone(child.brain);
  const invalid = JSON.parse(text);
  invalid.changes[0].evidence.improvement = 0;
  assert.throws(() => importText(child, JSON.stringify(invalid)), /uncertainty/);
  assert.deepEqual(child.brain, before);
  assert.throws(() => restore(child, { ...snapshot(mother), programGenome: invalid }), /uncertainty/);
  assert.deepEqual(child.brain, before);
});

test('an egg snapshots accepted changes and hatches with them even after the mother changes', () => {
  const blocks = [PROGRAM, LIFE, SEX, THERMAL, CYCLE, GEN];
  const saved = blocks.map((b) => ({ ...b }));
  try {
    PROGRAM.inherit = 1;
    LIFE.enabled = 1; SEX.enabled = 1; THERMAL.enabled = 0; CYCLE.enabled = 0; GEN.culture = 0;
    const world = createWorld();
    const nest = addObject(world, 400, 400, 'nest');
    for (let i = 0; i < 12; i++) storeInNest(nest, 'nectar');
    const colony = createColony(2);
    world.colony = colony;
    colony.ants.forEach((f, i) => {
      f.sex = i ? 'male' : 'female'; f.x = nest.x; f.y = nest.y; f.pantry = { nectar: 12 };
    });
    foundPopulation(world, colony);
    colony.ants.forEach(updateStage);
    const mother = colony.ants[0];
    mother.brain.program = founder().brain.program;
    updateLife(world, colony, 0.05);
    assert.equal(nest.eggs.length, 1);
    const egg = nest.eggs[0];
    assert.equal(egg.genome.program.changes.length, 1);
    const expected = structuredClone(egg.genome.program);
    mother.brain.watch = { moments: observations(mother, 0.01, 0.5) };
    review(mother);
    assert.equal(learnedRule(mother).retired, true);
    assert.deepEqual(egg.genome.program, expected);
    for (let t = 0; t < LIFE.incubation + 3; t++) updateLife(world, colony, 1);
    const child = colony.ants[2];
    assert.ok(child);
    assert.equal(learnedRule(child).source, 'inherited');
    assert.equal(Boolean(learnedRule(child).retired), false);
    assert.deepEqual(captureProgramGenome(child), expected);
  } finally { blocks.forEach((b, i) => Object.assign(b, saved[i])); }
});

test('a filtered genome passes on only the kept revisions and still validates', async () => {
  const { filterProgramGenome, validateProgramGenome } = await import('../src/program/genome.js');
  const g = captureProgramGenome(founder());
  assert.equal(filterProgramGenome(g, () => true).changes.length, 1);
  const none = filterProgramGenome(g, () => false);
  assert.equal(none.changes.length, 0);
  assert.deepEqual(none.base, g.base);
  validateProgramGenome(none);
  const retire = { ...g, changes: [...g.changes, { operation: 'retire', rule: { ...g.changes[0].rule, retired: true }, evidence: g.changes[0].evidence }] };
  assert.equal(filterProgramGenome(retire, (c) => c.operation === 'retire').changes.length, 0);
});
