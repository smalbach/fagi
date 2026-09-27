// A session's recorder. It writes down, in order, everything that changes: what
// gets created on the map and where, what disappears and why, every setting
// touched, the wind, the pheromone, what Fagi does and where she goes. With that
// replay.js rebuilds any moment of the game without saving a single snapshot.
//
// It knows nothing about the DOM or the network: batches go out through
// `send(events)`, supplied by whoever creates it (sink.js in the browser, an
// array in the tests).
//
// World events arrive through world.rec.emit (world.js sends them). Fagi's and
// the wind's are worked out here, comparing each frame with the previous one,
// like narrator.js does: that way her logic never finds out she's being recorded.
//
// What Fagi has in her head (what she thinks, what she believes, what rules she
// wrote, what effects are still on her) goes in `mind` events that only carry
// the parts that changed, and each console line in a `log` event: with that
// the replay paints the same panels that were seen live.

import { TRACK_FIELDS } from './events.js';
import { normalizeAngle } from '../vision.js';

// Row columns that, if they change, call for a new point: action, target,
// load, target kind, whether she's drinking, exploration leg.
const DISCRETE = [4, 5, 6, 10, 11, 17];

// The path isn't sampled at a fixed rate: Fagi turns up to 6 rad/s and slows
// down to drink or eat, so every half second the replay would join with
// straight lines what were curves and stops. A point is written down only when
// the line from the last written one would no longer pass within `tolPx` of
// some intermediate frame (or the heading would drift more than `tolAngle`);
// then the previous frame is written, the last one that still fit on the line.
// Also when what she's doing changes, and at most every `trackEvery` seconds.
export function createRecorder(world, { send, flushEvery = 5, trackEvery = 0.5, tolPx = 0.5, tolAngle = 0.3, trackBlock = 120, mindEvery = 0.25, thoughtEvery = 1 } = {}) {
  let seq = 0;
  let buffer = [];
  let track = [];
  let lastRow = null;     // last point written
  let pending = [];       // frames since then that the line still covers
  let nextFlush = flushEvery;
  let ended = false;
  let nextMind = 0;
  let lastLog = 0;
  const mindPrev = {};    // part -> JSON of the last thing recorded
  let thoughtAt = -Infinity;
  let deathNoted = false;
  const prev = { meal: 0, picked: 0, stored: 0, pantry: 0, rule: 0, drinking: false, alive: true, windTarget: null };

  function emit(type, data = {}) {
    if (ended) return null;
    const ev = { ...data, seq: seq++, t: world.time, type };
    buffer.push(ev);
    return ev;
  }

  function flush() {
    if (!buffer.length) return;
    const batch = buffer;
    buffer = [];
    send?.(batch);
  }

  function closeTrack() {
    if (!track.length) return;
    emit('track', { t0: track[0][0], t1: track[track.length - 1][0], fields: TRACK_FIELDS, pts: track });
    track = [];
  }

  // The starting snapshot isn't a snapshot: it's the list of what was already on
  // the map at the start, as if it had just been placed.
  function start({ config, learned = null } = {}) {
    // The seeds only decide the drawing (ground texture, shape of each
    // rock), but without them the replay wouldn't look like what was seen.
    emit('session_start', { config, learned, world: { width: world.width, height: world.height, seed: world.seed ?? null } });
    emit('wind', { angle: world.wind.angle, target: world.wind.target });
    prev.windTarget = world.wind.target;
    for (const o of world.objects) emit('obj_add', { id: o.id, what: o.type, x: o.x, y: o.y, r: o.r, source: 'setup', seed: o.seed ?? null });
    for (const p of world.points) emit('point_add', { id: p.id, what: p.type, x: p.x, y: p.y, from: 'setup' });
  }

  function rowEl(fagi) {
    const exploring = fagi.thought?.action === 'explore' && fagi.exploreTarget;
    return [
      round(world.time, 3), round(fagi.x, 1), round(fagi.y, 1), round(fagi.angle, 3),
      fagi.thought?.action ?? null, fagi.target?.id ?? null, fagi.carrying?.type ?? null,
      round(fagi.hunger, 1), round(fagi.thirst, 1), round(fagi.energy, 1),
      fagi.targetKind ?? null, !!fagi.drinking, fagi.castSide ?? 1,
      fagi.lastScent ? round(fagi.lastScent.x, 1) : null, fagi.lastScent ? round(fagi.lastScent.y, 1) : null,
      exploring ? round(fagi.exploreTarget.x, 1) : null, exploring ? round(fagi.exploreTarget.y, 1) : null,
      exploring ? fagi.exploreLegs ?? 0 : null,
      // The body and the sky she feels: soaked, in deep water, probing, pressure.
      Math.ceil(fagi.wet ?? 0), !!fagi.swimming, !!fagi.probing,
      round(fagi.pressure ?? 0, 1), !!fagi.pressureFalling,
    ];
  }

  function aim(row) {
    if (lastRow && row[0] <= lastRow[0]) return;
    pending = pending.filter((p) => p[0] > row[0]);
    track.push(row);
    lastRow = row;
    if (track.length >= trackBlock) closeTrack();
  }

  // Does the line from lastRow to `row` pass close to all the intermediate frames?
  function fits(row) {
    const dt = row[0] - lastRow[0];
    for (const p of pending) {
      const k = dt > 0 ? (p[0] - lastRow[0]) / dt : 0;
      const x = lastRow[1] + (row[1] - lastRow[1]) * k;
      const y = lastRow[2] + (row[2] - lastRow[2]) * k;
      if (Math.hypot(p[1] - x, p[2] - y) > tolPx) return false;
      const ang = lastRow[3] + normalizeAngle(row[3] - lastRow[3]) * k;
      if (Math.abs(normalizeAngle(p[3] - ang)) > tolAngle) return false;
    }
    return true;
  }

  const changesNow = (row) => DISCRETE.some((i) => row[i] !== lastRow[i]);

  function sampleFagi(fagi) {
    const row = rowEl(fagi);
    if (!lastRow) { aim(row); return; }
    const forced = changesNow(row) || row[0] - lastRow[0] >= trackEvery;
    if (!forced && fits(row)) { pending.push(row); return; }
    // The previous frame is the last one the line covered: the point goes there.
    if (pending.length) aim(pending[pending.length - 1]);
    pending = [];
    if (changesNow(row)) aim(row); else pending.push(row);
  }

  // Whatever is left unwritten at the end of the path.
  function closePending() {
    if (pending.length) aim(pending[pending.length - 1]);
    pending = [];
  }

  function observeFagi(fagi) {
    if (fagi.lastMeal && fagi.lastMeal.n !== prev.meal) {
      prev.meal = fagi.lastMeal.n;
      emit('fagi_eat', { what: fagi.lastMeal.type, x: fagi.x, y: fagi.y, reward: fagi.lastMeal.reward ?? null });
    }
    if ((fagi.picked ?? 0) !== prev.picked) {
      prev.picked = fagi.picked ?? 0;
      emit('fagi_pick', { what: fagi.carrying?.type ?? null, x: fagi.x, y: fagi.y });
    }
    if (fagi.lastDeposit && fagi.lastDeposit.n !== prev.stored) {
      prev.stored = fagi.lastDeposit.n;
      emit('fagi_deposit', { what: fagi.lastDeposit.type, total: fagi.lastDeposit.total, x: fagi.x, y: fagi.y });
    }
    if (fagi.lastPantry && fagi.lastPantry.n !== prev.pantry) {
      prev.pantry = fagi.lastPantry.n;
      emit('fagi_pantry', { what: fagi.lastPantry.type, x: fagi.x, y: fagi.y });
    }
    const rule = fagi.brain?.lastRule;
    if (rule && rule.n !== prev.rule) {
      prev.rule = rule.n;
      emit('fagi_rule', { rule: rule.id, kind: rule.kind, key: rule.key, verdict: rule.verdict });
    }
    if (fagi.drinking !== prev.drinking) {
      prev.drinking = fagi.drinking;
      emit(fagi.drinking ? 'fagi_drink_start' : 'fagi_drink_stop', { x: fagi.x, y: fagi.y });
    }
    if (prev.alive && !fagi.alive) {
      emit('fagi_death', { cause: fagi.cause, age: fagi.age, x: fagi.x, y: fagi.y });
    }
    prev.alive = fagi.alive;
  }

  // Only the parts of the mind that changed since last time.
  const slowAt = {};
  function observeMind(fagi) {
    const changes = {};
    let has = false;
    for (const [part, value] of Object.entries(mind(fagi, world.time))) {
      const json = JSON.stringify(value) ?? 'null';
      if (json === mindPrev[part]) continue;
      // What changes little by little (the network, the places, the map of
      // where she's been) isn't needed on every sample: with one every few
      // seconds it looks the same, and the session weighs half as much.
      if (SLOW[part] && fagi.alive && world.time - (slowAt[part] ?? -Infinity) < SLOW[part]) continue;
      if (SLOW[part]) slowAt[part] = world.time;
      // The thought carries distances and scores that move on every
      // sample: if only those numbers change, one per second is enough.
      if (part === 'thought') {
        const signature = thoughtSignature(value);
        if (signature === mindPrev.signature && world.time - thoughtAt < thoughtEvery) continue;
        mindPrev.signature = signature;
        thoughtAt = world.time;
      }
      mindPrev[part] = json;
      // A copy, not the live list: Fagi keeps changing it and the event
      // waits in the buffer until the next send.
      changes[part] = JSON.parse(json);
      has = true;
    }
    if (has) emit('mind', changes);
  }

  // The console's new lines (narrator.js), as they are: keys and data,
  // not sentences, so they read in the language of whoever replays.
  function observeLog(lines) {
    for (const l of lines ?? []) {
      if (l.id <= lastLog) continue;
      lastLog = l.id;
      emit('log', { tag: l.tag, text: l.text, detail: l.detail ?? null, age: round(l.t, 2) });
    }
  }

  // Once per frame, after step(). `lines`: what narrate() returns.
  function observe(fagi, lines) {
    if (ended) return;
    observeLog(lines);
    if (world.time >= nextMind || !fagi.alive) {
      observeMind(fagi);
      nextMind = world.time + mindEvery;
    }
    if (world.wind.target !== prev.windTarget) {
      prev.windTarget = world.wind.target;
      emit('wind', { angle: world.wind.angle, target: world.wind.target });
    }
    observeFagi(fagi);
    if (fagi.alive) sampleFagi(fagi);
    if (!fagi.alive && !deathNoted) {
      // She also moved on the frame she dies: that's the last spot.
      deathNoted = true;
      closePending();
      aim(rowEl(fagi));
      closeTrack();
    }
    if (world.time >= nextFlush) {
      flush();
      nextFlush = world.time + flushEvery;
    }
  }

  function end(reason, fagi, lines) {
    if (ended) return null;
    observeLog(lines);
    if (fagi) { observeFagi(fagi); observeMind(fagi); closePending(); if (fagi.alive) aim(rowEl(fagi)); }
    closeTrack();
    const summary = summarize(fagi);
    emit('session_end', { reason, summary });
    ended = true;
    flush();
    return summary;
  }

  return {
    emit, start, observe, end, flush,
    get seq() { return seq; },
    get ended() { return ended; },
  };
}

