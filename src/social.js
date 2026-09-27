// Learning from sisters.
//
// Two ways, both as an ant would:
//   - trophallaxis: sisters who meet in the nest pass each other food (the
//     pantry is already shared) and what they have written down. A rule she is
//     told comes in marked "told" ({ source: { kind: 'told', from, trust } }),
//     never "lived", and weighs less: SOCIAL.trust of what it weighed for the
//     teller. It can be told on again, weaker each time, until it is not worth
//     passing on (SOCIAL.minTrust);
//   - observation: watching a sister eat something and feel it teaches too, at
//     SOCIAL.observe of the strength, without counting as having tasted it
//     (brain.learnSeen).
//
// Nothing checks whether what is told is true. A rule she is told becomes hers
// when she lives it (synth.js drops the mark, or retires it if her own
// experience says otherwise). One nobody verifies can go round the whole
// colony: a myth. batch measures them (scripts/batch/run.js).

import { SOCIAL } from './config.js';
import { nestUnder } from './nest.js';
import { learnSeen } from './brain.js';
import { subjectOf, upsertRule } from './learned/rules.js';
import { viewRangeOf } from './vision.js';

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// How much she trusts one of her rules: fully if she lived it.
export const trustOf = (r) => r.source?.trust ?? 1;

// Everything the giver can tell the receiver now: the ids adopted.
export function tell(giver, receiver, now) {
  const mine = receiver.brain;
  const adopted = [];
  for (const r of giver.brain.rules.list) {
    if (r.retired || giver.brain.rules.quarantined.has(r.id)) continue;
    const trust = trustOf(r) * SOCIAL.trust;
    if (trust < SOCIAL.minTrust) continue;
    const subject = subjectOf(r);
    // She already has an opinion about it, or had one and dropped it.
    if (mine.rules.list.some((x) => subjectOf(x) === subject)) continue;
    // A fruit she has tasted is judged by her own experience.
    if (r.when.key && (mine.facts[r.when.key]?.tries ?? 0) > 0) continue;
    const copy = JSON.parse(JSON.stringify(r));
    delete copy.revisedAt;
    upsertRule(mine.rules, {
      ...copy,
      weight: round(r.weight * SOCIAL.trust, 3),
      learnedAt: round(now),
      source: { kind: 'told', from: giver.id, at: round(now), trust: round(trust, 3) },
    });
    adopted.push(r.id);
  }
  if (adopted.length) {
    mine.lastTold = { n: (mine.lastTold?.n ?? 0) + 1, from: giver.id, ids: adopted, at: round(now) };
    mine.version = (mine.version ?? 0) + 1;
  }
  return adopted;
}

// Sisters in the nest at the same time, each pair at most every SOCIAL.every s.
function trophallaxis(colony, world, now) {
  if (!SOCIAL.share) return;
  const home = colony.ants.filter((f) => f.alive && nestUnder(f, world));
  for (let i = 0; i < home.length; i++) {
    for (let j = i + 1; j < home.length; j++) {
      const [a, b] = [home[i], home[j]];
      const pair = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
      if (now - (colony.lastExchange[pair] ?? -Infinity) < SOCIAL.every) continue;
      colony.lastExchange[pair] = now;
      const told = tell(a, b, now).length + tell(b, a, now).length;
      colony.stats.exchanges += 1;
      colony.stats.told += told;
    }
  }
}

// A sister just ate: whoever is close enough to see it learns a little.
function observation(colony, now) {
  if (!SOCIAL.observe) return;
  for (const a of colony.ants) {
    const meal = a.lastMeal;
    if (!meal || colony.seenMeal[a.id] === meal.n) continue;
    colony.seenMeal[a.id] = meal.n;
    for (const b of colony.ants) {
      if (b === a || !b.alive) continue;
      if (Math.hypot(b.x - a.x, b.y - a.y) > viewRangeOf(b) * SOCIAL.seeRange) continue;
      learnSeen(b.brain, meal.type, meal.reward ?? 0, now, a.id);
      colony.stats.seen += 1;
    }
  }
}

// Once per step, after every sister has moved.
export function socialize(colony, world, now) {
  trophallaxis(colony, world, now);
  observation(colony, now);
}
