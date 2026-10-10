import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { learnSeen } from '../src/brain.js';
import { activeRule, verdict } from '../src/learned/rules.js';
import { tell, socialize, trustOf } from '../src/social.js';
import { createColony } from '../src/colony.js';
import { SOCIAL } from '../src/config.js';
import { rule, renderRule, parseModule } from '../src/learned/dsl.js';

// Eats until her own rule about it is written.
function live(fagi, key) {
  for (let i = 0; i < 12; i++) {
    fagi.hunger = 50;
    eat(fagi, key);
    fagi.episode = null;
    if (activeRule(fagi.brain.rules, key, 'avoid') || activeRule(fagi.brain.rules, key, 'prefer')) return;
  }
  throw new Error(`no rule about ${key}`);
}

const sisters = (n) => Array.from({ length: n }, (_, i) => Object.assign(createFagi(), { id: i + 1 }));

test('a rule told comes in marked "told", weighing less, and she acts on it', () => {
  const [a, b] = sisters(2);
  live(a, 'toxic');
  assert.deepEqual(tell(a, b, 50), ['avoid-toxic']);
  const r = activeRule(b.brain.rules, 'toxic', 'avoid');
  assert.deepEqual(r.source, { kind: 'told', from: 1, at: 50, trust: SOCIAL.trust });
  assert.ok(Math.abs(r.weight) < Math.abs(activeRule(a.brain.rules, 'toxic', 'avoid').weight));
  assert.equal(b.brain.facts.toxic, undefined, 'being told is not tasting');
  assert.equal(verdict(b, 'eat', 'toxic'), 'avoid');
  assert.equal(b.brain.lastTold.from, 1);
});

test('told on and on, it weakens until it is not worth passing on', () => {
  const [a, b, c, d] = sisters(4);
  live(a, 'toxic');
  tell(a, b, 1);
  tell(b, c, 2);
  const inC = activeRule(c.brain.rules, 'toxic', 'avoid');
  assert.equal(inC.source.from, 2);
  assert.ok(Math.abs(inC.source.trust - SOCIAL.trust ** 2) < 1e-9);
  assert.deepEqual(tell(c, d, 3), [], `${SOCIAL.trust ** 3} is below ${SOCIAL.minTrust}`);
  assert.equal(trustOf(activeRule(a.brain.rules, 'toxic', 'avoid')), 1, 'what she lived she trusts fully');
});

test('nobody is told what she already knows, lived or dropped', () => {
  const [a, b, c] = sisters(3);
  live(a, 'toxic');
  live(b, 'toxic');
  assert.deepEqual(tell(a, b, 1), [], 'she has her own rule');
  c.hunger = 50;
  eat(c, 'nectar');
  live(a, 'nectar');
  assert.ok(!tell(a, c, 1).includes('prefer-nectar'), 'she tasted nectar: her own experience judges it');
});

test('living a rule she was told makes it hers; living the opposite retires it', () => {
  const [a, b, c] = sisters(3);
  live(a, 'toxic');
  tell(a, b, 1);
  live(b, 'toxic');
  const mine = activeRule(b.brain.rules, 'toxic', 'avoid');
  assert.equal(mine.source, undefined, 'now she lived it');

  // A made-up rule: nectar is bad. The sister tells it; the other tastes nectar.
  a.brain.rules.list.push(rule('avoid-nectar', {
    on: ['eat', 'store', 'pursue'], when: { key: 'nectar' }, verdict: 'avoid', weight: -0.5,
    because: [], learnedAt: 0, tries: 1, stage: 'short',
  }));
  tell(a, c, 2);
  assert.ok(activeRule(c.brain.rules, 'nectar', 'avoid'));
  live(c, 'nectar');
  assert.equal(activeRule(c.brain.rules, 'nectar', 'avoid'), null, 'the myth dies when she checks it');
  assert.ok(activeRule(c.brain.rules, 'nectar', 'prefer'));
});

