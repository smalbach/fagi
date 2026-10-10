// The panel for editing what is on the map (object-edit.js), under its card
// in the inspector: sliders, and a list for a tree's fruit.
//
// Built once when opened, like the god-mode panel (godmode-panel.js): a slider
// keeps its drag and focus, and the ones nobody is touching catch up a few
// times a second (a tree ages while you look). Letting go records the edit.

import { getLang, labelOf } from './i18n.js';
import { editParams, editParamOf, editSet, noteEdit } from './object-edit.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shown = (p, v) => (p.options ? '' : p.step < 1 ? Number(v).toFixed(2) : String(Math.round(v)));

export function createEditPanel(el) {
  if (!el) return { open() {}, update() {}, close() {}, get isOpen() { return false; } };
  let target = null;
  let world = null;
  let mark = true;          // a running session: edits mark it as touched by hand
  let signature = '';
  let lastPaint = -Infinity;
  const before = new Map();

  el.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-edit]');
    if (!input || !target) return;
    const id = input.dataset.edit;
    if (!before.has(id)) before.set(id, editParamOf(target, id).get(target));
    const done = editSet(world, target, id, Number(input.value));
    if (done) input.closest('.god-row').querySelector('output').textContent = shown(editParamOf(target, id), done.to);
  });
  el.addEventListener('change', (e) => {
    const input = e.target.closest('[data-edit]');
    if (!input || !target) return;
    const id = input.dataset.edit;
    const p = editParamOf(target, id);
    if (input.tagName === 'SELECT') {
      const done = editSet(world, target, id, input.value);
      if (done) noteEdit(world, target, id, done.from, done.to, { mark });
      return;
    }
    const from = before.get(id);
    before.delete(id);
    if (from != null) noteEdit(world, target, id, from, p.get(target), { mark });
  });
  el.addEventListener('click', (e) => { if (e.target.closest('button[data-edit-act="close"]')) close(); });

  function open(o, w, { live = true } = {}) {
    target = o;
    world = w;
    mark = live;
    before.clear();
    build();
  }

  function close() {
    if (!target) return;
    target = null;
    before.clear();
    el.innerHTML = '';
  }

  function build() {
    const params = editParams(target);
    signature = params.map((p) => p.id).join(',');
    const rows = params.map((p) => (p.options
      ? `<label class="god-row"><span>${esc(L(...p.label))}</span>
          <select data-edit="${p.id}">${p.options.map((k) => `<option value="${esc(k)}"${k === p.value ? ' selected' : ''}>${esc(labelOf(k))}</option>`).join('')}</select></label>`
      : `<label class="god-row"><span>${esc(L(...p.label))}</span><output>${shown(p, p.value)}</output>
          <input type="range" data-edit="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}"></label>`)).join('');
    el.innerHTML = `<section class="god-panel edit-panel" aria-label="${L('Edit', 'Editar')}">
      <header class="god-head"><b>✎ ${L('Edit', 'Editar')}</b><small>${esc(labelOf(target.type))} #${target.id}</small>
        <button type="button" data-edit-act="close" class="ins-x" aria-label="${L('Close', 'Cerrar')}">×</button></header>
      ${mark ? `<p class="god-note">${L('Changes apply at once and are recorded: this session is no longer a clean run.',
        'Los cambios se aplican al instante y quedan registrados: esta sesión deja de ser una corrida limpia.')}</p>` : ''}
      ${rows || `<p class="god-note">${L('Nothing to set on this one.', 'Nada que ajustar en esto.')}</p>`}
    </section>`;
    lastPaint = performance.now();
  }

  function refresh() {
    const now = performance.now();
    if (now - lastPaint < 250) return;
    lastPaint = now;
    const params = editParams(target);
    if (params.map((p) => p.id).join(',') !== signature) { build(); return; }
    for (const p of params) {
      const input = el.querySelector(`[data-edit="${p.id}"]`);
      if (!input || before.has(p.id) || input === document.activeElement) continue;
      if (p.options) { input.value = p.value; continue; }
      input.max = String(p.max);
      input.value = String(p.value);
      input.closest('.god-row').querySelector('output').textContent = shown(p, p.value);
    }
  }

  // Once per frame, with whatever the inspector has selected. Anything else
  // selected, it gone from the map, or a replay, closes it.
  // `live`: a running session (setting up the map is not).
  function update(selected, w, allowed, live = mark) {
    if (!target) return;
    if (!allowed || selected !== target || w !== world) { close(); return; }
    if (live !== mark) { mark = live; build(); return; }
    refresh();
  }

  return { open, update, close, get isOpen() { return target != null; } };
}
