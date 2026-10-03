// Tyrrell's requirements for action selection, as measures of behaviour
// (--tyrrell; docs/research/libera/README.md §4, Tyrrell 1993 ch. 10). Realism
// first: these say whether she chooses as an animal does, not how long she
// lives. Nothing here runs without the flag, so every other report stays byte
// for byte what it was.
//
//   1      all sub-problems   time with a critical need nobody is tending
//   2      persistence        how long a consummatory bout (drinking, resting)
//                             goes on after its need stopped being the largest
//   3      activation ∝ need  per 10 s window, how much she tends a need against
//                             how big it is (correlation)
//   4–5    consummatory first with food within reach and hungry enough to eat it on
//                             the spot (CARRY.eatBelow), how often she
//                             eats it within 5 s rather than walking on
//   6      balanced lines     share of decisions the busiest line takes
//   7      contiguous         action changes a minute; switches that come back
//                             to the previous action within 3 s (dithering), and
//                             the same leaving out a bite or drink on the way
//                             (that is opportunism, 9, not dithering)
//   8      interrupt          seconds from cold or heat felt outside to an act
//                             that answers it
//   9      opportunism        meals taken on the way to something else
//   10     no WTA             not measured: `program` picks one line by design
//   11–12  compromise         time in which two needs fall at once
//   13–14  real sensors, flexible combination: documented, not measured

import { HUNGER, THIRST, NEEDS, THERMAL, CARRY, ENERGY } from '../../src/config.js';
import { energyMax } from '../../src/biology.js';
import { round, mean } from './stats.js';

const WINDOW = 10;      // s, for requirement 3
const REACH = 30;       // px: food this close is within reach
const TO_EAT = 5;       // s she has to eat it once within reach
const DITHER = 3;       // s: back to the previous action this fast is dithering
const OPPORTUNE = 2;    // s: what she was doing just before a meal

const NEEDS_OF = ['hunger', 'thirst', 'energy', 'thermal'];

// When each need is critical, by the model's own thresholds: hunger and thirst
// at NEEDS.critical, tiredness where she goes to rest (ENERGY.tired), thermal
// stress where the reflex takes her home (THERMAL.reflex).
const criticalAt = () => ({
  hunger: NEEDS.critical,
  thirst: NEEDS.critical,
  energy: 1 - ENERGY.tired / ENERGY.max,
  thermal: THERMAL.reflex,
});

function deficits(fagi) {
  return {
    hunger: fagi.hunger / HUNGER.max,
    thirst: fagi.thirst / THIRST.max,
    energy: 1 - fagi.energy / energyMax(fagi),
    thermal: THERMAL.enabled ? (fagi.thermalStress ?? 0) / THERMAL.maxStress : 0,
  };
}

// Which need the act she is on tends (null: none, or not a need: exploring,
// carrying for the pantry, lining the nest).
function tends(fagi) {
  const a = fagi.thought?.action;
  const kind = fagi.targetKind;
  if (a === 'seekFood' || a === 'taste' || ((a === 'track' || a === 'pheromone' || a === 'memory') && (kind === 'food' || kind === 'point'))) return 'hunger';
  if (a === 'seekWater' || a === 'drink' || a === 'sip' || a === 'swimOut' || ((a === 'track' || a === 'memory') && (kind === 'water' || kind === 'shore'))) return 'thirst';
  if (a === 'coolDown' || a === 'shelter') return 'thermal';
  if (a === 'rest' || a === 'toSleep') return fagi.thermalFeel ? 'thermal' : 'energy';
  if (a === 'toNest') return fagi.thermalFeel ? 'thermal' : 'energy';
  return null;
}

// Consummatory bouts: what she is doing that ends a need right now.
function consuming(fagi) {
  if (fagi.drinking || fagi.thought?.action === 'drink') return 'thirst';
  if (fagi.resting || fagi.sleeping) return 'energy';
  return null;
}

function foodWithinReach(fagi, world) {
  for (const p of world.points) if (Math.hypot(p.x - fagi.x, p.y - fagi.y) <= REACH) return true;
  return false;
}

export function newTyrrellFollow(opts) {
  if (!opts.tyrrell) return null;
  return {
    t: 0, critical: 0, untended: 0, untendedBy: {}, instead: {},
    bout: null, bouts: [],
    win: { t: 0, start: null, tend: Object.fromEntries(NEEDS_OF.map((k) => [k, 0])) },
    pairs: Object.fromEntries(NEEDS_OF.map((k) => [k, []])),
    reach: null, reachN: 0, reachAte: 0,
    rules: {}, decisions: 0,
    last: null, lastAt: 0, prev: null, prevAt: -Infinity, switches: 0, dithers: 0, dithersPure: 0, consumedAt: -Infinity,
    threat: null, latencies: [],
    eaten: null, meals: 0, opportune: 0, recent: [],
    before: null, compromise: 0,
  };
}

