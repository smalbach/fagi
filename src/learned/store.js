// Persistence of what was learned: beliefs, rules, what each thing made her
// feel (concept→sensation synapses) and how long a puddle lasts. Never the rest
// of Fagi's state (position, hunger, what she's carrying...), nor anything
// that belongs to a specific map (remembered places, what's been explored).
//
// Autosave and the exported module carry exactly the same thing. It lives only in the
// player's browser: localStorage to keep a recoverable copy
// between games, and export/import of the code module to take it to
// another session.
//
// She's born knowing nothing (memory.js, brain.js): none of this loads by itself. It's
// an explicit action, "Recover what was learned", never automatic at birth.

import { modernize } from '../legacy.js';
import { LEARN } from '../config.js';
import { renderModule, parseModule } from './dsl.js';

const KEY = 'fagi.learning';

// A snapshot of what was learned, ready to save or export.
// The connections left by learning from consequences (concept→sensation),
// rounded: the perception ones (Hebb) rebuild themselves on seeing again.
function learnedSynapses(fagi) {
  const outside = {};
  for (const [id, s] of Object.entries(fagi.brain.synapses ?? {})) {
    if (s.kind !== 'feel') continue;
    outside[id] = { a: s.a, b: s.b, kind: 'feel', w: Math.round(s.w * 1000) / 1000, n: s.n ?? 0 };
  }
  return outside;
}

export function snapshot(fagi) {
  return {
    version: 1,
    savedAt: Date.now(),
    age: fagi.age,
    facts: fagi.brain.facts,
    rules: fagi.brain.rules.list,
    // Only the connections learned from consequences: the perception ones
    // rebuild themselves as soon as she sees things again.
    synapses: learnedSynapses(fagi),
    // How long she thinks a puddle lasts: it doesn't depend on the map, it holds for the next one.
    puddleLife: fagi.brain.puddleLife ?? null,
  };
}

export function save(snap, storage = safeStorage()) {
  if (!storage) return false;
  try { storage.setItem(KEY, JSON.stringify(snap)); return true; }
  catch { return false; }
}

export function load(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const rawValue = storage.getItem(KEY);
    if (!rawValue) return null;
    const data = JSON.parse(rawValue);
    if (!data || typeof data !== 'object' || !data.facts) return null;
    return data;
  } catch { return null; }
}

export function hasSnapshot(storage = safeStorage()) {
  return Boolean(load(storage));
}

// Replaces what Fagi believes and the rules she has written with those from the
// snapshot. It touches nothing else: not position, not needs, not what she's
// carrying. Spaced confirmations are reset (lastAt: -Infinity) so that
// the first confirmation in the new game doesn't count as "back-to-back".
export function restore(fagi, saved) {
  const snap = modernize(saved);
  const facts = {};
  for (const [k, r] of Object.entries(snap.facts ?? {})) facts[k] = { ...r, lastAt: -Infinity };
  fagi.brain.facts = facts;
  fagi.brain.rules.list = (snap.rules ?? []).map((r) => ({ ...r }));
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
  fagi.brain.synapses = {};
  for (const [id, s] of Object.entries(snap.synapses ?? {})) fagi.brain.synapses[id] = { ...s, born: 0, last: 0 };
  fagi.brain.puddleLife = snap.puddleLife ?? null;
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
}

export function exportText(fagi) {
  return renderModule(fagi.brain.rules.list, fagi.brain.facts, {
    age: fagi.age, puddleLife: fagi.brain.puddleLife, synapses: learnedSynapses(fagi),
  });
}

// Reads an imported file and, if valid, replaces what was learned. Throws with
// a readable reason if it isn't; in that case it doesn't touch Fagi's memory.
export function importText(fagi, text) {
  const { rules, facts, puddleLife, synapses } = parseModule(text);
  restore(fagi, { facts, rules, puddleLife, synapses });
}

export function wipe(fagi, storage = safeStorage()) {
  fagi.brain.facts = {};
  fagi.brain.synapses = {};
  fagi.brain.puddleLife = null;
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
  fagi.brain.rules.list = [];
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
  fagi.brain.lastRule = null;
  if (storage) { try { storage.removeItem(KEY); } catch { /* nothing to delete */ } }
}

function safeStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}

// Saves only every so often: every LEARN.autosaveEvery simulated seconds, and
// also when something important asks for it (dying, closing the tab). `fagi`
// carries her own counter (fagi.saveIn), not a module-global one: that way each
// Fagi is independent and tests don't inherit a countdown from another test.
export function autoSave(fagi, dt, storage = safeStorage()) {
  if (!LEARN.autosave) return;
  fagi.saveIn = (fagi.saveIn ?? LEARN.autosaveEvery) - dt;
  if (fagi.saveIn > 0) return;
  fagi.saveIn = LEARN.autosaveEvery;
  save(snapshot(fagi), storage);
}
