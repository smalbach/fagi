// Concepts: what she makes of the things she has touched and nibbled
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.4, §12.8).
//
// Two layers, like memory.js and learned/induce.js for fruit:
//   kinds    what she lived with each look. Every touch or nibble rules out
//            what that look cannot afford ('cold to the touch' rules out all
//            but cool); a kind is settled when one affordance is left.
//   concepts groups of settled kinds with the same affordance, described by
//            the traits they share (the most specific common description,
//            like induce.js). A concept is kept only if it groups at least
//            CONCEPT.minKinds kinds, has more for it than against it and does
//            not repeat another. It predicts the affordance of a kind she
//            never touched; when she then lives that kind, the prediction is
//            scored. One that gets fewer than CONCEPT.keep of CONCEPT.testMin
//            or more predictions right is retired, and its description is not
//            formed again.
//
// Volatility (Behrens et al., 2007: animals learn faster in a world that has
// been changing). A surprise (a concept that got a new kind wrong, a kind she
// knew that now feels different) makes everything she believes about things
// less sure for a while (CONCEPT.surprise, fading with half-life CONCEPT.calm),
// and marks every kind she has not looked at lately as worth looking at again. In a world that
// does not change nothing ever surprises her and none of this happens.
//
// Nothing here knows what a thing really is: only what she felt. With
// CONCEPT.generalize = 0 kinds are learned one by one and nothing is predicted.

import { CONCEPT } from './config.js';
import { AFFORDANCES, TOUCH, MOUTH, cuesOfLook, lookKey } from './things.js';
import { record } from './world.js';

const ORDER = ['color', 'shape', 'texture'];
const byDimension = (a, b) => {
  const [da, db] = [a.split(':')[0], b.split(':')[0]];
  return (ORDER.indexOf(da) - ORDER.indexOf(db)) || (a < b ? -1 : a > b ? 1 : 0);
};
const descOf = (c) => `${c.aff}:${c.all.join('+')}`;

export function createConcepts() {
  return {
    kinds: {}, list: [], seq: 0, places: {}, blocked: [], tested: { hits: 0, misses: 0 }, version: 0,
    volatility: 0, volatileAt: 0, surprises: 0, now: 0,
  };
}

// Her concepts, made the first time she needs them: with CONCEPT off the brain
// never carries them.
export const conceptsOf = (fagi) => (fagi.brain.concepts ??= createConcepts());

// She sees a thing: its kind exists for her from now on, and she remembers
// where it was and whether it looked dry.
export function noteSeen(concepts, obj, dry, now) {
  concepts.now = now;
  const kind = concepts.kinds[obj.key] ??= { look: { ...obj.look }, possible: [...AFFORDANCES], touch: null, mouth: null, seenAt: now };
  const prev = concepts.places[obj.id];
  const place = { x: obj.x, y: obj.y, key: obj.key, dry, at: now, drainedAt: prev?.drainedAt ?? null, lookAt: prev?.lookAt ?? null };
  if (place.drainedAt != null) {
    const since = now - place.drainedAt;
    if (!dry) {
      // Full again: sap takes at most this long to come back.
      learnRegrow(concepts, since, 'atMost');
      place.drainedAt = null;
      place.lookAt = null;
    } else if (!prev?.dry || now >= (prev.lookAt ?? Infinity)) {
      // Still dry when she came to look: it takes longer than this.
      learnRegrow(concepts, since, 'atLeast');
      place.lookAt = now + Math.max(CONCEPT.lookAgain / 3, regrowOf(concepts) - since);
    }
  }
  concepts.places[obj.id] = place;
  return kind;
}

