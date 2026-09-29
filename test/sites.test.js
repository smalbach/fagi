import test from 'node:test';
import assert from 'node:assert/strict';

import { SITES, SOURCES } from '../src/config.js';
import { createWorld, addObject, addPoint } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { perceive } from '../src/perception.js';
import { noteSites, decaySites, bestSite, worthVisiting, sitesSummary } from '../src/sites.js';

// SITES on for one test, and back to how it was even if the test fails.
function withSites(fn) {
  const saved = { ...SITES };
  SITES.enabled = 1;
  try { fn(); } finally { Object.assign(SITES, saved); }
}

function scene() {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  fagi.angle = 0;          // looking along +x
  fagi.hunger = 60;
  return { world, fagi };
}

const fruitAt = (world, x, y, n = 1) => Array.from({ length: n }, (_, i) => addPoint(world, x + i * 6, y, 'nectar'));
const walkTo = (fagi, x, y) => { fagi.x = x; fagi.y = y; };

test('seeing fruit she would eat makes a site; under a tree the site is the tree', () => withSites(() => {
  const { world, fagi } = scene();
  const tree = addObject(world, fagi.x + 150, fagi.y, 'tree');
  fruitAt(world, tree.x - 40, tree.y, 2);
  fruitAt(world, fagi.x + 40, fagi.y + 60, 1);    // out in the open, not under the crown (her sight reaches ~120 px)
  noteSites(fagi, world);
  const sites = fagi.brain.sites;
  assert.equal(sites.length, 2);
  const under = sites.find((s) => s.ref === tree);
  assert.ok(under, 'the tree is a site');
  assert.equal(under.x, tree.x);
  assert.ok(sites.some((s) => s.ref === null), 'the open-ground find is its own site');
}));

test('coming back to an empty site lowers what she expects of it; a full one keeps it', () => withSites(() => {
  const { world, fagi } = scene();
  const far = { x: fagi.x, y: fagi.y };
  const fruit = fruitAt(world, fagi.x + 100, fagi.y, 3);
  noteSites(fagi, world);
  const site = fagi.brain.sites[0];
  const before = site.value;
  assert.ok(before > 0.9, `found full: ${before}`);

  // She leaves, the fruit is taken, she comes back: an empty visit.
  walkTo(fagi, far.x - 300, far.y); noteSites(fagi, world);
  world.points.length = 0;
  walkTo(fagi, site.x - site.r + 5, site.y); noteSites(fagi, world);
  assert.equal(site.visits, 1);
  assert.equal(site.empties, 1);
  assert.ok(site.value < before, `${site.value} < ${before}`);

  // Leaving and coming back again, empty again: lower still.
  const once = site.value;
  walkTo(fagi, far.x - 300, far.y); noteSites(fagi, world);
  walkTo(fagi, site.x - site.r + 5, site.y); noteSites(fagi, world);
  assert.equal(site.visits, 2);
  assert.ok(site.value < once);

  // Standing inside doesn't count as more visits.
  noteSites(fagi, world); noteSites(fagi, world);
  assert.equal(site.visits, 2);

  // It fills again: a full visit raises it.
  walkTo(fagi, far.x - 300, far.y); noteSites(fagi, world);
  fruitAt(world, fruit[0].x, fruit[0].y, 3);
  const low = site.value;
  walkTo(fagi, site.x - site.r + 5, site.y); noteSites(fagi, world);
  assert.ok(site.value > low);
}));

test('a tree she has learned gives nothing is not worth walking to; the best site is the one she counts on most', () => withSites(() => {
  const { world, fagi } = scene();
  const tree = addObject(world, fagi.x + 150, fagi.y, 'tree');
  fruitAt(world, tree.x - 40, tree.y, 3);
  noteSites(fagi, world);
  const site = fagi.brain.sites[0];
  assert.equal(worthVisiting(fagi, tree), true);
  assert.equal(bestSite(fagi), site);
  site.value = SITES.minValue / 2;
  assert.equal(worthVisiting(fagi, tree), false);
  assert.equal(bestSite(fagi), null);
}));

test('she holds only SITES.max sites: the one she counts on least makes way', () => withSites(() => {
  SITES.max = 2;
  const { world, fagi } = scene();
  fruitAt(world, fagi.x + 60, fagi.y - 50, 1);
  fruitAt(world, fagi.x + 60, fagi.y, 3);
  fruitAt(world, fagi.x + 60, fagi.y + 50, 2);
  noteSites(fagi, world);
  assert.equal(fagi.brain.sites.length, 2);
  assert.equal(fagi.brain.siteN, 3, 'the third took the place of the poorest');
  assert.ok(fagi.brain.sites.every((s) => s.value > 1 / SITES.full), 'the poorest went');
  // A find poorer than everything she holds is not kept.
  const [a, b] = fagi.brain.sites.map((s) => s.id);
  fruitAt(world, fagi.x + 20, fagi.y + 90, 1);
  noteSites(fagi, world);
  assert.deepEqual(fagi.brain.sites.map((s) => s.id), [a, b]);
  assert.equal(fagi.brain.siteN, 3);
}));

test('time away blurs a site and lowers her trust in it', () => withSites(() => {
  const { world, fagi } = scene();
  fruitAt(world, fagi.x + 100, fagi.y, 2);
  noteSites(fagi, world);
  const site = fagi.brain.sites[0];
  const trust = site.confidence;
  decaySites(fagi, 100);
  assert.ok(site.confidence < trust);
  assert.ok(site.error > 0);
}));

test('a site whose tree is gone is dropped', () => withSites(() => {
  const { world, fagi } = scene();
  const tree = addObject(world, fagi.x + 150, fagi.y, 'tree');
  fruitAt(world, tree.x - 40, tree.y, 2);
  noteSites(fagi, world);
  world.objects.splice(world.objects.indexOf(tree), 1);
  noteSites(fagi, world);
  assert.equal(fagi.brain.sites.some((s) => s.ref === tree), false);
}));

test('with SITES on, what she goes back to unseen is her best site, even on open ground', () => withSites(() => {
  const { world, fagi } = scene();
  fruitAt(world, fagi.x + 100, fagi.y, 3);
  perceive(fagi, world);
  world.points.length = 0;
  fagi.angle = Math.PI;   // she turns away: nothing in sight
  walkTo(fagi, fagi.x - 200, fagi.y);
  const ctx = perceive(fagi, world);
  assert.equal(ctx.visibleSource, null);
  assert.equal(ctx.source, fagi.brain.sites[0]);
  assert.ok(ctx.candidates.some((c) => c.ref === ctx.source && c.via === 'memory'), 'it is a candidate, from memory');
}));

test('with SITES off nothing is kept', () => {
  const { world, fagi } = scene();
  fruitAt(world, fagi.x + 100, fagi.y, 2);
  perceive(fagi, world);
  assert.equal(fagi.brain.sites, undefined);
  assert.deepEqual(sitesSummary(fagi), { held: 0, found: 0, visits: 0, empties: 0, sites: [] });
  assert.equal(SOURCES.enabled, 0);
});
