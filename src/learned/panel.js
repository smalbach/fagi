// El panel "Código aprendido": pinta el módulo tal y como lo escribe Fagi,
// y da los cuatro gestos explícitos sobre él — recuperar de otra sesión,
// exportarlo, importarlo, olvidarlo. Nada de esto pasa solo: aprender es
// automático, pero llevarse lo aprendido a otra partida es una decisión.

import { t, onLangChange } from '../i18n.js';
import { exportText, importText, load, restore, wipe } from './store.js';

const BACKEND_KEY = 'fagi.backend';
const URL_KEY = 'fagi.backend.url';

function readSavedBackend() {
  try { return { kind: localStorage.getItem(BACKEND_KEY) ?? 'none', url: localStorage.getItem(URL_KEY) ?? '' }; }
  catch { return { kind: 'none', url: '' }; }
}

// `onBackendChange(kind, url)`: a quién avisar cuando la persona elige quién
// decide. El panel solo guarda la preferencia; montar el backend de verdad es
// cosa de quien lo llama (main.js), que es quien sabe crear el córtex.
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
  // El marcado puede no estar (una página que solo prueba otra cosa): sin él
  // no hay nada que pintar, pero tampoco hace falta romper.
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
    a.download = `fagi-aprendido-${Math.round(fagi.age)}s.js`;
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

  // Quién decide: instinto solo, el emulador local, o una API de verdad.
  // Se guarda en el navegador y se avisa a quien montó el panel para que
  // arme (o desarme) el córtex de verdad.
  if (el.backend) {
    const saved = readSavedBackend();
    el.backend.value = saved.kind;
    el.backendUrl.value = saved.url;
    el.backendUrl.hidden = saved.kind !== 'http';

    const notifyChange = () => {
      const kind = el.backend.value;
      const url = el.backendUrl.value.trim();
      el.backendUrl.hidden = kind !== 'http';
      try { localStorage.setItem(BACKEND_KEY, kind); localStorage.setItem(URL_KEY, url); } catch { /* sin localStorage, se queda en memoria */ }
      onBackendChange?.(kind, url);
    };
    el.backend.addEventListener('change', notifyChange);
    el.backendUrl.addEventListener('change', notifyChange);
  }

  onLangChange(() => { paintRecover(); });
  paintRecover();
  paintCode();

  return {
    // Repintar el código cada frame sería tirar CPU en vano: solo hace falta
    // cuando algo cambió. rules.seq cuenta los cambios de reglas (y en una
    // reproducción, cada foto de la mente); brain.version, todo lo demás que
    // aprende: cada experiencia y el olvido, segundo a segundo.
    // `de`: otra Fagi que enseñar en vez de la propia (la de una sesión que se
    // reproduce). Cambiar de una a otra también obliga a repintar.
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
