// The set of rules Fagi carries written in her head. It lives in
// `fagi.brain.rules`, next to the beliefs from `memory.js` they come from.
//
// NOTHING about content is decided here: `synth.js` does that, looking at how much
// each belief weighs. This file only stores the list, queries it
// (`verdict`) and keeps it healthy: a rule that throws an error when evaluated is
// quarantined and stops counting, so that one rule's failure never
// brings down the frame.

import { BRAIN, LEARN, CUES } from '../config.js';
import { curious } from '../memory.js';
import { cuesOf } from './cues.js';

export function createRules() {
  return { list: [], seq: 0, quarantined: new Set() };
}

function liveRules(rules) {
  return rules.list.filter((r) => !r.retired && !rules.quarantined.has(r.id));
}

// What a rule is about: a species key ('nectar') or a set of traits
// ('shape:drop+smell:sour'). The two never collide: only traits carry a colon.
export const subjectOf = (r) => r.when.key ?? r.when.all.join('+');

// Does a rule about traits hold for this fruit? It has all the traits and none
// of the exceptions.
export function traitsMatch(r, key, traits) {
  return r.when.all.every((c) => traits.includes(c))
    && !(r.except ?? []).some((e) => e === key || traits.includes(e));
}

export function activeRule(rules, subject, verdict) {
  return liveRules(rules).find((r) => subjectOf(r) === subject && r.verdict === verdict) ?? null;
}

export function retiredRule(rules, subject, verdict) {
  return rules.list.find((r) => r.retired && subjectOf(r) === subject && r.verdict === verdict) ?? null;
}

export function upsertRule(rules, r) {
  const i = rules.list.findIndex((x) => x.id === r.id);
  if (i === -1) rules.list.push(r); else rules.list[i] = r;
  rules.quarantined.delete(r.id);
  rules.seq += 1;
  return r;
}

export function retireRule(rules, r, age) {
  if (!r || r.retired) return r;
  const retiredOne = { ...r, retired: true, retiredAt: age };
  upsertRule(rules, retiredOne);
  // Bounded history: the oldest retired rules are dropped, never the active ones.
  const retiredList = rules.list.filter((x) => x.retired).sort((a, b) => a.retiredAt - b.retiredAt);
  const extra = retiredList.length - LEARN.maxRetired;
  if (extra > 0) {
    const outside = new Set(retiredList.slice(0, extra).map((x) => x.id));
    rules.list = rules.list.filter((x) => !outside.has(x.id));
  }
  return retiredOne;
}

export function quarantine(rules, id) {
  rules.quarantined.add(id);
  rules.seq += 1;
}

// What do the learned rules say about using `key` for `scope`? 'avoid',
// 'prefer' or null if none has an opinion. Each rule is evaluated in
// isolation: one that throws is quarantined and doesn't count again until
// it's rewritten.
//
// What she has tasted is judged by its own rules. Only a species she has never
// tasted is judged by its traits: a rule about sour things is a guess, and her
// own experience with a fruit always outweighs a guess.
//
// `traits` asks "what if it had these traits instead?" (explain.js, the
// counterfactual); by default, the ones it has.
// `blind`: she perceives only `traits` (by smell alone, percept.js): rules about
// the one species she cannot tell it is, and its exceptions, do not apply.
export function verdict(fagi, scope, key, { deliberate = false, traits: asIf = null, blind = false } = {}) {
  const rules = fagi.brain.rules;
  const tasted = !blind && (fagi.brain.facts[key]?.tries ?? 0) > 0;
  const traits = CUES.enabled && !tasted ? asIf ?? cuesOf(key) : [];
  let result = null;
  for (const r of liveRules(rules)) {
    try {
      const about = r.when.all ? traitsMatch(r, blind ? null : key, traits) : !blind && r.when.key === key;
      if (r.on.includes(scope) && about) {
        if (r.verdict === 'avoid') result = 'avoid';
        else if (r.verdict === 'prefer' && result === null) result = 'prefer';
      }
    } catch {
      quarantine(rules, r.id);
    }
  }
  // Curiosity is instinct, not a rule: deliberately trying something she
  // believes is bad is still allowed as long as curiosity isn't used up.
  if (result === 'avoid' && scope === 'eat' && deliberate && curious(fagi.brain, key, BRAIN.curiosityTries)) {
    return null;
  }
  return result;
}

// The rule behind her verdict on `key` (what verdict() would say without
// curiosity): the first 'avoid' that holds, else the first 'prefer'; null if
// none does. What a sister passes on as a conclusion (social.js).
export function decidingRule(fagi, scope, key) {
  const tasted = (fagi.brain.facts[key]?.tries ?? 0) > 0;
  const traits = CUES.enabled && !tasted ? cuesOf(key) : [];
  let prefer = null;
  for (const r of liveRules(fagi.brain.rules)) {
    const about = r.when.all ? traitsMatch(r, key, traits) : r.when.key === key;
    if (!r.on.includes(scope) || !about) continue;
    if (r.verdict === 'avoid') return r;
    if (r.verdict === 'prefer' && !prefer) prefer = r;
  }
  return prefer;
}

// How much of a stock she would actually eat: what she has learned to avoid is
// there, but it feeds nobody. A pantry full of poison is not a full pantry.
export function edibleCount(fagi, stock) {
  let n = 0;
  for (const [type, amount] of Object.entries(stock ?? {})) {
    if (amount > 0 && verdict(fagi, 'eat', type) !== 'avoid') n += amount;
  }
  return n;
}
