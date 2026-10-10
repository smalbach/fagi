// Player for recorded sessions. It doesn't simulate again: it applies the events
// in order (applyEvent) and rebuilds the world as it was at any moment. What
// changes only with time —fruit age, pheromone evaporating, wind turning,
// where Fagi is between two samples— is derived from the clock in view(), not
// recorded.
//
// To go backwards without reapplying from the start, every `checkpointEvery`
// seconds a copy of the already rebuilt state is kept in memory. It never goes
// to disk: the saved session is just its events.

import { validAppearance } from '../object-appearance.js';
import { OBJECT_TYPES, TREE, PHERO, WIND, RAIN, LIFE } from '../config.js';
import { setSeasonNow } from '../seasons.js';
import { createWorld } from '../world.js';
import { createFagi } from '../fagi.js';
import { nameForId } from '../names.js';
import { normalizeAngle } from '../vision.js';
import { MARKER_TYPES } from './events.js';
import { modernize } from '../legacy.js';
import { addSpecies } from '../chemistry.js';
import { addFruits, addRetired } from '../custom-fruits.js';
import { modernWhen } from '../learned/dsl.js';

// --- the state: a world with the same shape as the real one ---

export function createReplayState() {
  const world = createWorld();
  world.wind = { angle: 0, target: 0, timer: 0, t: 0 };
  return {
    world,
    config: {},        // id -> value, as it was at this moment
    configSeq: 0,      // goes up with each config change: whoever draws reapplies
    windAt: 0,         // when the last wind was set
    rainSpans: [],     // [start, end|null] of each shower: rain washes away the pheromone
    dead: null,        // { t, cause } if Fagi died
    nights: [],        // night reports (organism), in order
    ended: null,
    mind: {},          // part -> value: the last thing recorded from her head
    mindSeq: 0,        // goes up with each rule change: the code panel repaints
    log: [],           // the console's latest lines
    people: {},        // id -> { name, mother, father, generation, sex, bornAt } (names.js)
    // The colony's book (reproduction.js census): eggs laid, hatched, lost.
    life: { matings: 0, laid: 0, hatched: 0, eggsLost: {}, deaths: {}, generations: 0, peak: 0, extinctAt: null, founded: 0 },
    homes: {},         // id -> the nest a member moved to (colony_found)
  };
}

const LOG_MAX = 80;   // the same as narrator.js keeps

const byId = (list, id) => list.findIndex((o) => o.id === id);

