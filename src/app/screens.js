// Screens outside the game: log in, sign up, forgot/reset password, waitlist, home (sessions) and
// admin panel. All of them are drawn inside #screen, which covers the game
// while it's visible.
//
// Everything that comes from the server (emails, names) goes through esc()
// before going into the HTML.

import { get, post, del, ApiError } from './api.js';
import { t, formatDuration, getLang, setLang, onLangChange, LANGS } from '../i18n.js';
import { versionLabel, versionTitle } from '../version.js';

const root = () => document.getElementById('screen');

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// The screen on view, drawn again when the language changes.
let current = null;
onLangChange(() => current?.());

function paint(html, again) {
  current = again;
  const el = root();
  el.innerHTML = `<div class="screen-card">${html}</div>`;
  el.querySelectorAll('.screen-lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  el.hidden = false;
  document.body.classList.add('screen-open');
  return el;
}

export function hide() {
  current = null;
  root().hidden = true;
  root().innerHTML = '';
  document.body.classList.remove('screen-open');
}

function errorMessage(err) {
  const key = `err.${err?.code ?? 'network'}`;
  const txt = t(key);
  return txt === key ? t('err.generic') : txt;
}

// Each cell carries its column's title: on mobile the table is drawn as
// cards and the header isn't visible.
function labelIt(list) {
  const titles = [...list.querySelectorAll('thead th')].map((th) => th.textContent);
  for (const tr of list.querySelectorAll('tbody tr')) {
    [...tr.children].forEach((td, i) => { if (titles[i]) td.dataset.label = titles[i]; });
  }
}

const date = (iso) => (iso ? new Date(iso).toLocaleString(getLang(), { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// The research site in the same language: / is Spanish, /en/ English.
const siteHref = () => (getLang() === 'es' ? '/' : '/en/');

const header = (title, extra = '') => `
  <nav class="screen-nav">
    <a href="${siteHref()}" class="screen-back">← ${t('nav.research')}</a>
    <span class="screen-lang" role="group" aria-label="${t('nav.lang')}">${LANGS.map((l) => `
      <button type="button" data-lang="${l}" ${l === getLang() ? 'aria-current="true"' : ''}>${l.toUpperCase()}</button>`).join('')}
    </span>
  </nav>
  <header class="screen-head">
    <h1>${t('app.title')}</h1>
    <span class="screen-sub">${title}</span>
    ${extra}
    <span class="app-version" title="${esc(versionTitle())}">${esc(versionLabel())}</span>
  </header>`;

// --- log in and sign up ---

export function showLogin({ onDone }) {
  const el = paint(`
    ${header(t('auth.login'))}
    <form class="screen-form" id="f-login">
      <label>${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label>
      <label>${t('auth.password')}<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.loginBtn')}</button>
      <p class="screen-alt"><a href="#" id="go-forgot">${t('auth.forgot')}</a></p>
      <p class="screen-alt">${t('auth.noAccount')} <a href="#" id="go-register">${t('auth.register')}</a></p>
    </form>`, () => showLogin({ onDone }));
  el.querySelector('#go-register').addEventListener('click', (e) => { e.preventDefault(); showRegister({ onDone }); });
  el.querySelector('#go-forgot').addEventListener('click', (e) => { e.preventDefault(); showForgot({ onDone }); });
  submitForm(el.querySelector('#f-login'), async (data) => {
    const { user } = await post('/auth/login', { email: data.email, password: data.password });
    onDone(user);
  });
}

export function showRegister({ onDone }) {
  const el = paint(`
    ${header(t('auth.register'))}
    <form class="screen-form" id="f-register">
      <label>${t('auth.name')}<input name="name" type="text" autocomplete="name" maxlength="80"></label>
      <label>${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label>
      <label>${t('auth.password')}<input name="password" type="password" autocomplete="new-password" minlength="8" required>
        <small>${t('auth.passwordHint')}</small></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.registerBtn')}</button>
      <p class="screen-alt">${t('auth.haveAccount')} <a href="#" id="go-login">${t('auth.login')}</a></p>
    </form>`, () => showRegister({ onDone }));
  el.querySelector('#go-login').addEventListener('click', (e) => { e.preventDefault(); showLogin({ onDone }); });
  submitForm(el.querySelector('#f-register'), async (data) => {
    const { user } = await post('/auth/register', data);
    onDone(user);
  });
}

// Asks for the reset link. The server answers the same whether the email
// has an account or not, so the screen does too.
export function showForgot({ onDone }) {
  const el = paint(`
    ${header(t('auth.forgotTitle'))}
    <form class="screen-form" id="f-forgot">
      <p class="screen-muted">${t('auth.forgotHelp')}</p>
      <label>${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.forgotBtn')}</button>
      <p class="screen-alt"><a href="#" id="go-login">${t('auth.backToLogin')}</a></p>
    </form>`, () => showForgot({ onDone }));
  el.querySelector('#go-login').addEventListener('click', (e) => { e.preventDefault(); showLogin({ onDone }); });
  const form = el.querySelector('#f-forgot');
  submitForm(form, async (data) => {
    await post('/auth/forgot', { email: data.email, lang: getLang() });
    form.querySelector('label').remove();
    form.querySelector('button[type=submit]').remove();
    form.querySelector('.screen-muted').textContent = t('auth.forgotSent', { email: data.email.trim() });
  });
}

// Opened from the emailed link (#reset=<token>): chooses the new password.
export function showReset(token, { onDone }) {
  const el = paint(`
    ${header(t('auth.resetTitle'))}
    <form class="screen-form" id="f-reset">
      <label>${t('auth.newPassword')}<input name="password" type="password" autocomplete="new-password" minlength="8" required>
        <small>${t('auth.passwordHint')}</small></label>
      <label>${t('auth.repeatPassword')}<input name="repeat" type="password" autocomplete="new-password" minlength="8" required></label>
      <p class="screen-error" role="alert"></p>
      <button type="submit" class="primary">${t('auth.resetBtn')}</button>
      <p class="screen-alt"><a href="#" id="go-forgot">${t('auth.resetAgain')}</a></p>
    </form>`, () => showReset(token, { onDone }));
  el.querySelector('#go-forgot').addEventListener('click', (e) => { e.preventDefault(); showForgot({ onDone }); });
  submitForm(el.querySelector('#f-reset'), async (data) => {
    if (data.password !== data.repeat) throw new ApiError(400, 'password_mismatch');
    const { user } = await post('/auth/reset', { token, password: data.password });
    onDone(user);
  });
}

function submitForm(form, action) {
  const error = form.querySelector('.screen-error');
  const btn = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    btn.disabled = true;
    try {
      await action(Object.fromEntries(new FormData(form)));
    } catch (err) {
      error.textContent = errorMessage(err);
    } finally {
      btn.disabled = false;
    }
  });
}

async function logout(onLogout) {
  try { await post('/auth/logout'); } catch { /* the cookie goes away anyway */ }
  onLogout();
}

// --- waitlist ---

export function showWaitlist(user, { onRetry, onLogout }) {
  const key = user.status === 'pending' ? 'wait.pending' : `wait.${user.status}`;
  const el = paint(`
    ${header(t('wait.title'))}
    <div class="screen-body">
      <p class="screen-big">${t(key)}</p>
      <p class="screen-muted">${esc(user.email)}</p>
      <div class="screen-actions">
        <button id="w-retry">${t('wait.check')}</button>
        <button id="w-logout">${t('auth.logout')}</button>
      </div>
    </div>`, () => showWaitlist(user, { onRetry, onLogout }));
  el.querySelector('#w-retry').addEventListener('click', onRetry);
  el.querySelector('#w-logout').addEventListener('click', () => logout(onLogout));
}

// --- home: the list of sessions ---

export async function showHome(user, { onNew, onReplay, onAdmin, onLogout }) {
  const el = paint(`
    ${header(t('home.title'), `
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
    </div>`, () => showHome(user, { onNew, onReplay, onAdmin, onLogout }));
  el.querySelector('#h-new').addEventListener('click', onNew);
  el.querySelector('#h-logout').addEventListener('click', () => logout(onLogout));
  el.querySelector('#h-admin')?.addEventListener('click', onAdmin);
  const error = el.querySelector('.screen-error');

  const fileHandle = el.querySelector('#h-import-file');
  el.querySelector('#h-import').addEventListener('click', () => fileHandle.click());
  fileHandle.addEventListener('change', async () => {
    const f = fileHandle.files?.[0];
    fileHandle.value = '';
    if (!f) return;
    error.textContent = '';
    try {
      const data = JSON.parse(await f.text());
      await post('/sessions/import', { session: data.session ?? {}, events: data.events });
      await paintList();
    } catch (err) {
      error.textContent = err instanceof SyntaxError ? t('err.badFile') : errorMessage(err);
    }
  });

  async function paintList() {
    const list = el.querySelector('#h-list');
    let sessions;
    try {
      ({ sessions: sessions } = await get('/sessions'));
    } catch (err) {
      list.innerHTML = `<p class="screen-error">${esc(errorMessage(err))}</p>`;
      return;
    }
    if (!sessions.length) { list.innerHTML = `<p class="screen-muted">${t('home.empty')}</p>`; return; }
    list.innerHTML = `
      <table>
        <thead><tr>
          <th>${t('home.started')}</th><th>${t('home.duration')}</th><th>${t('home.outcome')}</th>
          <th>${t('home.eaten')}</th><th>${t('home.stored')}</th><th>${t('home.rules')}</th>
          <th>${t('home.dunks')}</th><th>${t('home.rains')}</th><th></th>
        </tr></thead>
        <tbody>${sessions.map((s) => `
          <tr data-id="${esc(s.id)}">
            <td>${date(s.startedAt)}</td>
            <td>${formatDuration(s.duration ?? 0)}</td>
            <td>${result(s)}</td>
            <td>${esc(s.summary?.eaten ?? '—')}</td>
            <td>${esc(s.summary?.stored ?? '—')}</td>
            <td>${esc(s.summary?.rules ?? '—')}</td>
            <td>${esc(s.summary?.dunks ?? '—')}</td>
            <td>${esc(s.summary?.rains ?? '—')}</td>
            <td><div class="screen-row-actions">
              <button data-act="replay" ${s.events ? '' : 'disabled'}>${t('home.replay')}</button>
              <button data-act="export" ${s.events ? '' : 'disabled'}>${t('home.export')}</button>
              <button data-act="delete">${t('home.delete')}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    labelIt(list);
    list.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', async () => {
      const row = b.closest('tr');
      const id = row.dataset.id;
      const s = sessions.find((x) => x.id === id);
      error.textContent = '';
      try {
        if (b.dataset.act === 'replay') {
          b.disabled = true;
          const { events } = await get(`/sessions/${id}/events`);
          onReplay(s, events);
        } else if (b.dataset.act === 'export') {
          const { events } = await get(`/sessions/${id}/events`);
          download(`fagi-session-${s.startedAt.slice(0, 19).replace(/[:T]/g, '-')}.json`, { session: s, events });
        } else if (b.dataset.act === 'delete') {
          if (!confirm(t('home.confirmDelete'))) return;
          await del(`/sessions/${id}`);
          await paintList();
        }
      } catch (err) {
        b.disabled = false;
        error.textContent = errorMessage(err);
      }
    }));
  }

  await paintList();
}

function result(s) {
  if (!s.endedAt) return t('home.open');
  if (s.summary?.cause) return t('home.died', { cause: t(`cause.${s.summary.cause}`) });
  return t(`end.${s.endReason}`) === `end.${s.endReason}` ? esc(s.endReason) : t(`end.${s.endReason}`);
}

function download(name, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// --- admin: approve the waitlist ---

const FILTERS = ['pending', 'approved', 'rejected', 'disabled', ''];

export async function showAdmin(user, { onBack }) {
  let filterFn = 'pending';
  const el = paint(`
    ${header(t('admin.title'), `<button id="a-back">${t('admin.back')}</button>`)}
    <div class="screen-body">
      <div class="screen-tabs">${FILTERS.map((f) => `<button data-f="${f}">${t(`admin.f.${f || 'all'}`)}</button>`).join('')}</div>
      <p class="screen-error" role="alert"></p>
      <div id="a-list" class="screen-list"></div>
    </div>`, () => showAdmin(user, { onBack }));
  el.querySelector('#a-back').addEventListener('click', onBack);
  const error = el.querySelector('.screen-error');
  el.querySelectorAll('.screen-tabs button').forEach((b) => b.addEventListener('click', () => { filterFn = b.dataset.f; paintList(); }));

  async function paintList() {
    el.querySelectorAll('.screen-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.f === filterFn));
    const list = el.querySelector('#a-list');
    let users;
    try {
      ({ users: users } = await get(`/admin/users${filterFn ? `?status=${filterFn}` : ''}`));
    } catch (err) {
      error.textContent = errorMessage(err);
      return;
    }
    if (!users.length) { list.innerHTML = `<p class="screen-muted">${t('admin.empty')}</p>`; return; }
    list.innerHTML = `
      <table>
        <thead><tr><th>${t('auth.email')}</th><th>${t('auth.name')}</th><th>${t('admin.registered')}</th>
          <th>${t('admin.status')}</th><th>${t('admin.sessions')}</th><th></th></tr></thead>
        <tbody>${users.map((u) => `
          <tr data-id="${esc(u.id)}">
            <td>${esc(u.email)}${u.role === 'admin' ? ' <span class="tag">admin</span>' : ''}</td>
            <td>${esc(u.name)}</td>
            <td>${date(u.createdAt)}</td>
            <td><span class="status status-${esc(u.status)}">${t(`admin.f.${u.status}`)}</span></td>
            <td>${esc(u.sessions)}</td>
            <td><div class="screen-row-actions">${u.id === user.id ? '' : actions(u.status)}</div></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    labelIt(list);
    list.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', async () => {
      error.textContent = '';
      b.disabled = true;
      try {
        await post(`/admin/users/${b.closest('tr').dataset.id}/${b.dataset.act}`);
        await paintList();
      } catch (err) {
        b.disabled = false;
        error.textContent = errorMessage(err);
      }
    }));
  }

  function actions(state) {
    const b = (act, cls = '') => `<button data-act="${act}" class="${cls}">${t(`admin.${act}`)}</button>`;
    if (state === 'pending') return b('approve', 'primary') + b('reject');
    if (state === 'approved') return b('disable');
    return b('approve', 'primary');
  }

  await paintList();
}
