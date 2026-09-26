// El juego: prepara la vista una sola vez y la usa en tres modos.
//
//   setup   → mapa nuevo sin Fagi; se puede regenerar, mover, poner y quitar
//             cosas y tocar los ajustes antes de empezar.
//   play    → la sesión en marcha, grabándose (recorder/).
//   replay  → una sesión grabada, reconstruida a partir de sus eventos.
//
// Qué pantalla se ve antes y después (login, inicio, admin) no es cosa de
// aquí: lo decide app/boot.js, que es quien crea el juego.

import { WORLD } from './config.js';
import { createWorld, resetWorld, record } from './world.js';
import { generateMap } from './mapgen.js';
import { createFagi } from './fagi.js';
import { step } from './simulation.js';
import { updateTrails } from './smell.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createCamera, centrarEn, encajar } from './camera.js';
import { createUI } from './ui.js';
import { createSettings, loadSettings, configSnapshot, applyConfig, onConfigChange } from './settings.js';
import { bindDom, t, onLangChange, formatDuration } from './i18n.js';
import { createNarrator, narrate } from './narrator.js';
import { createConsola } from './consola.js';
import { createLearnedPanel } from './learned/panel.js';
import { createBrainMap } from './brainmap.js';
import { initPanelLayout, initHudGroups, initContainerToggle } from './panel-layout.js';
import { save, snapshot, load, restore } from './learned/store.js';
import { createBackend } from './backend/index.js';
import { createCortex, resetCortex } from './cortex.js';
import { createRecorder } from './recorder/recorder.js';
import { createPlayer } from './recorder/replay.js';
import { createSink } from './recorder/sink.js';
import { post } from './app/api.js';

const MAX_DT = 0.05;   // limita saltos grandes al volver de otra pestaña

