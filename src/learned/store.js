// Persistencia de lo aprendido: creencias, reglas, qué le hizo sentir cada
// cosa (sinapsis concepto→sensación) y cuánto dura un charco. Nunca las demás
// cosas del estado de Fagi (posición, hambre, lo que lleva encima...), ni lo
// que es de un mapa concreto (sitios recordados, lo explorado).
//
// El autoguardado y el módulo exportado llevan exactamente lo mismo. Vive solo en el
// navegador de quien juega: localStorage para guardar una copia recuperable
// entre partidas, y exportar/importar el módulo de código para llevárselo a
// otra sesión.
//
// Nace sin saber nada (memory.js, brain.js): nada de esto se carga sola. Es
// un gesto explícito, "Recuperar lo aprendido", nunca automático al nacer.

import { modernize } from '../legacy.js';
import { LEARN } from '../config.js';
import { renderModule, parseModule } from './dsl.js';

const KEY = 'fagi.learning';

// Una foto de lo aprendido, lista para guardar o exportar.
// Las conexiones que deja aprender por consecuencias (concepto→sensación),
// redondeadas: las de percibir (Hebb) se rehacen solas al volver a ver.
function learnedSynapses(fagi) {
  const outside = {};
  for (const [id, s] of Object.entries(fagi.brain.synapses ?? {})) {
    if (s.kind !== 'feel') continue;
    outside[id] = { a: s.a, b: s.b, kind: 'feel', w: Math.round(s.w * 1000) / 1000, n: s.n ?? 0 };
  }
  return outside;
}

export function snapshot(fagi) {
  return {
    version: 1,
    savedAt: Date.now(),
    age: fagi.age,
    facts: fagi.brain.facts,
    rules: fagi.brain.rules.list,
    // Solo las conexiones aprendidas por consecuencias: las de percibir se
    // rehacen solas en cuanto vuelve a ver las cosas.
    synapses: learnedSynapses(fagi),
    // Cuánto cree que dura un charco: no depende del mapa, vale para la próxima.
    puddleLife: fagi.brain.puddleLife ?? null,
  };
}

export function save(snap, storage = safeStorage()) {
  if (!storage) return false;
  try { storage.setItem(KEY, JSON.stringify(snap)); return true; }
  catch { return false; }
}

export function load(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const rawValue = storage.getItem(KEY);
    if (!rawValue) return null;
    const data = JSON.parse(rawValue);
    if (!data || typeof data !== 'object' || !data.facts) return null;
    return data;
  } catch { return null; }
}

export function hasSnapshot(storage = safeStorage()) {
  return Boolean(load(storage));
}

// Sustituye lo que Fagi cree y las reglas que tiene escritas por lo del
// snapshot. No toca nada más: ni posición, ni necesidades, ni lo que lleva
// encima. Las confirmaciones espaciadas se reinician (lastAt: -Infinity) para
// que la primera confirmación de la nueva partida no cuente como "seguida".
export function restore(fagi, saved) {
  const snap = modernize(saved);
  const facts = {};
  for (const [k, r] of Object.entries(snap.facts ?? {})) facts[k] = { ...r, lastAt: -Infinity };
  fagi.brain.facts = facts;
  fagi.brain.rules.list = (snap.rules ?? []).map((r) => ({ ...r }));
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
  fagi.brain.synapses = {};
  for (const [id, s] of Object.entries(snap.synapses ?? {})) fagi.brain.synapses[id] = { ...s, born: 0, last: 0 };
  fagi.brain.puddleLife = snap.puddleLife ?? null;
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
}

export function exportText(fagi) {
  return renderModule(fagi.brain.rules.list, fagi.brain.facts, {
    age: fagi.age, puddleLife: fagi.brain.puddleLife, synapses: learnedSynapses(fagi),
  });
}

// Lee un archivo importado y, si es válido, sustituye lo aprendido. Lanza con
// un motivo legible si no lo es; en ese caso no toca la memoria de Fagi.
export function importText(fagi, text) {
  const { rules, facts, puddleLife, synapses } = parseModule(text);
  restore(fagi, { facts, rules, puddleLife, synapses });
}

export function wipe(fagi, storage = safeStorage()) {
  fagi.brain.facts = {};
  fagi.brain.synapses = {};
  fagi.brain.puddleLife = null;
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
  fagi.brain.rules.list = [];
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
  fagi.brain.lastRule = null;
  if (storage) { try { storage.removeItem(KEY); } catch { /* nada que borrar */ } }
}

function safeStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}

// Guarda solo de vez en cuando: cada LEARN.autosaveEvery segundos simulados, y
// también cuando algo importante lo pide (morir, cerrar la pestaña). `fagi`
// lleva su propio contador (fagi.saveIn), no uno global de módulo: así cada
// Fagi es independiente y los tests no heredan cuenta atrás de otra prueba.
export function autoSave(fagi, dt, storage = safeStorage()) {
  if (!LEARN.autosave) return;
  fagi.saveIn = (fagi.saveIn ?? LEARN.autosaveEvery) - dt;
  if (fagi.saveIn > 0) return;
  fagi.saveIn = LEARN.autosaveEvery;
  save(snapshot(fagi), storage);
}
