// Where the recorder's batches go: to the server, in order. If the network
// fails, the batch stays queued (and in IndexedDB, in case the tab closes) and
// is retried. Repeating a batch duplicates nothing: the server ignores it by seq.

import { post, ApiError } from '../app/api.js';

const DB = 'fagi-sessions';
const STORE = 'pending';
const RETRY_MS = 10_000;

export function createSink(sessionId) {
  const tail = [];
  let sending = false;
  let timer = 0;
  let end = null;          // { reason, age, summary } when the session closes
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
          // A 4xx isn't fixed by retrying: drop it and move on.
          if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
            console.warn('Batch rejected by the server:', err.code);
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
    // Resolves when the server has the session closed (or after 3 s, if
    // there's no network: then it stays pending and is retried).
    end(data) {
      end = data;
      pump();
      return Promise.race([endSent, new Promise((r) => { setTimeout(() => r(false), 3000); })]);
    },
    // When the tab closes there's no time to wait for replies: whatever is
    // left is sent with keepalive and a copy is kept in case it doesn't arrive.
    unload() {
      savePending(sessionId, tail, end);
      for (const batch of tail) post(`/sessions/${sessionId}/events`, { events: batch }, { keepalive: true }).catch(() => {});
      if (end && !end.sent) post(`/sessions/${sessionId}/end`, end, { keepalive: true }).catch(() => {});
    },
  };
}

// Whatever was left unsent from previous sessions (tab closed, no network).
export async function retryPending() {
  const pendingList = await readPending();
  for (const { sessionId, batches, end } of pendingList) {
    const sink = createSink(sessionId);
    for (const batch of batches) sink.send(batch);
    if (end && !end.sent) await sink.end(end);
  }
}

// --- IndexedDB, all wrapped: without it things keep working, with no copy ---

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no IndexedDB')); return; }
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
