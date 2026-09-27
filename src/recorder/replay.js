// Reproductor de sesiones grabadas. No vuelve a simular: aplica los eventos en
// orden (applyEvent) y reconstruye el mundo tal como estaba en cualquier
// instante. Lo que cambia solo con el tiempo —edad de la fruta, feromona que se
// evapora, viento que gira, por dónde va Fagi entre dos muestras— se deriva del
// reloj en view(), no se graba.
//
// Para ir hacia atrás sin reaplicar desde el principio, cada `checkpointEvery`
// segundos se guarda en memoria una copia del estado ya reconstruido. Nunca va
// a disco: la sesión guardada son solo sus eventos.

import { OBJECT_TYPES, TREE, PHERO, WIND, RAIN } from '../config.js';
import { createWorld } from '../world.js';
import { createFagi } from '../fagi.js';
import { normalizeAngle } from '../vision.js';
import { MARKER_TYPES } from './events.js';
import { modernize } from '../legacy.js';

// --- el estado: un mundo con la misma forma que el de verdad ---

export function createReplayState() {
  const world = createWorld();
  world.wind = { angle: 0, target: 0, timer: 0, t: 0 };
  return {
    world,
    config: {},        // id -> valor, tal como estaba en este instante
    configSeq: 0,      // sube con cada cambio de config: quien dibuja reaplica
    windAt: 0,         // cuándo se fijó el último viento
    rainSpans: [],     // [inicio, fin|null] de cada chaparrón: la lluvia lava la feromona
    dead: null,        // { t, cause } si Fagi murió
    ended: null,
    mind: {},          // parte -> valor: lo último que se grabó de su cabeza
    mindSeq: 0,        // sube con cada cambio de reglas: el panel de código repinta
    log: [],           // las últimas líneas de la consola
  };
}

const LOG_MAX = 80;   // las mismas que guarda narrator.js

const byId = (list, id) => list.findIndex((o) => o.id === id);

