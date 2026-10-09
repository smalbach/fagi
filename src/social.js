// Learning from sisters.
//
// Two ways, both as a social insect would:
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

import { SOCIAL, POINT_TYPES, CONCEPT, PROGRAM } from './config.js';
import { shareMoments } from './program/share.js';
import { conceptsOf, watched } from './concepts.js';
import { nestUnder } from './nest.js';
import { learnSeen } from './brain.js';
import { subjectOf, upsertRule, traitsMatch, decidingRule } from './learned/rules.js';
import { SCOPE } from './learned/synth.js';
import { cuesOf } from './learned/cues.js';
import { viewRangeOf } from './vision.js';

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// How much she trusts one of her rules: fully if she lived it.
export const trustOf = (r) => r.source?.trust ?? 1;

// What one sister passes to another, in the colony's format (SOCIAL.format):
//   'rule':     her rules as they are, trait rules included ("sour drops make
//               you sick"). The default, and how the game plays;
//   'verdict':  only conclusions, one per fruit she has an opinion on ("don't
//               eat the red drop"), whatever rule that opinion comes from.
//               A conclusion says nothing about a fruit she never met;
//   'evidence': her rules, each followed by the bites behind it
//               (learned/explain.js keeps them), which the receiver weighs
//               like something she saw a sister go through (learnSeen).
// `budget` caps the items passed at once (a rule, a verdict and a bite each
// count one; 0 = no cap). With a cap, what she trusts and weighs most goes
// first. That is how research/ compares the formats on equal terms.
// SOCIAL.cost 'coverage' counts instead how many species of the world an item
// speaks about: a verdict, a rule about one fruit and a bite cost one; a rule
// about a trait costs as many as the species that have it. The formats are
// then equal in what they say about the world, not in how many sentences.
//
// `kind` is the source mark ('told' between sisters, 'born' from an elder to
// a newborn) and `scale` how much of the giver's trust survives the telling.
// Every rule passed on carries `origin`: where it was first lived, kept from
// copy to copy, so a belief can be followed back to the bite it came from.
//
// Returns what was adopted: [{ id, origin, kind: 'rule' | 'verdict' | 'bite' }].
export function pass(giver, receiver, now, { kind, scale, budget = 0, format = SOCIAL.format }) {
  const mine = receiver.brain;
  const out = [];
  const at = round(now);
  const has = (subject) => mine.rules.list.some((x) => subjectOf(x) === subject);
  const tasted = (key) => (mine.facts[key]?.tries ?? 0) > 0;
  let spent = 0;
  const room = (cost = 1) => !budget || spent + cost <= budget;
  const spend = (cost = 1) => { spent += cost; };

  const adopt = (r, trust, origin) => {
    const copy = JSON.parse(JSON.stringify(r));
    delete copy.revisedAt;
    upsertRule(mine.rules, {
      ...copy,
      weight: round(r.weight * scale, 3),
      learnedAt: at,
      origin,
      source: { kind, from: giver.id, at, trust: round(trust, 3) },
    });
  };

  if (format === 'verdict') {
    for (const v of giverVerdicts(giver, scale, budget)) {
      if (!room()) break;
      const id = `${v.verdict}-${v.key}`;
      if (has(v.key) || tasted(v.key)) continue;
      spend(1);
      adopt({
        id, on: SCOPE[v.verdict], when: { key: v.key }, verdict: v.verdict, weight: v.rule.weight,
        because: [{ sense: 'told', v: v.verdict === 'avoid' ? -1 : 1 }], tries: 0, stage: 'short',
      }, v.trust, v.origin);
      out.push({ id, origin: v.origin, kind: 'verdict' });
    }
    return out;
  }

  for (const r of passable(giver, scale, budget)) {
    if (!room()) break;
    const subject = subjectOf(r);
    // She already has an opinion about it, or had one and dropped it.
    if (has(subject)) continue;
    // A fruit she has tasted is judged by her own experience.
    if (r.when.key && tasted(r.when.key)) continue;
    // By coverage, a rule too broad for what is left is skipped for a narrower one.
    const cost = SOCIAL.cost === 'coverage' ? coverageOf(r) : 1;
    if (!room(cost)) continue;
    spend(cost);
    const origin = originOf(giver, r);
    adopt(r, trustOf(r) * scale, origin);
    out.push({ id: r.id, origin, kind: 'rule' });
    if (format !== 'evidence') continue;
    for (const b of backing(giver, r)) {
      if (!room()) break;
      spend(1);
      learnSeen(mine, b.key, b.reward, now, giver.id);
      out.push({ id: r.id, origin, kind: 'bite', key: b.key });
    }
  }
  return out;
}

// How many species of the world a rule speaks about (SOCIAL.cost 'coverage').
function coverageOf(r) {
  if (r.when?.key) return 1;
  if (r.cases) return Math.max(1, r.cases.length);
  let n = 0;
  for (const [k, t] of Object.entries(POINT_TYPES)) if (t.species && t.traits && traitsMatch(r, k, cuesOf(k))) n++;
  return Math.max(1, n);
}

// Where a rule was first lived: a rule she lived herself starts a lineage.
const originOf = (f, r) => r.origin ?? `${f.id}/${r.id}@${round(r.learnedAt ?? 0)}`;

