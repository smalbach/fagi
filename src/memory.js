// La memoria de Fagi.
//
// Copia tres cosas de los insectos de verdad:
//
//   1. Un recuerdo tiene VALOR y CONFIANZA. El valor es lo aprendido; la
//      confianza, cuánto se fía de ello. En las decisiones pesa el producto.
//   2. Hay tres etapas: corta, media y larga. Se asciende repitiendo, pero solo
//      cuentan las repeticiones ESPACIADAS: cinco bocados seguidos enseñan
//      menos que cinco repartidos en el tiempo.
//   3. Nada se borra: lo que cae es la confianza. Por eso un recuerdo olvidado
//      puede volver a pesar en cuanto se confirma una vez.
//
// De los sitios se recuerda además "más o menos dónde": la posición se
// difumina mientras no se vuelve a ver, así que hay que buscar al llegar.

import { MEMORY, BELIEF_KEYS } from './config.js';

const STAGES = ['corta', 'media', 'larga'];
const DECAY = { corta: 'decayShort', media: 'decayMedium', larga: 'decayLong' };
const CLAVE_GUARDADO = 'fagi.memory';

function nuevoRecuerdo() {
  return { value: 0, confidence: 0, confirms: 0, lastAt: -Infinity, stage: 'corta', tries: 0 };
}

export function createMemory() {
  const facts = {};
  for (const k of BELIEF_KEYS) facts[k] = nuevoRecuerdo();
  const mem = { facts, places: {} };
  if (MEMORY.save) loadLongTerm(mem);
  return mem;
}

export function recall(mem, key) {
  return mem.facts[key] ?? (mem.facts[key] = nuevoRecuerdo());
}

// Lo que pesa un recuerdo al decidir. La confianza lo modula, no lo borra:
// con la confianza a cero sigue quedando el poso de lo aprendido (MEMORY.floor).
export function weight(mem, key) {
  const r = recall(mem, key);
  return r.value * (MEMORY.floor + (1 - MEMORY.floor) * r.confidence);
}

// ¿Le queda curiosidad por esto? La tiene si no lo ha probado o si ya no se fía.
export function curious(mem, key, triesNeeded) {
  const r = recall(mem, key);
  return r.tries < triesNeeded || r.confidence < MEMORY.minConfidence;
}

function subirEtapa(r) {
  if (r.confirms >= MEMORY.toLong) r.stage = 'larga';
  else if (r.confirms >= MEMORY.toMedium) r.stage = 'media';
}

function bajarEtapa(r) {
  const i = STAGES.indexOf(r.stage);
  r.stage = STAGES[Math.max(0, i - 1)];
}

// Una experiencia nueva. `reward` es lo que sintió; `now`, la edad de Fagi.
export function reinforce(mem, key, reward, now, learnRate) {
  const r = recall(mem, key);
  const primera = r.tries === 0;
  const coherente = primera || Math.sign(reward) === Math.sign(r.value) || r.value === 0;
  const espaciada = now - r.lastAt >= MEMORY.spacing;

  const before = { value: r.value, confidence: r.confidence, stage: r.stage };

  // El valor se mueve siempre con la regla delta de toda la vida.
  r.value += learnRate * (reward - r.value);
  r.value = Math.min(1, Math.max(-1, r.value));
  r.tries += 1;
  r.lastAt = now;

  if (primera) {
    r.confidence = MEMORY.first;
  } else if (coherente) {
    // Confirmación. Espaciada consolida; seguida apenas aporta.
    const gain = MEMORY.gain * (espaciada ? 1 : MEMORY.massedGain);
    r.confidence += gain * (1 - r.confidence);
    if (espaciada) { r.confirms += 1; subirEtapa(r); }
  } else {
    // Chasco: se fía mucho menos y el recuerdo se vuelve lábil otra vez.
    r.confidence *= MEMORY.contradiction;
    r.confirms = Math.max(0, r.confirms - 1);
    bajarEtapa(r);
  }
  r.confidence = Math.min(1, Math.max(0, r.confidence));

  return { before, after: { value: r.value, confidence: r.confidence, stage: r.stage },
           kind: primera ? 'primera' : coherente ? (espaciada ? 'confirma' : 'repite') : 'contradice' };
}

// --- sitios ---
// Un sitio recordado guarda dónde CREE que está (x, y), cuánto puede fallar
// (error) y el objeto real que vio, para saber si sigue existiendo.
export function rememberPlace(mem, kind, obj, now) {
  const p = mem.places[kind] ?? (mem.places[kind] = { ...nuevoRecuerdo(), x: obj.x, y: obj.y, error: 0, ref: obj });
  p.ref = obj;
  p.x = obj.x;
  p.y = obj.y;
  p.error = 0;

  const espaciada = now - p.lastAt >= MEMORY.spacing;
  p.lastAt = now;
  p.tries += 1;
  p.confidence += (p.tries === 1 ? MEMORY.first : MEMORY.gain * (espaciada ? 1 : MEMORY.massedGain)) * (1 - p.confidence);
  p.confidence = Math.min(1, p.confidence);
  if (espaciada) { p.confirms += 1; subirEtapa(p); }
  return p;
}

export function recallPlace(mem, kind) {
  const p = mem.places[kind];
  return p && p.confidence > 0 ? p : null;
}

export function forgetPlace(mem, kind) {
  delete mem.places[kind];
}

// El tiempo pasa: la confianza baja y los sitios se van desdibujando.
export function decayMemory(mem, dt) {
  for (const r of Object.values(mem.facts)) {
    r.confidence = Math.max(0, r.confidence - MEMORY[DECAY[r.stage]] * dt);
  }
  for (const p of Object.values(mem.places)) {
    p.confidence = Math.max(0, p.confidence - MEMORY[DECAY[p.stage]] * dt);
    if (p.error < MEMORY.placeErrorMax) {
      p.error = Math.min(MEMORY.placeErrorMax, p.error + MEMORY.placeDrift * dt);
      // La posición recordada deriva despacio: recuerda la zona, no el punto.
      p.x += (Math.random() - 0.5) * MEMORY.placeDrift * dt * 2;
      p.y += (Math.random() - 0.5) * MEMORY.placeDrift * dt * 2;
    }
  }
}

// --- guardar entre partidas ---
// Solo sobrevive lo consolidado: lo que no llegó a memoria larga se pierde al
// cerrar, igual que una experiencia que nunca se repitió lo suficiente.
export function saveLongTerm(mem) {
  if (!MEMORY.save) return;
  const facts = {};
  for (const [k, r] of Object.entries(mem.facts)) {
    if (r.stage === 'larga') facts[k] = { value: r.value, confidence: r.confidence, confirms: r.confirms, stage: r.stage, tries: r.tries };
  }
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ facts }));
  } catch { /* sin localStorage no se guarda nada y ya está */ }
}

export function loadLongTerm(mem) {
  try {
    const crudo = localStorage.getItem(CLAVE_GUARDADO);
    if (!crudo) return;
    const datos = JSON.parse(crudo);
    for (const [k, r] of Object.entries(datos.facts ?? {})) {
      mem.facts[k] = { ...nuevoRecuerdo(), ...r, lastAt: -Infinity };
    }
  } catch { /* guardado ilegible: se empieza de cero */ }
}

export function wipeMemory(mem) {
  for (const k of Object.keys(mem.facts)) mem.facts[k] = nuevoRecuerdo();
  mem.places = {};
  try { localStorage.removeItem(CLAVE_GUARDADO); } catch { /* nada que borrar */ }
}