// What the panels of Fagi's mind paint (ui.js, console.js, brainmap.js,
// learned/panel.js), with no references to the world and with the numbers
// rounded to what's visible: that way it doesn't change every frame over decimals.
// Parts of the mind that are recorded at most every so many seconds.
const SLOW = { synapses: 4, places: 4, explored: 5 };

function mind(fagi, now) {
  const th = fagi.thought;
  const facts = {};
  for (const [k, r] of Object.entries(fagi.brain?.facts ?? {})) {
    facts[k] = { value: round(r.value, 3), confidence: round(r.confidence, 2), confirms: r.confirms, stage: r.stage, tries: r.tries };
  }
  return {
    thought: th ? {
      action: th.action, reason: th.reason ?? null,
      hungerU: round(th.hungerU, 2), thirstU: round(th.thirstU, 2), energyU: round(th.energyU, 2),
      seesPoints: th.seesPoints ?? 0, smellsPoints: th.smellsPoints ?? 0,
      seesWater: !!th.seesWater, smellsWater: !!th.smellsWater, remembersWater: !!th.remembersWater,
      carrying: th.carrying ?? null,
      rethink: th.rethink ? { ...th.rethink, score: round(th.rethink.score, 2), current: round(th.rethink.current, 2) } : null,
      tier: th.tier ?? null, rule: th.rule ?? null, news: th.news ?? [],
      ranked: (th.ranked ?? []).slice(0, 6).map((r) => ({
        key: r.key, kind: r.kind ?? null, via: r.via ?? null,
        score: round(r.score, 2), dist: round(r.dist, 0),
        confidence: round(r.confidence, 2), stage: r.stage ?? null,
        parts: Object.fromEntries(Object.entries(r.parts ?? {}).map(([k, v]) => [k, round(v, 2)])),
      })),
    } : null,
    facts,
    rules: fagi.brain?.rules?.list ?? [],
    quarantined: [...(fagi.brain?.rules?.quarantined ?? [])],
    lastRule: lastRuleOf(fagi.brain?.lastRule),
    // The network and what she remembers of each place, at the resolution
    // that's visible: that way it's only recorded when something really changes.
    synapses: Object.values(fagi.brain?.synapses ?? {}).map((s) => [s.a, s.b, s.kind, round(s.w, 1), round(s.born, 0)]),
    places: Object.fromEntries(Object.entries(fagi.brain?.places ?? {}).map(([k, p]) => [k, {
      x: step(p.x, 5), y: step(p.y, 5), error: step(p.error, 10), confidence: round(p.confidence, 1), stage: p.stage,
    }])),
    puddleLife: fagi.brain?.puddleLife != null ? Math.round(fagi.brain.puddleLife) : null,
    explored: fagi.explored ? Array.from(fagi.explored, (v) => Math.round(v)).join('') : null,
    episode: episode(fagi.lastEpisode),
    // Effects are stored by when they end, not by how much is left:
    // otherwise they'd change on every sample.
    effects: Object.values(fagi.effects ?? {}).map((e) => ({
      stat: e.stat, mult: e.mult, sec: e.sec, color: e.color, until: round(now + e.time, 2),
    })),
    stats: {
      eaten: fagi.eaten ?? 0, picked: fagi.picked ?? 0, stored: fagi.stored ?? 0,
      directive: !!fagi.directive, trailKey: fagi.trailKey ?? null,
      dunks: fagi.dunks ?? 0, rainLessons: fagi.rainLessons ?? 0, puddleGone: fagi.puddleGone ?? 0,
    },
  };
}

