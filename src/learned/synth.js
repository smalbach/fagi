// The learner: turns how much a belief weighs into a line of code.
//
// It invents nothing memory.js doesn't already know: it looks at `weight(brain, key)` after
// each `learn()` and decides whether a rule needs to be written, revised or
// retired. The entry and exit thresholds differ (hysteresis) so that
// a belief hovering at the limit doesn't switch the rule on and off every frame.

import { LEARN, POINT_TYPES, CUES, MEMORY } from '../config.js';
import { weight } from '../memory.js';
import { activeRule, retireRule, upsertRule } from './rules.js';

const SCOPE = { avoid: ['eat', 'store', 'pursue'], prefer: ['eat', 'store'] };
// What isn't eaten (deep water, rain, the pressure drop, water,
// puddles) is only pursued or avoided: a rule about it says nothing about eating.
const scope = (key, verdict) => (POINT_TYPES[key] ? SCOPE[verdict] : ['pursue']);
const PREFIX = { avoid: 'avoid', prefer: 'prefer' };
const OPPOSITE = { avoid: 'prefer', prefer: 'avoid' };

// A rule is about a species ({ key }) or about a trait ({ cue: 'smell:sour' }).
// A trait says nothing about a species she has already tasted: that one has its
// own belief (rules.js, verdict).
const cueId = (cue) => cue.replace(':', '-');

function newRule(now, key, verdict, w, because, cue = null) {
  return {
    id: `${PREFIX[verdict]}-${cue ? cueId(cue) : key}`,
    on: cue ? SCOPE.avoid : scope(key, verdict),
    when: cue ? { cue } : { key },
    verdict,
    weight: Number(w.toFixed(3)),
    because,
    learnedAt: now,
    tries: 1,
    stage: 'short',
  };
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
    if (r.when.cue) {
      const e = brain.cues?.[r.when.cue];
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

function synth(brain, subject, w, stage, tries, sensations, now, cue = null) {
  const rules = brain.rules;
  const key = subject;

  for (const verdict of ['avoid', 'prefer']) {
    const enters = verdict === 'avoid' ? LEARN.avoidFrom : LEARN.preferFrom;
    const exits = verdict === 'avoid' ? LEARN.avoidUntil : LEARN.preferUntil;
    const sign = verdict === 'avoid' ? -1 : 1;
    const existing = activeRule(rules, key, verdict);

    if (sign * w >= enters) {
      // Retire the opposite one if there is one: she can't avoid and prefer the same thing.
      const opposite = activeRule(rules, key, OPPOSITE[verdict]);
      if (opposite) {
        retireRule(rules, opposite, now);
        markRule(brain, opposite.id, 'retired', key, opposite.verdict, because0(sensations));
      }

      if (!existing) {
        const r = upsertRule(rules, { ...newRule(now, key, verdict, w, sensations, cue), ...(cue ? { tries, stage } : {}) });
        markRule(brain, r.id, 'new', key, verdict, sensations);
      } else {
        const r = upsertRule(rules, {
          ...existing, weight: Number(w.toFixed(3)), because: sensations,
          revisedAt: now, tries, stage,
        });
        markRule(brain, r.id, 'revised', key, verdict, sensations);
      }
    } else if (existing && sign * w <= exits) {
      retireRule(rules, existing, now);
      markRule(brain, existing.id, 'retired', key, verdict, sensations);
    }
  }
}
