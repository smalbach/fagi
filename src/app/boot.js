// Boot: who you are decides what you see.
//
//   not logged in       → log in / sign up / forgot password
//   #reset=<token>      → choose a new password (link from the email)
//   on the waitlist     → notice, until an admin approves the account
//   approved            → home: saved sessions and "New session"
//   new session         → set up the map and the settings, and "Start session"

// First of all: the game plays the whole organism (before settings.js reads
// its factory values).
import './organism-on.js';
import { get, ApiError } from './api.js';
import { showLogin, showReset, showWaitlist, showHome, showAdmin, hide, esc } from './screens.js';
import { createGame } from '../main.js';
import { retryPending } from '../recorder/sink.js';
import { t, onLangChange, getLang } from '../i18n.js';

let user = null;
const game = createGame({ onExit: () => goHome() });

async function start() {
  // The reset link from the email: the token leaves the address bar at once
  // (history, screenshots) and the screen keeps it.
  const reset = /^#reset=([\w-]+)$/.exec(location.hash)?.[1];
  if (reset) {
    history.replaceState(null, '', location.pathname + location.search);
    showReset(reset, { onDone: decide });
    return;
  }
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
  if (!user) {
    decide(null);
    return;
  }
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
    <p style="margin: 0.5rem 0 1.5rem; opacity: 0.8; font-size: 0.95rem; line-height: 1.4;">
      ${getLang() === 'es'
        ? 'El servidor de cuentas/Postgres (:8787) no está conectado. Puedes iniciar directamente una sesión local para jugar y probar las entidades adaptativas.'
        : 'The account/Postgres server (:8787) is not connected. You can start a local session directly to play and test the adaptive entities.'}
    </p>
    <div class="screen-actions">
      <button id="btn-local-play" class="primary">${getLang() === 'es' ? '▶ Jugar en modo local' : '▶ Play local mode'}</button>
      <button id="retry">${t('wait.check')}</button>
    </div>
  </div></div>`;
  el.querySelector('#btn-local-play').addEventListener('click', () => {
    hide();
    newSession();
  });
  el.querySelector('#retry').addEventListener('click', start);
}

// --- set up a session ---

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

// --- replay a session ---

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

// One mark per important event; hovering says what it was, and a click
// jumps to that moment and takes the camera to where it happened.
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
  // The latest important event so far, as a subtitle.
  let i = -1;
  for (let k = 0; k < player.markers.length && player.markers[k].t <= player.time; k++) i = k;
  if (i !== lastEvent) {
    lastEvent = i;
    bar.event.textContent = i >= 0 ? describe(player.markers[i]) : '';
  }
};
onLangChange(() => { if (game.player) paintMarks(game.player); });

start();
