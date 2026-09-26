// Pantallas fuera del juego: entrar, registrarse, lista de espera, inicio
// (sesiones) y panel de admin. Todas se pintan dentro de #screen, que tapa el
// juego mientras está visible.
//
// Todo lo que viene del servidor (emails, nombres) pasa por esc() antes de
// entrar en el HTML.

import { get, post, del } from './api.js';
import { t, formatDuration, getLang } from '../i18n.js';

const raiz = () => document.getElementById('screen');

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pintar(html) {
  const el = raiz();
  el.innerHTML = `<div class="screen-card">${html}</div>`;
  el.hidden = false;
  document.body.classList.add('screen-open');
  return el;
}

export function ocultar() {
  raiz().hidden = true;
  raiz().innerHTML = '';
  document.body.classList.remove('screen-open');
}

function mensajeDeError(err) {
  const clave = `err.${err?.code ?? 'network'}`;
  const txt = t(clave);
  return txt === clave ? t('err.generic') : txt;
}

const fecha = (iso) => (iso ? new Date(iso).toLocaleString(getLang(), { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const cabecera = (titulo, extra = '') => `
  <header class="screen-head">
    <h1>${t('app.title')}</h1>
    <span class="screen-sub">${titulo}</span>
    ${extra}
  </header>`;

// --- entrar y registrarse ---

export function showLogin({ onDone }) {
  const el = pintar(`
    ${cabecera(t('auth.login'))}
    <form class="screen-form" id="f-login">
      <label>${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label>
      <label>${t('auth.password')}<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.loginBtn')}</button>
      <p class="screen-alt">${t('auth.noAccount')} <a href="#" id="go-register">${t('auth.register')}</a></p>
    </form>`);
  el.querySelector('#go-register').addEventListener('click', (e) => { e.preventDefault(); showRegister({ onDone }); });
  enviarFormulario(el.querySelector('#f-login'), async (datos) => {
    const { user } = await post('/auth/login', { email: datos.email, password: datos.password });
    onDone(user);
  });
}

export function showRegister({ onDone }) {
  const el = pintar(`
    ${cabecera(t('auth.register'))}
    <form class="screen-form" id="f-register">
      <label>${t('auth.name')}<input name="name" type="text" autocomplete="name" maxlength="80"></label>
      <label>${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label>
      <label>${t('auth.password')}<input name="password" type="password" autocomplete="new-password" minlength="8" required>
        <small>${t('auth.passwordHint')}</small></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.registerBtn')}</button>
      <p class="screen-alt">${t('auth.haveAccount')} <a href="#" id="go-login">${t('auth.login')}</a></p>
    </form>`);
  el.querySelector('#go-login').addEventListener('click', (e) => { e.preventDefault(); showLogin({ onDone }); });
  enviarFormulario(el.querySelector('#f-register'), async (datos) => {
    const { user } = await post('/auth/register', datos);
    onDone(user);
  });
}

function enviarFormulario(form, accion) {
  const error = form.querySelector('.screen-error');
  const boton = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    boton.disabled = true;
    try {
      await accion(Object.fromEntries(new FormData(form)));
    } catch (err) {
      error.textContent = mensajeDeError(err);
    } finally {
      boton.disabled = false;
    }
  });
}

async function salirDeCuenta(onLogout) {
  try { await post('/auth/logout'); } catch { /* la cookie se va igual */ }
  onLogout();
}

// --- lista de espera ---

export function showWaitlist(user, { onRetry, onLogout }) {
  const clave = user.status === 'pending' ? 'wait.pending' : `wait.${user.status}`;
  const el = pintar(`
    ${cabecera(t('wait.title'))}
    <div class="screen-body">
      <p class="screen-big">${t(clave)}</p>
      <p class="screen-muted">${esc(user.email)}</p>
      <div class="screen-actions">
        <button id="w-retry">${t('wait.check')}</button>
        <button id="w-logout">${t('auth.logout')}</button>
      </div>
    </div>`);
  el.querySelector('#w-retry').addEventListener('click', onRetry);
  el.querySelector('#w-logout').addEventListener('click', () => salirDeCuenta(onLogout));
}

// --- inicio: la lista de sesiones ---

export async function showHome(user, { onNew, onReplay, onAdmin, onLogout }) {
  const el = pintar(`
    ${cabecera(t('home.title'), `
      <span class="screen-user">${esc(user.name || user.email)}</span>
      ${user.role === 'admin' ? `<button id="h-admin">${t('home.admin')}</button>` : ''}
      <button id="h-logout">${t('auth.logout')}</button>`)}
    <div class="screen-body">
      <div class="screen-actions">
        <button id="h-new" class="primary">${t('home.new')}</button>
        <button id="h-import">${t('home.import')}</button>
        <input id="h-import-file" type="file" accept=".json,application/json" hidden>
        <span class="screen-error" role="alert"></span>
      </div>
      <div id="h-list" class="screen-list"><p class="screen-muted">${t('home.loading')}</p></div>
    </div>`);
  el.querySelector('#h-new').addEventListener('click', onNew);
  el.querySelector('#h-logout').addEventListener('click', () => salirDeCuenta(onLogout));
  el.querySelector('#h-admin')?.addEventListener('click', onAdmin);
  const error = el.querySelector('.screen-error');

  const fichero = el.querySelector('#h-import-file');
  el.querySelector('#h-import').addEventListener('click', () => fichero.click());
  fichero.addEventListener('change', async () => {
    const f = fichero.files?.[0];
    fichero.value = '';
    if (!f) return;
    error.textContent = '';
    try {
      const datos = JSON.parse(await f.text());
      await post('/sessions/import', { session: datos.session ?? {}, events: datos.events });
      await pintarLista();
    } catch (err) {
      error.textContent = err instanceof SyntaxError ? t('err.badFile') : mensajeDeError(err);
    }
  });

  async function pintarLista() {
    const lista = el.querySelector('#h-list');
    let sesiones;
    try {
      ({ sessions: sesiones } = await get('/sessions'));
    } catch (err) {
      lista.innerHTML = `<p class="screen-error">${esc(mensajeDeError(err))}</p>`;
      return;
    }
    if (!sesiones.length) { lista.innerHTML = `<p class="screen-muted">${t('home.empty')}</p>`; return; }
    lista.innerHTML = `
      <table>
        <thead><tr>
          <th>${t('home.started')}</th><th>${t('home.duration')}</th><th>${t('home.outcome')}</th>
          <th>${t('home.eaten')}</th><th>${t('home.rules')}</th><th></th>
        </tr></thead>
        <tbody>${sesiones.map((s) => `
          <tr data-id="${esc(s.id)}">
            <td>${fecha(s.startedAt)}</td>
            <td>${formatDuration(s.duration ?? 0)}</td>
            <td>${resultado(s)}</td>
            <td>${esc(s.summary?.eaten ?? '—')}</td>
            <td>${esc(s.summary?.rules ?? '—')}</td>
            <td><div class="screen-row-actions">
              <button data-act="replay" ${s.events ? '' : 'disabled'}>${t('home.replay')}</button>
              <button data-act="export" ${s.events ? '' : 'disabled'}>${t('home.export')}</button>
              <button data-act="delete">${t('home.delete')}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    lista.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', async () => {
      const fila = b.closest('tr');
      const id = fila.dataset.id;
      const s = sesiones.find((x) => x.id === id);
      error.textContent = '';
      try {
        if (b.dataset.act === 'replay') {
          b.disabled = true;
          const { events } = await get(`/sessions/${id}/events`);
          onReplay(s, events);
        } else if (b.dataset.act === 'export') {
          const { events } = await get(`/sessions/${id}/events`);
          descargar(`fagi-sesion-${s.startedAt.slice(0, 19).replace(/[:T]/g, '-')}.json`, { session: s, events });
        } else if (b.dataset.act === 'delete') {
          if (!confirm(t('home.confirmDelete'))) return;
          await del(`/sessions/${id}`);
          await pintarLista();
        }
      } catch (err) {
        b.disabled = false;
        error.textContent = mensajeDeError(err);
      }
    }));
  }

  await pintarLista();
}

