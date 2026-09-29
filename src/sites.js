// Food sites (SITES, phase 9 B, spec §12.11): the places where she has found
// food, each with what she expects to find there.
//
// A single remembered tree (memory.js 'foodSource') can't tell a tree that
// bears all year from one gone bare, nor a windfall on the ground from either.
// So she keeps a few sites, and learns what each one yields the way animals
// learn a flower or a patch: by the gap between what she expected and what
// she found (a prediction error, Rescorla-Wagner style). Coming back to a
// full site keeps its value; finding it empty lowers it; enough empty visits
// and she stops counting on it. Nobody tells her which trees are seasonal:
// she finds out by going back.
//
// A site is where she SAW food she would eat: under a tree it is the tree
// (its crown is where fruit falls), anywhere else it is that spot. What she
// knows of it is only what she saw and when.
//
// Alongside what she expects (value, moved by the surprise at SITES.rate), each
// site keeps her evidence about it as two counts, a Beta belief: `a` grows
// with what she found there, `b` with what she didn't. The choice (choice.js,
// CHOICE.mode 1) samples from that belief, so the less she has seen of a
// site the more her guesses about it vary: her doubt is her own history, not
// a number set by hand. Evidence fades back toward knowing nothing at the
// pace of her middle-term memory (MEMORY.decayMedium), so an old lesson
// weighs less than a fresh one.
//
// No randomness is drawn here: with SITES on or off, the streams batch
// replays stay the same until her behaviour itself differs.

import { SITES, SOURCES, MEMORY } from './config.js';
import { seenPoints, distanceTo } from './vision.js';
import { isTree, radiusOf } from './obstacles.js';
import { verdict } from './learned/rules.js';
import { forageGene, priorOf } from './generations.js';

// Evidence: every visit adds one observation, split between found and not.
const observe = (site, y) => { site.a += y; site.b += 1 - y; };

const sitesOf = (fagi) => (fagi.brain.sites ??= []);
const worth = (s) => s.value * s.confidence;

// Would she eat it? What she has learned to avoid is not food to her.
const edible = (fagi, p) => verdict(fagi, 'eat', p.type) !== 'avoid';

// The tree a fruit lies under, if any: where fruit falls around a crown.
function treeUnder(world, p) {
  for (const o of world.objects) {
    if (isTree(o) && Math.hypot(o.x - p.x, o.y - p.y) <= radiusOf(o) * SOURCES.near) return o;
  }
  return null;
}

// The site a spot belongs to, among the ones she knows.
function siteAt(fagi, x, y) {
  return sitesOf(fagi).find((s) => Math.hypot(s.x - x, s.y - y) <= s.r) ?? null;
}

// How good a sight is: the edible fruit she sees there, up to SITES.full.
const yieldOf = (n) => Math.min(1, n / SITES.full);

function discover(fagi, world, p, seen) {
  const tree = treeUnder(world, p);
  const r = tree ? radiusOf(tree) * SOURCES.near : SITES.radius;
  const x = tree ? tree.x : p.x;
  const y = tree ? tree.y : p.y;
  const n = seen.filter(({ point }) => Math.hypot(point.x - x, point.y - y) <= r).length;
  const site = {
    id: 0,
    x, y, r, ref: tree, fruit: p.type,
    value: yieldOf(n), confidence: SITES.first, error: 0, ...priorOf(forageGene(fagi, 'site')),
    found: fagi.age, lastAt: fagi.age, visits: 0, empties: 0, lastYield: n,
    inside: distanceTo(fagi, { x, y }) <= r,
  };
  const sites = sitesOf(fagi);
  // Room for only a few: a new find takes the place of the one she counts on
  // least, and only if it is worth more to her. Otherwise it goes unkept.
  if (sites.length >= SITES.max) {
    const least = sites.reduce((a, b) => (worth(b) < worth(a) ? b : a));
    if (worth(site) <= worth(least)) return null;
    sites.splice(sites.indexOf(least), 1);
  }
  observe(site, site.value);
  site.id = fagi.brain.siteN = (fagi.brain.siteN ?? 0) + 1;
  sites.push(site);
  fagi.brain.lastSite = { n: (fagi.brain.lastSite?.n ?? 0) + 1, id: site.id, what: 'found', value: site.value, seen: n, tree: Boolean(tree) };
  return site;
}

