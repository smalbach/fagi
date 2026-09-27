// La consola lateral tiene demasiado dentro para caber cómoda a la vez: esto
// la organiza en pestañas (consola+mapa / código+histórico) y dentro de cada
// una dos mitades que se pueden colapsar o redimensionar arrastrando el
// tirador. Ese arrastre lo hace Split.js (github.com/nathancahill/split),
// no código propio: en el escritorio hacía falta algo probado con el dedo y
// con el ratón a la vez, y reinventarlo a mano se quedaba corto en móvil.
//
// En pantallas angostas ni se monta Split.js ni se fuerza ningún alto: cada
// mitad simplemente se apila en el flujo normal de la página (ver el media
// query junto a #consola en index.html), así que solo hay un sitio con
// scroll — la página entera — en vez de varias "ventanas" con su propio
// scroll interno peleándose por el gesto del dedo.

import Split from 'split.js';
import { t, onLangChange } from './i18n.js';

const KEY = 'fagi.panel-layout';
const DESKTOP_MEDIA = '(min-width: 861px)';
const HEADER_HEIGHT = 32; // px de un .pane-head: mínimo al arrastrar y tamaño al colapsar

function readState() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin localStorage, no persiste */ }
}

function initTabs(root, state) {
  const tabs = [...root.querySelectorAll('#console-tabs > .tab')];
  const paneles = [...root.querySelectorAll('.tab-panel')];
  if (tabs.length === 0) return;

  function activate(name) {
    for (const btn of tabs) {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
    for (const panel of paneles) panel.hidden = panel.dataset.panel !== name;
    state.tab = name;
    saveState(state);
  }

  for (const btn of tabs) btn.addEventListener('click', () => activate(btn.dataset.tab));
  const initial = tabs.some((b) => b.dataset.tab === state.tab) ? state.tab : tabs[0].dataset.tab;
  activate(initial);
}

// Un controlador por `.split-pane`: sabe colapsar/expandir cada mitad (algo
// que vale tanto en escritorio como en móvil) y, solo cuando hace falta,
// montar o desmontar la instancia de Split.js que permite arrastrar.
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
    // Las dos mitades no pueden colapsarse a la vez: no quedaría nada que mostrar.
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
    // Solo se llama en escritorio: aquí sí hay un tirador que arrastrar.
    mount() {
      if (instance) return;
      instance = Split([a, b], {
        direction: 'vertical',
        sizes: sizesOf,
        minSize: HEADER_HEIGHT,
        gutterSize: 8,
        snapOffset: 0,
        onDragEnd(sizes) { sizesOf = sizes; save(); },
      });
      if (a.classList.contains('collapsed')) instance.collapse(0);
      else if (b.classList.contains('collapsed')) instance.collapse(1);
    },
    // Solo se llama en móvil: sin Split.js, cada mitad usa su alto natural
    // (definido por el CSS de móvil), sin estilos inline que lo compliquen.
    unmount() {
      if (!instance) return;
      instance.destroy(false, false);
      instance = null;
    },
  };
}

// `root` es la sección #consola: sin ella (una página que solo prueba otra
// cosa) no hay nada que organizar.
export function initPanelLayout(root) {
  if (!root) return;
  const state = readState();
  initTabs(root, state);

  const controllers = [...root.querySelectorAll('.split-pane')].map((sp) => createController(sp, state));

  const mq = window.matchMedia(DESKTOP_MEDIA);
  const sync = () => {
    for (const c of controllers) (mq.matches ? c.mount() : c.unmount());
  };
  mq.addEventListener('change', sync);
  sync();
}

// Un botón para abrir o cerrar TODAS las secciones del HUD (Food, Map,
// State...) de una vez: cerrarlas una por una en el móvil, cuando lo que se
// quiere es despejar la pantalla para mirar el mapa, era demasiado lento.
export function initHudGroups(hud, btn) {
  if (!hud || !btn) return;
  const groups = () => [...hud.querySelectorAll('.hud-group')];

  function updateButton() {
    const anyOpen = groups().some((g) => g.open);
    btn.textContent = anyOpen ? t('app.collapseAll') : t('app.expandAll');
  }

  btn.addEventListener('click', () => {
    const open = !groups().some((g) => g.open);
    for (const g of groups()) g.open = open;
    updateButton();
  });
  // Cerrar o abrir una sección a mano también debe refrescar la etiqueta del
  // botón: "toggle" en <details> no burbujea, así que se escucha en cada una.
  for (const g of groups()) g.addEventListener('toggle', updateButton);
  onLangChange(updateButton);
  updateButton();
}

// El botón ▾/▸ de una cabecera (#hud o #consola): oculta o muestra TODO el
// contenido de ese panel de un tirón, dejando solo la barra de título — para
// cuando lo que estorba no es una sección, sino el panel entero.
export function initContainerToggle(btn, body, key) {
  if (!btn || !body) return;

  function markRule(collapsedState) {
    body.classList.toggle('collapsed', collapsedState);
    btn.textContent = collapsedState ? '▸' : '▾';
    btn.setAttribute('aria-expanded', String(!collapsedState));
    btn.title = collapsedState ? t('app.showPanel') : t('app.hidePanel');
  }

  let collapsedState = false;
  try { collapsedState = localStorage.getItem(key) === '1'; } catch { /* sin localStorage, empieza abierto */ }
  markRule(collapsedState);

  btn.addEventListener('click', () => {
    collapsedState = !body.classList.contains('collapsed');
    markRule(collapsedState);
    try { localStorage.setItem(key, collapsedState ? '1' : '0'); } catch { /* sin localStorage, no persiste */ }
  });
  onLangChange(() => markRule(body.classList.contains('collapsed')));
}
