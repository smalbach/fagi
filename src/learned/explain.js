// Why: what Fagi thinks of a fruit, and the experiences that made her think so.
//
// Every opinion she has about a fruit comes from somewhere she can point at:
//   - one she has tasted: her own bites of it;
//   - one she has never tasted: the rules and trait weights it falls under,
//     and behind them, the bites of other fruit that share its traits.
// This module reads those back. It decides nothing: it asks the same
// questions the decision does (rules.verdict, cues.predict) and adds the bites
// that answer them.
//
// It also asks one counterfactual: which single trait, if the fruit did not
// have it, would change her mind. Re-asking without that trait is enough:
// that is the trait her caution hangs on.
//
// The result is data (keys and numbers), never sentences, like the narrator's
// lines: whoever shows it translates it (lines() below does, with i18n keys).

import { CUES, EXPLAIN } from '../config.js';
import { peekWeight } from '../memory.js';
import { cuesOf, predict, wariness } from './cues.js';
import { verdict, traitsMatch } from './rules.js';

// --- the bite log -----------------------------------------------------------

// Every experience with a fruit, in order: what, when, how it felt, and
// whether it was the later reckoning of an earlier bite (episodes.js).
// Bounded: the oldest go first.
//
// `saw`: the id of the sister she watched eat it, when it was not her bite.
export function logBite(brain, key, reward, now, late, saw = null) {
  if (!cuesOf(key).length) return;
  const log = brain.bites ?? (brain.bites = []);
  log.push({
    key, at: Math.round(now * 10) / 10, reward: Math.round(reward * 1000) / 1000,
    ...(late ? { late: true } : {}), ...(saw != null ? { saw } : {}),
  });
  if (log.length > EXPLAIN.log) log.splice(0, log.length - EXPLAIN.log);
}

// How each kind she tasted went, from the log: bites, and whether on the
// whole it did her harm or good.
function kindsFromLog(brain) {
  const kinds = {};
  for (const b of brain.bites ?? []) {
    if (b.saw != null) continue;   // what she tasted herself
    const k = kinds[b.key] ?? (kinds[b.key] = { bites: 0, sum: 0 });
    if (!b.late) k.bites += 1;   // a later reckoning is not another bite
    k.sum += b.reward;
  }
  return kinds;
}

// What the kinds she tasted with a trait did to her.
export function traitRecord(brain, cue) {
  const kinds = kindsFromLog(brain);
  const out = { cue, kinds: 0, bad: 0, good: 0, bites: 0 };
  for (const [key, k] of Object.entries(kinds)) {
    if (!cuesOf(key).includes(cue)) continue;
    out.kinds += 1;
    out.bites += k.bites;
    if (k.sum < 0) out.bad += 1;
    else if (k.sum > 0) out.good += 1;
  }
  return out;
}

// --- what she thinks --------------------------------------------------------

// Her stance on eating `key`, if it had these `traits`:
//   avoid    a rule forbids it;
//   dislikes tasted, and it did her more harm than good;
//   likes    tasted, and it did her good;
//   wary     never tasted, but it looks like what harmed her: no curiosity left;
//   tempted  never tasted, and it looks like what did her good;
//   curious  never tasted, and nothing she knows says much about it.
function stanceOf(fagi, key, traits) {
  const brain = fagi.brain;
  const tasted = (brain.facts[key]?.tries ?? 0) > 0;
  if (verdict(fagi, 'eat', key, { traits }) === 'avoid') return 'avoid';
  if (tasted) {
    const w = peekWeight(brain, key);
    return w > 0 ? 'likes' : w < 0 ? 'dislikes' : 'curious';
  }
  if (!CUES.enabled) return 'curious';
  const guess = predict(brain.cues, traits);
  if (wariness(guess) >= EXPLAIN.wary) return 'wary';
  if (guess.value * guess.confidence >= EXPLAIN.tempted) return 'tempted';
  return 'curious';
}

const CAUTIOUS = new Set(['avoid', 'wary']);

// Just the stance, cheap enough to ask every frame (the narrator does, to
// notice when her opinion of something she sees changes).
export function stance(fagi, key) {
  return stanceOf(fagi, key, cuesOf(key));
}

// The live rules that forbid (or recommend) eating it, most backed first.
function rulesAbout(fagi, key, traits, tasted) {
  const rules = fagi.brain.rules;
  return rules.list
    .filter((r) => !r.retired && !rules.quarantined.has(r.id) && r.on.includes('eat'))
    .filter((r) => (r.when.key ? r.when.key === key : !tasted && traitsMatch(r, key, traits)))
    .sort((a, b) => (a.verdict === 'avoid' ? -1 : 1) - (b.verdict === 'avoid' ? -1 : 1) || (b.pro ?? 0) - (a.pro ?? 0));
}

// The trait that weighs most on her guess: the most negative if she is
// cautious, the most positive otherwise. Only one she has actually met.
function keyTrait(fagi, traits, cautious) {
  const met = traits.filter((c) => fagi.brain.cues?.[c]?.n > 0);
  if (!met.length) return null;
  const w = (c) => fagi.brain.cues[c].w;
  return met.sort((a, b) => (cautious ? w(a) - w(b) : w(b) - w(a)))[0];
}

