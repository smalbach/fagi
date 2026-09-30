// Step 4's competitors for the bite point (docs/research/plan-decision-adaptativa.md,
// revision 2). Neither knows how the world works; both learn only from the
// bites they take (did her hunger rise?), from nothing in each life.
//
//   heuristic:<k>:<below>  a kind is bad once `k` bites of it harmed and at
//                          least as many as fed; a kind never eaten gets a
//                          trial bite only below hunger `below`; known good,
//                          eaten when hungry and carried home when not
//   qlearn:<alpha>:<eps>   tabular Q-learning over hunger band × what she has
//                          seen of the kind, actions eat / trial bite / leave,
//                          reward the hunger a bite took away (/25), ε-greedy
//                          from a stream of its own
//
// Six configurations each (CONFIGS), tuned on the development worlds.

import { CARRY, EXPERIMENT } from '../../src/config.js';
import { registerJudge } from '../../src/decision/bite.js';
import { pantryEstimate, roomAtHome } from '../../src/larder.js';
import { habit } from '../../src/habits.js';

export const CONFIGS = {
  heuristic: ['1:40', '1:60', '1:75', '2:40', '2:60', '2:75'],
  qlearn: ['0.1:0.05', '0.1:0.15', '0.1:0.3', '0.3:0.05', '0.3:0.15', '0.3:0.3'],
};

const hungry = (fagi) => fagi.hunger >= CARRY.eatBelow;
const mayCarry = (fagi, p) => !fagi.carrying && !p.refuse && pantryEstimate(fagi) < habit(fagi, 'reserve') && roomAtHome(fagi);

// Her own record of each kind, from the bites she felt.
function recordOf(fagi, onBite = null) {
  const m = (fagi.competitor ??= { kinds: {}, meals: fagi.eaten ?? 0 });
  if ((fagi.eaten ?? 0) !== m.meals && fagi.lastMeal) {
    m.meals = fagi.eaten;
    const meal = fagi.lastMeal;
    const harmed = meal.hungerAfter > meal.hungerBefore;
    const r = (m.kinds[meal.type] ??= { good: 0, bad: 0 });
    const before = { ...r };
    if (harmed) r.bad += 1; else r.good += 1;
    if (onBite) onBite(m, meal, before, r);
  }
  return m;
}

// --- heuristic ------------------------------------------------------------------

function heuristic(k, below) {
  const status = (m, key) => {
    const r = m.kinds[key];
    if (!r || r.good + r.bad === 0) return 'unknown';
    return r.bad >= k && r.bad >= r.good ? 'bad' : 'good';
  };
  return {
    ground(fagi, p) {
      const s = status(recordOf(fagi), p.type);
      if (s === 'bad') return 'leave';
      if (s === 'unknown') {
        if (fagi.hunger < below) return 'taste';
        return fagi.hunger >= 90 ? 'eat' : 'leave';   // desperate
      }
      if (hungry(fagi)) return 'eat';
      return mayCarry(fagi, p) ? 'carry' : 'leave';
    },
    pantry(fagi, keys) {
      const m = recordOf(fagi);
      const good = keys.filter((key) => status(m, key) === 'good');
      return good.length ? good.reduce((a, b) => (m.kinds[b].good > m.kinds[a].good ? b : a)) : null;
    },
    carried: (fagi, key) => status(recordOf(fagi), key) === 'good',
    wants: (fagi, c) => status(recordOf(fagi), c.key) !== 'bad',
  };
}

// --- Q-learning -----------------------------------------------------------------

const ACTIONS = ['eat', 'taste', 'leave'];
const band = (h) => (h < 45 ? 0 : h < 72 ? 1 : 2);
const seen = (r) => (!r || r.good + r.bad === 0 ? 'unknown' : r.bad === 0 ? 'good' : r.good === 0 ? 'bad' : 'mixed');
const GAMMA = 0.5;

function stream(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function qlearn(alpha, eps) {
  const stateOf = (fagi) => {
    const m = recordOf(fagi, (mm, meal, before, after) => {
      const last = mm.last;
      if (!last || last.key !== meal.type) return;
      const portion = last.action === 'taste' ? EXPERIMENT.portion : 1;
      const r = -(meal.hungerAfter - meal.hungerBefore) / 25 / portion;
      const s2 = `${band(meal.hungerAfter)}:${seen(after)}`;
      const q = mm.q[last.state];
      const next = Math.max(...Object.values(mm.q[s2] ?? { eat: 0.1, taste: 0.1, leave: 0 }));
      q[last.action] += alpha * (r + GAMMA * next - q[last.action]);
      mm.last = null;
    });
    // Its own stream, seeded once from hers: exploring changes what she decides, not how she walks.
    m.q ??= {};
    m.rnd ??= stream(Math.floor(Math.random() * 4294967296));
    return m;
  };
  const qOf = (m, s) => (m.q[s] ??= { eat: 0.1, taste: 0.1, leave: 0 });
  const choose = (fagi, m, key, greedy = false) => {
    const s = `${band(fagi.hunger)}:${seen(m.kinds[key])}`;
    const q = qOf(m, s);
    let a = ACTIONS.reduce((x, y) => (q[y] > q[x] ? y : x));
    if (!greedy && m.rnd() < eps) a = ACTIONS[Math.floor(m.rnd() * ACTIONS.length)];
    return { s, a };
  };
  return {
    ground(fagi, p) {
      const m = stateOf(fagi);
      const { s, a } = choose(fagi, m, p.type);
      if (a === 'eat' && !hungry(fagi)) {
        // Not hungry: what it would eat it carries home instead.
        return mayCarry(fagi, p) ? 'carry' : 'leave';
      }
      if (a !== 'leave') m.last = { state: s, action: a, key: p.type };
      return a;
    },
    pantry(fagi, keys) {
      const m = stateOf(fagi);
      let best = null;
      for (const key of keys) {
        const { s } = choose(fagi, m, key, true);
        const q = qOf(m, s);
        if (q.eat > q.leave && (!best || q.eat > best.v)) best = { key, v: q.eat, s };
      }
      if (best && fagi.perceived?.inNest) m.last = { state: best.s, action: 'eat', key: best.key };
      return best?.key ?? null;
    },
    carried(fagi, key) {
      const m = stateOf(fagi);
      const { s } = choose(fagi, m, key, true);
      const q = qOf(m, s);
      if (q.eat <= q.leave) return false;
      m.last = { state: s, action: 'eat', key };
      return true;
    },
    wants(fagi, c) {
      const m = stateOf(fagi);
      const { s } = choose(fagi, m, c.key, true);
      const q = qOf(m, s);
      return Math.max(q.eat, q.taste) > q.leave;
    },
  };
}

for (const c of CONFIGS.heuristic) { const [k, below] = c.split(':').map(Number); registerJudge(`heuristic:${c}`, heuristic(k, below)); }
for (const c of CONFIGS.qlearn) { const [a, e] = c.split(':').map(Number); registerJudge(`qlearn:${c}`, qlearn(a, e)); }