function lastRuleOf(r) {
  return r ? { n: r.n, id: r.id ?? null, kind: r.kind ?? null, key: r.key ?? null, verdict: r.verdict ?? null } : null;
}

// The latest experience: what she tried, what she felt and how it moved the belief.
function episode(ep) {
  if (!ep) return null;
  const photo = (x) => (x ? { value: round(x.value, 3), confidence: round(x.confidence, 2), stage: x.stage } : null);
  return {
    n: ep.n, action: ep.action, key: ep.key, at: round(ep.at, 1), pending: !!ep.pending,
    reward: round(ep.reward, 2), correction: round(ep.correction ?? null, 2),
    sensations: (ep.sensations ?? []).map((x) => ({ sense: x.sense, v: round(x.v, 2) })),
    kind: ep.change?.kind ?? null, before: photo(ep.change?.before), after: photo(ep.change?.after),
  };
}

// What, if it changes, is recorded right away: what she's doing, why (the key,
// not its numbers), what she carries, what she knows about water and which is
// her top candidate.
function thoughtSignature(th) {
  if (!th) return 'null';
  return JSON.stringify([th.action, th.reason?.key ?? th.reason, th.carrying, th.seesWater, th.smellsWater,
    th.remembersWater, th.ranked[0]?.key ?? null, th.rethink?.n ?? 0, th.rule ?? null]);
}

function summarize(fagi) {
  if (!fagi) return {};
  return {
    alive: fagi.alive,
    cause: fagi.cause ?? null,
    age: round(fagi.age, 2),
    eaten: fagi.eaten ?? 0,
    picked: fagi.picked ?? 0,
    stored: fagi.stored ?? 0,
    rules: fagi.brain?.rules?.list?.length ?? 0,
    dunks: fagi.dunks ?? 0,
    rains: fagi.rainLessons ?? 0,
  };
}

function step(v, k) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v / k) * k : null;
}

function round(v, d) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v ?? null;
  const k = 10 ** d;
  return Math.round(v * k) / k;
}
