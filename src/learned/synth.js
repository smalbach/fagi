// The learner: turns how much a belief weighs into a line of code.
//
// It invents nothing memory.js doesn't already know: it looks at `weight(brain, key)` after
// each `learn()` and decides whether a rule needs to be written, revised or
// retired. The entry and exit thresholds differ (hysteresis) so that
// a belief hovering at the limit doesn't switch the rule on and off every frame.

import { LEARN, POINT_TYPES, CUES, MEMORY } from '../config.js';
import { weight } from '../memory.js';
import { activeRule, retireRule, upsertRule } from './rules.js';
import { induce } from './induce.js';

export const SCOPE = { avoid: ['eat', 'store', 'pursue'], prefer: ['eat', 'store'] };
// What isn't eaten (deep water, rain, the pressure drop, water,
// puddles) is only pursued or avoided: a rule about it says nothing about eating.
const scope = (key, verdict) => (POINT_TYPES[key] ? SCOPE[verdict] : ['pursue']);
const PREFIX = { avoid: 'avoid', prefer: 'prefer' };
const OPPOSITE = { avoid: 'prefer', prefer: 'avoid' };

// A rule is about a species ({ key }) or about traits ({ all: ['smell:sour'] }).
// Traits say nothing about a species she has already tasted: that one has its
// own belief (rules.js, verdict).
const traitsId = (all) => all.map((c) => c.replace(':', '-')).join('-');

function newRule(now, key, verdict, w, because, cue = null) {
  return {
    id: `${PREFIX[verdict]}-${cue ? traitsId([cue]) : key}`,
    on: cue ? SCOPE.avoid : scope(key, verdict),
    when: cue ? { all: [cue] } : { key },
    verdict,
    weight: Number(w.toFixed(3)),
    because,
    learnedAt: now,
    tries: 1,
    stage: 'short',
  };
}

// Where what she is learning right now comes from: null when she lived it,
// or { kind: 'saw', from, at, trust } while she learns from watching a sister
// (social.js sets it around learnSeen). A rule she lived never becomes one she
// only saw; one she was told becomes hers the moment she lives it.
function sourceFor(brain, existing) {
  const seen = brain.learningFrom ?? null;
  if (!seen) return null;
  return existing && !existing.source ? null : seen;
}

function withSource(r, source) {
  const { source: _old, ...rest } = r;
  return source ? { ...rest, source } : rest;
}

function markRule(brain, id, kind, key, verdict, because) {
  brain.lastRule = { n: (brain.lastRule?.n ?? 0) + 1, id, kind, key, verdict, because };
}

function because0(sensations) {
  return sensations && sensations.length ? sensations : [{ sense: 'contradiction', v: 0 }];
}

// Forgetting also changes how much a belief weighs: confidence drops on its own
// (memory.decayMemory) and the weight with it. Without this, the `weight` and `stage`
// written in each rule stayed at those of the last learning about that
// key, up to 0.3 above the real weight after an hour.
//
// It only refreshes what the rule SAYS about the belief; it doesn't retire it. A
// rule gets retired by learning the opposite (synthAfterLearn): what
// drops over time is confidence, not what was learned, and MEMORY.floor keeps
// the residue. A big scare (deep water) leaves its rule forever, on purpose.
export function refreshRules(brain) {
  for (const r of brain.rules.list) {
    if (r.retired) continue;
    // What a sister told her rests on what the sister lived: she has nothing
    // of her own to weigh it with.
    if (r.source?.kind === 'told' || r.source?.kind === 'born') continue;
    if (r.cases) {
      const w = r.cases.reduce((sum, k) => sum + (brain.facts[k] ? weight(brain, k) : 0), 0) / r.cases.length;
      r.weight = Number(w.toFixed(3));
      continue;
    }
    if (r.when.all) {
      const e = brain.cues?.[r.when.all[0]];
      if (e) r.weight = Number(cueWeight(e).toFixed(3));
      continue;
    }
    const fact = brain.facts[r.when.key];
    if (!fact) continue;
    r.weight = Number(weight(brain, r.when.key).toFixed(3));
    r.stage = fact.stage;
    r.tries = fact.tries;
  }
}

// Called from brain.js, after EVERY learn() (bite, delayed correction,
// death): that way no learning path forgets to write
// code. `change` is what reinforce() returned: {before, after, kind}.
export function synthAfterLearn(brain, key, change, sensations, now) {
  const tries = brain.facts[key]?.tries ?? change.after.tries ?? 1;
  synth(brain, key, weight(brain, key), change.after.stage, tries, sensations, now);
}

// What a trait weighs toward a rule: its weight, trusted by how many times she
// has met it. One bad fruit blames all its traits alike, so a single experience
// is never enough to write a rule about a trait.
function cueWeight(e) {
  return e.n < CUES.ruleEvidence ? 0 : e.w;
}

const cueStage = (n) => (n >= MEMORY.toLong ? 'long' : n >= MEMORY.toMedium ? 'medium' : 'short');

