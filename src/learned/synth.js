// The learner: turns how much a belief weighs into a line of code.
//
// It invents nothing memory.js doesn't already know: it looks at `weight(brain, key)` after
// each `learn()` and decides whether a rule needs to be written, revised or
// retired. The entry and exit thresholds differ (hysteresis) so that
// a belief hovering at the limit doesn't switch the rule on and off every frame.

import { LEARN, POINT_TYPES } from '../config.js';
import { weight } from '../memory.js';
import { activeRule, retireRule, upsertRule } from './rules.js';

const SCOPE = { avoid: ['eat', 'store', 'pursue'], prefer: ['eat', 'store'] };
// What isn't eaten (deep water, rain, the pressure drop, water,
// puddles) is only pursued or avoided: a rule about it says nothing about eating.
const scope = (key, verdict) => (POINT_TYPES[key] ? SCOPE[verdict] : ['pursue']);
const PREFIJO = { avoid: 'avoid', prefer: 'prefer' };
const OPPOSITE = { avoid: 'prefer', prefer: 'avoid' };

function newRule(now, key, verdict, w, because) {
  return {
    id: `${PREFIJO[verdict]}-${key}`,
    on: scope(key, verdict),
    when: { key },
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
  const rules = brain.rules;
  const w = weight(brain, key);
  const stage = change.after.stage;
  const tries = brain.facts[key]?.tries ?? change.after.tries ?? 1;

  for (const verdict of ['avoid', 'prefer']) {
    const enters = verdict === 'avoid' ? LEARN.avoidFrom : LEARN.preferFrom;
    const exits = verdict === 'avoid' ? LEARN.avoidUntil : LEARN.preferUntil;
    const signo = verdict === 'avoid' ? -1 : 1;
    const existing = activeRule(rules, key, verdict);

    if (signo * w >= enters) {
      // Retire the opposite one if any: she can't avoid and prefer the same thing.
      const opposite = activeRule(rules, key, OPPOSITE[verdict]);
      if (opposite) {
        retireRule(rules, opposite, now);
        markRule(brain, opposite.id, 'retired', key, opposite.verdict, because0(sensations));
      }

      if (!existing) {
        const r = upsertRule(rules, newRule(now, key, verdict, w, sensations));
        markRule(brain, r.id, 'new', key, verdict, sensations);
      } else {
        const r = upsertRule(rules, {
          ...existing, weight: Number(w.toFixed(3)), because: sensations,
          revisedAt: now, tries, stage,
        });
        markRule(brain, r.id, 'revised', key, verdict, sensations);
      }
    } else if (existing && signo * w <= exits) {
      retireRule(rules, existing, now);
      markRule(brain, existing.id, 'retired', key, verdict, sensations);
    }
  }
}
