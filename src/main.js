// The game: sets up the view just once and uses it in three modes.
//
//   setup   → new map without Fagi; you can regenerate, move, place and remove
//             things and tweak the settings before starting.
//   play    → the session running, being recorded (recorder/).
//   replay  → a recorded session, rebuilt from its events.
//
// Which screen shows before and after (login, home, admin) is not handled
// here: app/boot.js decides that, since it's the one that creates the game.

import { WORLD, SOCIAL, LIFE } from './config.js';
import { createWorld, resetWorld, record } from './world.js';
import { generateMap } from './mapgen.js';
import { createFagi } from './fagi.js';
import { step } from './simulation.js';
import { updateTrails } from './smell.js';
import { render } from './render.js';
import { createInput, INSPECT } from './input.js';
import { createInspector, pickAt, pickFagiAt, markOf } from './inspect.js';
import { createAskCard } from './ask.js';
import { createColony, successorOf, swapInto } from './colony.js';
import { createCamera, centerOn, fit } from './camera.js';
import { createUI } from './ui.js';
import { loadFruits } from './custom-fruits.js';
import { createFruitEditor } from './fruit-editor.js';
import { versionLabel, versionTitle } from './version.js';
import { createSettings, loadSettings, configSnapshot, applyConfig, onConfigChange, organismOffConfig } from './settings.js';
import { bindDom, t, onLangChange, formatDuration } from './i18n.js';
import { createNarrator, narrate, followed } from './narrator.js';
import { createConsole } from './console.js';
import { createLearnedPanel } from './learned/panel.js';
import { createBrainMap } from './brainmap.js';
import { initPanelLayout, initHudGroups, initContainerToggle } from './panel-layout.js';
import { initLayout } from './layout.js';
import { save, snapshot, load, restore } from './learned/store.js';
import { createBackend } from './backend/index.js';
import { createCortex, resetCortex } from './cortex.js';
import { createRecorder } from './recorder/recorder.js';
import { createPlayer } from './recorder/replay.js';
import { createSink } from './recorder/sink.js';
import { post } from './app/api.js';

const MAX_DT = 0.05;   // caps big jumps when coming back from another tab