test('watching a sister get sick teaches a little, without counting as tasting', () => {
  const [b] = sisters(1);
  learnSeen(b.brain, 'toxic', -1, 10, 7);
  const fact = b.brain.facts.toxic;
  assert.equal(fact.tries, 0, 'still untasted');
  assert.ok(fact.value < 0);
  assert.equal(b.brain.bites.at(-1).saw, 7);
  assert.equal(b.brain.lastSeen.from, 7);
  for (let i = 0; i < 6; i++) learnSeen(b.brain, 'toxic', -1, 20 + i * 30, 7);
  const r = activeRule(b.brain.rules, 'toxic', 'avoid');
  assert.ok(r, 'enough of it writes a rule');
  assert.equal(r.source.kind, 'saw');
  assert.equal(r.source.from, 7);
});

test('sisters in the nest exchange, then wait before exchanging again', () => {
  const colony = createColony(2);
  const [a, b] = colony.ants;
  const nest = { type: 'nest', x: 100, y: 100, r: 30, stock: {}, ages: {} };
  const world = { objects: [nest], points: [], time: 0 };
  for (const f of colony.ants) { f.x = 100; f.y = 100; }
  live(a, 'toxic');
  socialize(colony, world, 5);
  assert.ok(activeRule(b.brain.rules, 'toxic', 'avoid'));
  assert.equal(colony.stats.exchanges, 1);
  socialize(colony, world, 6);
  assert.equal(colony.stats.exchanges, 1, 'too soon');
  socialize(colony, world, 5 + SOCIAL.every);
  assert.equal(colony.stats.exchanges, 2);
  assert.equal(b.sister, true, 'only the first ant saves what she learned');
  assert.equal(a.sister, undefined);
});

test('a rule told survives export and import with its source; a bad source is refused', () => {
  const [a, b] = sisters(2);
  live(a, 'toxic');
  tell(a, b, 3);
  const line = renderRule(activeRule(b.brain.rules, 'toxic', 'avoid'));
  const { rules } = parseModule(`${line}\n`);
  assert.deepEqual(rules[0].source, { kind: 'told', from: 1, at: 3, trust: SOCIAL.trust });
  assert.throws(() => rule('avoid-x', {
    on: ['eat'], when: { key: 'x' }, verdict: 'avoid', weight: -0.3, because: [], learnedAt: 0, tries: 0, stage: 'short',
    source: { kind: 'rumor', from: 1, at: 0, trust: 0.5 },
  }), /source.kind/);
});

test('a colony session replays with her sisters where they were', async () => {
  const { generateMap } = await import('../src/mapgen.js');
  const { step } = await import('../src/simulation.js');
  const { createWorld } = await import('../src/world.js');
  const { createRecorder } = await import('../src/recorder/recorder.js');
  const { createPlayer } = await import('../src/recorder/replay.js');
  const { invalidEvent } = await import('../src/recorder/events.js');
  let seed = 11;
  const original = Math.random;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  try {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    world.colony = createColony(3, fagi);
    const events = [];
    const rec = createRecorder(world, { send: (batch) => events.push(...batch) });
    world.rec = rec;
    rec.start({ config: {} });
    const seen = {};
    while (world.time < 120) {
      step(world, fagi, 0.05);
      rec.observe(fagi);
      if (Math.abs(world.time - 90) < 0.025) seen.at90 = world.colony.ants.slice(1).map((s) => [s.x, s.y]);
    }
    rec.end('user');
    assert.deepEqual(events.map(invalidEvent).filter(Boolean), [], 'every event is valid for the server');
    assert.ok(events.some((e) => e.type === 'sisters'));

    const player = createPlayer(events);
    player.seek(90);
    // As live: the one followed first, then her sisters.
    assert.equal(player.world.colony.ants[0], player.fagi);
    const ants = player.world.colony.ants.slice(1);
    assert.equal(ants.length, 2);
    ants.forEach((s, i) => {
      assert.ok(Math.hypot(s.x - seen.at90[i][0], s.y - seen.at90[i][1]) < 20, `sister ${s.id} is where she was`);
    });
  } finally {
    Math.random = original;
  }
});
