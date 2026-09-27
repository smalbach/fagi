// Adónde van los lotes del grabador: al servidor, en orden. Si la red falla,
// el lote se queda en cola (y en IndexedDB, por si se cierra la pestaña) y se
// reintenta. Repetir un lote no duplica nada: el servidor lo ignora por seq.

import { post, ApiError } from '../app/api.js';

const DB = 'fagi-sessions';
const STORE = 'pending';
const RETRY_MS = 10_000;

export function createSink(sessionId) {
  const tail = [];
  let sending = false;
  let timer = 0;
  let end = null;          // { reason, age, summary } cuando la sesión se cierra
  let notifyEnd;
  const endSent = new Promise((resolve) => { notifyEnd = resolve; });

  async function pump() {
    if (sending) return;
    sending = true;
    try {
      while (tail.length) {
        try {
          await post(`/sessions/${sessionId}/events`, { events: tail[0] });
          tail.shift();
        } catch (err) {
          // Un 4xx no se arregla reintentando: se descarta y se sigue.
          if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
            console.warn('Lote rechazado por el servidor:', err.code);
            tail.shift();
            continue;
          }
          await savePending(sessionId, tail, end);
          schedule();
          if (end) notifyEnd(false);
          return;
        }
      }
      if (end) {
        try { await post(`/sessions/${sessionId}/end`, end); end.sent = true; notifyEnd(true); }
        catch { await savePending(sessionId, tail, end); schedule(); notifyEnd(false); return; }
      }
      await clearPending(sessionId);
    } finally {
      sending = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(pump, RETRY_MS);
  }

  return {
    send(batch) { tail.push(batch); pump(); },
    // Resuelve cuando el servidor ya tiene la sesión cerrada (o a los 3 s, si
    // no hay red: entonces se queda pendiente y se reintenta).
    end(data) {
      end = data;
      pump();
      return Promise.race([endSent, new Promise((r) => { setTimeout(() => r(false), 3000); })]);
    },
    // Al cerrar la pestaña no hay tiempo de esperar respuestas: se manda lo
    // que quede con keepalive y se deja copia por si no llega.
    unload() {
      savePending(sessionId, tail, end);
      for (const batch of tail) post(`/sessions/${sessionId}/events`, { events: batch }, { keepalive: true }).catch(() => {});
      if (end && !end.sent) post(`/sessions/${sessionId}/end`, end, { keepalive: true }).catch(() => {});
    },
  };
}

// Lo que quedó sin enviar de sesiones anteriores (pestaña cerrada, sin red).
export async function retryPending() {
  const pendingList = await readPending();
  for (const { sessionId, batches, end } of pendingList) {
    const sink = createSink(sessionId);
    for (const batch of batches) sink.send(batch);
    if (end && !end.sent) await sink.end(end);
  }
}

// --- IndexedDB, con todo envuelto: sin ella se sigue funcionando, sin copia ---

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('sin IndexedDB')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'sessionId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function operate(mode, fn) {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const res = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(res?.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    return undefined;
  }
}

function savePending(sessionId, tail, end) {
  if (!tail.length && (!end || end.sent)) return clearPending(sessionId);
  return operate('readwrite', (s) => s.put({ sessionId, batches: [...tail], end }));
}

function clearPending(sessionId) {
  return operate('readwrite', (s) => s.delete(sessionId));
}

async function readPending() {
  return (await operate('readonly', (s) => s.getAll())) ?? [];
}
