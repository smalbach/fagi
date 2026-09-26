// Arranque: quién eres decide qué ves.
//
//   sin sesión          → entrar / registrarse
//   en lista de espera  → aviso, hasta que un admin apruebe la cuenta
//   aprobado            → inicio: sesiones guardadas y "Nueva sesión"
//   nueva sesión        → preparar el mapa y los ajustes, y "Comenzar sesión"

import { get, ApiError } from './api.js';
import { showLogin, showWaitlist, showHome, showAdmin, ocultar, esc } from './screens.js';
import { createGame } from '../main.js';
import { retryPending } from '../recorder/sink.js';
import { t, onLangChange } from '../i18n.js';

let user = null;
const game = createGame({ onExit: () => irAInicio() });

async function arrancar() {
  try {
    ({ user } = await get('/auth/me'));
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) { sinServidor(); return; }
    user = null;
  }
  decidir(user);
}

function decidir(u) {
  user = u;
  if (!u) { showLogin({ onDone: decidir }); return; }
  if (u.status !== 'approved') {
    showWaitlist(u, { onRetry: arrancar, onLogout: () => decidir(null) });
    return;
  }
  retryPending();
  irAInicio();
}

function irAInicio() {
  showHome(user, {
    onNew: nuevaSesion,
    onReplay: reproducir,
    onAdmin: () => showAdmin(user, { onBack: irAInicio }),
    onLogout: () => decidir(null),
  });
}

function sinServidor() {
  const el = document.getElementById('screen');
  el.hidden = false;
  el.innerHTML = `<div class="screen-card"><div class="screen-body">
    <p class="screen-big">${t('err.network')}</p>
    <div class="screen-actions"><button id="retry">${t('wait.check')}</button></div></div></div>`;
  el.querySelector('#retry').addEventListener('click', arrancar);
}

// --- preparar una sesión ---

function nuevaSesion() {
  ocultar();
  game.setup();
  document.getElementById('setup-error').textContent = '';
}

document.getElementById('btn-regen').addEventListener('click', () => game.regenerar());
document.getElementById('btn-setup-cancel').addEventListener('click', () => game.salir());
document.getElementById('btn-start').addEventListener('click', async (e) => {
  const boton = e.currentTarget;
  const error = document.getElementById('setup-error');
  error.textContent = '';
  boton.disabled = true;
  try {
    await game.comenzar({ recuperar: document.getElementById('chk-recover').checked });
  } catch (err) {
    error.textContent = err instanceof ApiError && err.status === 401 ? t('err.unauthenticated') : t('err.network');
  } finally {
    boton.disabled = false;
  }
});
document.getElementById('btn-end').addEventListener('click', () => game.salir());

// --- reproducir una sesión ---

const barra = {
  play: document.getElementById('rp-play'),
  speed: document.getElementById('rp-speed'),
  slider: document.getElementById('rp-slider'),
  marks: document.getElementById('rp-marks'),
  time: document.getElementById('rp-time'),
  event: document.getElementById('rp-event'),
  follow: document.getElementById('rp-follow'),
};

function reproducir(sesion, eventos) {
  ocultar();
  const player = game.reproducir(eventos);
  barra.slider.max = String(player.duration);
  barra.slider.value = '0';
  pintarMarcas(player);
  pintarPlay();
}

// Una marca por suceso importante; pasar el ratón dice qué fue, y un clic
// salta a ese instante y lleva la cámara a donde ocurrió.
function pintarMarcas(player) {
  const d = player.duration || 1;
  barra.marks.innerHTML = player.markers.map((m, i) => `
    <button class="rp-mark rp-${esc(m.type)}" data-i="${i}" style="left:${(m.t / d) * 100}%"
      title="${esc(`${game.formatTime(m.t)} · ${describir(m)}`)}"></button>`).join('');
  barra.marks.querySelectorAll('.rp-mark').forEach((b) => b.addEventListener('click', () => {
    const m = player.markers[Number(b.dataset.i)];
    game.seek(m.t);
    if (Number.isFinite(m.x)) game.focus(m.x, m.y);
  }));
}

function describir(ev) {
  const que = ev.what ? t(`type.${ev.what}`) : '';
  if (ev.type === 'fagi_death') return t('replay.ev.fagi_death', { cause: t(`cause.${ev.cause}`) });
  if (ev.type === 'fagi_rule') return t('replay.ev.fagi_rule', { rule: ev.rule });
  if (ev.type === 'config') return t('replay.ev.config', { id: ev.id, to: ev.to });
  return t(`replay.ev.${ev.type}`, { what: que });
}

function pintarPlay() {
  barra.play.textContent = game.replayControls.on ? '⏸' : '▶';
}

barra.play.addEventListener('click', () => { game.togglePlay(); pintarPlay(); });
barra.speed.addEventListener('change', () => game.setSpeed(Number(barra.speed.value)));
barra.slider.addEventListener('input', () => game.seek(Number(barra.slider.value)));
barra.follow.addEventListener('click', () => {
  const p = game.player;
  if (p) game.focus(p.fagi.x, p.fagi.y);
});
document.getElementById('rp-exit').addEventListener('click', () => game.salir());

let ultimoEvento = -1;
game.onReplayFrame = (player, ctl) => {
  if (document.activeElement !== barra.slider) barra.slider.value = String(player.time);
  barra.time.textContent = `${game.formatTime(player.time)} / ${game.formatTime(player.duration)}`;
  if (!ctl.on && barra.play.textContent !== '▶') pintarPlay();
  // El último suceso importante hasta ahora, como subtítulo.
  let i = -1;
  for (let k = 0; k < player.markers.length && player.markers[k].t <= player.time; k++) i = k;
  if (i !== ultimoEvento) {
    ultimoEvento = i;
    barra.event.textContent = i >= 0 ? describir(player.markers[i]) : '';
  }
};
onLangChange(() => { if (game.player) pintarMarcas(game.player); });

arrancar();
