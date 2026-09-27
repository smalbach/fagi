// Narrator: watches Fagi every frame and writes a line ONLY when something changes.
// That way the console can be read, instead of filling up with 60 lines a second.
//
// It stores keys and data, never sentences: the console translates them when
// painting, so switching language also rewrites the history already written.

import { MEMORY, BRAIN, WATER, POINT_TYPES } from './config.js';
import { explain, lines, stance } from './learned/explain.js';

const MIN_SCORE = BRAIN.minScore;
import { t } from './i18n.js';

const MAX_LINES = 80;

// Color tag for each event. The tag's text comes from the language.
export const TAG_COLOR = {
  explore: '#7f869a',
  seekFood: '#5bd97e',
  seekWater: '#3d8fd9',
  drink: '#4cc9f0',
  track: '#e8a33d',
  memory: '#b57bff',
  pheromone: '#c9a227',
  carry: '#c9a227',
  toNest: '#c9a227',
  rest: '#7f869a',
  pantry: '#c9a227',
  eat: '#e8a33d',
  pick: '#e8a33d',
  nest: '#c9a227',
  learn: '#b57bff',
  spot: '#8a90a2',
  done: '#7f869a',
  dead: '#d95b7e',
  eatCarried: '#e8a33d',
  searchWaterNearHome: '#3d8fd9',
  swimOut: '#d95b7e',
  swim: '#d95b7e',
  rain: '#6f9fbf',
  shelter: '#6f9fbf',
  api: '#4cc9f0',
  rethink: '#f0c75e',
  why: '#b57bff',
};

export function createNarrator() {
  return {
    lines: [],
    prev: { action: null, drinking: false, swimming: false, dunk: 0, probed: false, raining: false, pressureFalling: false, rainLesson: 0, pressureLesson: 0, puddleGone: 0, meal: 0, drink: 0, water: 0,
            picked: 0, stored: 0, pantry: 0, alive: true,
            stages: {}, trusted: {}, why: {}, rule: 0, peril: 0, rethink: 0, leg: 0 },
    seq: 0,
  };
}

function push(narr, fagi, tag, text, detail = null) {
  narr.lines.push({ id: ++narr.seq, t: fagi.age, tag, text, detail });
  if (narr.lines.length > MAX_LINES) narr.lines.shift();
}

const arrow = (before, after) => (after - before >= 0 ? '↑' : '↓');

// Translates the list of sensations ("hunger +25 · speed ×0.60") into a single
// already-resolved text: log.ruleSub only has to insert it, without knowing
// about sensations or languages.
function why(because) {
  return (because ?? []).map((s) => t(`sense.${s.sense}`, { v: s.v })).join(' · ');
}

