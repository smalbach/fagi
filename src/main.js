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

// La cámara es de la vista, no del mundo: reiniciar el mapa no la toca.
const camera = encajar(createCamera(world), canvas, world);

const input = createInput(canvas, world, camera);
const ui = createUI(input, world, reset);
const narrator = createNarrator();
const consola = createConsola();
createSettings(world, () => fagi.brain);
bindDom();

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
  Object.assign(fagi, createFagi());
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

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
