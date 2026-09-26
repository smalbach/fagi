// El grabador de una sesión. Apunta, en orden, todo lo que cambia: lo que se
// crea en el mapa y dónde, lo que desaparece y por qué, cada ajuste tocado, el
// viento, la feromona, lo que Fagi hace y por dónde anda. Con eso replay.js
// reconstruye cualquier instante de la partida sin guardar ni una foto.
//
// No sabe nada del DOM ni de la red: los lotes salen por `send(eventos)`, que
// pone quien lo crea (sink.js en el navegador, un array en los tests).
//
// Los sucesos del mundo llegan por world.rec.emit (world.js los manda). Los de
// Fagi y el viento se sacan aquí, comparando cada frame con el anterior, como
// hace narrator.js: así su lógica no se entera de que la graban.
//
// Lo que Fagi tiene en la cabeza (qué piensa, qué cree, qué reglas escribió,
// qué efectos le duran) va en eventos `mind` que solo llevan las partes que
// cambiaron, y cada línea de la consola en un evento `log`: con eso la
// reproducción pinta los mismos cuadros que se vieron en directo.

import { TRACK_FIELDS } from './events.js';
import { normalizeAngle } from '../vision.js';

// Columnas de la fila que, si cambian, piden punto nuevo: acción, objetivo,
// carga, tipo de objetivo, si bebe, tramo de exploración.
const DISCRETOS = [4, 5, 6, 10, 11, 17];