// Applies an event to the state. Pure except for mutating `state`.
export function applyEvent(state, ev) {
  const w = state.world;
  switch (ev.type) {
    case 'session_start':
      state.config = { ...(ev.config ?? {}) };
      state.configSeq++;
      if (ev.world?.seed != null) w.seed = ev.world.seed;
      // The map's wild species, so their fruit can be drawn.
      if (ev.world?.species?.length) addSpecies(ev.world.species);
      // The fruit the person made for that session, and the size of its map.
      if (ev.world?.fruits?.length) addFruits(ev.world.fruits);
      if (ev.world?.width) { w.width = ev.world.width; w.height = ev.world.height; }
      // The mud patches of that map (MAPGEN.hazards), so the replay shows them.
      w.mud = (ev.world?.mud ?? []).map((m) => ({ ...m }));
      break;
    case 'config':
      state.config[ev.id] = ev.to;
      state.configSeq++;
      break;
    case 'obj_add': {
      const obj = { id: ev.id, x: ev.x, y: ev.y, type: ev.what, r: ev.r ?? OBJECT_TYPES[ev.what]?.radius, born: ev.t };
      if (ev.seed != null) obj.seed = ev.seed;
      if (ev.fruit) obj.fruit = ev.fruit;
      for (const k of ['interval', 'maxNear', 'life']) if (ev[k] != null) obj[k] = ev[k];
      // Its age goes with the clock (view): it was this old at ev.t.
      if (ev.age != null) obj.born = ev.t - ev.age;
      if (validAppearance(obj.type, ev.appearance)) obj.appearance = ev.appearance;
      // What it already was at the start (recorder.js setupState).
      if (ev.look) obj.look = ev.look;
      if (ev.habitat) obj.habitat = ev.habitat;
      if (ev.seasonal != null) obj.seasonal = ev.seasonal;
      if (ev.bare) obj.bare = 1;
      const kind = OBJECT_TYPES[ev.what]?.kind;
      if (kind === 'nest') {
        obj.stock = { ...(ev.stock ?? {}) };
        obj.ages = Object.fromEntries(Object.entries(obj.stock).map(([k, n]) => [k, Array(n).fill(0)]));
        if (ev.lining) obj.lining = ev.lining.map((l) => ({ ...l }));
      }
      if (kind === 'spawner') obj.timer = TREE.interval;
      w.objects.push(obj);
      break;
    }
    case 'tree_time': {
      const o = w.objects.find((x) => x.id === ev.id);
      if (o) { o.life = ev.life; o.born = ev.t - ev.age; }
      break;
    }
    case 'mud_tread': {
      const m = w.mud?.[ev.i];
      if (m) m.tread = ev.tread;
      break;
    }
    case 'egg': {
      const n = nestObj(w, ev.nest);
      if (n) (n.eggs ??= []).push({ id: ev.id, mother: ev.mother, father: ev.father, sex: ev.sex ?? null, generation: ev.generation ?? 0, inbreeding: ev.inbreeding ?? 0, laidAt: ev.t, progress: 0 });
      state.life.matings += 1;
      state.life.laid += 1;
      break;
    }
    case 'hatch':
    case 'egg_lost': {
      const id = ev.type === 'hatch' ? ev.egg : ev.id;
      for (const n of w.objects) {
        const i = n.eggs?.findIndex((e) => e.id === id) ?? -1;
        if (i !== -1) n.eggs.splice(i, 1);
      }
      if (ev.type === 'hatch') {
        state.life.hatched += 1;
        state.life.generations = Math.max(state.life.generations, ev.generation ?? 0);
      } else state.life.eggsLost[ev.reason] = (state.life.eggsLost[ev.reason] ?? 0) + 1;
      break;
    }
    case 'extinct':
      state.life.extinctAt = ev.at;
      break;
    case 'colony_found':
      state.life.founded += 1;
      for (const id of [ev.female, ev.male]) if (id != null) state.homes[id] = ev.to;
      break;
    case 'tree_bare':
    case 'tree_bears': {
      const o = w.objects.find((x) => x.id === ev.id);
      // Only the look: a bare tree draws without fruit (trees.js isBare).
      if (o) o.bare = ev.type === 'tree_bare' ? 1 : 0;
      break;
    }
    case 'obj_fruit': {
      addRetired(ev.what);
      const o = w.objects.find((x) => x.id === ev.id);
      if (o) o.fruit = ev.what;
      break;
    }
    case 'obj_appearance': {
      const o = w.objects.find((x) => x.id === ev.id);
      if (o && validAppearance(o.type, ev.appearance)) o.appearance = ev.appearance;
      break;
    }
    case 'obj_look': {
      const o = w.objects.find((x) => x.id === ev.id);
      if (o) { o.look = ev.look; o.dryUntil = 0; }
      break;
    }
    case 'nest_line': {
      const n = nestObj(w, ev.nest);
      if (n) (n.lining ??= []).push({ id: ev.id, look: ev.look });
      break;
    }
    case 'thing_contact': {
      const o = w.objects.find((x) => x.id === ev.id);
      if (o && ev.felt === 'sap') o.dryUntil = ev.t + (ev.dry ?? 0);
      break;
    }
    case 'obj_remove': {
      const i = byId(w.objects, ev.id);
      if (i !== -1) w.objects.splice(i, 1);
      break;
    }
    case 'obj_move': {
      const o = w.objects[byId(w.objects, ev.id)];
      if (o) { o.x = ev.x; o.y = ev.y; o.trail = null; }
      break;
    }
    case 'rain': {
      w.rain = { ...(w.rain ?? {}), on: Boolean(ev.on) };
      const lastItem = state.rainSpans.at(-1);
      if (ev.on && !(lastItem && lastItem[1] == null)) state.rainSpans.push([ev.t, null]);
      else if (!ev.on && lastItem && lastItem[1] == null) lastItem[1] = ev.t;
      break;
    }
    case 'season':
      // Older recordings carry only the name and the year.
      w.season = ev.name === 'none' ? null : {
        on: true, name: ev.name, year: ev.year, depth: ev.depth ?? (ev.name === 'winter' ? 1 : ev.name === 'autumn' ? 0.3 : 0),
        cold: ev.cold ?? 0, hot: Boolean(ev.hot), shown: ev.shown ?? ev.name,
      };
      break;
    case 'obj_edit': {
      // Only what the replay draws: a tree's pace and age, a fruit's ripeness.
      const list = ev.point ? w.points : w.objects;
      const o = list[byId(list, ev.id)];
      if (!o) break;
      if (ev.param === 'age') o.born = ev.t - ev.to;
      else if (!ev.point) o[ev.param] = ev.to;
      break;
    }
    case 'obj_resize': {
      const o = w.objects[byId(w.objects, ev.id)];
      if (o) o.r = ev.r;
      break;
    }
    case 'point_add':
      addRetired(ev.what);   // a fruit from before the person made their own
      w.points.push({ id: ev.id, x: ev.x, y: ev.y, type: ev.what, born: ev.t, from: ev.from ?? null });
      break;
    case 'point_rot': {
      const p = w.points[byId(w.points, ev.id)];
      if (p) { p.type = ev.what; p.born = ev.t; p.rotten = true; }
      break;
    }
    case 'point_remove': {
      const i = byId(w.points, ev.id);
      if (i !== -1) w.points.splice(i, 1);
      break;
    }
    case 'nest_store': {
      const n = nestObj(w, ev.nest);
      if (n) {
        n.stock[ev.what] = (n.stock[ev.what] ?? 0) + 1;
        (n.ages[ev.what] ??= []).push(ev.age ?? 0);
      }
      break;
    }
    case 'nest_take': {
      const n = nestObj(w, ev.nest);
      if (n) {
        n.stock[ev.what] = Math.max(0, (n.stock[ev.what] ?? 0) - 1);
        const list = n.ages[ev.what] ?? [];
        if (list.length) list.splice(list.indexOf(Math.max(...list)), 1);
      }
      break;
    }
    case 'nest_spoil': {
      const n = nestObj(w, ev.nest);
      if (n && ev.what) {
        n.stock[ev.what] = Math.max(0, (n.stock[ev.what] ?? 0) - ev.count);
        const list = n.ages[ev.what] ?? [];
        list.sort((a, b) => b - a).splice(0, ev.count);
      }
      break;
    }
    case 'phero_drop':
      w.pheromone.push({ x: ev.x, y: ev.y, dNest: ev.dNest, born: ev.t, life: PHERO.life });
      break;
    case 'wind':
      w.wind.angle = ev.angle;
      w.wind.target = ev.target;
      state.windAt = ev.t;
      break;
    case 'fagi_death':
      state.dead = { t: ev.t, cause: ev.cause };
      break;
    case 'follow':
      // The game followed another of the population from here: alive again.
      state.dead = null;
      state.followed = { t: ev.t, id: ev.id, from: ev.from };
      break;
    case 'people':
      Object.assign(state.people, ev.people);
      break;
    case 'night_report':
      state.nights.push({ t: ev.t, report: ev.report });
      break;
    case 'session_end':
      state.ended = { t: ev.t, reason: ev.reason };
      break;
    case 'mind': {
      const { seq, t, type, ...parts } = ev;
      if ('rules' in parts || 'facts' in parts) state.mindSeq++;
      Object.assign(state.mind, parts);
      break;
    }
    case 'log':
      state.log.push({ id: ev.seq, t: ev.age ?? ev.t, tag: ev.tag, text: ev.text, detail: ev.detail ?? null });
      if (state.log.length > LOG_MAX) state.log.shift();
      break;
    default:
      break;   // fagi_* and track don't change the world: view() reads them
  }
  return state;
}

