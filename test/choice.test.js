import test from 'node:test';
import assert from 'node:assert/strict';

import { CHOICE, SITES, HUNGER } from '../src/config.js';
import { createWorld, addPoint } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { perceive } from '../src/perception.js';
import { noteSites, decaySites } from '../src/sites.js';
import { updateChoice, temperatureOf, choiceSummary, choiceView, optionsOf } from '../src/choice.js';
import { rng, withRng } from '../scripts/batch/random.js';

// SITES and CHOICE on for one test, and back to how they were even if it fails.
function withChoice(fn) {
  const saved = { sites: { ...SITES }, choice: { ...CHOICE } };
  SITES.enabled = 1;
  CHOICE.enabled = 1;
  try { fn(); } finally { Object.assign(SITES, saved.sites); Object.assign(CHOICE, saved.choice); }
}

// A hungry Fagi who once saw three fruit ahead (a site), now 200 px away and
// looking elsewhere, with nothing in sight.
function scene() {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.hunger = HUNGER.max * 0.7;
  for (let i = 0; i < 3; i++) addPoint(world, fagi.x + 60 + i * 6, fagi.y, 'nectar');
  noteSites(fagi, world);
  world.points.length = 0;
  fagi.x -= 200;
  fagi.angle = Math.PI;
  return { world, fagi, site: fagi.brain.sites[0] };
}

const look = (fagi, world) => updateChoice(fagi, noteSites(fagi, world));

test('the fixed policies: always back to her best site, or always explore', () => withChoice(() => {
  CHOICE.policy = 1;
  let { world, fagi, site } = scene();
  assert.equal(look(fagi, world), site);
  assert.equal(fagi.brain.choice.plan.kind, 'site');

  CHOICE.policy = 2;
  ({ world, fagi } = scene());
  assert.equal(look(fagi, world), null);
  assert.equal(fagi.brain.choice.plan.kind, 'explore');
}));

test('mode 0: with little noise she takes the option worth more; with a lot, both', () => withChoice(() => {
  CHOICE.mode = 0;
  CHOICE.temperSpread = 0;
  const share = (temper, explorePrior) => {
    CHOICE.temper = temper;
    CHOICE.explorePrior = explorePrior;
    let site = 0;
    withRng(rng(21), () => {
      for (let i = 0; i < 200; i++) {
        const { world, fagi, site: known } = scene();
        known.value = 0.5;        // a middling site she is sure of: no wobble
        known.confidence = 1;
        if (look(fagi, world)) site++;
      }
    });
    return site / 200;
  };
  assert.ok(share(0.02, 0.1) > 0.95, 'a good site against poor exploring: back');
  assert.ok(share(0.02, 0.9) < 0.05, 'a good site against rich exploring: explore');
  const mixed = share(5, 0.4);
  assert.ok(mixed > 0.3 && mixed < 0.7, `noisy: ${mixed}`);
}));

test('mode 0: exploring that finds food raises what she expects of it; a long search for nothing lowers it', () => withChoice(() => {
  CHOICE.mode = 0;
  CHOICE.policy = 2;
  let { world, fagi } = scene();
  const before = fagi.brain.choice?.exploreValue ?? CHOICE.explorePrior;
  look(fagi, world);
  addPoint(world, fagi.x - 60, fagi.y, 'nectar');   // ahead of her now
  addPoint(world, fagi.x - 66, fagi.y, 'nectar');
  look(fagi, world);
  const c = fagi.brain.choice;
  assert.equal(c.plan, null, 'resolved');
  assert.ok(c.exploreValue > before);
  assert.equal(c.outcomes['explore:found'], 1);

  ({ world, fagi } = scene());
  look(fagi, world);
  fagi.age += CHOICE.exploreWindow / 2;
  fagi.sleeping = true;                 // a night asleep doesn't count
  look(fagi, world);
  fagi.age += CHOICE.exploreWindow * 3;
  look(fagi, world);
  assert.ok(fagi.brain.choice.plan, 'still exploring after sleeping');
  fagi.sleeping = false;
  look(fagi, world);
  fagi.age += CHOICE.exploreWindow + 1;
  look(fagi, world);
  assert.ok(fagi.brain.choice.exploreValue < before);
  assert.equal(fagi.brain.choice.outcomes['explore:nothing'], 1);
}));

test('mode 0: going back to a site that turns out empty resolves the plan and heats her up', () => withChoice(() => {
  CHOICE.mode = 0;
  CHOICE.policy = 1;
  CHOICE.temperSpread = 0;   // only the surprise moves her noise here
  const { world, fagi, site } = scene();
  const t0 = temperatureOf(fagi);
  look(fagi, world);
  fagi.x = site.x - site.r + 5;
  fagi.y = site.y;
  look(fagi, world);
  const c = fagi.brain.choice;
  assert.equal(c.log[0].outcome, 'empty', 'the plan resolved on arrival');
  assert.equal(c.outcomes['site:empty'], 1);
  assert.ok(c.volatility > 0);
  assert.ok(temperatureOf(fagi) > t0);
  assert.deepEqual(c.early[0], { chose: 'site', outcome: 'empty' });
}));