// Waiting and looking again (§12.3): how long she believes sap takes to come
// back to a thing she drained, from what she saw. Seeing it full again says
// "at most this long"; finding it still dry, "longer than this".
// She keeps the tightest of each bound; her guess is between them, or, with
// only one, a little past the lower one or at the upper one.
function learnRegrow(concepts, seconds, bound) {
  const b = (concepts.regrowBounds ??= { atLeast: null, atMost: null });
  if (bound === 'atMost') b.atMost = b.atMost == null ? seconds : Math.min(b.atMost, seconds);
  else b.atLeast = b.atLeast == null ? seconds : Math.max(b.atLeast, seconds);
  // Contradictory bounds (it changed, or she misjudged): the newest one wins.
  if (b.atLeast != null && b.atMost != null && b.atLeast > b.atMost) {
    if (bound === 'atMost') b.atLeast = null; else b.atMost = null;
  }
  concepts.regrow = b.atLeast != null && b.atMost != null ? (b.atLeast + b.atMost) / 2
    : b.atMost != null ? b.atMost : b.atLeast * 1.5;
}

export const regrowOf = (concepts) => concepts.regrow ?? CONCEPT.lookAgain;

// She drained it: it will be dry for a while. When to go and look again.
export function drained(concepts, obj, now) {
  const place = concepts.places[obj.id];
  if (!place) return;
  place.dry = true;
  place.drainedAt = now;
  place.lookAt = now + regrowOf(concepts);
}

export const settled = (kind) => (kind?.possible.length === 1 ? kind.possible[0] : null);

// How changeable the world of things seems to her right now (0-1).
export function volatilityOf(concepts) {
  if (!concepts?.volatility) return 0;
  return concepts.volatility * 0.5 ** (Math.max(0, concepts.now - concepts.volatileAt) / CONCEPT.calm);
}

// Something she believed did not hold: the world may have changed.
function surprise(concepts, now, except) {
  concepts.surprises += 1;
  if (!CONCEPT.surprise) return;
  concepts.volatility = Math.min(1, volatilityOf(concepts) + CONCEPT.surprise);
  concepts.volatileAt = now;
  // Only what she learned before this stretch of change: what she has looked
  // at since is already news of the world as it is now.
  for (const k of Object.values(concepts.kinds)) {
    if (k !== except && (k.touch || k.mouth) && (k.checkedAt ?? 0) < now - CONCEPT.calm) k.stale = true;
  }
}

const cuesOfKey = (concepts, key) => cuesOfLook(concepts.kinds[key].look);

// The concepts that hold for a look: they have all its traits and it is not
// one of their exceptions. The most specific first, then the surest.
export function covering(concepts, look) {
  const cues = cuesOfLook(look);
  const key = lookKey(look);
  return concepts.list
    .filter((c) => !c.retired && c.all.every((x) => cues.includes(x)) && !c.except.some((e) => e === key || cues.includes(e)))
    .sort((a, b) => b.all.length - a.all.length || confidence(b) - confidence(a));
}

// How far a concept can be trusted: the kinds behind it and its tested
// predictions, against its exceptions and its misses.
export function confidence(c) {
  const pro = c.members.length + c.hits;
  return pro / (pro + c.con + c.misses + 1);
}

// What she believes a look affords: { aff, confidence, via } where via is
// 'self' (she lived it) or a concept id; aff null when she cannot tell.
// `possible`: what her own contact with it has left open.
export function believe(concepts, look) {
  const key = lookKey(look);
  const kind = concepts.kinds[key];
  const own = settled(kind);
  const sure = 1 - volatilityOf(concepts);
  if (own && kind.watched && !kind.touch && !kind.mouth) return { aff: own, confidence: CONCEPT.seen * sure, via: 'saw', possible: kind.possible };
  if (own) return { aff: own, confidence: sure, via: 'self', possible: kind.possible };
  const possible = kind?.possible ?? AFFORDANCES;
  if (CONCEPT.generalize) {
    const c = covering(concepts, look).find((x) => possible.includes(x.aff));
    if (c) return { aff: c.aff, confidence: confidence(c) * sure, via: c.id, possible };
  }
  return { aff: null, confidence: 0, via: null, possible };
}

