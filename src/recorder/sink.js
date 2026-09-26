// Adónde van los lotes del grabador: al servidor, en orden. Si la red falla,
// el lote se queda en cola (y en IndexedDB, por si se cierra la pestaña) y se
// reintenta. Repetir un lote no duplica nada: el servidor lo ignora por seq.

import { post, ApiError } from '../app/api.js';

const DB = 'fagi-sessions';
const STORE = 'pending';
const REINTENTO_MS = 10_000;

export function createSink(sessionId) {
  const cola = [];
  let enviando = false;
  let temporizador = 0;
  let fin = null;          // { reason, age, summary } cuando la sesión se cierra
  let avisarFin;
  const finEnviado = new Promise((resolve) => { avisarFin = resolve; });

  async function bombear() {
    if (enviando) return;
    enviando = true;
    try {
      while (cola.length) {
        try {
          await post(`/sessions/${sessionId}/events`, { events: cola[0] });
          cola.shift();
        } catch (err) {
          // Un 4xx no se arregla reintentando: se descarta y se sigue.
          if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
            console.warn('Lote rechazado por el servidor:', err.code);
            cola.shift();
            continue;
          }
          await guardarPendiente(sessionId, cola, fin);
          programar();
          if (fin) avisarFin(false);
          return;
        }
      }
      if (fin) {
        try { await post(`/sessions/${sessionId}/end`, fin); fin.enviado = true; avisarFin(true); }
        catch { await guardarPendiente(sessionId, cola, fin); programar(); avisarFin(false); return; }
      }
      await borrarPendiente(sessionId);
    } finally {
      enviando = false;
    }
  }

  function programar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(bombear, REINTENTO_MS);
  }

  return {
    send(lote) { cola.push(lote); bombear(); },
    // Resuelve cuando el servidor ya tiene la sesión cerrada (o a los 3 s, si
    // no hay red: entonces se queda pendiente y se reintenta).
    end(datos) {
      fin = datos;
      bombear();
      return Promise.race([finEnviado, new Promise((r) => { setTimeout(() => r(false), 3000); })]);
    },
    // Al cerrar la pestaña no hay tiempo de esperar respuestas: se manda lo
    // que quede con keepalive y se deja copia por si no llega.
    unload() {
      guardarPendiente(sessionId, cola, fin);
      for (const lote of cola) post(`/sessions/${sessionId}/events`, { events: lote }, { keepalive: true }).catch(() => {});
      if (fin && !fin.enviado) post(`/sessions/${sessionId}/end`, fin, { keepalive: true }).catch(() => {});
    },
  };
}

// Lo que quedó sin enviar de sesiones anteriores (pestaña cerrada, sin red).
export async function retryPending() {
  const pendientes = await leerPendientes();
  for (const { sessionId, lotes, fin } of pendientes) {
    const sink = createSink(sessionId);
    for (const lote of lotes) sink.send(lote);
    if (fin && !fin.enviado) await sink.end(fin);
  }
}

// --- IndexedDB, con todo envuelto: sin ella se sigue funcionando, sin copia ---

function abrir() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('sin IndexedDB')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'sessionId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function operar(modo, fn) {
  try {
    const db = await abrir();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, modo);
      const res = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(res?.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    return undefined;
  }
}

function guardarPendiente(sessionId, cola, fin) {
  if (!cola.length && (!fin || fin.enviado)) return borrarPendiente(sessionId);
  return operar('readwrite', (s) => s.put({ sessionId, lotes: [...cola], fin }));
}

function borrarPendiente(sessionId) {
  return operar('readwrite', (s) => s.delete(sessionId));
}

async function leerPendientes() {
  return (await operar('readonly', (s) => s.getAll())) ?? [];
}
