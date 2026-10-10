// The side console has too much inside to fit comfortably at once: this
// organizes it into tabs (console+map / code+history) and inside each one
// two halves that can be collapsed or resized by dragging the gutter. That
// dragging is done by Split.js (github.com/nathancahill/split), not our own
// code: on desktop we needed something proven with finger and mouse at the
// same time, and reinventing it by hand fell short on mobile.
//
// On narrow screens Split.js isn't mounted and no height is forced: each
// half simply stacks in the page's normal flow (see the media query in
// src/styles/mobile.css), so there's only one place that scrolls — the whole
// page — instead of several "windows" with their own inner scroll fighting
// over the finger's gesture.

import Split from 'split.js';
import { t, onLangChange } from './i18n.js';

const KEY = 'fagi.panel-layout';
const DESKTOP_MEDIA = '(min-width: 861px)';
const HEADER_HEIGHT = 32; // px of a .pane-head: minimum when dragging and size when collapsed

function readState() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* no localStorage, it doesn't persist */ }
}

function initTabs(root, state) {
  const tabs = [...root.querySelectorAll('#console-tabs > .tab')];
  const panes = [...root.querySelectorAll('.tab-panel')];
  if (tabs.length === 0) return;

  function activate(name) {
    for (const btn of tabs) {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
    for (const panel of panes) panel.hidden = panel.dataset.panel !== name;
    state.tab = name;
    saveState(state);
  }

  for (const btn of tabs) btn.addEventListener('click', () => activate(btn.dataset.tab));
  const initial = tabs.some((b) => b.dataset.tab === state.tab) ? state.tab : tabs[0].dataset.tab;
  activate(initial);
}

// One controller per `.split-pane`: it knows how to collapse/expand each half
// (something that applies on both desktop and mobile) and, only when needed,
// how to mount or unmount the Split.js instance that allows dragging.
function createController(split, state) {
  const key = split.dataset.split;
  const [a, b] = split.querySelectorAll(':scope > .pane');
  const saved = state[key] ?? {};
  let sizesOf = saved.sizes ?? [50, 50];
  let instance = null;

  function markCollapse(pane, collapsedState) {
    pane.classList.toggle('collapsed', collapsedState);
    const btn = pane.querySelector('.pane-toggle');
    btn.textContent = collapsedState ? '▸' : '▾';
    btn.setAttribute('aria-expanded', String(!collapsedState));
  }

  function updateGutter() {
    const anyCollapsed = a.classList.contains('collapsed') || b.classList.contains('collapsed');
    split.classList.toggle('resizer-hidden', anyCollapsed);
  }

  function save() {
    state[key] = {
      sizes: sizesOf,
      collapsed: [a.classList.contains('collapsed'), b.classList.contains('collapsed')],
    };
    saveState(state);
  }

  if (saved.collapsed?.[0]) markCollapse(a, true);
  if (saved.collapsed?.[1]) markCollapse(b, true);
  updateGutter();

  function toggleSplit(pane, other, index) {
    const collapsedState = !pane.classList.contains('collapsed');
    // Both halves can't be collapsed at once: there'd be nothing left to show.
    if (collapsedState && other.classList.contains('collapsed')) markCollapse(other, false);
    markCollapse(pane, collapsedState);
    updateGutter();
    if (instance) {
      if (collapsedState) instance.collapse(index);
      else instance.setSizes(sizesOf);
    }
    save();
  }
  a.querySelector('.pane-toggle').addEventListener('click', () => toggleSplit(a, b, 0));
  b.querySelector('.pane-toggle').addEventListener('click', () => toggleSplit(b, a, 1));

  return {
    // Only called on desktop: here there is a gutter to drag. `direction`:
    // 'vertical' (stacked, the side console) or 'horizontal' (side by side,
    // the console at the bottom: layout.js).
    mount(direction = 'vertical') {
      if (instance) return;
      split.classList.toggle('side-by-side', direction === 'horizontal');
      instance = Split([a, b], {
        direction,
        sizes: sizesOf,
        minSize: HEADER_HEIGHT,
        gutterSize: 8,
        snapOffset: 0,
        onDragEnd(sizes) { sizesOf = sizes; save(); },
      });
      if (a.classList.contains('collapsed')) instance.collapse(0);
      else if (b.classList.contains('collapsed')) instance.collapse(1);
    },
    // Only called on mobile: without Split.js, each half uses its natural height
    // (set by the mobile CSS), with no inline styles to complicate it.
    unmount() {
      if (!instance) return;
      instance.destroy(false, false);
      instance = null;
    },
  };
}

// `root` is the #console section: without it (a page that only tests
// something else) there's nothing to organize.
export function initPanelLayout(root) {
  if (!root) return { setSideBySide() {} };
  const state = readState();
  initTabs(root, state);

  const controllers = [...root.querySelectorAll('.split-pane')].map((sp) => createController(sp, state));

  const mq = window.matchMedia(DESKTOP_MEDIA);
  let direction = 'vertical';
  const sync = () => {
    for (const c of controllers) (mq.matches ? c.mount(direction) : c.unmount());
  };
  mq.addEventListener('change', sync);
  sync();
  return {
    // The console moved (layout.js): its halves go side by side at the bottom.
    setSideBySide(on) {
      const next = on ? 'horizontal' : 'vertical';
      if (next === direction) return;
      direction = next;
      for (const c of controllers) c.unmount();
      for (const sp of root.querySelectorAll('.split-pane')) {
        sp.classList.toggle('side-by-side', on);
        for (const pane of sp.querySelectorAll(':scope > .pane')) pane.style.removeProperty('width'), pane.style.removeProperty('height');
      }
      sync();
    },
  };
}

// One button to open or close ALL the HUD sections (Food, Map, State...) at
// once: closing them one by one on mobile, when what you want is to clear the
// screen to look at the map, was too slow.
export function initHudGroups(hud, btn) {
  if (!hud || !btn) return;
  const groups = () => [...hud.querySelectorAll('.hud-group')];

  // A rail button: an icon, its name in the tooltip and, on phones, beside it.
  function updateButton() {
    const anyOpen = groups().some((g) => g.open);
    const name = t(anyOpen ? 'rail.collapseAll' : 'rail.expandAll');
    btn.firstChild.textContent = anyOpen ? '⊟' : '⊞';
    btn.querySelector('.rail-label').textContent = name;
    btn.title = name;
    btn.setAttribute('aria-label', name);
  }

  btn.addEventListener('click', () => {
    const open = !groups().some((g) => g.open);
    for (const g of groups()) g.open = open;
    updateButton();
  });
  // Closing or opening a section by hand must also refresh the button's
  // label: "toggle" on <details> doesn't bubble, so we listen on each one.
  for (const g of groups()) g.addEventListener('toggle', updateButton);
  onLangChange(updateButton);
  updateButton();
}

// The ▾/▸ button in a header (#hud or #console): hides or shows ALL of that
// panel's content in one go, leaving only the title bar — for when what's in
// the way isn't a section, but the whole panel.
export function initContainerToggle(btn, body, key) {
  if (!btn || !body) return;

  function markRule(collapsedState) {
    body.classList.toggle('collapsed', collapsedState);
    btn.textContent = collapsedState ? '▸' : '▾';
    btn.setAttribute('aria-expanded', String(!collapsedState));
    btn.title = collapsedState ? t('app.showPanel') : t('app.hidePanel');
  }

  let collapsedState = false;
  try { collapsedState = localStorage.getItem(key) === '1'; } catch { /* no localStorage, starts open */ }
  markRule(collapsedState);

  btn.addEventListener('click', () => {
    collapsedState = !body.classList.contains('collapsed');
    markRule(collapsedState);
    try { localStorage.setItem(key, collapsedState ? '1' : '0'); } catch { /* no localStorage, it doesn't persist */ }
  });
  onLangChange(() => markRule(body.classList.contains('collapsed')));
}