// The nest an event names; older recordings name none: the first one.
function nestObj(w, id) {
  const nests = w.objects.filter((o) => OBJECT_TYPES[o.type]?.kind === 'nest');
  return (id != null ? nests.find((o) => o.id === id) : null) ?? nests[0] ?? null;
}

// --- the player ---

export function createPlayer(eventList, { checkpointEvery = 60 } = {}) {
  const events = eventList.map(modernize).sort((a, b) => a.seq - b.seq);
  const duration = events.reduce((m, e) => Math.max(m, e.t, e.t1 ?? 0), 0);

  // Fagi's path, all together and sorted, to search by time.
  const track = events.filter((e) => e.type === 'track').flatMap((e) => e.pts);
  // Distance traveled up to each point: moves the legs when drawing.
  const route = [0];
  for (let i = 1; i < track.length; i++) {
    route.push(route[i - 1] + Math.hypot(track[i][1] - track[i - 1][1], track[i][2] - track[i - 1][2]));
  }
  const markers = events.filter((e) => MARKER_TYPES.has(e.type));
  // Her sisters' samples, if the session had a colony: sorted by time.
  const sisterTrack = events.filter((e) => e.type === 'sisters');
  const sisters = new Map();   // id -> the sister drawn, reused frame to frame

  let state = createReplayState();
  let cursor = 0;          // next event to apply
  let time = 0;
  let logEpoch = 0;        // goes up when going back: the console repaints whole
  const checkpoints = [{ t: 0, cursor: 0, state: clone(state) }];
  const fagi = createFagi();

  function applyUntil(t) {
    while (cursor < events.length && events[cursor].t <= t) {
      const ev = events[cursor];
      // The checkpoint is taken BEFORE the first event that goes past it.
      const lastItem = checkpoints[checkpoints.length - 1];
      if (ev.t - lastItem.t >= checkpointEvery && cursor > lastItem.cursor) {
        checkpoints.push({ t: events[cursor - 1].t, cursor, state: clone(state) });
      }
      applyEvent(state, ev);
      cursor++;
    }
  }

  function seek(t) {
    t = Math.max(0, Math.min(duration, t));
    if (t < time) {
      // Backwards: from the latest earlier checkpoint.
      let cp = checkpoints[0];
      for (const c of checkpoints) if (c.t <= t) cp = c;
      state = clone(cp.state);
      cursor = cp.cursor;
      logEpoch++;
    }
    applyUntil(t);
    time = t;
    return view();
  }

  // What depends only on the clock.
  function view() {
    const w = state.world;
    w.time = time;
    for (const p of w.points) p.age = time - p.born;
    for (const o of w.objects) if (o.born !== undefined) o.age = time - o.born;
    w.pheromone = w.pheromone.filter((m) => {
      // Under the rain it fades RAIN.washPhero times faster, as when live.
      const wetOne = rainBetween(state.rainSpans, m.born, time);
      m.life = PHERO.life - (time - m.born) - (RAIN.washPhero - 1) * wetOne;
      return m.life > 0;
    });
    // The wind turns toward its target at a fixed speed.
    const diff = normalizeAngle(w.wind.target - w.wind.angle);
    const turn = Math.min(Math.abs(diff), WIND.turnRate * Math.max(0, time - state.windAt));
    w.wind.angle = normalizeAngle(w.wind.angle + Math.sign(diff) * turn);
    state.windAt = time;
    putFagi(fagi, track, route, time, state.dead, w);
    const nights = state.nights ?? [];
    fagi.lastNightReport = nights.at(-1)?.report ?? null;
    fagi.consolidations = nights.length;
    // The season as recorded: the sky, the ground and the leaves draw it.
    setSeasonNow(w.season);
    // An egg's progress, at the usual pace (the nest's warmth isn't kept).
    for (const n of w.objects) for (const egg of n.eggs ?? []) egg.progress = Math.min(1, (time - egg.laidAt) / Math.max(1, LIFE.incubation));
    fagi.id = state.followed?.id ?? (sisterTrack.length ? 1 : undefined);
    // The colony: the one followed and her sisters, and its book (census).
    w.colony = sisterTrack.length
      ? { ants: [fagi, ...putSisters(sisters, sisterTrack, time, state.people, state.homes)], life: { ...state.life, peak: Math.max(state.life.peak, sisters.size + 1) } }
      : null;
    // Who is who: the family tree is the lineage the game kept.
    w.lineage = state.people;
    const me = state.people[fagi.id ?? 1];
    if (me) Object.assign(fagi, { name: me.name ?? fagi.name, sex: me.sex ?? fagi.sex, generation: me.generation });
    bodyOf(fagi, me);
    if (state.homes[fagi.id] != null) fagi.home = state.homes[fagi.id];
    // An old recording names no one: the same made-up name on every seek.
    if (!me?.name) fagi.name = nameForId(fagi.id ?? 1, fagi.sex);
    putMind(fagi, state, time);
    return { world: w, fagi, time, config: state.config, configSeq: state.configSeq };
  }

  return {
    events, markers, track, duration,
    seek,
    advance: (dt) => seek(time + dt),
    get time() { return time; },
    get world() { return state.world; },
    get fagi() { return fagi; },
    get config() { return state.config; },
    get configSeq() { return state.configSeq; },
    get log() { return state.log; },
    get logEpoch() { return logEpoch; },
  };
}

