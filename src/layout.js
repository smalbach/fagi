// The screen's layout while a session plays or replays (desktop):
//
//   ┌──────── strip: who she is, her needs, the day ────────┬──┐
//   │ map                                    │ dock panel   │ra│
//   ├────────────────────────────────────────┴──────────────┤il│
//   │ console (its two halves side by side)                  │  │
//   └────────────────────────────────────────────────────────┴──┘
//
// Three views:
//   observe  the map alone, and the strip (world.immersive: no aids drawn)
//   normal   the dock shows ONE section at a time (Fagi, Map, Inspector),
//            chosen on the rail; the console lies at the bottom
//   deep     everything at once: a wide dock with every section in columns
//            and a tall console, the map smaller
//
// The dock's width and the console's height are dragged from their edges and
// remembered (one pair for normal, another for deep), as are the view, the
// section, the text size and compact mode. Narrow screens keep their own
// layout (mobile.css).
//
// Setting up a session (desktop): the map large, and beside it ONE wide panel
// with two tabs, what to place on the map and the settings; the buttons to
// start at the foot of the map.

const KEY = 'fagi.layout';
const VIEWS = ['observe', 'normal', 'deep'];
const SECTIONS = ['fagi', 'map', 'inspect'];
const SETUP_TABS = ['map', 'settings'];
const DESKTOP = '(min-width: 861px)';

