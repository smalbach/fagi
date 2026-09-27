// El mapa del cerebro: cómo está pensando Fagi AHORA MISMO, paso a paso, y
// cómo lo que ha aprendido entra en esa cuenta.
//
//   1. Siente    — el cuerpo: hambre, sed, energía y los efectos que lleva.
//   2. Percibe   — lo que ve, huele o recuerda, con su puntuación desglosada
//      y puntúa    (creencia + curiosidad + necesidad + distancia) frente al
//                  mínimo que hace falta para moverse.
//      Recuerda  — la memoria aprendida de cada cosa: su peso frente a los
//                  umbrales que la convierten en regla, cuánto se fía, en qué
//                  etapa está (corta, media, larga) y la regla escrita si la hay.
//   3. Instinto  — los escalones de la directiva de sobrevivir, en orden; el
//                  primero que contesta manda.
//   4. Decide    — la acción, su porqué, y si algo nuevo le hizo replantearse.
//   5. Aprende   — la última experiencia: qué probó, qué sintió, cómo movió
//                  la creencia y qué regla escribió o revisó.
//   6. Red       — las neuronas y sus sinapsis, con la señal que corre ahora.
//   7. Mapa      — lo que recuerda del sitio: por dónde ha pasado, dónde cree
//      mental      que están el agua y el árbol, y su casa.
//
// No calcula nada que no esté ya calculado: lee fagi.thought (decision.js),
// fagi.brain (memory.js, learned/) y fagi.lastEpisode (episodes.js). El alto
// del lienzo sale de lo que hay que dibujar; el panel hace scroll.
//
// Aquí solo vive el panel (tamaño, ampliar, la línea de estado) y el orden de
// las secciones; cada sección se pinta en su módulo de brainmap/, con los
// pinceles comunes de brainmap/pinceles.js.

import { t } from './i18n.js';
import { crearPinceles } from './brainmap/pinceles.js';
import { pintarSiente } from './brainmap/siente.js';
import { pintarPercibe } from './brainmap/percibe.js';
import { pintarInstinto } from './brainmap/instinto.js';
import { pintarDecide } from './brainmap/decide.js';
import { pintarAprende } from './brainmap/aprende.js';
import { pintarRed } from './brainmap/red.js';
import { pintarMapaMental } from './brainmap/mapa-mental.js';

export function createBrainMap(canvas, statusEl, expandBtn) {
  if (!canvas) return { update() {} };
  const pinceles = crearPinceles(canvas);

  // Ampliar: el panel entero pasa a ocupar casi toda la pantalla.
  const pane = canvas.closest('.pane');
  function grande(si) {
    pane?.classList.toggle('brainmap-big', si);
    if (!expandBtn) return;
    expandBtn.dataset.i18n = si ? 'brainmap.close' : 'brainmap.expand';   // bindDom lo retraduce
    expandBtn.textContent = t(expandBtn.dataset.i18n);
  }
  function cerrarGrande() { if (pane?.classList.contains('brainmap-big')) grande(false); }
  expandBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    grande(!pane?.classList.contains('brainmap-big'));
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarGrande(); });

  function estado(fagi) {
    if (!statusEl) return;
    const activas = fagi.brain.rules.list.filter((r) => !r.retired);
    const retiradas = fagi.brain.rules.list.filter((r) => r.retired);
    statusEl.textContent = t('brainmap.status', {
      beliefs: Object.keys(fagi.brain.facts).length,
      active: activas.length,
      retired: retiradas.length,
      events: fagi.brain.lastRule?.n ?? 0,
    });
  }

  // Las siete secciones, una debajo de otra: cada una empieza donde acabó la
  // anterior y devuelve dónde acaba ella. El total es el alto del lienzo.
  function todo(fagi, mundo) {
    pinceles.empezar();
    let y = 12 * pinceles.s;
    y = pintarSiente(pinceles, fagi, y);
    y = pintarPercibe(pinceles, fagi, y);
    y = pintarInstinto(pinceles, fagi, y);
    y = pintarDecide(pinceles, fagi, y);
    y = pintarAprende(pinceles, fagi, y);
    y = pintarRed(pinceles, fagi, y);
    return pintarMapaMental(pinceles, fagi, mundo, y);
  }

  function update(fagi, world = null) {
    estado(fagi);
    if (!canvas.getBoundingClientRect().width) return;   // panel plegado u oculto
    if (pinceles.cssW === 0) pinceles.ajustar(200);
    const alto = todo(fagi, world);
    // El alto cambió (más creencias, más neuronas): redimensionar borra el
    // lienzo, así que se vuelve a pintar en el mismo fotograma.
    if (pinceles.ajustar(Math.ceil(alto))) todo(fagi, world);
  }

  return { update };
}