export function noteTyrrell(s, fagi, world, dt) {
  if (!s || !fagi.alive) return;
  s.t += dt;
  const d = deficits(fagi);
  const tend = tends(fagi);
  const action = fagi.thought?.action ?? '-';

  // 1. A critical need she is not tending.
  const at = criticalAt();
  const critical = NEEDS_OF.filter((k) => d[k] >= at[k]);
  if (critical.length) {
    s.critical += dt;
    if (!critical.includes(tend) && !critical.includes(consuming(fagi))) {
      s.untended += dt;
      for (const k of critical) s.untendedBy[k] = (s.untendedBy[k] ?? 0) + dt;
      s.instead[action] = (s.instead[action] ?? 0) + dt;
    }
  }

  // 2. Persistence of a consummatory bout past the point where its need is the largest.
  const c = consuming(fagi);
  if (c !== s.bout?.need) {
    if (s.bout) s.bouts.push(s.bout);
    s.bout = c ? { need: c, secs: 0, past: 0 } : null;
  }
  if (s.bout) {
    s.bout.secs += dt;
    const largest = NEEDS_OF.reduce((a, k) => (d[k] > d[a] ? k : a), 'hunger');
    if (largest !== c) s.bout.past += dt;
  }

  // 3. How much she tends each need in a window, against how big it was as the
  // window began (tending it lowers it within the window: the start is the cause).
  const w = s.win;
  w.start ??= d;
  w.t += dt;
  for (const k of NEEDS_OF) if (tend === k || c === k) w.tend[k] += dt;
  if (w.t >= WINDOW) {
    for (const k of NEEDS_OF) s.pairs[k].push([w.start[k], w.tend[k] / w.t]);
    s.win = { t: 0, start: null, tend: Object.fromEntries(NEEDS_OF.map((k) => [k, 0])) };
  }

  // 4–5. Food within reach while hungry: does she eat it?
  const eatenNow = fagi.eaten ?? 0;
  const ate = s.eaten != null && eatenNow > s.eaten;
  if (ate || fagi.drinking) s.consumedAt = s.t;
  if (s.reach && ate) { s.reachAte++; s.reach = null; }
  if (s.reach && s.t - s.reach > TO_EAT) s.reach = null;
  if (!s.reach && d.hunger >= CARRY.eatBelow / HUNGER.max && foodWithinReach(fagi, world)) { s.reach = s.t; s.reachN++; }

  // 6. Which line decides.
  if (fagi.thought?.rule) { s.rules[fagi.thought.rule] = (s.rules[fagi.thought.rule] ?? 0) + dt; s.decisions += dt; }

  // 7. Changes of action, and dithering back.
  if (action !== s.last) {
    if (s.last != null) {
      s.switches++;
      if (action === s.prev && s.t - s.prevAt <= DITHER) {
        s.dithers++;
        // Back after eating or drinking on the way is opportunism (9), not
        // dithering: the pure count leaves those out.
        if (!(s.consumedAt > s.prevAt)) s.dithersPure++;
      }
      s.prev = s.last;
      s.prevAt = s.t;
    }
    s.last = action;
  }

  // 8. Cold or heat felt outside: how long until she answers it.
  const outside = !(fagi.perceived?.inNest);
  // Only a threat she is not already answering starts the clock.
  if (!s.threat && fagi.thermalFeel && outside && tend !== 'thermal') s.threat = s.t;
  if (s.threat != null && (tend === 'thermal' || !outside || !fagi.thermalFeel)) {
    if (tend === 'thermal' || !outside) s.latencies.push(s.t - s.threat);
    s.threat = null;
  }

  // 9. A meal taken out in the field on the way to something else (a ration
  // from the pantry while resting at home is not met on the way).
  s.recent.push([s.t, tend]);
  while (s.recent.length && s.t - s.recent[0][0] > OPPORTUNE) s.recent.shift();
  if (ate && outside) {
    s.meals++;
    if (s.recent.some(([, k]) => k != null && k !== 'hunger')) s.opportune++;
  }
  s.eaten = eatenNow;

  // 11–12. Two needs falling at once.
  if (s.before) {
    const falling = NEEDS_OF.filter((k) => d[k] < s.before[k] - 1e-6 && s.before[k] > 0.2);
    if (falling.length >= 2) s.compromise += dt;
  }
  s.before = d;
}

