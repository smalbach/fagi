// Persistencia de lo aprendido: creencias y reglas, nunca las demás cosas del
// estado de Fagi (posición, hambre, lo que lleva encima...). Vive solo en el
// navegador de quien juega: localStorage para guardar una copia recuperable
// entre partidas, y exportar/importar el módulo de código para llevárselo a
// otra sesión.
//
// Nace sin saber nada (memory.js, brain.js): nada de esto se carga sola. Es
// un gesto explícito, "Recuperar lo aprendido", nunca automático al nacer.

import { LEARN } from '../config.js';
import { renderModule, parseModule } from './dsl.js';

const CLAVE = 'fagi.learning';

// Una foto de lo aprendido, lista para guardar o exportar.
export function snapshot(fagi) {
  return {
    version: 1,
    savedAt: Date.now(),
    age: fagi.age,
    facts: fagi.brain.facts,
    rules: fagi.brain.rules.list,
  };
}

export function save(snap, storage = safeStorage()) {
  if (!storage) return false;
  try { storage.setItem(CLAVE, JSON.stringify(snap)); return true; }
  catch { return false; }
}

export function load(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const crudo = storage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo);
    if (!datos || typeof datos !== 'object' || !datos.facts) return null;
    return datos;
  } catch { return null; }
}

export function hasSnapshot(storage = safeStorage()) {
  return Boolean(load(storage));
}

// Sustituye lo que Fagi cree y las reglas que tiene escritas por lo del
// snapshot. No toca nada más: ni posición, ni necesidades, ni lo que lleva
// encima. Las confirmaciones espaciadas se reinician (lastAt: -Infinity) para
// que la primera confirmación de la nueva partida no cuente como "seguida".
export function restore(fagi, snap) {
  const facts = {};
  for (const [k, r] of Object.entries(snap.facts ?? {})) facts[k] = { ...r, lastAt: -Infinity };
  fagi.brain.facts = facts;
  fagi.brain.rules.list = (snap.rules ?? []).map((r) => ({ ...r }));
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
}

export function exportText(fagi) {
  return renderModule(fagi.brain.rules.list, fagi.brain.facts, { age: fagi.age });
}

// Lee un archivo importado y, si es válido, sustituye lo aprendido. Lanza con
// un motivo legible si no lo es; en ese caso no toca la memoria de Fagi.
export function importText(fagi, text) {
  const { rules, facts } = parseModule(text);
  restore(fagi, { facts, rules });
}

export function wipe(fagi, storage = safeStorage()) {
  fagi.brain.facts = {};
  fagi.brain.rules.list = [];
  fagi.brain.rules.quarantined = new Set();
  fagi.brain.rules.seq += 1;
  fagi.brain.lastRule = null;
  if (storage) { try { storage.removeItem(CLAVE); } catch { /* nada que borrar */ } }
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