// Aplica un evento al estado. Pura salvo por mutar `state`.
export function applyEvent(state, ev) {
  const w = state.world;
  switch (ev.type) {
    case 'session_start':
      state.config = { ...(ev.config ?? {}) };
      state.configSeq++;
      if (ev.world?.seed != null) w.seed = ev.world.seed;
      break;
    case 'config':
      state.config[ev.id] = ev.to;
      state.configSeq++;
      break;
    case 'obj_add': {
      const obj = { id: ev.id, x: ev.x, y: ev.y, type: ev.what, r: ev.r ?? OBJECT_TYPES[ev.what]?.radius, born: ev.t };
      if (ev.seed != null) obj.seed = ev.seed;
      const kind = OBJECT_TYPES[ev.what]?.kind;
      if (kind === 'nest') { obj.stock = {}; obj.ages = {}; }
      if (kind === 'spawner') obj.timer = TREE.interval;
      w.objects.push(obj);
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
    case 'obj_resize': {
      const o = w.objects[byId(w.objects, ev.id)];
      if (o) o.r = ev.r;
      break;
    }
    case 'point_add':
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
      const n = nestObj(w);
      if (n) {
        n.stock[ev.what] = (n.stock[ev.what] ?? 0) + 1;
        (n.ages[ev.what] ??= []).push(ev.age ?? 0);
      }
      break;
    }
    case 'nest_take': {
      const n = nestObj(w);
      if (n) {
        n.stock[ev.what] = Math.max(0, (n.stock[ev.what] ?? 0) - 1);
        const list = n.ages[ev.what] ?? [];
        if (list.length) list.splice(list.indexOf(Math.max(...list)), 1);
      }
      break;
    }
    case 'nest_spoil': {
      const n = nestObj(w);
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
      break;   // fagi_* y track no cambian el mundo: los lee view()
  }
  return state;
}

function nestObj(w) {
  return w.objects.find((o) => OBJECT_TYPES[o.type]?.kind === 'nest') ?? null;
}

// --- el reproductor ---

export function createPlayer(eventList, { checkpointEvery = 60 } = {}) {
  const events = eventList.map(modernize).sort((a, b) => a.seq - b.seq);
  const duration = events.reduce((m, e) => Math.max(m, e.t, e.t1 ?? 0), 0);

  // El recorrido de Fagi, todo junto y ordenado, para buscar por tiempo.
  const track = events.filter((e) => e.type === 'track').flatMap((e) => e.pts);
  // Distancia recorrida hasta cada punto: mueve las patas al dibujar.
  const route = [0];
  for (let i = 1; i < track.length; i++) {
    route.push(route[i - 1] + Math.hypot(track[i][1] - track[i - 1][1], track[i][2] - track[i - 1][2]));
  }
  const markers = events.filter((e) => MARKER_TYPES.has(e.type));

  let state = createReplayState();
  let cursor = 0;          // siguiente evento por aplicar
  let time = 0;
  let logEpoch = 0;        // sube al volver atrás: la consola se repinta entera
  const checkpoints = [{ t: 0, cursor: 0, state: clone(state) }];
  const fagi = createFagi();

  function applyUntil(t) {
    while (cursor < events.length && events[cursor].t <= t) {
      const ev = events[cursor];
      // El punto de control se toma ANTES del primer evento que lo pasa.
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
      // Hacia atrás: desde el último punto de control anterior.
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

  // Lo que solo depende del reloj.
  function view() {
    const w = state.world;
    w.time = time;
    for (const p of w.points) p.age = time - p.born;
    for (const o of w.objects) if (o.born !== undefined) o.age = time - o.born;
    w.pheromone = w.pheromone.filter((m) => {
      // Bajo la lluvia se borra RAIN.washPhero veces más rápido, como en vivo.
      const wetOne = rainBetween(state.rainSpans, m.born, time);
      m.life = PHERO.life - (time - m.born) - (RAIN.washPhero - 1) * wetOne;
      return m.life > 0;
    });
    // El viento gira hacia su objetivo a velocidad fija.
    const diff = normalizeAngle(w.wind.target - w.wind.angle);
    const giro = Math.min(Math.abs(diff), WIND.turnRate * Math.max(0, time - state.windAt));
    w.wind.angle = normalizeAngle(w.wind.angle + Math.sign(diff) * giro);
    state.windAt = time;
    putFagi(fagi, track, route, time, state.dead, w);
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

// Fagi en el instante t: entre dos muestras del recorrido se interpola la
// posición y el giro; lo demás (acción, carga, necesidades) es el de la
// muestra anterior.
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
  // Sesiones grabadas antes de que la fila llevara estas columnas: sin ellas.
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
  fagi.carrying = a[6] ? { type: a[6], age: 0 } : null;
  fagi.hunger = a[7];
  fagi.thirst = a[8];
  fagi.energy = a[9];
  fagi.age = t;
  fagi.alive = !(dead && t >= dead.t);
  if (dead && !fagi.alive) fagi.cause = dead.cause;
}

// Su cabeza en el instante t, con la forma que leen los cuadros. Sesiones
// grabadas antes de que existieran los eventos `mind`: la cabeza queda vacía
// y el pensamiento sale del recorrido.
function putMind(fagi, state, t) {
  const m = state.mind;
  if (m.thought) fagi.thought = { ...m.thought, ranked: m.thought.ranked ?? [] };
  else fagi.thought = { ...fagi.thought, ranked: [] };
  fagi.brain.facts = m.facts ?? {};
  fagi.brain.rules.list = m.rules ?? [];
  fagi.brain.rules.quarantined = new Set(m.quarantined ?? []);
  fagi.brain.rules.seq = state.mindSeq;
  // Sesiones viejas guardaban solo el contador.
  fagi.brain.lastRule = typeof m.lastRule === 'number' ? (m.lastRule ? { n: m.lastRule } : null) : (m.lastRule ?? null);
  fagi.lastEpisode = m.episode ?? null;
  fagi.brain.synapses = {};
  for (const [a, b, kind, w, born] of m.synapses ?? []) fagi.brain.synapses[`${a}>${b}`] = { a, b, kind, w, born, last: t, n: 0 };
  fagi.brain.places = m.places ?? {};
  fagi.brain.puddleLife = m.puddleLife ?? null;
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

// Segundos de lluvia entre a y b.
function rainBetween(spans, a, b) {
  let total = 0;
  for (const [init, end] of spans) total += Math.max(0, Math.min(b, end ?? b) - Math.max(a, init));
  return total;
}

function clone(state) {
  // Las estelas de olor no se copian: se regeneran solas al dibujar.
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
