import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/world.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import {
  createPhylogeny,
  phylogenyOf,
  noteCodeMutation,
  renderPhylogenyMermaid,
  summarizePhylogeny,
  exportPhylogenyJson,
} from '../src/phylogeny.js';

test('phylogeny initializes and tracks programmatic mutations', () => {
  const world = createWorld();
  const phy = phylogenyOf(world);
  assert.equal(phy.nodes.size, 0);
  assert.equal(phy.events.length, 0);

  const fagi = createFagi();
  fagi.id = 1;
  fagi.generation = 0;

  // Synthesize first mutation
  noteCodeMutation(world, fagi, {
    kind: 'written',
    id: 'shelterRetreat-before-forage',
    from: 'shelterRetreat',
    over: 'forage',
    source: 'self',
    why: 'counterfactual storm crisis avoidance',
  });

  assert.equal(phy.nodes.size, 1);
  assert.equal(phy.events.length, 1);
  const node1 = phy.nodes.get('shelterRetreat-before-forage');
  assert.equal(node1.who, 1);
  assert.equal(node1.generation, 0);
  assert.equal(node1.source, 'self');
  assert.equal(node1.parentId, null);

  // Synthesize a specialized macro chain derived from shelterRetreat
  noteCodeMutation(world, fagi, {
    kind: 'written',
    id: 'shelterRetreat-before-forage-chain-shelterRetreat-rest',
    from: 'shelterRetreat',
    over: 'forage',
    chain: ['shelterRetreat', 'rest'],
    source: 'night',
    why: 'dream consolidation',
  });

  assert.equal(phy.nodes.size, 2);
  const node2 = phy.nodes.get('shelterRetreat-before-forage-chain-shelterRetreat-rest');
  assert.equal(node2.source, 'night');
  assert.equal(node2.parentId, 'shelterRetreat-before-forage', 'identified parent mutation');
});

test('renderPhylogenyMermaid generates valid flowchart with badges', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.id = 2;
  fagi.generation = 1;

  noteCodeMutation(world, fagi, {
    kind: 'written',
    id: 'patrol-before-explore',
    from: 'patrol',
    over: 'explore',
    source: 'self',
  });

  noteCodeMutation(world, fagi, {
    kind: 'written',
    id: 'zigzag-before-pursue',
    from: 'zigzag',
    over: 'pursue',
    source: 'night',
    chain: ['zigzag', 'pursue'],
  });

  const mmd = renderPhylogenyMermaid(world);
  assert.ok(mmd.startsWith('graph TD'));
  assert.ok(mmd.includes('Root["Innate Primordial Program"]'));
  assert.ok(mmd.includes('patrol_before_explore'));
  assert.ok(mmd.includes('zigzag_before_pursue'));
  assert.ok(mmd.includes('🌙 NIGHT'));
  assert.ok(mmd.includes('🧠 SELF'));
  assert.ok(mmd.includes('macro: zigzag → pursue'));
});

test('summarizePhylogeny and exportPhylogenyJson produce structured analytics', () => {
  const world = createWorld();
  const fagi1 = createFagi();
  fagi1.id = 1;
  fagi1.generation = 0;

  const fagi2 = createFagi();
  fagi2.id = 2;
  fagi2.generation = 1;

  noteCodeMutation(world, fagi1, { kind: 'written', id: 'rule-a', source: 'self' });
  noteCodeMutation(world, fagi1, { kind: 'written', id: 'rule-b', source: 'night' });
  noteCodeMutation(world, fagi2, { kind: 'written', id: 'rule-c', source: 'told' });

  const summary = summarizePhylogeny(world);
  assert.equal(summary.totalInnovations, 3);
  assert.equal(summary.bySource.self, 1);
  assert.equal(summary.bySource.night, 1);
  assert.equal(summary.bySource.told, 1);
  assert.equal(summary.byGeneration[0], 2);
  assert.equal(summary.byGeneration[1], 1);
  assert.equal(summary.activeEntitiesWithCode, 2);

  const jsonStr = exportPhylogenyJson(world);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.summary.totalInnovations, 3);
  assert.equal(parsed.events.length, 3);
  assert.ok(parsed.nodes['rule-a']);
  assert.deepEqual(parsed.lineages['1'], ['rule-a', 'rule-b']);
  assert.deepEqual(parsed.lineages['2'], ['rule-c']);
});

test('updateFagi automatically notes program mutations into world phylogeny', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.id = 42;
  fagi.generation = 2;

  // Simulate a program mutation written into fagi.brain.lastProgram
  fagi.brain.lastProgram = {
    n: 1,
    kind: 'written',
    id: 'rest-before-pursue',
    from: 'rest',
    over: 'pursue',
    source: 'self',
    why: 'energy conservation',
  };

  updateFagi(fagi, world, 0.1);

  const phy = world.codePhylogeny;
  assert.ok(phy, 'phylogeny initialized on world');
  assert.equal(phy.nodes.size, 1);
  assert.ok(phy.nodes.has('rest-before-pursue'));
  const node = phy.nodes.get('rest-before-pursue');
  assert.equal(node.who, 42);
  assert.equal(node.generation, 2);

  // Updating again without new mutation should not duplicate
  updateFagi(fagi, world, 0.1);
  assert.equal(phy.events.length, 1);
});