const corr = (pts) => {
  if (pts.length < 3) return null;
  const mx = mean(pts.map((p) => p[0])), my = mean(pts.map((p) => p[1]));
  let a = 0, b = 0, c = 0;
  for (const [x, y] of pts) { a += (x - mx) * (y - my); b += (x - mx) ** 2; c += (y - my) ** 2; }
  return b && c ? a / Math.sqrt(b * c) : null;
};

export function tyrrellSummary(s) {
  if (!s) return null;
  const bouts = [...s.bouts, ...(s.bout ? [s.bout] : [])];
  const top = Object.values(s.rules).reduce((a, v) => Math.max(a, v), 0);
  return {
    r1Untended: s.critical ? round(s.untended / s.critical, 3) : 0,
    r1Critical: round(s.critical / Math.max(1, s.t), 3),
    r1By: Object.fromEntries(Object.entries(s.untendedBy).map(([k, v]) => [k, round(v / Math.max(1, s.t), 4)])),
    r1Instead: Object.fromEntries(Object.entries(s.instead).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, round(v / Math.max(1, s.t), 4)])),
    r2Past: bouts.length ? round(mean(bouts.map((b) => b.past)), 2) : null,
    r2Share: bouts.length ? round(mean(bouts.map((b) => (b.secs ? b.past / b.secs : 0))), 3) : null,
    r3: Object.fromEntries(NEEDS_OF.map((k) => [k, corr(s.pairs[k]) == null ? null : round(corr(s.pairs[k]), 3)])),
    r45Eat: s.reachN ? round(s.reachAte / s.reachN, 3) : null,
    r6Top: s.decisions ? round(top / s.decisions, 3) : null,
    r7Switches: round(s.switches / Math.max(1 / 60, s.t / 60), 2),
    r7Dither: s.switches ? round(s.dithers / s.switches, 3) : 0,
    r7DitherPure: s.switches ? round(s.dithersPure / s.switches, 3) : 0,
    r8Latency: s.latencies.length ? round(mean(s.latencies), 2) : null,
    r9Opportune: s.meals ? round(s.opportune / s.meals, 3) : null,
    r1112Compromise: round(s.compromise / Math.max(1, s.t), 4),
  };
}

const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? '—' : Number(v).toFixed(d));

export function reportTyrrell(runs) {
  const rs = runs.map((r) => r.tyrrell).filter(Boolean);
  if (!rs.length) return [];
  const m = (f) => { const v = rs.map(f).filter((x) => x != null && !Number.isNaN(x)); return v.length ? mean(v) : null; };
  return [
    '',
    `Tyrrell's requirements (mean of ${rs.length} lives)`,
    `  1     critical need untended   ${fmt(m((r) => r.r1Untended), 3)} of critical time (critical ${fmt(m((r) => r.r1Critical), 3)} of life)`,
    `        untended, by need       ${['hunger', 'thirst', 'energy', 'thermal'].map((k) => `${k} ${fmt(m((r) => r.r1By[k] ?? 0), 3)}`).join(' · ')} of life`,
    `        doing instead            ${Object.entries(rs.reduce((a, r) => { for (const [k, v] of Object.entries(r.r1Instead)) a[k] = (a[k] ?? 0) + v / rs.length; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${fmt(v, 3)}`).join(' · ')}`,
    `  2     persistence past largest ${fmt(m((r) => r.r2Past))} s a bout (${fmt(m((r) => r.r2Share), 3)} of it)`,
    `  3     tending ∝ need (r)       hunger ${fmt(m((r) => r.r3.hunger))} · thirst ${fmt(m((r) => r.r3.thirst))} · energy ${fmt(m((r) => r.r3.energy))} · thermal ${fmt(m((r) => r.r3.thermal))}`,
    `  4–5   eats food within reach   ${fmt(m((r) => r.r45Eat), 3)}`,
    `  6     busiest line's share     ${fmt(m((r) => r.r6Top), 3)}`,
    `  7     switches a minute        ${fmt(m((r) => r.r7Switches))} (dithering ${fmt(m((r) => r.r7Dither), 3)}; leaving out a bite or drink on the way ${fmt(m((r) => r.r7DitherPure), 3)})`,
    `  8     answers cold/heat in     ${fmt(m((r) => r.r8Latency))} s`,
    `  9     meals on the way         ${fmt(m((r) => r.r9Opportune), 3)}`,
    `  10    no winner-take-all       not measured (program picks one line by design)`,
    `  11–12 two needs falling        ${fmt(m((r) => r.r1112Compromise), 4)} of life`,
    `  13–14 real sensors, flexible   documented, not measured`,
  ];
}
