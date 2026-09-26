// Arranque y bucle principal.

import { WORLD } from './config.js';
import { createWorld, clearWorld } from './world.js';
import { generateMap } from './mapgen.js';
import { createFagi } from './fagi.js';
import { step } from './simulation.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createCamera, centrarEn, encajar } from './camera.js';
import { createUI } from './ui.js';
import { createSettings, loadSettings } from './settings.js';
import { bindDom, t, onLangChange } from './i18n.js';
import { createNarrator, narrate } from './narrator.js';
import { createConsola } from './consola.js';
import { createLearnedPanel } from './learned/panel.js';
import { createBrainMap } from './brainmap.js';
import { initPanelLayout } from './panel-layout.js';
import { save, snapshot } from './learned/store.js';
import { createBackend } from './backend/index.js';
import { createCortex, resetCortex } from './cortex.js';

// Los ajustes guardados van antes que nada: hay números que solo se leen al
// crear el mundo y a Fagi, no en cada frame.
loadSettings();

const canvas = document.getElementById('canvas');
canvas.width = WORLD.width;
canvas.height = WORLD.height;
const ctx = canvas.getContext('2d');

const world = createWorld();
const fagi = createFagi();
generateMap(world);

// Quién decide, si alguien además del instinto: se guarda en el navegador y
// se puede cambiar en caliente desde el panel de código aprendido.
function montarBackend(kind, url) {
  fagi.cortex = createCortex(createBackend(kind, { url }));
}
{
  const kindGuardado = (() => { try { return localStorage.getItem('fagi.backend') ?? 'none'; } catch { return 'none'; } })();
  const urlGuardada = (() => { try { return localStorage.getItem('fagi.backend.url') ?? ''; } catch { return ''; } })();
  montarBackend(kindGuardado, urlGuardada);
}

// La cámara es de la vista, no del mundo: reiniciar el mapa no la toca.
const camera = encajar(createCamera(world), canvas, world);

const input = createInput(canvas, world, camera);
const ui = createUI(input, world, reset);
const narrator = createNarrator();
const consola = createConsola();
const learnedPanel = createLearnedPanel(fagi, { onBackendChange: montarBackend });
const brainMap = createBrainMap(document.getElementById('brainmap'), document.getElementById('brainmap-status'));
createSettings(world, () => fagi);
bindDom();
initPanelLayout(document.getElementById('consola'));

// Cerrar la pestaña no debería costarle a Fagi lo último que aprendió.
window.addEventListener('pagehide', () => save(snapshot(fagi)));

// Presentación limpia por defecto; las ayudas de simulación siguen disponibles
// sin tocar la lógica del mundo.
const visual = document.getElementById('btn-visual');
function updateVisualButton() {
  visual.textContent = world.immersive ? t('app.immersive') : t('app.analysis');
  visual.classList.toggle('active', !world.immersive);
  visual.setAttribute('aria-pressed', String(!world.immersive));
  document.body.classList.toggle('immersive', world.immersive);
}
visual.addEventListener('click', () => {
  world.immersive = !world.immersive;
  updateVisualButton();
});
onLangChange(updateVisualButton);
updateVisualButton();

function reset() {
  clearWorld(world);
  generateMap(world);
  // createFagi() trae su propio cortex:null; el de verdad (con el backend que
  // haya elegido la persona) se conserva y solo se le limpia lo pendiente.
  const cortex = fagi.cortex;
  Object.assign(fagi, createFagi());
  fagi.cortex = cortex;
  resetCortex(cortex);
  Object.assign(narrator, createNarrator());
  consola.reset();
}

const MAX_DT = 0.05;   // limita saltos grandes al volver de otra pestaña

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, MAX_DT);
  last = now;

  step(world, fagi, dt);
  input.pan(dt);
  if (camera.seguir) centrarEn(camera, canvas, world, fagi);
  render(ctx, world, fagi, camera);
  ui.update(fagi, world);
  consola.update(fagi, narrate(narrator, fagi));
  learnedPanel.update();
  brainMap.update(fagi);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