export function createGame({ onExit } = {}) {
  // Saved settings go before anything else: some numbers are only read when
  // creating the world and Fagi, not on every frame.
  loadSettings();
  // The fruit the person made (custom-fruits.js), before any map asks for them.
  loadFruits();

  const canvas = document.getElementById('canvas');
  canvas.width = WORLD.width;
  canvas.height = WORLD.height;
  const ctx = canvas.getContext('2d');

  const world = createWorld();
  const fagi = createFagi();

  // Who decides, if anyone besides instinct: it's saved in the browser and
  // can be changed on the fly from the learned-code panel.
  function mountBackend(kind, url) {
    fagi.cortex = createCortex(createBackend(kind, { url }));
  }
  {
    const savedKind = (() => { try { return localStorage.getItem('fagi.backend') ?? 'none'; } catch { return 'none'; } })();
    const savedUrl = (() => { try { return localStorage.getItem('fagi.backend.url') ?? ''; } catch { return ''; } })();
    mountBackend(savedKind, savedUrl);
  }

  // The camera belongs to the view, not the world: switching sessions leaves it alone.
  const camera = fit(createCamera(world), canvas, world);

  const input = createInput(canvas, world, camera);
  const ask = createAskCard(document.getElementById('ask-card'));
  // Ask about the Fagi on screen: the live one, or the one being replayed.
  input.onAsk = (x, y) => (player ? ask.show(player.fagi, player.world, x, y) : ask.show(fagi, world, x, y));
  const ui = createUI(input, world, () => finishUp('user'));

  // The inspector (inspect.js): whatever is clicked, on screen and live. It
  // reads the world on screen: the live one, the replayed one, or the map
  // being set up (no Fagi there yet).
  const shown = () => (player ? { w: player.world, f: player.fagi } : { w: world, f: mode === 'setup' ? null : fagi });
  const inspector = createInspector(document.getElementById('inspect-card'), {
    canFollow: () => mode === 'play',
    onFollow: (target) => followChosen(target),
    onCenter: (x, y) => { camera.follow = false; centerOn(camera, canvas, shown().w, { x, y }); },
    onAsk: (x, y) => input.onAsk(x, y),
  });
  // Small targets get some slack, less the closer the camera is.
  const slack = () => 2 + 8 / camera.zoom;
  input.onInspect = (x, y) => {
    const { w, f } = shown();
    const hit = pickAt(w, f, x, y, slack());
    if (hit) { inspector.select(hit); layout.reveal(); } else inspector.clear();
  };
  input.pickFagi = (x, y) => {
    if (mode !== 'play') return false;
    const hit = pickFagiAt(world, fagi, x, y, slack());
    if (hit) { inspector.select(hit); layout.reveal(); }
    return Boolean(hit);
  };
  ui.onPick = (sel) => { inspector.select(sel); layout.reveal(); };
  // Which version is running: to know what's in production.
  const tagLabel = document.getElementById('app-version');
  if (tagLabel) { tagLabel.textContent = versionLabel(); tagLabel.title = versionTitle(); }
  const narrator = createNarrator();
  const console = createConsole();
  const learnedPanel = createLearnedPanel(fagi, { onBackendChange: mountBackend });
  const brainMap = createBrainMap(document.getElementById('brainmap'), document.getElementById('brainmap-status'), document.getElementById('brainmap-expand'));
  createSettings(world, () => fagi);
  // Fruit the person makes, and the map's size and water (setup only).
  const fruitEditor = createFruitEditor(world, {
    onFruitsChanged: () => ui.rebuildPalette(),
    onMapChanged: () => { if (mode === 'setup') regenerate(); },
  });
  bindDom();
  const panels = initPanelLayout(document.getElementById('console'));
  initHudGroups(document.getElementById('hud'), document.getElementById('btn-toggle-groups'));
  initContainerToggle(document.getElementById('btn-toggle-hud'), document.getElementById('hud-body'), 'fagi.hud-collapsed');
  initContainerToggle(document.getElementById('btn-toggle-console'), document.getElementById('console-body'), 'fagi.console-collapsed');

  // --- session state ---
  let mode = 'idle';
  let session = null;     // { id, rec, sink }
  let player = null;
  const replaying = { on: true, speed: 1, configSeq: -1, configBefore: null };

  // Views, the dock, the console at the bottom (layout.js). The simulation
  // aids are drawn in every view but observe.
  const layout = initLayout(world, {
    isSession: () => mode === 'play' || mode === 'replay',
    isSetup: () => mode === 'setup',
    onSettings: () => { document.getElementById('settings-overlay').hidden = false; },
    onRelayout: (dock) => panels.setSideBySide(dock),
  });

  function setMode(fresh) {
    mode = fresh;
    for (const m of ['idle', 'setup', 'play', 'replay']) document.body.classList.toggle(`mode-${m}`, m === fresh);
    input.editable = fresh === 'setup' || fresh === 'play';
    document.getElementById('settings-overlay').hidden = fresh !== 'setup';
    layout.sync();
  }

  function newFagi() {
    // createFagi() comes with its own cortex:null; the real one (with the backend
    // the person chose) is kept and only its pending work is cleared.
    const cortex = fagi.cortex;
    Object.assign(fagi, createFagi());
    fagi.cortex = cortex;
    resetCortex(cortex);
    Object.assign(narrator, createNarrator());
    console.reset();
  }

  // Every setting changed by hand during the game gets recorded.
  onConfigChange((id, from, to, source) => {
    if (mode === 'play') record(world, 'config', { id, from, to, source });
  });

  // --- setup ---
  function setup() {
    exitReplay();
    inspector.clear();
    resetWorld(world);
    world.colony = null;
    generateMap(world);
    newFagi();
    camera.follow = false;
    // The map may have changed size (MAPGEN.size): the whole of it on screen.
    camera.zoom = 0;
    fit(camera, canvas, world);
    ui.sync();
    fruitEditor.sync();
    setMode('setup');
  }

  function regenerate() {
    const size = world.width;
    resetWorld(world);
    generateMap(world);
    input.editing = null;
    if (world.width !== size) { camera.zoom = 0; camera.follow = false; }
    fit(camera, canvas, world);
  }

  // --- play ---
  async function begin({ recoverLearning = false } = {}) {
    const { session: s } = await post('/sessions');
    newFagi();
    let learned = null;
    if (recoverLearning) {
      const snap = load();
      if (snap) { restore(fagi, snap); learned = { facts: Object.keys(snap.facts ?? {}).length, rules: snap.rules?.length ?? 0 }; }
    }
    // Her sisters, if the colony has more than one: born knowing nothing.
    // With LIFE, a population that breeds (reproduction.js): at least LIFE.founders.
    const size = Math.max(SOCIAL.size, LIFE.enabled ? LIFE.founders : 1);
    world.colony = size > 1 ? createColony(size, fagi) : null;
    // The clock starts with the session, not with the map: the time spent
    // setting up doesn't count.
    world.time = 0;
    const sink = createSink(s.id);
    const rec = createRecorder(world, { send: (batch) => sink.send(batch) });
    world.rec = rec;
    rec.start({ config: configSnapshot(), learned });
    session = { id: s.id, rec, sink };
    inspector.clear();
    // Playing, a click shows what is there; placing is one click away in the palette.
    ui.selectTool(INSPECT);
    setMode('play');
  }

  // Closes the recording. The view stays as it was until you leave.
  function closeRecording(reason) {
    if (!session) return null;
    if (!session.closing) {
      const summary = session.rec.end(reason, fagi, narrator.lines);
      world.rec = null;
      session.closing = session.sink.end({ reason, age: fagi.age, summary });
    }
    return session.closing;
  }

  // She died. In a population that breeds (LIFE) the game follows her nearest
  // descendant, or whoever is left; the session ends only with the last one.
  function followOrClose() {
    const found = world.colony && LIFE.enabled ? successorOf(world, world.colony, fagi) : null;
    if (!found) { closeRecording('death'); return; }
    const from = fagi.id;
    const other = found.next;
    swapInto(fagi, other);
    resetCortex(fagi.cortex);
    session.rec.follow(fagi, from);
    followed(narrator, fagi, found.kin, from);
    console.reset();
  }

  // The one you follow, by your choice (the inspector's "Follow her"): the
  // same swap as when she dies (colony.js swapInto), recorded the same way.
  function followChosen(target) {
    if (mode !== 'play' || !session || session.rec.ended || target === fagi || !target?.alive) return;
    const from = fagi.id;
    swapInto(fagi, target);
    resetCortex(fagi.cortex);
    session.rec.follow(fagi, from);
    followed(narrator, fagi, 'chosen', from);
    console.reset();
  }

  async function finishUp(reason) {
    if (mode !== 'play') return;
    const closing = closeRecording(reason);
    save(snapshot(fagi));
    setMode('idle');
    // The session list has to see this one already closed.
    await closing;
    session = null;
    onExit?.();
  }

  // Closing the tab shouldn't cost Fagi the last thing she learned, nor the
  // session its last seconds.
  window.addEventListener('pagehide', () => {
    save(snapshot(fagi));
    if (session) { closeRecording('unload'); session.sink.unload(); }
  });

  // --- replay ---
  function replay(eventList) {
    Object.assign(replaying, { on: true, speed: 1, configSeq: -1, configBefore: configSnapshot(), logEpoch: -1 });
    player = createPlayer(eventList);
    player.seek(0);
    inspector.clear();
    camera.follow = false;
    setMode('replay');
    return player;
  }

  function exitReplay() {
    if (!player) return;
    // The replayed session's settings were its own: go back to ours.
    applyConfig(replaying.configBefore);
    ui.sync();
    player = null;
  }

  function leave() {
    if (mode === 'play') { finishUp('user'); return; }
    exitReplay();
    setMode('idle');
    onExit?.();
  }

  // --- loop ---
  function frameSetup(dt) {
    updateTrails(world, dt);
    render(ctx, world, null, camera, markOf(inspector.selection, world, null), input.editing);
    inspector.update(null, world, { live: false });
    ui.paintMap(world);
  }

  function framePlay(dt) {
    step(world, fagi, dt);
    const lines = narrate(narrator, fagi);
    if (session && !session.rec.ended) {
      session.rec.observe(fagi, lines);
      if (!fagi.alive) followOrClose();
    }
    if (camera.follow) centerOn(camera, canvas, world, fagi);
    render(ctx, world, fagi, camera, markOf(inspector.selection, world, fagi), input.editing);
    ui.update(fagi, world);
    ui.paintMap(world);
    inspector.update(fagi, world);
    console.update(fagi, lines);
    learnedPanel.update();
    brainMap.update(fagi, world);
    ask.update(fagi);
  }

  function frameReplay(dt) {
    if (replaying.on) {
      player.advance(dt * replaying.speed);
      if (player.time >= player.duration) replaying.on = false;
    }
    if (player.configSeq !== replaying.configSeq) {
      applyConfig({ ...organismOffConfig(), ...player.config });
      replaying.configSeq = player.configSeq;
    }
    updateTrails(player.world, dt);
    player.world.immersive = world.immersive;   // the view's, not the recording's
    if (camera.follow) centerOn(camera, canvas, player.world, player.fagi);
    render(ctx, player.world, player.fagi, camera, markOf(inspector.selection, player.world, player.fagi));
    ui.update(player.fagi, player.world);
    inspector.update(player.fagi, player.world, { live: false });
    // Going back leaves lines from the future in the console: repaint it whole.
    if (player.logEpoch !== replaying.logEpoch) {
      console.reset();
      replaying.logEpoch = player.logEpoch;
    }
    console.update(player.fagi, player.log);
    learnedPanel.update(player.fagi);
    brainMap.update(player.fagi, player.world);
    ask.update(player.fagi);
    onReplayFrame?.(player, replaying);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, MAX_DT);
    last = now;
    input.pan(dt);

    if (mode === 'setup') frameSetup(dt);
    else if (mode === 'play') framePlay(dt);
    else if (mode === 'replay' && player) frameReplay(dt);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  let onReplayFrame = null;

  return {
    setup, regenerate, begin, replay, leave,
    get mode() { return mode; },
    get player() { return player; },
    replayControls: replaying,
    set onReplayFrame(fn) { onReplayFrame = fn; },
    togglePlay() { replaying.on = !replaying.on; if (player && replaying.on && player.time >= player.duration) player.seek(0); return replaying.on; },
    setSpeed(v) { replaying.speed = v; },
    seek(tt) { player?.seek(tt); },
    focus(x, y) { camera.follow = false; centerOn(camera, canvas, player?.world ?? world, { x, y }); },
    formatTime: (s) => formatDuration(s),
  };
}