export function narrate(narr, fagi) {
  const th = fagi.thought;
  if (!th) return narr.lines;
  const p = narr.prev;

  // Death.
  if (p.alive && !fagi.alive) {
    push(narr, fagi, 'dead',
      { key: 'log.died', params: { cause: { key: `cause.${fagi.cause}` } } },
      { key: 'log.diedSub', params: { age: { dur: fagi.age }, eaten: fagi.eaten } });
  }
  p.alive = fagi.alive;
  if (!fagi.alive) return narr.lines;

  // Bite: what she ate, how it agreed with her and what she learned from it.
  if (fagi.lastMeal && fagi.lastMeal.n !== p.meal) {
    const m = fagi.lastMeal;
    push(narr, fagi, 'eat',
      { key: 'log.ate', params: { what: { key: `type.${m.type}` } } },
      { key: 'log.ateSub', params: {
        hunger: `${Math.round(m.hungerAfter)}%`,
        arrow: arrow(m.beliefBefore, m.beliefAfter),
        before: m.beliefBefore.toFixed(2), after: m.beliefAfter.toFixed(2),
      } });
    p.meal = m.n;
  }

  // Carries a point instead of eating it.
  if ((fagi.picked ?? 0) !== p.picked) {
    push(narr, fagi, 'pick',
      { key: 'log.pick', params: { what: { key: `type.${fagi.carrying?.type ?? 'nectar'}` } } },
      { key: 'log.pickSub' });
    p.picked = fagi.picked ?? 0;
  }

  // Drops it in the pantry.
  if (fagi.lastDeposit && fagi.lastDeposit.n !== p.stored) {
    const d = fagi.lastDeposit;
    push(narr, fagi, 'nest',
      { key: 'log.store', params: { what: { key: `type.${d.type}` } } },
      { key: 'log.storeSub', params: { what: { key: `type.${d.type}` }, total: d.total } });
    p.stored = d.n;
  }

  // Draws on the pantry.
  if (fagi.lastPantry && fagi.lastPantry.n !== p.pantry) {
    push(narr, fagi, 'nest', { key: 'log.pantry' },
      { key: 'log.pantrySub', params: { what: { key: `type.${fagi.lastPantry.type}` } } });
    p.pantry = fagi.lastPantry.n;
  }

  // A memory consolidates or stops being trustworthy.
  for (const [key, r] of Object.entries(fagi.brain.facts)) {
    const before = p.stages[key];
    if (before !== 'long' && r.stage === 'long') {
      push(narr, fagi, 'learn',
        { key: 'log.consolidated', params: { what: { key: `type.${key}` } } },
        { key: 'log.consolidatedSub' });
    }
    p.stages[key] = r.stage;

    const reliable = r.confidence >= MEMORY.minConfidence;
    if (p.trusted[key] && !reliable && r.tries > 0) {
      push(narr, fagi, 'explore',
        { key: 'log.forgot', params: { what: { key: `type.${key}` } } },
        { key: 'log.forgotSub' });
    }
    p.trusted[key] = reliable;
  }

  // Writes, revises or retires a rule: experience turned into code.
  if (fagi.brain.lastRule && fagi.brain.lastRule.n !== p.rule) {
    const r = fagi.brain.lastRule;
    const logKey = { new: 'log.rule', revised: 'log.ruleRevised', retired: 'log.ruleRetired' }[r.kind];
    push(narr, fagi, 'learn',
      { key: logKey, params: { rule: r.id, what: { key: `type.${r.key}` } } },
      { key: 'log.ruleSub', params: { because: why(r.because) } });
    p.rule = r.n;
  }

  // A bite that seemed bearable ended up worse than it felt when she tried
  // it: the belief is corrected separately, later.
  if (fagi.lastEpisode?.correction && fagi.lastEpisode.n !== p.peril) {
    push(narr, fagi, 'learn',
      { key: 'log.peril', params: { what: { key: `type.${fagi.lastEpisode.key}` } } },
      { key: 'log.perilSub' });
    p.peril = fagi.lastEpisode.n;
  }

  // Discovers a water source: memorizes it even if she's not going there.
  if ((fagi.waterFound ?? 0) !== p.water) {
    push(narr, fagi, 'spot', { key: 'log.spotWater' }, { key: 'log.spotWaterSub' });
    p.water = fagi.waterFound ?? 0;
  }

  // Drinks while thirsty for the first time: discovers what water is for.
  if (fagi.lastDrink && fagi.lastDrink.n !== p.drink) {
    const d = fagi.lastDrink;
    push(narr, fagi, 'learn', { key: 'log.tryWater' },
      { key: 'log.tryWaterSub', params: {
        thirst: `${Math.round(d.thirst)}%`,
        arrow: arrow(d.beliefBefore, d.beliefAfter),
        before: d.beliefBefore.toFixed(2), after: d.beliefAfter.toFixed(2),
      } });
    p.drink = d.n;
  }

  // Goes into the deep water: out of her depth.
  if (fagi.swimming && !p.swimming) push(narr, fagi, 'swim', { key: 'log.sink' }, { key: 'log.sinkSub' });
  // Leaves the deep water: soaked until she dries.
  if (!fagi.swimming && p.swimming && fagi.alive) {
    push(narr, fagi, 'swim', { key: 'log.soaked' }, { key: 'log.soakedSub', params: { sec: WATER.dryTime } });
  }
  p.swimming = fagi.swimming;

  // Rain starts and stops.
  if (fagi.raining !== p.raining) {
    push(narr, fagi, 'rain', { key: fagi.raining ? 'log.rain' : 'log.rainStop' },
      { key: fagi.raining ? 'log.rainSub' : 'log.rainStopSub' });
    p.raining = fagi.raining;
  }

  // Notices the pressure dropping (once per front).
  if (fagi.pressureFalling && !p.pressureFalling) {
    push(narr, fagi, 'rain', { key: 'log.pressure' }, { key: 'log.pressureSub' });
  }
  p.pressureFalling = Boolean(fagi.pressureFalling);

  // The first time the rain catches her outside: what it costs her.
  const lr = fagi.lastRainLesson;
  if (lr && lr.n === 1 && p.rainLesson !== 1) {
    push(narr, fagi, 'learn', { key: 'log.rainLearn' }, { key: 'log.rainLearnSub', params: {
      arrow: arrow(lr.beliefBefore, lr.beliefAfter),
      before: lr.beliefBefore.toFixed(2), after: lr.beliefAfter.toFixed(2),
    } });
  }
  p.rainLesson = lr?.n ?? 0;

  // It clears up and she links the front she noticed with the rain that came.
  const pl = fagi.lastPressureLesson;
  if (pl && pl.n !== p.pressureLesson) {
    push(narr, fagi, 'learn', { key: 'log.pressureLearn' }, { key: 'log.pressureLearnSub', params: {
      arrow: arrow(pl.beliefBefore, pl.beliefAfter),
      before: pl.beliefBefore.toFixed(2), after: pl.beliefAfter.toFixed(2),
    } });
  }
  p.pressureLesson = pl?.n ?? 0;

  // Goes to the puddle she remembered and it has dried up.
  if ((fagi.puddleGone ?? 0) !== p.puddleGone) {
    push(narr, fagi, 'spot', { key: 'log.puddleGone' }, { key: 'log.puddleGoneSub' });
    p.puddleGone = fagi.puddleGone ?? 0;
  }

  // The first time her antennae warn her of water before she steps in it.
  if (fagi.probed && !p.probed) push(narr, fagi, 'spot', { key: 'log.probe' }, { key: 'log.probeSub' });
  p.probed = Boolean(fagi.probed);

  // What the time in the deep water cost her, and what she learns from it.
  if (fagi.lastDunk && fagi.lastDunk.n !== p.dunk) {
    const d = fagi.lastDunk;
    push(narr, fagi, 'learn', { key: 'log.dunk' },
      { key: 'log.dunkSub', params: {
        secs: d.secs.toFixed(1),
        arrow: arrow(d.beliefBefore, d.beliefAfter),
        before: d.beliefBefore.toFixed(2), after: d.beliefAfter.toFixed(2),
      } });
    p.dunk = d.n;
  }

  // Starts and stops drinking.
  if (fagi.drinking !== p.drinking) {
    const thirst = { key: 'log.thirstIs', params: { thirst: `${Math.round(th.thirstU * 100)}%` } };
    if (fagi.drinking) push(narr, fagi, 'drink', { key: 'log.reachWater' }, thirst);
    else push(narr, fagi, 'done', { key: 'log.leaveWater' }, thirst);
    p.drinking = fagi.drinking;
  }

  // A fruit she has never tasted: what she makes of it, and why. Told the
  // first time she perceives each kind, and again whenever her opinion of it
  // changes (a rule written, a bite of something like it).
  for (const c of fagi.perceived?.ranked ?? []) {
    if (c.kind !== 'food' || !POINT_TYPES[c.key]?.traits || fagi.brain.facts[c.key]?.tries > 0) continue;
    const now = stance(fagi, c.key);
    if (p.why[c.key] === now) continue;
    p.why[c.key] = now;
    push(narr, fagi, 'why', { key: 'log.why', params: { what: { key: `type.${c.key}` } } }, whyDetail(explain(fagi, c.key)));
  }

  // Something new entered what she perceives: what she did about it.
  if (fagi.rethink && fagi.rethink.n !== p.rethink) {
    p.rethink = fagi.rethink.n;
    const line = rethinkLine(fagi.rethink, th);
    if (line) {
      push(narr, fagi, 'rethink', line.text, line.detail);
      p.action = th.action;   // the change is already told here
    }
  }

  // Goes back to exploring and picks between the leg she left half-done and a new one.
  if (fagi.legChoice && fagi.legChoice.n !== p.leg) {
    p.leg = fagi.legChoice.n;
    const l = legLine(fagi.legChoice);
    push(narr, fagi, 'rethink', l.text, l.detail);
    if (th.action === 'explore') p.action = th.action;
  }

  // Change of decision.
  if (th.action !== p.action) {
    push(narr, fagi, th.action, { key: `action.${th.action}` }, th.reason);
    p.action = th.action;
  }

  return narr.lines;
}

