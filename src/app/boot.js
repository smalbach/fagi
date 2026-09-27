// Arranque: quién eres decide qué ves.
//
//   sin sesión          → entrar / registrarse
//   en lista de espera  → aviso, hasta que un admin apruebe la cuenta
//   aprobado            → inicio: sesiones guardadas y "Nueva sesión"
//   nueva sesión        → preparar el mapa y los ajustes, y "Comenzar sesión"

import { get, ApiError } from './api.js';
import { showLogin, showWaitlist, showHome, showAdmin, hide, esc } from './screens.js';
import { createGame } from '../main.js';
import { retryPending } from '../recorder/sink.js';
import { t, onLangChange } from '../i18n.js';

let user = null;
const game = createGame({ onExit: () => goHome() });

async function start() {
  try {
    ({ user } = await get('/auth/me'));
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) { noServer(); return; }
    user = null;
  }
  decide(user);
}

function decide(u) {
  user = u;
  if (!u) { showLogin({ onDone: decide }); return; }
  if (u.status !== 'approved') {
    showWaitlist(u, { onRetry: start, onLogout: () => decide(null) });
    return;
  }
  retryPending();
  goHome();
}

function goHome() {
  showHome(user, {
    onNew: newSession,
    onReplay: replay,
    onAdmin: () => showAdmin(user, { onBack: goHome }),
    onLogout: () => decide(null),
  });
}

function noServer() {
  const el = document.getElementById('screen');
  el.hidden = false;
  el.innerHTML = `<div class="screen-card"><div class="screen-body">
    <p class="screen-big">${t('err.network')}</p>
    <div class="screen-actions"><button id="retry">${t('wait.check')}</button></div></div></div>`;
  el.querySelector('#retry').addEventListener('click', start);
}

// --- preparar una sesión ---

function newSession() {
  hide();
  game.setup();
  document.getElementById('setup-error').textContent = '';
}

document.getElementById('btn-regen').addEventListener('click', () => game.regenerate());
document.getElementById('btn-setup-cancel').addEventListener('click', () => game.leave());
document.getElementById('btn-start').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const error = document.getElementById('setup-error');
  error.textContent = '';
  btn.disabled = true;
  try {
    await game.begin({ recoverLearning: document.getElementById('chk-recover').checked });
  } catch (err) {
    error.textContent = err instanceof ApiError && err.status === 401 ? t('err.unauthenticated') : t('err.network');
  } finally {
    btn.disabled = false;
  }
});
document.getElementById('btn-end').addEventListener('click', () => game.leave());

// --- reproducir una sesión ---

const bar = {
  play: document.getElementById('rp-play'),
  speed: document.getElementById('rp-speed'),
  slider: document.getElementById('rp-slider'),
  marks: document.getElementById('rp-marks'),
  time: document.getElementById('rp-time'),
  event: document.getElementById('rp-event'),
  follow: document.getElementById('rp-follow'),
};

function replay(session, eventList) {
  hide();
  const player = game.replay(eventList);
  bar.slider.max = String(player.duration);
  bar.slider.value = '0';
  paintMarks(player);
  paintPlay();
}

// Una marca por suceso importante; pasar el ratón dice qué fue, y un clic
// salta a ese instante y lleva la cámara a donde ocurrió.
function paintMarks(player) {
  const d = player.duration || 1;
  bar.marks.innerHTML = player.markers.map((m, i) => `
    <button class="rp-mark rp-${esc(m.type)}" data-i="${i}" style="left:${(m.t / d) * 100}%"
      title="${esc(`${game.formatTime(m.t)} · ${describe(m)}`)}"></button>`).join('');
  bar.marks.querySelectorAll('.rp-mark').forEach((b) => b.addEventListener('click', () => {
    const m = player.markers[Number(b.dataset.i)];
    game.seek(m.t);
    if (Number.isFinite(m.x)) game.focus(m.x, m.y);
  }));
}

function describe(ev) {
  const what = ev.what ? t(`type.${ev.what}`) : '';
  if (ev.type === 'fagi_death') return t('replay.ev.fagi_death', { cause: t(`cause.${ev.cause}`) });
  if (ev.type === 'fagi_rule') return t('replay.ev.fagi_rule', { rule: ev.rule });
  if (ev.type === 'config') return t('replay.ev.config', { id: ev.id, to: ev.to });
  return t(`replay.ev.${ev.type}`, { what: what });
}

function paintPlay() {
  bar.play.textContent = game.replayControls.on ? '⏸' : '▶';
}

bar.play.addEventListener('click', () => { game.togglePlay(); paintPlay(); });
bar.speed.addEventListener('change', () => game.setSpeed(Number(bar.speed.value)));
bar.slider.addEventListener('input', () => game.seek(Number(bar.slider.value)));
bar.follow.addEventListener('click', () => {
  const p = game.player;
  if (p) game.focus(p.fagi.x, p.fagi.y);
});
document.getElementById('rp-exit').addEventListener('click', () => game.leave());

let lastEvent = -1;
game.onReplayFrame = (player, ctl) => {
  if (document.activeElement !== bar.slider) bar.slider.value = String(player.time);
  bar.time.textContent = `${game.formatTime(player.time)} / ${game.formatTime(player.duration)}`;
  if (!ctl.on && bar.play.textContent !== '▶') paintPlay();
  // El último suceso importante hasta ahora, como subtítulo.
  let i = -1;
  for (let k = 0; k < player.markers.length && player.markers[k].t <= player.time; k++) i = k;
  if (i !== lastEvent) {
    lastEvent = i;
    bar.event.textContent = i >= 0 ? describe(player.markers[i]) : '';
  }
};
onLangChange(() => { if (game.player) paintMarks(game.player); });

start();