// Her organs and her caste as recorded with who she is (people).
function bodyOf(f, who) {
  if (who?.morph) f.morph = who.morph;
  if (who?.caste) f.casteProfile = { dominant: who.caste, affinities: { [who.caste]: 1 } };
}

// Her sisters at moment t, between the two samples around it. A row:
// [id, x, y, angle, alive, carrying, stage, action, home, hunger, feel, hauling]
// (recorder.js observeSisters); older ones end after the load or the stage.
function putSisters(sisters, samples, t, people = {}, homes = {}) {
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= t) lo = mid; else hi = mid;
  }
  if (samples[hi].t <= t) lo = hi;
  const a = samples[lo];
  const b = samples[Math.min(lo + 1, samples.length - 1)];
  if (t < a.t) return [];
  const k = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0;
  const next = new Map(b.ants.map((s) => [s[0], s]));
  return a.ants.map(([id, x, y, angle, alive, carrying, stage, action, home, hunger, feel, hauling]) => {
    const n = next.get(id) ?? [id, x, y, angle, alive, carrying];
    const f = sisters.get(id) ?? { id, sister: true, stride: 0, castSide: 1, effects: {} };
    const nx = x + (n[1] - x) * k;
    const ny = y + (n[2] - y) * k;
    f.stride += Math.hypot(nx - (f.x ?? nx), ny - (f.y ?? ny));
    Object.assign(f, { x: nx, y: ny, angle: angle + normalizeAngle(n[3] - angle) * k, alive: Boolean(alive), carrying: carrying ? { type: carrying } : null, lifeStage: stage ?? 'adult' });
    f.thought = action ? { action } : null;
    f.hunger = hunger ?? 0;
    f.thermalFeel = feel ?? null;
    f.hauling = hauling ?? null;
    if (home != null) f.home = home;
    else if (homes[id] != null) f.home = homes[id];
    const who = people[id];
    if (who) Object.assign(f, { name: who.name ?? f.name, sex: who.sex, generation: who.generation });
    bodyOf(f, who);
    f.name ??= nameForId(id, f.sex);
    sisters.set(id, f);
    return f;
  });
}