test('bringing food home ends a plan without judging it', () => withChoice(() => {
  CHOICE.policy = 2;
  const { world, fagi } = scene();
  look(fagi, world);
  const value = fagi.brain.choice.exploreValue;
  fagi.stored = (fagi.stored ?? 0) + 1;
  fagi.hunger = 0;
  fagi.pantry = { nectar: 99 };
  look(fagi, world);
  const c = fagi.brain.choice;
  assert.equal(c.plan, null);
  assert.equal(c.exploreValue, value);
  assert.equal(c.outcomes['explore:home'], 1);
  assert.equal(c.early.length, 0);
}));

test('mode 0: each is born with her own noise, unless the spread is zero', () => withChoice(() => {
  CHOICE.mode = 0;
  const innate = () => withRng(rng(31), () => Array.from({ length: 6 }, () => {
    const { world, fagi } = scene();
    look(fagi, world);
    return fagi.brain.choice.innate;
  }));
  CHOICE.temperSpread = 0.5;
  assert.ok(new Set(innate()).size > 1);
  CHOICE.temperSpread = 0;
  assert.deepEqual([...new Set(innate())], [1]);
}));

test('with CHOICE on, choosing to explore leaves no remembered site to go to', () => withChoice(() => {
  CHOICE.policy = 2;
  const { world, fagi } = scene();
  const ctx = perceive(fagi, world);
  assert.equal(ctx.source, null);
  assert.equal(choiceSummary(fagi).explore, 1);
}));

test('drawing her wiring draws no random numbers, and its chances add up to one', () => withChoice(() => {
  const { world, fagi } = scene();
  look(fagi, world);
  const real = Math.random;
  let draws = 0;
  Math.random = () => { draws++; return real(); };
  try {
    const view = choiceView(fagi);
    assert.equal(draws, 0);
    assert.ok(Math.abs(view.options.reduce((a, o) => a + o.p, 0) - 1) < 1e-9);
    assert.ok(view.options.some((o) => o.kind === 'site' && o.site));
  } finally { Math.random = real; }
}));

// --- mode 1: guesses drawn from her own evidence --------------------------

// How often she goes back to her site among `n` fresh sisters built by `make`.
function backShare(make, n = 300, seed = 41) {
  let back = 0;
  withRng(rng(seed), () => {
    for (let i = 0; i < n; i++) {
      const { world, fagi, site } = scene();
      make(fagi, site);
      if (look(fagi, world)) back++;
    }
  });
  return back / n;
}

test('mode 1: much evidence settles her; little evidence leaves her trying', () => withChoice(() => {
  CHOICE.mode = 1;
  // Many visits that paid, many explorations that didn't: back, nearly always.
  // 400 s of life and one site found: exploring has taken her ~400 s.
  const sure = backShare((f, s) => { f.age = 400; s.a = 40; s.b = 2; });
  assert.ok(sure > 0.95, `settled: ${sure}`);
  // A site she stands in is not an option.
  const { world, fagi, site } = scene();
  fagi.x = site.x; fagi.y = site.y;
  noteSites(fagi, world);
  assert.equal(look(fagi, world), null);
}));

test('mode 1: a search that finds food adds to her evidence for exploring, and teaches her how long one takes', () => withChoice(() => {
  CHOICE.mode = 1;
  CHOICE.policy = 2;
  const { world, fagi } = scene();
  look(fagi, world);
  fagi.age += 30;
  look(fagi, world);   // 30 s of searching
  addPoint(world, fagi.x - 60, fagi.y, 'nectar');
  addPoint(world, fagi.x - 66, fagi.y, 'nectar');
  look(fagi, world);
  const c = fagi.brain.choice;
  assert.ok(c.explore.a > 1, 'found');
  assert.equal(c.explorations, 1);
  assert.ok(Math.abs(c.exploreTime - 30) < 1, `took ${c.exploreTime}`);
  assert.equal(c.innate, null, 'no innate noise drawn');
}));

test('mode 1: old evidence fades back toward knowing nothing', () => withChoice(() => {
  CHOICE.mode = 1;
  const { world, fagi, site } = scene();
  site.a = 20; site.b = 5;
  look(fagi, world);
  fagi.brain.choice.explore = { a: 10, b: 10 };
  decaySites(fagi, 1000);
  fagi.age += 1000;
  look(fagi, world);
  assert.ok(site.a < 20 && site.a > 1);
  assert.ok(fagi.brain.choice.explore.a < 10);
}));

test('mode 1: two sisters alike in all but what they lived choose differently', () => withChoice(() => {
  CHOICE.mode = 1;
  // Same walk to the site as an exploration takes her, same evidence for
  // exploring; one found the site full nearly every time, the other mostly empty.
  const setUp = (f, s, a, b) => {
    optionsOf(f, false);   // her choice state, as she is born with it (draws nothing)
    Object.assign(f.brain.choice, { explore: { a: 3, b: 3 }, exploreTime: 1 + Math.hypot(s.x - f.x, s.y - f.y) / 70 });
    s.a = a; s.b = b;
  };
  const lucky = backShare((f, s) => setUp(f, s, 9, 2));
  const unlucky = backShare((f, s) => setUp(f, s, 3, 8));
  assert.ok(lucky > unlucky + 0.3, `${lucky} vs ${unlucky}`);
}));

test('with CHOICE off nothing is chosen and the best site is offered, as in phase B', () => {
  SITES.enabled = 1;
  try {
    const { world, fagi, site } = scene();
    assert.equal(look(fagi, world), undefined);
    assert.equal(perceive(fagi, world).source, site);
    assert.equal(fagi.brain.choice, undefined);
  } finally { SITES.enabled = 0; }
});