// She is back at a site: what she sees there now against what she expected.
function visit(fagi, site, seen) {
  const n = seen.filter(({ point }) => Math.hypot(point.x - site.x, point.y - site.y) <= site.r).length;
  const surprise = yieldOf(n) - site.value;
  site.value += SITES.rate * surprise;
  observe(site, yieldOf(n));
  site.visits += 1;
  if (n === 0) site.empties += 1;
  // Kept apart from the sites: one she has since dropped still counts.
  fagi.brain.siteVisits = (fagi.brain.siteVisits ?? 0) + 1;
  if (n === 0) fagi.brain.siteEmpties = (fagi.brain.siteEmpties ?? 0) + 1;
  site.lastYield = n;
  site.lastAt = fagi.age;
  site.error = 0;
  site.confidence += SITES.gain * (1 - site.confidence);
  if (n > 0) site.fruit = seen.find(({ point }) => Math.hypot(point.x - site.x, point.y - site.y) <= site.r).point.type;
  fagi.brain.lastSite = { n: (fagi.brain.lastSite?.n ?? 0) + 1, id: site.id, what: n ? 'full' : 'empty', surprise, value: site.value, seen: n, tree: Boolean(site.ref) };
}

// Every frame, from what she sees: new sites, and visits to the ones she knows.
// Returns the edible fruit in sight (choice.js uses it).
export function noteSites(fagi, world) {
  if (!SITES.enabled) return [];
  const sites = sitesOf(fagi);
  // A tree that fell is no longer a site.
  for (let i = sites.length - 1; i >= 0; i--) {
    if (sites[i].ref && !world.objects.includes(sites[i].ref)) sites.splice(i, 1);
  }
  const seen = seenPoints(fagi, world.points, world).filter(({ point }) => edible(fagi, point));

  for (const site of sites) {
    const d = distanceTo(fagi, site);
    if (!site.inside && d <= site.r) { site.inside = true; visit(fagi, site, seen); }
    else if (site.inside && d > site.r * SITES.leave) site.inside = false;
  }
  for (const { point } of seen) {
    if (!siteAt(fagi, point.x, point.y)) discover(fagi, world, point, seen);
  }
  return seen;
}

// Time passes: she trusts a site less and remembers less exactly where it is.
export function decaySites(fagi, dt) {
  if (!SITES.enabled || !fagi.brain.sites) return;
  // Evidence fades toward what she was born believing, at her memory's inherited pace.
  const fade = Math.max(0, 1 - MEMORY.decayMedium * Math.exp(forageGene(fagi, 'memory')) * dt);
  const born = priorOf(forageGene(fagi, 'site'));
  for (const s of fagi.brain.sites) {
    s.a = born.a + (s.a - born.a) * fade;
    s.b = born.b + (s.b - born.b) * fade;
    s.confidence = Math.max(0, s.confidence - SITES.decay * dt);
    s.error = Math.min(MEMORY.placeErrorMax, s.error + MEMORY.placeDrift * dt);
  }
}

// The site she counts on most, if any is still worth it.
export function bestSite(fagi) {
  let best = null;
  for (const s of fagi.brain.sites ?? []) {
    if (s.value < SITES.minValue || s.confidence <= 0) continue;
    if (!best || worth(s) > worth(best)) best = s;
  }
  return best;
}

// A tree she sees is worth walking to unless she has learned it gives
// nothing now: a site she knows, with its value run down.
export function worthVisiting(fagi, tree) {
  const s = (fagi.brain.sites ?? []).find((x) => x.ref === tree);
  return !s || s.value >= SITES.minValue;
}

// What batch reports of her sites.
export function sitesSummary(fagi) {
  const r2 = (v) => Math.round(v * 100) / 100;
  const sites = fagi.brain.sites ?? [];
  return {
    held: sites.length,
    found: fagi.brain.siteN ?? 0,
    visits: fagi.brain.siteVisits ?? 0,
    empties: fagi.brain.siteEmpties ?? 0,
    sites: sites.map((s) => ({
      kind: s.ref ? 'tree' : 'ground', seasonal: s.ref ? s.ref.seasonal ?? null : null,
      value: r2(s.value), confidence: r2(s.confidence), visits: s.visits, empties: s.empties,
    })),
  };
}
