// La consola lateral tiene demasiado dentro para caber cómoda a la vez:
// esto la organiza en pestañas (consola+mapa / código+histórico) y deja que
// cada mitad se colapse o se redimensione arrastrando el separador. El
// tamaño y qué pestaña estaba abierta se recuerdan entre visitas.

const CLAVE = 'fagi.panel-layout';

function leerEstado() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? JSON.parse(guardado) : {};
  } catch { return {}; }
}

function guardarEstado(estado) {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin localStorage, no persiste */ }
}

function initTabs(root, estado) {
  const tabs = [...root.querySelectorAll(':scope > #consola-tabs > .tab')];
  const paneles = [...root.querySelectorAll(':scope > .tab-panel')];
  if (tabs.length === 0) return;

  function activar(nombre) {
    for (const boton of tabs) {
      const activo = boton.dataset.tab === nombre;
      boton.classList.toggle('active', activo);
      boton.setAttribute('aria-selected', String(activo));
    }
    for (const panel of paneles) panel.hidden = panel.dataset.panel !== nombre;
    estado.tab = nombre;
    guardarEstado(estado);
  }

  for (const boton of tabs) boton.addEventListener('click', () => activar(boton.dataset.tab));
  const inicial = tabs.some((b) => b.dataset.tab === estado.tab) ? estado.tab : tabs[0].dataset.tab;
  activar(inicial);
}

function initSplitPane(split, estado) {
  const panes = [...split.querySelectorAll(':scope > .pane')];
  const resizer = split.querySelector(':scope > .resizer');

  function marcarColapso(pane, colapsado) {
    pane.classList.toggle('collapsed', colapsado);
    const boton = pane.querySelector('.pane-toggle');
    boton.textContent = colapsado ? '▸' : '▾';
    boton.setAttribute('aria-expanded', String(!colapsado));
  }

  function actualizarResizer() {
    const algunoColapsado = panes.some((p) => p.classList.contains('collapsed'));
    split.classList.toggle('resizer-hidden', algunoColapsado);
  }

  for (const pane of panes) {
    const clave = pane.dataset.pane;
    const guardado = estado[clave];
    if (guardado?.collapsed) marcarColapso(pane, true);
    if (guardado?.flex) pane.style.flex = guardado.flex;

    pane.querySelector('.pane-toggle').addEventListener('click', () => {
      const colapsado = !pane.classList.contains('collapsed');
      marcarColapso(pane, colapsado);
      estado[clave] = { ...estado[clave], collapsed: colapsado };
      guardarEstado(estado);
      actualizarResizer();
    });
  }
  actualizarResizer();

  if (!resizer || panes.length !== 2) return;
  const [a, b] = panes;
  const MINIMO = 60;
  let arrastre = null;

  resizer.addEventListener('pointerdown', (ev) => {
    if (a.classList.contains('collapsed') || b.classList.contains('collapsed')) return;
    arrastre = {
      y: ev.clientY,
      alturaA: a.getBoundingClientRect().height,
      total: a.getBoundingClientRect().height + b.getBoundingClientRect().height,
    };
    resizer.setPointerCapture(ev.pointerId);
    resizer.classList.add('dragging');
  });

  resizer.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const propuesta = arrastre.alturaA + (ev.clientY - arrastre.y);
    const alturaA = Math.min(Math.max(propuesta, MINIMO), Math.max(arrastre.total - MINIMO, MINIMO));
    const pctA = (alturaA / arrastre.total) * 100;
    a.style.flex = `${pctA} 1 0%`;
    b.style.flex = `${100 - pctA} 1 0%`;
  });

  function soltar() {
    if (!arrastre) return;
    arrastre = null;
    resizer.classList.remove('dragging');
    estado[a.dataset.pane] = { ...estado[a.dataset.pane], flex: a.style.flex };
    estado[b.dataset.pane] = { ...estado[b.dataset.pane], flex: b.style.flex };
    guardarEstado(estado);
  }
  resizer.addEventListener('pointerup', soltar);
  resizer.addEventListener('pointercancel', soltar);
}

// `root` es la sección #consola: sin ella (una página que solo prueba otra
// cosa) no hay nada que organizar.
export function initPanelLayout(root) {
  if (!root) return;
  const estado = leerEstado();
  initTabs(root, estado);
  for (const split of root.querySelectorAll('.split-pane')) initSplitPane(split, estado);
}