// She saw a sister react to a thing (social.js): stung ('pain') or drinking its
// sap ('sap'). What she sees tells that kind apart only if she has not touched
// it herself: her own contact always outweighs what she watched. It counts as
// a settled kind for her concepts too: a sister's sting is evidence.
export function watched(concepts, world, obj, felt, now) {
  const kind = noteSeen(concepts, obj, false, now);
  if (kind.touch || kind.mouth || settled(kind)) return null;
  const aff = felt === 'pain' ? 'sting' : felt === 'sap' ? 'sap' : null;
  if (!aff) return null;
  kind.possible = [aff];
  kind.watched = true;
  const out = CONCEPT.generalize ? form(concepts, world, now) : { formed: [], retired: [] };
  concepts.version += 1;
  return { settled: aff, ...out };
}

// One touch or nibble and what she felt ('dry' teaches nothing: she saw it
// was drained). Returns what changed: { settled, scored, formed, retired }.
export function experience(concepts, world, obj, act, felt, now) {
  const kind = noteSeen(concepts, obj, false, now);
  const out = { settled: null, scored: null, formed: [], retired: [] };
  if (felt === 'dry') return out;
  // What she only watched gives way to what she lives.
  if (kind.watched && !kind.touch && !kind.mouth) { kind.possible = [...AFFORDANCES]; kind.watched = false; }
  // Looking again at a kind she knew, after a surprise: what she felt then
  // counts no more; this contact starts it afresh.
  const known = settled(kind);
  if (kind.stale && act === 'touch') {
    kind.stale = false;
    kind.recheck = known;
    kind.possible = [...AFFORDANCES];
    kind.touch = null;
    kind.mouth = null;
  }
  // What a concept said before she found out, if this is the first time.
  if (!kind.touch && !kind.mouth && CONCEPT.generalize) {
    const b = believe(concepts, kind.look);
    if (b.via && b.via !== 'self') kind.predicted = { id: b.via, aff: b.aff };
  }
  if (act === 'touch') kind.touch = felt; else kind.mouth = felt;
  kind.checkedAt = now;
  const table = act === 'touch' ? TOUCH : MOUTH;
  const before = kind.possible.length;
  kind.possible = kind.possible.filter((a) => table[a] === felt);
  // What she felt fits nothing she thought possible: start again from this.
  let surprised = false;
  if (!kind.possible.length) {
    kind.possible = AFFORDANCES.filter((a) => table[a] === felt);
    surprised = true;
  }
  out.scored = score(concepts, world, kind, now);
  if (out.scored && !out.scored.hit) surprised = true;
  // Looked at again, it settles on something else than it used to.
  if (kind.recheck && settled(kind)) {
    if (settled(kind) !== kind.recheck) surprised = true;
    kind.recheck = null;
  }
  if (surprised) { surprise(concepts, now, kind); out.surprised = true; }
  if (settled(kind) && (before > 1 || surprised)) {
    out.settled = settled(kind);
    if (CONCEPT.generalize) Object.assign(out, form(concepts, world, now));
  }
  concepts.version += 1;
  return out;
}

// A prediction is right once the kind settles on it, wrong as soon as what she
// felt rules it out.
function score(concepts, world, kind, now) {
  const p = kind.predicted;
  if (!p || p.done) return null;
  const hit = settled(kind) === p.aff;
  if (!hit && kind.possible.includes(p.aff)) return null;
  p.done = true;
  p.hit = hit;
  const c = concepts.list.find((x) => x.id === p.id);
  concepts.tested[hit ? 'hits' : 'misses'] += 1;
  if (!c) return { hit, id: p.id };
  if (hit) c.hits += 1; else c.misses += 1;
  const tests = c.hits + c.misses;
  if (!c.retired && tests >= CONCEPT.testMin && c.hits / tests < CONCEPT.keep) {
    c.retired = true;
    c.retiredAt = now;
    c.why = 'fails';
    concepts.blocked.push(descOf(c));
    record(world, 'concept', { id: c.id, change: 'fails' });
  }
  return { hit, id: c.id, retired: Boolean(c.retired && c.why === 'fails' && c.retiredAt === now) };
}

