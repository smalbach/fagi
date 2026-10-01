import test from 'node:test';
import assert from 'node:assert/strict';
import { GEN } from '../src/config.js';
import { createWorld } from '../src/world.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { teach, teachProgram } from '../src/generations.js';
import { programOf, line } from '../src/program.js';
import { summarizePhylogeny } from '../src/phylogeny.js';

test('when GEN.cultureProgram is off (default), teach does not transfer custom program lines', () => {
  const elder = createFagi();
  elder.id = 5;
  const elderProg = programOf(elder);
  elderProg.lines.splice(
    elderProg.lines.findIndex((l) => l.id === 'pursue'),
    0,
    line('shelterRetreat-before-pursue', {
      tier: 'endure',
      do: 'shelterRetreat',
      source: 'self',
      learnedAt: 1,
      from: 'shelterRetreat',
      over: 'pursue',
    })
  );

  const child = createFagi();
  child.id = 10;
  teach(child, elder);

  const childProg = programOf(child);
  assert.ok(!childProg.lines.some((l) => l.id === 'shelterRetreat-before-pursue'));
  assert.ok(childProg.lines.every((l) => l.source === 'born'));
});

test('when GEN.cultureProgram is on, elder teaches custom program lines marked as "told"', () => {
  const elder = createFagi();
  elder.id = 7;
  const elderProg = programOf(elder);
  elderProg.lines.splice(
    elderProg.lines.findIndex((l) => l.id === 'pursue'),
    0,
    line('rest-before-pursue', {
      tier: 'endure',
      do: 'rest',
      source: 'self',
      learnedAt: 1,
      from: 'rest',
      over: 'pursue',
      why: 'avoid starvation distress',
    })
  );

  const child = createFagi();
  child.id = 12;

  const wasCultureProgram = GEN.cultureProgram;
  GEN.cultureProgram = 1;
  try {
    teach(child, elder);

    const childProg = programOf(child);
    const taughtLine = childProg.lines.find((l) => l.id === 'rest-before-pursue');
    assert.ok(taughtLine, 'line was adopted by child');
    assert.equal(taughtLine.source, 'told', 'marked as told');
    assert.equal(taughtLine.do, 'rest');
    assert.equal(taughtLine.over, 'pursue');
    assert.ok(taughtLine.why.includes('taught by elder #7'));

    // Check precedence: taught line is immediately before pursue
    const taughtIdx = childProg.lines.indexOf(taughtLine);
    const pursueIdx = childProg.lines.findIndex((l) => l.id === 'pursue');
    assert.equal(taughtIdx, pursueIdx - 1);

    // Verify lastProgram update
    assert.equal(child.brain.lastProgram.kind, 'written');
    assert.equal(child.brain.lastProgram.source, 'told');

    // Stepping child in world logs this cultural innovation into phylogeny
    const world = createWorld();
    updateFagi(child, world, 0.1);
    const phy = summarizePhylogeny(world);
    assert.equal(phy.totalInnovations, 1);
    assert.equal(phy.bySource.told, 1);
  } finally {
    GEN.cultureProgram = wasCultureProgram;
  }
});