// After learnCues: the same hysteresis as for a species, trait by trait.
export function synthCues(brain, cues, sensations, now) {
  for (const cue of cues) {
    const e = brain.cues[cue];
    if (!e) continue;
    synth(brain, cue, cueWeight(e), cueStage(e.n), e.n, sensations, now, cue);
  }
}

const sameList = (a = [], b = []) => a.length === b.length && a.every((x, i) => x === b[i]);

// After learning about a fruit (`key`): rewrites the trait rules from what
// induce.js finds now. A description that holds on is revised in place; one
// that changed (a trait dropped, another species joined) is a new rule that
// says which one it grew out of (`from`), and the old one is retired. That is
// how a rule can be seen growing more general, or picking up exceptions.
export function synthInduced(brain, key, sensations, now) {
  const rules = brain.rules;
  const found = induce(brain).map((d) => ({ ...d, id: `${PREFIX[d.verdict]}-${traitsId(d.all)}` }));
  const foundIds = new Set(found.map((d) => d.id));
  // Only its own rules (they carry `cases`): one-trait rules from synthCues
  // may live next to them.
  // Rules a sister told her are not hers to rewrite until she lives them.
  const current = rules.list.filter((r) => !r.retired && r.cases && !r.source && !rules.quarantined.has(r.id));
  const because = because0(sensations);

  for (const d of found) {
    const existing = current.find((r) => r.id === d.id);
    if (existing && sameList(existing.cases, d.cases) && sameList(existing.except, d.except)) continue;
    const tries = d.cases.reduce((sum, k) => sum + (brain.facts[k]?.tries ?? 0), 0);
    const parent = existing ? null : current.find((r) => r.verdict === d.verdict && !foundIds.has(r.id)
      && (r.cases ?? []).some((k) => d.cases.includes(k)));
    const r = upsertRule(rules, {
      id: d.id,
      on: SCOPE[d.verdict],
      when: { all: d.all },
      ...(d.except.length ? { except: d.except } : {}),
      verdict: d.verdict,
      weight: Number(d.weight.toFixed(3)),
      pro: d.pro,
      con: d.con,
      cases: d.cases,
      because,
      learnedAt: existing?.learnedAt ?? now,
      ...(existing ? { revisedAt: now } : {}),
      ...(existing?.from ?? parent?.id ? { from: existing?.from ?? parent.id } : {}),
      tries,
      stage: cueStage(tries),
    });
    markRule(brain, r.id, existing ? 'revised' : parent ? 'refined' : 'new', key, d.verdict, because);
  }
  for (const r of current) {
    if (foundIds.has(r.id)) continue;
    retireRule(rules, r, now);
    // A rule that grew into another is not news: its successor already is.
    if (!found.some((d) => d.verdict === r.verdict && (r.cases ?? []).some((k) => d.cases.includes(k)))) {
      markRule(brain, r.id, 'retired', key, r.verdict, because);
    }
  }
}

function synth(brain, subject, w, stage, tries, sensations, now, cue = null) {
  const rules = brain.rules;
  const key = subject;

  for (const verdict of ['avoid', 'prefer']) {
    const enters = verdict === 'avoid' ? LEARN.avoidFrom : LEARN.preferFrom;
    const exits = verdict === 'avoid' ? LEARN.avoidUntil : LEARN.preferUntil;
    const sign = verdict === 'avoid' ? -1 : 1;
    const existing = activeRule(rules, key, verdict);
    // An induced rule about the same trait is backed by whole species: it
    // owns that subject, and the trait's own weight does not touch it.
    if (cue && existing?.cases) continue;
    // Nor does a trait she has barely met overturn what a sister told her.
    if (cue && existing?.source && (brain.cues[cue]?.n ?? 0) < CUES.ruleEvidence) continue;

    if (sign * w >= enters) {
      // Retire the opposite one if there is one: she can't avoid and prefer the same thing.
      const opposite = activeRule(rules, key, OPPOSITE[verdict]);
      if (opposite) {
        retireRule(rules, opposite, now);
        markRule(brain, opposite.id, 'retired', key, opposite.verdict, because0(sensations));
      }

      if (!existing) {
        const r = upsertRule(rules, withSource(
          { ...newRule(now, key, verdict, w, sensations, cue), ...(cue ? { tries, stage } : {}) }, sourceFor(brain, null)));
        markRule(brain, r.id, 'new', key, verdict, sensations);
      } else {
        const r = upsertRule(rules, withSource({
          ...existing, weight: Number(w.toFixed(3)), because: sensations,
          revisedAt: now, tries, stage,
        }, sourceFor(brain, existing)));
        markRule(brain, r.id, 'revised', key, verdict, sensations);
      }
    } else if (existing && sign * w <= exits) {
      retireRule(rules, existing, now);
      markRule(brain, existing.id, 'retired', key, verdict, sensations);
    }
  }
}