// The rules worth passing on, most trusted and weighty first when there is a cap.
// With SOCIAL.topic 'food', only rules about eating: the budget is not spent on
// rain, pheromone or deep water (research/ compares formats on food alone).
function passable(giver, scale, budget) {
  const list = giver.brain.rules.list.filter((r) => !r.retired && !giver.brain.rules.quarantined.has(r.id)
    && trustOf(r) * scale >= SOCIAL.minTrust && (SOCIAL.topic !== 'food' || r.on.includes('eat')));
  return budget ? list.sort((a, b) => strength(b) - strength(a)) : list;
}
const strength = (r) => trustOf(r) * Math.abs(r.weight ?? 0);

// Her conclusions: for every fruit she knows of, what her rules say about
// eating it, and the rule that says it.
function giverVerdicts(giver, scale, budget) {
  const out = [];
  for (const key of Object.keys(giver.brain.facts)) {
    if (!POINT_TYPES[key]?.traits) continue;
    const r = decidingRule(giver, 'eat', key);
    if (!r || trustOf(r) * scale < SOCIAL.minTrust) continue;
    out.push({ key, verdict: r.verdict, rule: r, trust: trustOf(r) * scale, origin: originOf(giver, r) });
  }
  return budget ? out.sort((a, b) => strength(b.rule) - strength(a.rule)) : out;
}

// Her own bites behind a rule, one per fruit, newest first.
function backing(giver, r) {
  const about = r.cases ? (k) => r.cases.includes(k)
    : r.when.key ? (k) => k === r.when.key
      : (k) => traitsMatch(r, k, cuesOf(k));
  const seen = new Set();
  const out = [];
  for (let i = (giver.brain.bites ?? []).length - 1; i >= 0 && out.length < SOCIAL.evidence; i--) {
    const b = giver.brain.bites[i];
    if (b.saw != null || b.late || seen.has(b.key) || !about(b.key)) continue;
    seen.add(b.key);
    out.push(b);
  }
  return out;
}

// Everything the giver can tell the receiver now: the ids adopted.
export function tell(giver, receiver, now) {
  const got = pass(giver, receiver, now, { kind: 'told', scale: SOCIAL.trust, budget: SOCIAL.budget });
  const adopted = [...new Set(got.map((g) => g.id))];
  if (adopted.length) {
    const mine = receiver.brain;
    mine.lastTold = { n: (mine.lastTold?.n ?? 0) + 1, from: giver.id, ids: adopted, at: round(now) };
    mine.version = (mine.version ?? 0) + 1;
  }
  return adopted;
}

// Sisters in the nest at the same time, each pair at most every SOCIAL.every s:
// their rules (SOCIAL.share) and what their lines cost them (PROGRAM.share,
// program/share.js). With SOCIAL.touch, only two close enough to touch
// exchange (trophallaxis is mouth to mouth); 0 = any two in the nest, as the
// preregistered studies ran.
function trophallaxis(colony, world, now) {
  if (!SOCIAL.share && !PROGRAM.share) return;
  const home = colony.ants.filter((f) => f.alive && nestUnder(f, world));
  const touch = SOCIAL.touch;
  for (let i = 0; i < home.length; i++) {
    for (let j = i + 1; j < home.length; j++) {
      const [a, b] = [home[i], home[j]];
      if (touch > 0 && Math.hypot(a.x - b.x, a.y - b.y) > touch) continue;
      const pair = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
      if (now - (colony.lastExchange[pair] ?? -Infinity) < SOCIAL.every) continue;
      colony.lastExchange[pair] = now;
      if (SOCIAL.share) {
        const told = tell(a, b, now).length + tell(b, a, now).length;
        colony.stats.exchanges += 1;
        colony.stats.told += told;
      }
      if (PROGRAM.share) colony.stats.moments = (colony.stats.moments ?? 0) + shareMoments(a, b) + shareMoments(b, a);
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

// A sister just touched or nibbled a thing (things.js): if it stung her, or
// she drank its sap, whoever sees it learns that kind without touching it.
// Cold or warmth to the touch cannot be seen. Watching a fellow's pain is
// enough for real animals to fear what caused it (Mineka and Cook's monkeys).
function watchThings(colony, world, now) {
  if (!CONCEPT.enabled || !CONCEPT.social || !SOCIAL.observe) return;
  colony.seenThing ??= {};
  for (const a of colony.ants) {
    const t = a.lastThing;
    if (!t || colony.seenThing[a.id] === t.n) continue;
    colony.seenThing[a.id] = t.n;
    if (t.felt !== 'pain' && t.felt !== 'sap') continue;
    const obj = world.objects.find((o) => o.id === t.id);
    if (!obj) continue;
    for (const b of colony.ants) {
      if (b === a || !b.alive) continue;
      if (Math.hypot(b.x - a.x, b.y - a.y) > viewRangeOf(b) * SOCIAL.seeRange) continue;
      const change = watched(conceptsOf(b), world, obj, t.felt, now);
      if (change) b.lastWatchedThing = { n: (b.lastWatchedThing?.n ?? 0) + 1, from: a.id, key: obj.key, felt: t.felt, change };
    }
  }
}

// Once per step, after every sister has moved.
export function socialize(colony, world, now) {
  trophallaxis(colony, world, now);
  observation(colony, now);
  watchThings(colony, world, now);
}