// The explanation in a console line: the stance, the reason that weighs most,
// one bite behind it and the counterfactual. The full list is for the ask card.
function whyDetail(ex) {
  const all = lines(ex);
  const [stanceLine, , ...rest] = all;
  const reason = rest.find((l) => /^why\.(rule|ruleInduced|traitBad|traitGood|nothingLikeIt)$/.test(l.key));
  const bite = rest.find((l) => l.key.startsWith('why.bite.'));
  const ifLine = rest.find((l) => l.key.startsWith('why.if'));
  return [stanceLine, reason, bite, ifLine].filter(Boolean);
}

// The line for a rethink: what she saw, where, and whether she kept going or
// switched. What she doesn't need and changes nothing isn't written: the console
// would fill up with every puddle and every tree that crosses her path.
export function rethinkLine(r, th) {
  const base = {
    what: { key: `type.${r.what}` },
    more: r.count > 1 ? { key: 'log.rethinkMore', params: { n: r.count - 1 } } : '',
    side: { key: `side.${r.side}` },
  };
  if (r.changed && r.forNew) {
    return { text: { key: 'log.rethinkFor', params: base }, detail: th?.reason ?? null };
  }
  if (r.why === 'notNeeded') return null;
  if (r.changed) {
    // She changed plans at the same moment, but not because of the new thing: the
    // new thing is no use to her and what she switches to comes from elsewhere
    // (rising thirst...).
    return {
      text: { key: 'log.rethinkSwitch', params: { ...base, to: { key: `action.${r.to}` } } },
      detail: rethinkWhy(r),
    };
  }
  return {
    text: { key: 'log.rethinkKeep', params: { ...base, action: { key: `action.${r.to}` } } },
    detail: rethinkWhy(r),
  };
}

export function rethinkWhy(r) {
  if (!r.why) return null;
  return { key: `rethink.${r.why}`, params: {
    score: r.score != null ? r.score.toFixed(2) : '–',
    current: r.current != null ? r.current.toFixed(2) : '–',
    min: MIN_SCORE.toFixed(2),
    stick: BRAIN.stickiness.toFixed(2),
    action: { key: `action.${r.to}` },
  } };
}

// Resume the old leg or plot another: which one won and by how much.
export function legLine(c) {
  const f = (v) => (v == null ? '–' : v.toFixed(2));
  return c.resumed
    ? { text: { key: 'log.legResume' }, detail: { key: 'log.legResumeSub', params: { score: f(c.score), rival: f(c.rival) } } }
    : { text: { key: 'log.legNew' }, detail: { key: 'log.legNewSub', params: { score: f(c.score), rival: f(c.rival) } } };
}