// Does a description cover a kind?
const covers = (concepts, all, key) => {
  const cues = cuesOfKey(concepts, key);
  return all.every((c) => cues.includes(c));
};

// The traits of the wrongly covered kinds that none of the backing kinds has;
// the kind itself when no trait sets it apart (induce.js, exceptionsFor).
function exceptionsFor(concepts, wrong, cases) {
  const theirs = new Set(cases.flatMap((k) => cuesOfKey(concepts, k)));
  const left = [...wrong];
  const out = [];
  while (left.length) {
    const count = {};
    for (const k of left) for (const c of cuesOfKey(concepts, k)) if (!theirs.has(c)) count[c] = (count[c] ?? 0) + 1;
    const best = Object.keys(count).sort((a, b) => count[b] - count[a] || byDimension(a, b))[0];
    if (!best) { out.push(left.shift()); continue; }
    out.push(best);
    for (let i = left.length - 1; i >= 0; i--) if (cuesOfKey(concepts, left[i]).includes(best)) left.splice(i, 1);
  }
  return out.sort(byDimension);
}

// Agglomerative, from the specific to the general (induce.js, generalize):
// merge the two groups whose shared description stays the most specific,
// never covering more of the other kinds than of its own.
function generalize(concepts, cases, others) {
  const describe = (all, members) => {
    const wrong = others.filter((k) => covers(concepts, all, k));
    if (wrong.length >= members.length) return null;
    return { all, members, con: wrong.length, except: exceptionsFor(concepts, wrong, members) };
  };
  let groups = cases.map((k) => ({ all: cuesOfKey(concepts, k).sort(byDimension), members: [k], con: 0, except: [] }));
  for (;;) {
    let best = null;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const all = groups[i].all.filter((c) => groups[j].all.includes(c));
        if (!all.length) continue;
        const merged = describe(all, [...groups[i].members, ...groups[j].members].sort());
        if (!merged) continue;
        const s = all.length * 100 - merged.con * 10 + merged.members.length;
        if (!best || s > best.s) best = { i, j, merged, s };
      }
    }
    if (!best) break;
    groups = groups.filter((_, k) => k !== best.i && k !== best.j);
    groups.push(best.merged);
  }
  return groups.filter((g) => g.members.length >= CONCEPT.minKinds);
}

// Groups the settled kinds into concepts. What already exists keeps its
// record; a concept the evidence no longer describes is retired as revised.
export function form(concepts, world, now) {
  const byAff = {};
  for (const [key, kind] of Object.entries(concepts.kinds)) {
    const a = settled(kind);
    if (a) (byAff[a] ??= []).push(key);
  }
  const fresh = [];
  for (const [aff, cases] of Object.entries(byAff)) {
    const others = Object.entries(byAff).filter(([a]) => a !== aff).flatMap(([, ks]) => ks);
    for (const g of generalize(concepts, cases.sort(), others)) {
      const c = { aff, ...g };
      if (!concepts.blocked.includes(descOf(c))) fresh.push(c);
    }
  }
  const formed = [];
  const retired = [];
  const live = concepts.list.filter((c) => !c.retired);
  for (const c of fresh) {
    const old = live.find((x) => descOf(x) === descOf(c));
    if (old) { Object.assign(old, { members: c.members, con: c.con, except: c.except }); continue; }
    concepts.seq += 1;
    const made = { id: `c${concepts.seq}`, ...c, hits: 0, misses: 0, formedAt: Math.round(now * 10) / 10 };
    concepts.list.push(made);
    formed.push(made);
    record(world, 'concept', { id: made.id, change: 'formed', aff: made.aff, all: made.all });
  }
  for (const c of live) {
    if (fresh.some((x) => descOf(x) === descOf(c))) continue;
    c.retired = true;
    c.retiredAt = now;
    c.why = 'revised';
    retired.push(c);
    record(world, 'concept', { id: c.id, change: 'revised' });
  }
  return { formed, retired };
}

// Live concepts, for whoever shows them (HUD, API).
export const liveConcepts = (concepts) => concepts?.list.filter((c) => !c.retired) ?? [];