// Fagi at moment t: between two path samples the position and heading are
// interpolated; the rest (action, load, needs) is taken from the previous
// sample.
function putFagi(fagi, track, route, t, dead, w) {
  if (!track.length) { fagi.alive = !dead; return; }
  let lo = 0;
  let hi = track.length - 1;
  if (t <= track[0][0]) hi = 0;
  else {
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (track[mid][0] <= t) lo = mid; else hi = mid;
    }
    if (track[hi][0] <= t) lo = hi;
  }
  const a = track[lo];
  const b = track[Math.min(lo + 1, track.length - 1)];
  const k = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0;
  fagi.x = a[1] + (b[1] - a[1]) * k;
  fagi.y = a[2] + (b[2] - a[2]) * k;
  fagi.angle = a[3] + normalizeAngle(b[3] - a[3]) * k;
  fagi.stride = route[lo] + (route[Math.min(lo + 1, track.length - 1)] - route[lo]) * k;
  fagi.thought = { action: a[4] ?? 'explore', reason: null };
  // Sessions recorded before the row carried these columns: without them.
  fagi.target = a[5] != null ? (w.points.find((p) => p.id === a[5]) ?? w.objects.find((o) => o.id === a[5]) ?? null) : null;
  fagi.targetKind = a[10] ?? null;
  fagi.drinking = !!a[11];
  fagi.castSide = a[12] ?? 1;
  fagi.lastScent = a[13] != null ? { x: a[13], y: a[14] } : null;
  fagi.exploreTarget = a[15] != null ? { x: a[15], y: a[16], inView: true } : null;
  fagi.exploreLegs = a[17] ?? 0;
  fagi.wet = a[18] ?? 0;
  fagi.swimming = !!a[19];
  fagi.probing = !!a[20];
  fagi.pressure = a[21] ?? 0;
  fagi.pressureFalling = !!a[22];
  // Sessions from before the organism: the neutral body.
  fagi.temperature = a[23] ?? null;
  fagi.thermalStress = a[24] ?? 0;
  fagi.sleepPressure = a[25] ?? 0;
  fagi.sex = a[26] ?? null;
  // How she looks; older sessions without these columns: an adult at ease.
  fagi.lifeStage = a[27] ?? 'adult';
  fagi.thermalFeel = a[28] ?? null;
  fagi.hauling = a[29] ?? null;
  fagi.justLearnedCode = a[30] ?? 0;
  fagi.carrying = a[6] ? { type: a[6], age: 0 } : null;
  fagi.hunger = a[7];
  fagi.thirst = a[8];
  fagi.energy = a[9];
  fagi.age = t;
  fagi.alive = !(dead && t >= dead.t);
  if (dead && !fagi.alive) fagi.cause = dead.cause;
}