// The bites behind it: of this fruit if she tasted it; else of the species a
// rule was induced from, or of the kinds that share the trait that weighs most.
//
// Bites that agree with her stance go first (the ones that made her sick, if
// she is cautious); the others only if there are no such bites, so the
// evidence quoted never argues against what she concluded.
function backingBites(fagi, key, tasted, rule, cue, stance) {
  let about;
  if (tasted) about = (k) => k === key;
  else if (rule?.cases) about = (k) => rule.cases.includes(k);
  else if (rule?.when.all) about = (k) => rule.when.all.every((c) => cuesOf(k).includes(c));
  else if (cue) about = (k) => cuesOf(k).includes(cue);
  else return [];
  const relevant = (fagi.brain.bites ?? []).filter((b) => about(b.key));
  const sign = CAUTIOUS.has(stance) || stance === 'dislikes' ? -1 : 1;
  const agreeing = relevant.filter((b) => sign * b.reward > 0);
  const bites = agreeing.length ? agreeing : relevant;
  // The latest bite of each kind, newest first: several kinds say more than
  // several bites of the same one.
  const seen = new Set();
  const out = [];
  for (let i = bites.length - 1; i >= 0 && out.length < EXPLAIN.examples; i--) {
    const b = bites[i];
    if (seen.has(b.key)) continue;
    seen.add(b.key);
    out.push(b);
  }
  return out;
}

// Which single trait, taken away, would change her mind; null if none would.
function counterfactual(fagi, key, traits, stance) {
  if (!CAUTIOUS.has(stance)) return null;
  // The traits that count against it most go first: the answer should name the
  // one her caution really hangs on.
  const w = (c) => fagi.brain.cues?.[c]?.w ?? 0;
  for (const cue of [...traits].sort((a, b) => w(a) - w(b))) {
    const other = stanceOf(fagi, key, traits.filter((c) => c !== cue));
    if (!CAUTIOUS.has(other)) return { without: cue, stance: other };
  }
  return { without: null, stance };
}

// Everything she can say about eating `key`.
export function explain(fagi, key) {
  const brain = fagi.brain;
  const tasted = (brain.facts[key]?.tries ?? 0) > 0;
  const traits = cuesOf(key);
  const stance = stanceOf(fagi, key, traits);
  const [rule] = rulesAbout(fagi, key, traits, tasted);
  const cue = tasted ? null : keyTrait(fagi, traits, CAUTIOUS.has(stance));
  return {
    key,
    tasted,
    stance,
    tries: brain.facts[key]?.tries ?? 0,
    rule: rule ? {
      id: rule.id, verdict: rule.verdict, pro: rule.pro ?? null, con: rule.con ?? null, except: rule.except ?? [],
      source: rule.source ?? null,
    } : null,
    trait: cue ? traitRecord(brain, cue) : null,
    bites: backingBites(fagi, key, tasted, rule, cue, stance),
    counterfactual: tasted ? null : counterfactual(fagi, key, traits, stance),
  };
}

// --- in words ---------------------------------------------------------------

const what = (k) => ({ key: `type.${k}` });

// The explanation as translatable lines ({ key, params }), in the order a
// person would say them: what she thinks, why, what it rests on, what would
// change her mind.
export function lines(ex) {
  const out = [{ key: `why.stance.${ex.stance}` }];
  out.push(ex.tasted ? { key: 'why.tried', params: { n: ex.tries } } : { key: 'why.never' });
  if (ex.rule) {
    out.push(ex.rule.pro != null
      ? { key: 'why.ruleInduced', params: { id: ex.rule.id, pro: ex.rule.pro, con: ex.rule.con } }
      : { key: 'why.rule', params: { id: ex.rule.id } });
    // Not lived: who it came from, and how much she trusts it.
    const src = ex.rule.source;
    if (src) out.push({ key: `why.${src.kind}`, params: { from: src.from, trust: Math.round(src.trust * 100) } });
    const [first, ...others] = ex.rule.except;
    if (first) out.push({ key: 'why.except', params: { what: what(first), more: others.length ? ` (+${others.length})` : '' } });
  }
  if (ex.trait?.kinds) {
    const bad = ex.trait.bad >= ex.trait.good;
    out.push({ key: bad ? 'why.traitBad' : 'why.traitGood', params: {
      trait: what(ex.trait.cue), n: bad ? ex.trait.bad : ex.trait.good, kinds: ex.trait.kinds, bites: ex.trait.bites,
    } });
  } else if (!ex.tasted && !ex.rule) {
    out.push({ key: 'why.nothingLikeIt' });
  }
  for (const b of ex.bites) {
    const felt = b.late ? 'late' : b.reward < 0 ? 'bad' : 'good';
    out.push(b.saw != null
      ? { key: `why.bite.saw.${b.reward < 0 ? 'bad' : 'good'}`, params: { what: what(b.key), from: b.saw, at: { dur: b.at } } }
      : { key: `why.bite.${felt}`, params: { what: what(b.key), at: { dur: b.at } } });
  }
  const cf = ex.counterfactual;
  if (cf) {
    out.push(cf.without
      ? { key: `why.if.${cf.stance === 'tempted' ? 'tempted' : 'curious'}`, params: { trait: what(cf.without) } }
      : { key: 'why.ifNone' });
  }
  return out;
}
