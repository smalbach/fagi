// The god-mode panel: sliders for one Fagi's numbers (godmode.js), under
// her card in the inspector.
//
// Built once when opened and never repainted wholesale, so a slider keeps
// its drag and its focus; a few times a second the sliders nobody is
// touching catch up with her (hunger keeps rising while you look).
//
// Dragging changes her at once; letting go records the edit, once, from the
// value before the drag to the one after.

import { getLang } from './i18n.js';
import { fullName } from './names.js';
import { godParams, godSet, godPreset, noteGod, paramById } from './godmode.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const GROUPS = [
  ['state', ['State', 'Estado']],
  ['body', ['Body (her own draw)', 'Cuerpo (su propia variación)']],
  ['habits', ['Habits', 'Hábitos']],
];

// Her identity for the panel: the id in a colony, the object itself alone.
const keyOf = (f) => f?.id ?? f;

function shown(p, v) {
  if (p.show) return p.show(v);
  if (p.group === 'body') return `×${v.toFixed(2)}`;
  return p.step < 1 ? v.toFixed(2) : String(Math.round(v));
}

export function createGodPanel(el, { onClose } = {}) {
  if (!el) return { open() {}, update() {}, close() {}, get isOpen() { return false; } };
  let key = null;          // whose panel it is, null = closed
  let target = null;       // her, as of the last frame
  let world = null;
  let signature = '';      // which parameters are on: rebuilt when it changes
  let lastPaint = -Infinity;
  const before = new Map();   // param -> value before the drag in progress

  el.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-god]');
    if (!input || !target) return;
    const id = input.dataset.god;
    const p = paramById(id);
    if (!before.has(id)) before.set(id, p.get(target));
    const done = godSet(world, target, id, Number(input.value), { log: false });
    if (done) input.closest('.god-row').querySelector('output').textContent = shown(p, done.to);
  });
  el.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-god]');
    if (!input || !target) return;
    const id = input.dataset.god;
    const from = before.get(id);
    before.delete(id);
    const to = paramById(id).get(target);
    if (from != null && from !== to) noteGod(world, target, id, from, to);
    paintCount();
  });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-god-act]');
    if (!b) return;
    const act = b.dataset.godAct;
    if (act === 'close') close();
    else if (target && (act === 'restore' || act === 'standardBody')) {
      godPreset(world, target, act);
      refresh(true);
    }
  });

  function open(f, w) {
    key = keyOf(f);
    target = f;
    world = w;
    before.clear();
    build();
  }

  function close() {
    if (key == null) return;
    key = null;
    target = null;
    before.clear();
    el.innerHTML = '';
    onClose?.();
  }

  function build() {
    const params = godParams(target);
    signature = params.map((p) => p.id).join(',');
    const groups = GROUPS.map(([g, title]) => {
      const rows = params.filter((p) => p.group === g).map((p) => `
        <label class="god-row">
          <span>${esc(L(...p.label))}</span>
          <output>${shown(p, p.value)}</output>
          <input type="range" data-god="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}">
        </label>`).join('');
      return rows ? `<div class="god-group"><h4>${L(...title)}</h4>${rows}</div>` : '';
    }).join('');
    el.innerHTML = `<section class="god-panel" aria-label="${L('God mode', 'Modo dios')}">
      <header class="god-head"><b>⚡ ${L('God mode', 'Modo dios')}</b><small>${esc(fullName(target) || '')}</small>
        <button type="button" data-god-act="close" class="ins-x" aria-label="${L('Close', 'Cerrar')}">×</button></header>
      <p class="god-note">${L(
        'Changes apply at once and are recorded: this session is no longer a clean run.',
        'Los cambios se aplican al instante y quedan registrados: esta sesión deja de ser una corrida limpia.')}
        <span class="god-count"></span></p>
      <div class="god-actions">
        <button type="button" data-god-act="restore">${L('Fill her needs', 'Saciarla')}</button>
        <button type="button" data-god-act="standardBody">${L('Standard body', 'Cuerpo estándar')}</button>
      </div>
      ${groups}
    </section>`;
    paintCount();
    lastPaint = performance.now();
  }

  function paintCount() {
    const n = world?.god ?? 0;
    const out = el.querySelector('.god-count');
    if (out) out.textContent = n ? L(` ${n} edit${n === 1 ? '' : 's'} so far.`, ` ${n} cambio${n === 1 ? '' : 's'} hasta ahora.`) : '';
  }

  // The sliders nobody is holding follow her numbers.
  function refresh(force = false) {
    const now = performance.now();
    if (!force && now - lastPaint < 250) return;
    lastPaint = now;
    const params = godParams(target);
    if (params.map((p) => p.id).join(',') !== signature) { build(); return; }
    for (const p of params) {
      const input = el.querySelector(`input[data-god="${p.id}"]`);
      if (!input || before.has(p.id) || input === document.activeElement) continue;
      input.max = String(p.max);
      input.value = String(p.value);
      input.closest('.god-row').querySelector('output').textContent = shown(p, p.value);
    }
    paintCount();
  }

  // Once per frame, with whatever the inspector has selected. `allowed`:
  // a live session (not setting up, not a replay). Anyone else selected,
  // her death or leaving the session closes it.
  function update(selected, w, allowed) {
    if (key == null) return;
    if (!allowed || !selected || keyOf(selected) !== key || !selected.alive) { close(); return; }
    target = selected;
    world = w;
    refresh();
  }

  return { open, update, close, get isOpen() { return key != null; } };
}