// Her head at moment t, in the shape the panels read. Sessions recorded
// before `mind` events existed: the head stays empty and the thought comes
// from the path.
function putMind(fagi, state, t) {
  const m = state.mind;
  if (m.thought) fagi.thought = { ...m.thought, ranked: m.thought.ranked ?? [] };
  else fagi.thought = { ...fagi.thought, ranked: [] };
  fagi.brain.facts = m.facts ?? {};
  fagi.brain.rules.list = (m.rules ?? []).map(modernWhen);
  fagi.brain.rules.quarantined = new Set(m.quarantined ?? []);
  fagi.brain.rules.seq = state.mindSeq;
  // Old sessions only stored the counter.
  fagi.brain.lastRule = typeof m.lastRule === 'number' ? (m.lastRule ? { n: m.lastRule } : null) : (m.lastRule ?? null);
  fagi.lastEpisode = m.episode ?? null;
  fagi.brain.synapses = {};
  for (const [a, b, kind, w, born] of m.synapses ?? []) fagi.brain.synapses[`${a}>${b}`] = { a, b, kind, w, born, last: t, n: 0 };
  fagi.brain.places = m.places ?? {};
  fagi.brain.puddleLife = m.puddleLife ?? null;
  fagi.brain.cues = m.cues ?? {};
  fagi.brain.bites = m.bites ?? [];
  if (typeof m.explored === 'string' && fagi.explored?.length === m.explored.length) {
    for (let i = 0; i < m.explored.length; i++) fagi.explored[i] = Number(m.explored[i]);
  }
  fagi.effects = {};
  for (const e of m.effects ?? []) {
    const remains = e.until - t;
    if (remains > 0) fagi.effects[e.stat] = { stat: e.stat, mult: e.mult, sec: e.sec, color: e.color, time: remains };
  }
  const st = m.stats ?? {};
  fagi.eaten = st.eaten ?? 0;
  fagi.picked = st.picked ?? 0;
  fagi.stored = st.stored ?? 0;
  fagi.dunks = st.dunks ?? 0;
  fagi.rainLessons = st.rainLessons ?? 0;
  fagi.puddleGone = st.puddleGone ?? 0;
  fagi.directive = st.directive ? {} : null;
  fagi.trailKey = st.trailKey ?? null;
}

// Seconds of rain between a and b.
function rainBetween(spans, a, b) {
  let total = 0;
  for (const [init, end] of spans) total += Math.max(0, Math.min(b, end ?? b) - Math.max(a, init));
  return total;
}

function clone(state) {
  // Scent plumes aren't copied: they regenerate on their own when drawing.
  const copy = structuredClone({
    ...state,
    world: {
      ...state.world,
      rec: null,
      points: state.world.points.map(({ trail, ...p }) => p),
      objects: state.world.objects.map(({ trail, ...o }) => o),
    },
  });
  return copy;
}