function readState() {
  try { return { ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return {}; }
}

// `world` gets immersive = (view is observe). `hooks`:
//   isSession()        playing or replaying (the dock layout applies)
//   onSettings()       open the settings
//   isSetup()          setting up a session
//   onRelayout(dock)   the console changed orientation (panel-layout.js)
export function initLayout(world, hooks = {}) {
  const body = document.body;
  const state = { view: 'normal', section: 'fagi', setupTab: 'map', dockOpen: true, zoom: 1, compact: false, sizes: {}, ...readState() };
  if (!SETUP_TABS.includes(state.setupTab)) state.setupTab = 'map';
  if (!VIEWS.includes(state.view)) state.view = 'normal';
  if (!SECTIONS.includes(state.section)) state.section = 'fagi';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* not remembered */ } };

  const rail = document.getElementById('rail');
  const card = document.getElementById('inspect-card');
  const stage = document.getElementById('stage');
  const dockInspect = document.getElementById('dock-inspect');
  const mq = window.matchMedia(DESKTOP);
  let docked = null;
  // Whose sizes: setting up has its own panel width.
  const sizeKey = () => (body.classList.contains('layout-setup') ? 'setup' : state.view);

  function applySizes() {
    const s = state.sizes[sizeKey()] ?? {};
    body.style.setProperty('--dock-w', s.dock ? `${Math.min(s.dock, window.innerWidth * 0.6)}px` : '');
    body.style.setProperty('--bottom-h', s.bottom ? `${Math.min(s.bottom, window.innerHeight * 0.6)}px` : '');
  }

  // Everything that follows from the state, in one go.
  function sync() {
    const session = Boolean(hooks.isSession?.());
    const panelsVisible = session && state.view !== 'observe';
    const dock = panelsVisible && mq.matches;
    body.classList.toggle('layout-mobile', panelsVisible && !mq.matches);
    world.immersive = state.view === 'observe';
    for (const v of VIEWS) body.classList.toggle(`view-${v}`, state.view === v);
    body.classList.toggle('immersive', world.immersive);
    body.classList.toggle('layout-dock', dock);
    body.classList.toggle('layout-setup', Boolean(hooks.isSetup?.()) && mq.matches);
    body.dataset.setup = state.setupTab;
    for (const b of document.querySelectorAll('#setup-tabs [data-setup]')) {
      const on = b.dataset.setup === state.setupTab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    }
    body.classList.toggle('dock-closed', !state.dockOpen && state.view === 'normal');
    body.classList.toggle('compact', state.compact);
    body.dataset.dock = state.section;
    body.style.setProperty('--ui-zoom', String(state.zoom));
    applySizes();
    for (const b of document.querySelectorAll('#view-modes [data-view]')) {
      b.classList.toggle('active', b.dataset.view === state.view);
      b.setAttribute('aria-checked', String(b.dataset.view === state.view));
    }
    for (const b of rail.querySelectorAll('[data-dock]')) {
      const active = state.dockOpen && (state.view === 'deep' || b.dataset.dock === state.section);
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    }
    rail.querySelector('[data-act="compact"]')?.classList.toggle('active', state.compact);
    rail.querySelector('[data-act="compact"]')?.setAttribute('aria-pressed', String(state.compact));
    // The inspector: a card over the map, or a section of the dock.
    const home = panelsVisible ? dockInspect : stage;
    if (card && card.parentElement !== home) home.append(card);
    if (docked !== dock) { docked = dock; hooks.onRelayout?.(dock); }
  }

  function setView(view) {
    state.view = view;
    save();
    sync();
  }

  function show(section) {
    state.section = section;
    state.dockOpen = true;
    save();
    sync();
    if (state.view === 'deep') document.querySelector(`#hud-body > [data-dock="${section}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  for (const b of document.querySelectorAll('#view-modes [data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
  for (const b of document.querySelectorAll('#setup-tabs [data-setup]')) {
    b.addEventListener('click', () => { state.setupTab = b.dataset.setup; save(); sync(); });
  }

  rail.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.dock) {
      // The open section again closes the dock (normal view): the map takes it all.
      if (state.view === 'normal' && state.dockOpen && state.section === b.dataset.dock) state.dockOpen = false;
      else { state.section = b.dataset.dock; state.dockOpen = true; }
      save();
      sync();
      return;
    }
    const act = b.dataset.act;
    if (act === 'console') document.getElementById('btn-toggle-console')?.click();
    else if (act === 'settings') hooks.onSettings?.();
    else if (act === 'smaller' || act === 'bigger') {
      state.zoom = Math.round(Math.min(1.4, Math.max(0.75, state.zoom + (act === 'bigger' ? 0.05 : -0.05))) * 100) / 100;
    } else if (act === 'compact') state.compact = !state.compact;
    save();
    sync();
  });

  // Dragging the dock's left edge and the console's top edge.
  function drag(handle, measure) {
    if (!handle) return;
    handle.addEventListener('pointerdown', (e) => {
      if (!body.classList.contains('layout-dock') && !body.classList.contains('layout-setup')) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      body.classList.add('resizing');
      const move = (ev) => {
        const sizes = (state.sizes[sizeKey()] ??= {});
        Object.assign(sizes, measure(ev));
        applySizes();
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        body.classList.remove('resizing');
        save();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
    // A double click puts it back to its default size.
    handle.addEventListener('dblclick', () => { state.sizes[sizeKey()] = {}; save(); applySizes(); });
  }
  const railW = () => rail.getBoundingClientRect().width;
  drag(document.getElementById('dock-resizer'), (ev) => ({
    dock: Math.round(Math.min(window.innerWidth * 0.7, Math.max(240, window.innerWidth - (body.classList.contains('layout-setup') ? 0 : railW()) - ev.clientX))),
  }));
  drag(document.getElementById('bottom-resizer'), (ev) => ({
    bottom: Math.round(Math.min(window.innerHeight * 0.75, Math.max(120, window.innerHeight - ev.clientY))),
  }));

  // The strip wraps to two rows when the map is narrow: the map leaves it room.
  const strip = document.getElementById('strip');
  if (strip && 'ResizeObserver' in window) {
    new ResizeObserver(() => body.style.setProperty('--strip-h', `${Math.ceil(strip.getBoundingClientRect().height)}px`)).observe(strip);
  }

  window.addEventListener('resize', applySizes);
  mq.addEventListener('change', sync);
  sync();

  return {
    sync,
    get view() { return state.view; },
    // Something was selected: bring the inspector into view (normal view).
    reveal() {
      if (!body.classList.contains('layout-dock') && !body.classList.contains('layout-mobile')) return;
      if (state.view === 'normal' && (state.section !== 'inspect' || !state.dockOpen)) show('inspect');
      else if (state.view === 'deep') show('inspect');
    },
  };
}
