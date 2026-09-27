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

// What a rule is about: a species key ('nectar') or a trait ('smell:sour').
// The two never collide: only traits carry a colon.
export const subjectOf = (r) => r.when.key ?? r.when.cue;

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
export function verdict(fagi, scope, key, { deliberate = false } = {}) {
  const rules = fagi.brain.rules;
  const tasted = (fagi.brain.facts[key]?.tries ?? 0) > 0;
  const traits = CUES.enabled && !tasted ? cuesOf(key) : [];
  let result = null;
  for (const r of liveRules(rules)) {
    try {
      const about = r.when.cue ? traits.includes(r.when.cue) : r.when.key === key;
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
