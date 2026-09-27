// Attention: what has just entered what she perceives.
//
// Fagi decides every frame, but not every frame brings something to think about. What
// matters is what's NEW: a fruit that shows up at her side, a smell that reaches her,
// a puddle at the back of her view. That forces her to rethink the plan: does she carry on
// with what she was going to do, or does this change it? decision.js decides; this module
// only says what's new, and afterwards notes what was decided with it
// (fagi.rethink), which is what the console reports.
//
// "New" means not having perceived it in the last ATTENTION.forget seconds:
// something flickering at the edge of the cone doesn't count as new every time.

import { ATTENTION, BRAIN, TREE } from './config.js';
import { normalizeAngle } from './vision.js';

export function createAttention() {
  return { lastSeen: new Map() };   // ref -> age at which she last perceived it
}

// What she perceives right now through her senses (not what she only remembers), with
// the score perception.js already gave it if it's something chaseable.
function perceived(ctx) {
  const list = [];
  const already = new Set();
  for (const c of ctx.ranked) {
    if (c.via === 'memory' || already.has(c.ref)) continue;
    already.add(c.ref);
    list.push(c);
  }
  // Seeing water or a tree is information even if she doesn't need it right now.
  for (const [ref, key, kind] of [[ctx.visible, 'water', 'water'], [ctx.visibleSource, ctx.visibleSource?.fruit ?? TREE.fruit, 'food']]) {
    if (ref && !already.has(ref)) { already.add(ref); list.push({ ref, key, kind, via: 'sight', score: null, dist: null }); }
  }
  return list;
}

// Marks what's perceived and returns what's new.
export function notice(fagi, ctx) {
  const att = (fagi.attention ??= createAttention());
  const now = fagi.age;
  const newOnes = [];
  for (const c of perceived(ctx)) {
    const before = att.lastSeen.get(c.ref);
    if (before === undefined || now - before > ATTENTION.forget) newOnes.push(c);
    att.lastSeen.set(c.ref, now);
  }
  // What she hasn't perceived in a long while is dropped from the list: that way it doesn't grow.
  for (const [ref, t] of att.lastSeen) if (now - t > ATTENTION.forget * 4) att.lastSeen.delete(ref);
  return newOnes;
}

const NOTHING_BETTER = new Set(['explore', 'pheromone', 'memory', 'track']);

// Which side something is on, seen from her heading.
function sideOf(fagi, ref) {
  const rel = normalizeAngle(Math.atan2(ref.y - fagi.y, ref.x - fagi.x) - fagi.angle);
  if (Math.abs(rel) < 0.35) return 'ahead';
  return rel < 0 ? 'left' : 'right';
}

// Notes what she did with what's new: stick with the plan or change it, and why.
// `before` is the previous frame's intention; `intent` is this one's.
export function rethink(fagi, newOnes, before, intent, ranked = []) {
  // With no previous plan (the first frame) there's nothing to rethink.
  if (!newOnes.length || before.action == null) return null;
  const main = newOnes.reduce((m, c) => ((c.score ?? -Infinity) > (m.score ?? -Infinity) ? c : m));
  const changesNow = intent.action !== before.action
    || ('target' in intent && intent.target !== before.target);
  const goesForNew = newOnes.some((c) => c.ref === intent.target);

  // Why she carries on the same, if she does: either what's new isn't worth it, or something more
  // important keeps her busy.
  let motive = null;
  // What she was already pursuing, if she sticks with it: its score is the one that won.
  const current = ranked.find((r) => r.ref === intent.target) ?? null;
  if (!changesNow || !goesForNew) {
    // Negative score: she doesn't even consider it (water without thirst, something she knows is bad).
    if (main.score == null || main.score <= 0) motive = 'notNeeded';
    else if (main.score <= BRAIN.minScore) motive = 'lowScore';
    else if (current && !newOnes.includes(current)) motive = 'better';
    // It scores, but what she's doing belongs to a more urgent tier (drinking, carrying,
    // resting, a directive...), or what she's doing is one of the "nothing
    // better" ones and she still didn't go for it: then it's no use to her (pantry
    // full, or she learned not to pursue it).
    else motive = NOTHING_BETTER.has(intent.action) ? 'notUseful' : 'busy';
  }

  fagi.rethink = {
    n: (fagi.rethink?.n ?? 0) + 1,
    what: main.key,
    via: main.via,
    side: sideOf(fagi, main.ref),
    count: newOnes.length,
    score: main.score,
    current: current?.score ?? null,
    from: before.action,
    to: intent.action,
    changed: changesNow,
    forNew: goesForNew,
    why: motive,
  };
  return fagi.rethink;
}