// El recorrido no se muestrea a ritmo fijo: Fagi gira hasta 6 rad/s y frena
// al beber o comer, así que cada medio segundo la reproducción uniría con
// rectas lo que fueron curvas y paradas. Se apunta un punto solo cuando la
// recta desde el último apuntado dejaría de pasar a menos de `tolPx` de algún
// frame intermedio (o el rumbo se desviaría más de `tolAngle`); entonces se
// apunta el frame anterior, el último que aún cabía en la recta. También al
// cambiar lo que hace, y como mucho cada `trackEvery` segundos.
export function createRecorder(world, { send, flushEvery = 5, trackEvery = 0.5, tolPx = 0.5, tolAngle = 0.3, trackBlock = 120, mindEvery = 0.25, thoughtEvery = 1 } = {}) {
  let seq = 0;
  let buffer = [];
  let track = [];
  let lastRow = null;     // último punto apuntado
  let pending = [];       // frames desde entonces que la recta aún cubre
  let nextFlush = flushEvery;
  let ended = false;
  let nextMind = 0;
  let lastLog = 0;
  const mindPrev = {};    // parte -> JSON de lo último grabado
  let thoughtAt = -Infinity;
  let muerteApuntada = false;
  const prev = { meal: 0, picked: 0, stored: 0, pantry: 0, rule: 0, drinking: false, alive: true, windTarget: null };

  function emit(type, data = {}) {
    if (ended) return null;
    const ev = { ...data, seq: seq++, t: world.time, type };
    buffer.push(ev);
    return ev;
  }

  function flush() {
    if (!buffer.length) return;
    const lote = buffer;
    buffer = [];
    send?.(lote);
  }

  function cerrarTrack() {
    if (!track.length) return;
    emit('track', { t0: track[0][0], t1: track[track.length - 1][0], fields: TRACK_FIELDS, pts: track });
    track = [];
  }

  // La foto de partida no es una foto: es la lista de lo que ya había en el
  // mapa al empezar, como si se acabara de poner.
  function start({ config, learned = null } = {}) {
    // Las semillas solo deciden el dibujo (textura del suelo, forma de cada
    // roca), pero sin ellas la reproducción no se parecería a lo que se vio.
    emit('session_start', { config, learned, world: { width: world.width, height: world.height, seed: world.seed ?? null } });
    emit('wind', { angle: world.wind.angle, target: world.wind.target });
    prev.windTarget = world.wind.target;
    for (const o of world.objects) emit('obj_add', { id: o.id, what: o.type, x: o.x, y: o.y, r: o.r, source: 'setup', seed: o.seed ?? null });
    for (const p of world.points) emit('point_add', { id: p.id, what: p.type, x: p.x, y: p.y, from: 'setup' });
  }

  function fila(fagi) {
    const explorando = fagi.thought?.action === 'explore' && fagi.exploreTarget;
    return [
      round(world.time, 3), round(fagi.x, 1), round(fagi.y, 1), round(fagi.angle, 3),
      fagi.thought?.action ?? null, fagi.target?.id ?? null, fagi.carrying?.type ?? null,
      round(fagi.hunger, 1), round(fagi.thirst, 1), round(fagi.energy, 1),
      fagi.targetKind ?? null, !!fagi.drinking, fagi.castSide ?? 1,
      fagi.lastScent ? round(fagi.lastScent.x, 1) : null, fagi.lastScent ? round(fagi.lastScent.y, 1) : null,
      explorando ? round(fagi.exploreTarget.x, 1) : null, explorando ? round(fagi.exploreTarget.y, 1) : null,
      explorando ? fagi.exploreLegs ?? 0 : null,
    ];
  }

  function apuntar(row) {
    if (lastRow && row[0] <= lastRow[0]) return;
    pending = pending.filter((p) => p[0] > row[0]);
    track.push(row);
    lastRow = row;
    if (track.length >= trackBlock) cerrarTrack();
  }

  // ¿La recta de lastRow a `row` pasa cerca de todos los frames intermedios?
  function cabe(row) {
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

  const cambia = (row) => DISCRETOS.some((i) => row[i] !== lastRow[i]);

  function sampleFagi(fagi) {
    const row = fila(fagi);
    if (!lastRow) { apuntar(row); return; }
    const forzado = cambia(row) || row[0] - lastRow[0] >= trackEvery;
    if (!forzado && cabe(row)) { pending.push(row); return; }
    // El frame anterior es el último que la recta cubría: ahí va el punto.
    if (pending.length) apuntar(pending[pending.length - 1]);
    pending = [];
    if (cambia(row)) apuntar(row); else pending.push(row);
  }

  // Lo que queda sin apuntar al final del recorrido.
  function cerrarPendiente() {
    if (pending.length) apuntar(pending[pending.length - 1]);
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
    const regla = fagi.brain?.lastRule;
    if (regla && regla.n !== prev.rule) {
      prev.rule = regla.n;
      emit('fagi_rule', { rule: regla.id, kind: regla.kind, key: regla.key, verdict: regla.verdict });
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

  // Solo las partes de la mente que cambiaron desde la última vez.
  const lentasAt = {};
  function observeMind(fagi) {
    const cambios = {};
    let hay = false;
    for (const [parte, valor] of Object.entries(mente(fagi, world.time))) {
      const json = JSON.stringify(valor) ?? 'null';
      if (json === mindPrev[parte]) continue;
      // Lo que cambia poco a poco (la red, los sitios, el mapa de por dónde
      // ha pasado) no hace falta a cada muestra: con una cada pocos segundos
      // se ve igual, y la sesión pesa la mitad.
      if (LENTAS[parte] && fagi.alive && world.time - (lentasAt[parte] ?? -Infinity) < LENTAS[parte]) continue;
      if (LENTAS[parte]) lentasAt[parte] = world.time;
      // El pensamiento trae distancias y puntuaciones que se mueven en cada
      // muestra: si solo cambian esos números, basta con uno por segundo.
      if (parte === 'thought') {
        const firma = firmaPensamiento(valor);
        if (firma === mindPrev.firma && world.time - thoughtAt < thoughtEvery) continue;
        mindPrev.firma = firma;
        thoughtAt = world.time;
      }
      mindPrev[parte] = json;
      // Una copia, no la lista viva: Fagi la sigue cambiando y el evento
      // espera en el búfer hasta el próximo envío.
      cambios[parte] = JSON.parse(json);
      hay = true;
    }
    if (hay) emit('mind', cambios);
  }

  // Las líneas nuevas de la consola (narrator.js), tal cual: claves y datos,
  // no frases, para que se lean en el idioma de quien reproduce.
  function observeLog(lines) {
    for (const l of lines ?? []) {
      if (l.id <= lastLog) continue;
      lastLog = l.id;
      emit('log', { tag: l.tag, text: l.text, detail: l.detail ?? null, age: round(l.t, 2) });
    }
  }

  // Una vez por frame, después de step(). `lines`: lo que devuelve narrate().
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
    if (!fagi.alive && !muerteApuntada) {
      // El frame en que muere también se movió: ese es el último sitio.
      muerteApuntada = true;
      cerrarPendiente();
      apuntar(fila(fagi));
      cerrarTrack();
    }
    if (world.time >= nextFlush) {
      flush();
      nextFlush = world.time + flushEvery;
    }
  }

  function end(reason, fagi, lines) {
    if (ended) return null;
    observeLog(lines);
    if (fagi) { observeFagi(fagi); observeMind(fagi); cerrarPendiente(); if (fagi.alive) apuntar(fila(fagi)); }
    cerrarTrack();
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

// Lo que pintan los cuadros de la mente de Fagi (ui.js, consola.js,
// brainmap.js, learned/panel.js), sin referencias al mundo y con los números
// redondeados a lo que se ve: así no cambia cada frame por decimales.
// Partes de la mente que se graban como mucho cada tantos segundos.
const LENTAS = { synapses: 4, places: 4, explored: 5 };

function mente(fagi, now) {
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
      seesWater: !!th.seesWater, smellsWater: !!th.smellsWater, recuerdaAgua: !!th.recuerdaAgua,
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
    lastRule: ultimaRegla(fagi.brain?.lastRule),
    // La red y lo que recuerda del sitio, con la resolución que se ve: así
    // solo se graba cuando algo cambia de verdad.
    synapses: Object.values(fagi.brain?.synapses ?? {}).map((s) => [s.a, s.b, s.kind, round(s.w, 1), round(s.born, 0)]),
    places: Object.fromEntries(Object.entries(fagi.brain?.places ?? {}).map(([k, p]) => [k, {
      x: paso(p.x, 5), y: paso(p.y, 5), error: paso(p.error, 10), confidence: round(p.confidence, 1), stage: p.stage,
    }])),
    explored: fagi.explored ? Array.from(fagi.explored, (v) => Math.round(v)).join('') : null,
    episode: episodio(fagi.lastEpisode),
    // Los efectos se guardan por cuándo acaban, no por lo que les queda:
    // si no, cambiarían en cada muestra.
    effects: Object.values(fagi.effects ?? {}).map((e) => ({
      stat: e.stat, mult: e.mult, sec: e.sec, color: e.color, until: round(now + e.time, 2),
    })),
    stats: {
      eaten: fagi.eaten ?? 0, picked: fagi.picked ?? 0, stored: fagi.stored ?? 0,
      directive: !!fagi.directive, trailKey: fagi.trailKey ?? null,
    },
  };
}

function ultimaRegla(r) {
  return r ? { n: r.n, id: r.id ?? null, kind: r.kind ?? null, key: r.key ?? null, verdict: r.verdict ?? null } : null;
}

// La última experiencia: qué probó, qué sintió y cómo le movió la creencia.
function episodio(ep) {
  if (!ep) return null;
  const foto = (x) => (x ? { value: round(x.value, 3), confidence: round(x.confidence, 2), stage: x.stage } : null);
  return {
    n: ep.n, action: ep.action, key: ep.key, at: round(ep.at, 1), pending: !!ep.pending,
    reward: round(ep.reward, 2), correction: round(ep.correction ?? null, 2),
    sensations: (ep.sensations ?? []).map((x) => ({ sense: x.sense, v: round(x.v, 2) })),
    kind: ep.cambio?.kind ?? null, before: foto(ep.cambio?.before), after: foto(ep.cambio?.after),
  };
}

// Lo que, si cambia, se graba al momento: qué hace, por qué (la clave, no sus
// números), qué lleva, qué sabe del agua y cuál es su primer candidato.
function firmaPensamiento(th) {
  if (!th) return 'null';
  return JSON.stringify([th.action, th.reason?.key ?? th.reason, th.carrying, th.seesWater, th.smellsWater,
    th.recuerdaAgua, th.ranked[0]?.key ?? null, th.rethink?.n ?? 0, th.rule ?? null]);
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
  };
}

function paso(v, k) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v / k) * k : null;
}

function round(v, d) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v ?? null;
  const k = 10 ** d;
  return Math.round(v * k) / k;
}