function resultado(s) {
  if (!s.endedAt) return t('home.open');
  if (s.summary?.cause) return t('home.died', { cause: t(`cause.${s.summary.cause}`) });
  return t(`end.${s.endReason}`) === `end.${s.endReason}` ? esc(s.endReason) : t(`end.${s.endReason}`);
}

function descargar(nombre, datos) {
  const blob = new Blob([JSON.stringify(datos)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

// --- admin: aprobar la lista de espera ---

const FILTROS = ['pending', 'approved', 'rejected', 'disabled', ''];

export async function showAdmin(user, { onBack }) {
  let filtro = 'pending';
  const el = pintar(`
    ${cabecera(t('admin.title'), `<button id="a-back">${t('admin.back')}</button>`)}
    <div class="screen-body">
      <div class="screen-tabs">${FILTROS.map((f) => `<button data-f="${f}">${t(`admin.f.${f || 'all'}`)}</button>`).join('')}</div>
      <p class="screen-error" role="alert"></p>
      <div id="a-list" class="screen-list"></div>
    </div>`);
  el.querySelector('#a-back').addEventListener('click', onBack);
  const error = el.querySelector('.screen-error');
  el.querySelectorAll('.screen-tabs button').forEach((b) => b.addEventListener('click', () => { filtro = b.dataset.f; pintarLista(); }));

  async function pintarLista() {
    el.querySelectorAll('.screen-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.f === filtro));
    const lista = el.querySelector('#a-list');
    let usuarios;
    try {
      ({ users: usuarios } = await get(`/admin/users${filtro ? `?status=${filtro}` : ''}`));
    } catch (err) {
      error.textContent = mensajeDeError(err);
      return;
    }
    if (!usuarios.length) { lista.innerHTML = `<p class="screen-muted">${t('admin.empty')}</p>`; return; }
    lista.innerHTML = `
      <table>
        <thead><tr><th>${t('auth.email')}</th><th>${t('auth.name')}</th><th>${t('admin.registered')}</th>
          <th>${t('admin.status')}</th><th>${t('admin.sessions')}</th><th></th></tr></thead>
        <tbody>${usuarios.map((u) => `
          <tr data-id="${esc(u.id)}">
            <td>${esc(u.email)}${u.role === 'admin' ? ' <span class="tag">admin</span>' : ''}</td>
            <td>${esc(u.name)}</td>
            <td>${fecha(u.createdAt)}</td>
            <td><span class="status status-${esc(u.status)}">${t(`admin.f.${u.status}`)}</span></td>
            <td>${esc(u.sessions)}</td>
            <td><div class="screen-row-actions">${u.id === user.id ? '' : acciones(u.status)}</div></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    lista.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', async () => {
      error.textContent = '';
      b.disabled = true;
      try {
        await post(`/admin/users/${b.closest('tr').dataset.id}/${b.dataset.act}`);
        await pintarLista();
      } catch (err) {
        b.disabled = false;
        error.textContent = mensajeDeError(err);
      }
    }));
  }

  function acciones(estado) {
    const b = (act, cls = '') => `<button data-act="${act}" class="${cls}">${t(`admin.${act}`)}</button>`;
    if (estado === 'pending') return b('approve', 'primary') + b('reject');
    if (estado === 'approved') return b('disable');
    return b('approve', 'primary');
  }

  await pintarLista();
}
