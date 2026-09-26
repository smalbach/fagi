// El panel "Código aprendido": pinta el módulo tal y como lo escribe Fagi,
// y da los cuatro gestos explícitos sobre él — recuperar de otra sesión,
// exportarlo, importarlo, olvidarlo. Nada de esto pasa solo: aprender es
// automático, pero llevarse lo aprendido a otra partida es una decisión.

import { t, onLangChange } from '../i18n.js';
import { exportText, importText, load, restore, wipe } from './store.js';

const CLAVE_BACKEND = 'fagi.backend';
const CLAVE_URL = 'fagi.backend.url';

function leerBackendGuardado() {
  try { return { kind: localStorage.getItem(CLAVE_BACKEND) ?? 'none', url: localStorage.getItem(CLAVE_URL) ?? '' }; }
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

  let vistoSeq = -1;
  let visto = fagi;

  function aviso(key, tipo = 'ok') {
    el.status.textContent = t(key);
    el.status.classList.toggle('error', tipo === 'error');
  }

  function pintarRecuperar() {
    const snap = load();
    el.recover.disabled = !snap;
    el.recover.title = snap ? t('code.recoverFrom', { age: { dur: snap.age } }) : t('code.recoverNone');
  }

  function pintarCodigo(de = fagi) {
    const texto = exportText(de);
    el.code.textContent = texto;
  }

  el.recover.addEventListener('click', () => {
    const snap = load();
    if (!snap) return;
    restore(fagi, snap);
    pintarCodigo();
    aviso('code.recovered');
  });

  el.export.addEventListener('click', () => {
    const texto = exportText(fagi);
    const blob = new Blob([texto], { type: 'text/javascript' });
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
      const texto = await file.text();
      importText(fagi, texto);
      pintarCodigo();
      pintarRecuperar();
      aviso('code.imported');
    } catch (e) {
      aviso('code.importError', 'error');
    }
  });

  el.forget.addEventListener('click', () => {
    wipe(fagi);
    pintarCodigo();
    pintarRecuperar();
  });

  // Quién decide: instinto solo, el emulador local, o una API de verdad.
  // Se guarda en el navegador y se avisa a quien montó el panel para que
  // arme (o desarme) el córtex de verdad.
  if (el.backend) {
    const guardado = leerBackendGuardado();
    el.backend.value = guardado.kind;
    el.backendUrl.value = guardado.url;
    el.backendUrl.hidden = guardado.kind !== 'http';

    const avisarCambio = () => {
      const kind = el.backend.value;
      const url = el.backendUrl.value.trim();
      el.backendUrl.hidden = kind !== 'http';
      try { localStorage.setItem(CLAVE_BACKEND, kind); localStorage.setItem(CLAVE_URL, url); } catch { /* sin localStorage, se queda en memoria */ }
      onBackendChange?.(kind, url);
    };
    el.backend.addEventListener('change', avisarCambio);
    el.backendUrl.addEventListener('change', avisarCambio);
  }

  onLangChange(() => { pintarRecuperar(); });
  pintarRecuperar();
  pintarCodigo();

  return {
    // Repintar el código cada frame sería tirar CPU en vano: solo hace falta
    // cuando algo cambió, y eso es justo lo que cuenta rules.seq.
    // `de`: otra Fagi que enseñar en vez de la propia (la de una sesión que se
    // reproduce). Cambiar de una a otra también obliga a repintar.
    update(de = fagi) {
      if (de.brain.rules.seq === vistoSeq && de === visto) return;
      vistoSeq = de.brain.rules.seq;
      visto = de;
      pintarCodigo(de);
      pintarRecuperar();
    },
  };
}
