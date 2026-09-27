// The "Learned code" panel: paints the module exactly as Fagi writes it,
// and offers the four explicit actions on it — recover from another session,
// export it, import it, forget it. None of this happens on its own: learning is
// automatic, but taking what was learned into another game is a decision.

import { t, onLangChange } from '../i18n.js';
import { exportText, importText, load, restore, wipe } from './store.js';

const BACKEND_KEY = 'fagi.backend';
const URL_KEY = 'fagi.backend.url';

function readSavedBackend() {
  try { return { kind: localStorage.getItem(BACKEND_KEY) ?? 'none', url: localStorage.getItem(URL_KEY) ?? '' }; }
  catch { return { kind: 'none', url: '' }; }
}

// `onBackendChange(kind, url)`: whom to notify when the person chooses who
// decides. The panel only stores the preference; setting up the real backend is
// up to the caller (main.js), which is the one that knows how to create the cortex.
export function createLearnedPanel(fagi, { onBackendChange } = {}) {
  const el = {
    code: document.getElementById('learned-code'),
    status: document.getElementById('code-status'),
    recover: document.getElementById('btn-recover'),
    export: document.getElementById('btn-export'),
    import: document.getElementById('btn-import'),
    importFile: document.getElementById('btn-import-file'),
    forget: document.getElementById('btn-forget-code'),
    backend: document.getElementById('backend-select'),
    backendUrl: document.getElementById('backend-url'),
  };
  // The markup may be missing (a page that only tests something else): without it
  // there's nothing to paint, but no need to break either.
  if (!el.code) return { update() {} };

  let seenSeq = -1;
  let versionView = -1;
  let seen = fagi;

  function warning(key, type = 'ok') {
    el.status.textContent = t(key);
    el.status.classList.toggle('error', type === 'error');
  }

  function paintRecover() {
    const snap = load();
    el.recover.disabled = !snap;
    el.recover.title = snap ? t('code.recoverFrom', { age: { dur: snap.age } }) : t('code.recoverNone');
  }

  function paintCode(de = fagi) {
    const text = exportText(de);
    el.code.textContent = text;
  }

  el.recover.addEventListener('click', () => {
    const snap = load();
    if (!snap) return;
    restore(fagi, snap);
    paintCode();
    warning('code.recovered');
  });

  el.export.addEventListener('click', () => {
    const text = exportText(fagi);
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fagi-learned-${Math.round(fagi.age)}s.js`;
    a.click();
    URL.revokeObjectURL(url);
  });

  el.import.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', async () => {
    const file = el.importFile.files?.[0];
    el.importFile.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      importText(fagi, text);
      paintCode();
      paintRecover();
      warning('code.imported');
    } catch (e) {
      warning('code.importError', 'error');
    }
  });

  el.forget.addEventListener('click', () => {
    wipe(fagi);
    paintCode();
    paintRecover();
  });

  // Who decides: instinct alone, the local emulator, or a real API.
  // It's stored in the browser and whoever set up the panel is notified so it
  // builds (or tears down) the actual cortex.
  if (el.backend) {
    const saved = readSavedBackend();
    el.backend.value = saved.kind;
    el.backendUrl.value = saved.url;
    el.backendUrl.hidden = saved.kind !== 'http';

    const notifyChange = () => {
      const kind = el.backend.value;
      const url = el.backendUrl.value.trim();
      el.backendUrl.hidden = kind !== 'http';
      try { localStorage.setItem(BACKEND_KEY, kind); localStorage.setItem(URL_KEY, url); } catch { /* no localStorage, it stays in memory */ }
      onBackendChange?.(kind, url);
    };
    el.backend.addEventListener('change', notifyChange);
    el.backendUrl.addEventListener('change', notifyChange);
  }

  onLangChange(() => { paintRecover(); });
  paintRecover();
  paintCode();

  return {
    // Repainting the code every frame would waste CPU for nothing: it's only needed
    // when something changed. rules.seq counts rule changes (and in a
    // replay, each snapshot of the mind); brain.version, everything else she
    // learns: each experience and forgetting, second by second.
    // `de`: another Fagi to show instead of our own (the one from a session being
    // replayed). Switching from one to the other also forces a repaint.
    update(de = fagi) {
      const version = de.brain.version ?? 0;
      if (de.brain.rules.seq === seenSeq && version === versionView && de === seen) return;
      seenSeq = de.brain.rules.seq;
      versionView = version;
      seen = de;
      paintCode(de);
      paintRecover();
    },
  };
}
