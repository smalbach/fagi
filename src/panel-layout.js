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

const CLAVE = 'fagi.panel-layout';
const MEDIA_ESCRITORIO = '(min-width: 861px)';
const ALTO_CABECERA = 32; // px de un .pane-head: mínimo al arrastrar y tamaño al colapsar

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

// Un controlador por `.split-pane`: sabe colapsar/expandir cada mitad (algo
// que vale tanto en escritorio como en móvil) y, solo cuando hace falta,
// montar o desmontar la instancia de Split.js que permite arrastrar.
function crearControlador(split, estado) {
  const clave = split.dataset.split;
  const [a, b] = split.querySelectorAll(':scope > .pane');
  const guardado = estado[clave] ?? {};
  let tamanos = guardado.sizes ?? [50, 50];
  let instancia = null;

  function marcarColapso(pane, colapsado) {
    pane.classList.toggle('collapsed', colapsado);
    const boton = pane.querySelector('.pane-toggle');
    boton.textContent = colapsado ? '▸' : '▾';
    boton.setAttribute('aria-expanded', String(!colapsado));
  }

  function actualizarGutter() {
    const algunoColapsado = a.classList.contains('collapsed') || b.classList.contains('collapsed');
    split.classList.toggle('resizer-hidden', algunoColapsado);
  }

  function guardar() {
    estado[clave] = {
      sizes: tamanos,
      collapsed: [a.classList.contains('collapsed'), b.classList.contains('collapsed')],
    };
    guardarEstado(estado);
  }

  if (guardado.collapsed?.[0]) marcarColapso(a, true);
  if (guardado.collapsed?.[1]) marcarColapso(b, true);
  actualizarGutter();

  function alternar(pane, otro, indice) {
    const colapsado = !pane.classList.contains('collapsed');
    // Las dos mitades no pueden colapsarse a la vez: no quedaría nada que mostrar.
    if (colapsado && otro.classList.contains('collapsed')) marcarColapso(otro, false);
    marcarColapso(pane, colapsado);
    actualizarGutter();
    if (instancia) {
      if (colapsado) instancia.collapse(indice);
      else instancia.setSizes(tamanos);
    }
    guardar();
  }
  a.querySelector('.pane-toggle').addEventListener('click', () => alternar(a, b, 0));
  b.querySelector('.pane-toggle').addEventListener('click', () => alternar(b, a, 1));

  return {
    // Solo se llama en escritorio: aquí sí hay un tirador que arrastrar.
    montar() {
      if (instancia) return;
      instancia = Split([a, b], {
        direction: 'vertical',
        sizes: tamanos,
        minSize: ALTO_CABECERA,
        gutterSize: 8,
        snapOffset: 0,
        onDragEnd(sizes) { tamanos = sizes; guardar(); },
      });
      if (a.classList.contains('collapsed')) instancia.collapse(0);
      else if (b.classList.contains('collapsed')) instancia.collapse(1);
    },
    // Solo se llama en móvil: sin Split.js, cada mitad usa su alto natural
    // (definido por el CSS de móvil), sin estilos inline que lo compliquen.
    desmontar() {
      if (!instancia) return;
      instancia.destroy(false, false);
      instancia = null;
    },
  };
}

// `root` es la sección #consola: sin ella (una página que solo prueba otra
// cosa) no hay nada que organizar.
export function initPanelLayout(root) {
  if (!root) return;
  const estado = leerEstado();
  initTabs(root, estado);

  const controladores = [...root.querySelectorAll('.split-pane')].map((sp) => crearControlador(sp, estado));

  const mq = window.matchMedia(MEDIA_ESCRITORIO);
  const sincronizar = () => {
    for (const c of controladores) (mq.matches ? c.montar() : c.desmontar());
  };
  mq.addEventListener('change', sincronizar);
  sincronizar();
}

// Un botón para abrir o cerrar TODAS las secciones del HUD (Food, Map,
// State...) de una vez: cerrarlas una por una en el móvil, cuando lo que se
// quiere es despejar la pantalla para mirar el mapa, era demasiado lento.
export function initHudGroups(hud, boton) {
  if (!hud || !boton) return;
  const grupos = () => [...hud.querySelectorAll(':scope > .hud-group')];

  function actualizarBoton() {
    const algunoAbierto = grupos().some((g) => g.open);
    boton.textContent = algunoAbierto ? t('app.collapseAll') : t('app.expandAll');
  }

  boton.addEventListener('click', () => {
    const abrir = !grupos().some((g) => g.open);
    for (const g of grupos()) g.open = abrir;
    actualizarBoton();
  });
  // Cerrar o abrir una sección a mano también debe refrescar la etiqueta del
  // botón: "toggle" en <details> no burbujea, así que se escucha en cada una.
  for (const g of grupos()) g.addEventListener('toggle', actualizarBoton);
  onLangChange(actualizarBoton);
  actualizarBoton();
}
