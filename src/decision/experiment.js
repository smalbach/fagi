// Last tier, before exploring: an experiment from last night's questions
// (experiment.js). Only with nothing pressing, nothing on her back and
// strength to spare; and never a fruit whose traits already make her wary.

import { ENERGY, EXPERIMENT, SCIENCE } from '../config.js';
import { wariness } from '../learned/cues.js';
import { labelOf } from '../i18n.js';
import { habit } from '../habits.js';
import { onAgenda } from '../experiment.js';
import { smellOnly } from '../percept.js';
import { reasonOf, pressing } from './common.js';

// What a question in sight is worth to her now: the nearer the better and,
// with the scientific night ordering by learning progress (SCIENCE 'lp'),
// what she expects to learn from it times how safe it looks, halved by every
// SCIENCE.reach px of walking. Otherwise only nearness counts, as always.
function worth(fagi, c) {
  if (!SCIENCE.enabled || SCIENCE.order !== 'lp') return -c.dist;
  const w = fagi.hypotheses?.[c.key]?.worth ?? 0;
  return w / (1 + c.dist / SCIENCE.reach);
}

export function taste(fagi, world, ctx) {
  if (!EXPERIMENT.enabled || !fagi.agenda?.length) return null;
  if (pressing(ctx) || fagi.carrying || fagi.energy <= Math.max(habit(fagi, 'restAt'), ENERGY.tired)) return null;
  let best = null;
  for (const c of ctx.ranked) {
    // A question is about a fruit she can tell by sight, not by a smell (percept.js).
    if (c.kind !== 'food' || !c.ref || smellOnly(c) || !onAgenda(fagi, c.key)) continue;
    if (c.guess && wariness(c.guess) >= EXPERIMENT.maxWary) continue;
    if (!best || worth(fagi, c) > worth(fagi, best)) best = c;
  }
  if (!best) return null;
  return {
    action: 'taste',
    reason: reasonOf('reason.taste', { what: labelOf(best.key), left: fagi.agenda.length }),
    target: best.ref,
    targetKind: 'food',
    trailKey: null,
  };
}