export function createGame({ onExit } = {}) {
  // Los ajustes guardados van antes que nada: hay números que solo se leen al
  // crear el mundo y a Fagi, no en cada frame.
  loadSettings();

  const canvas = document.getElementById('canvas');
  canvas.width = WORLD.width;
  canvas.height = WORLD.height;
  const ctx = canvas.getContext('2d');

  const world = createWorld();
  const fagi = createFagi();

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

  // La cámara es de la vista, no del mundo: cambiar de sesión no la toca.
  const camera = encajar(createCamera(world), canvas, world);

  const input = createInput(canvas, world, camera);
  const ui = createUI(input, world, () => terminar('user'));
  const narrator = createNarrator();
  const consola = createConsola();
  const learnedPanel = createLearnedPanel(fagi, { onBackendChange: montarBackend });
  const brainMap = createBrainMap(document.getElementById('brainmap'), document.getElementById('brainmap-status'), document.getElementById('brainmap-expand'));
  createSettings(world, () => fagi);
  bindDom();
  initPanelLayout(document.getElementById('consola'));
  initHudGroups(document.getElementById('hud'), document.getElementById('btn-toggle-groups'));
  initContainerToggle(document.getElementById('btn-toggle-hud'), document.getElementById('hud-body'), 'fagi.hud-collapsed');
  initContainerToggle(document.getElementById('btn-toggle-consola'), document.getElementById('consola-body'), 'fagi.consola-collapsed');

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

  // --- estado de la sesión ---
  let mode = 'idle';
  let session = null;     // { id, rec, sink }
  let player = null;
  const reproduciendo = { on: true, speed: 1, configSeq: -1, configAntes: null };

  function ponerModo(nuevo) {
    mode = nuevo;
    for (const m of ['idle', 'setup', 'play', 'replay']) document.body.classList.toggle(`mode-${m}`, m === nuevo);
    input.editable = nuevo === 'setup' || nuevo === 'play';
    document.getElementById('settings-overlay').hidden = nuevo !== 'setup';
  }

  function fagiNueva() {
    // createFagi() trae su propio cortex:null; el de verdad (con el backend que
    // haya elegido la persona) se conserva y solo se le limpia lo pendiente.
    const cortex = fagi.cortex;
    Object.assign(fagi, createFagi());
    fagi.cortex = cortex;
    resetCortex(cortex);
    Object.assign(narrator, createNarrator());
    consola.reset();
  }

  // Cada ajuste tocado a mano durante la partida queda grabado.
  onConfigChange((id, from, to, source) => {
    if (mode === 'play') record(world, 'config', { id, from, to, source });
  });

  // --- setup ---
  function setup() {
    salirDeReplay();
    resetWorld(world);
    generateMap(world);
    fagiNueva();
    camera.seguir = false;
    ui.sync();
    ponerModo('setup');
  }

  function regenerar() {
    resetWorld(world);
    generateMap(world);
  }

  // --- play ---
  async function comenzar({ recuperar = false } = {}) {
    const { session: s } = await post('/sessions');
    fagiNueva();
    let learned = null;
    if (recuperar) {
      const snap = load();
      if (snap) { restore(fagi, snap); learned = { facts: Object.keys(snap.facts ?? {}).length, rules: snap.rules?.length ?? 0 }; }
    }
    // El reloj empieza con la sesión, no con el mapa: el tiempo que se pasó
    // preparando no cuenta.
    world.time = 0;
    const sink = createSink(s.id);
    const rec = createRecorder(world, { send: (lote) => sink.send(lote) });
    world.rec = rec;
    rec.start({ config: configSnapshot(), learned });
    session = { id: s.id, rec, sink };
    ponerModo('play');
  }

  // Cierra la grabación. La vista sigue como estaba hasta que se sale.
  function cerrarGrabacion(reason) {
    if (!session) return null;
    if (!session.cierre) {
      const summary = session.rec.end(reason, fagi, narrator.lines);
      world.rec = null;
      session.cierre = session.sink.end({ reason, age: fagi.age, summary });
    }
    return session.cierre;
  }

  async function terminar(reason) {
    if (mode !== 'play') return;
    const cierre = cerrarGrabacion(reason);
    save(snapshot(fagi));
    ponerModo('idle');
    // La lista de sesiones tiene que ver esta ya cerrada.
    await cierre;
    session = null;
    onExit?.();
  }

  // Cerrar la pestaña no debería costarle a Fagi lo último que aprendió, ni a
  // la sesión sus últimos segundos.
  window.addEventListener('pagehide', () => {
    save(snapshot(fagi));
    if (session) { cerrarGrabacion('unload'); session.sink.unload(); }
  });

  // --- replay ---
  function reproducir(eventos) {
    Object.assign(reproduciendo, { on: true, speed: 1, configSeq: -1, configAntes: configSnapshot(), logEpoch: -1 });
    player = createPlayer(eventos);
    player.seek(0);
    camera.seguir = false;
    ponerModo('replay');
    return player;
  }

  function salirDeReplay() {
    if (!player) return;
    // Los ajustes de la sesión reproducida eran suyos: se vuelve a los propios.
    applyConfig(reproduciendo.configAntes);
    ui.sync();
    player = null;
  }

  function salir() {
    if (mode === 'play') { terminar('user'); return; }
    salirDeReplay();
    ponerModo('idle');
    onExit?.();
  }

  // --- bucle ---
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, MAX_DT);
    last = now;
    input.pan(dt);

    if (mode === 'setup') {
      updateTrails(world, dt);
      render(ctx, world, null, camera);
    } else if (mode === 'play') {
      step(world, fagi, dt);
      const lineas = narrate(narrator, fagi);
      if (session && !session.rec.ended) {
        session.rec.observe(fagi, lineas);
        if (!fagi.alive) cerrarGrabacion('death');
      }
      if (camera.seguir) centrarEn(camera, canvas, world, fagi);
      render(ctx, world, fagi, camera);
      ui.update(fagi, world);
      consola.update(fagi, lineas);
      learnedPanel.update();
      brainMap.update(fagi, world);
    } else if (mode === 'replay' && player) {
      if (reproduciendo.on) {
        player.advance(dt * reproduciendo.speed);
        if (player.time >= player.duration) reproduciendo.on = false;
      }
      if (player.configSeq !== reproduciendo.configSeq) {
        applyConfig(player.config);
        reproduciendo.configSeq = player.configSeq;
      }
      updateTrails(player.world, dt);
      if (camera.seguir) centrarEn(camera, canvas, player.world, player.fagi);
      render(ctx, player.world, player.fagi, camera);
      ui.update(player.fagi, player.world);
      // Volver atrás deja en la consola líneas del futuro: se repinta entera.
      if (player.logEpoch !== reproduciendo.logEpoch) {
        consola.reset();
        reproduciendo.logEpoch = player.logEpoch;
      }
      consola.update(player.fagi, player.log);
      learnedPanel.update(player.fagi);
      brainMap.update(player.fagi, player.world);
      onReplayFrame?.(player, reproduciendo);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  let onReplayFrame = null;

  return {
    setup, regenerar, comenzar, reproducir, salir,
    get mode() { return mode; },
    get player() { return player; },
    replayControls: reproduciendo,
    set onReplayFrame(fn) { onReplayFrame = fn; },
    togglePlay() { reproduciendo.on = !reproduciendo.on; if (player && reproduciendo.on && player.time >= player.duration) player.seek(0); return reproduciendo.on; },
    setSpeed(v) { reproduciendo.speed = v; },
    seek(tt) { player?.seek(tt); },
    focus(x, y) { camera.seguir = false; centrarEn(camera, canvas, player?.world ?? world, { x, y }); },
    formatTime: (s) => formatDuration(s),
  };
}
