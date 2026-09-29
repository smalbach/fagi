// Languages. English by default; the chosen language is saved in the browser.
//
// Nothing stores already-translated text: modules store KEYS and translate
// when painting, so switching language also relabels what's already on
// screen, including the console history.

import { POINT_TYPES } from './config.js';
import en from './i18n/en.js';
import es from './i18n/es.js';

// One dictionary per language, in src/i18n/. The order here is LANGS' order.
const DICT = { en, es };

export const LANGS = Object.keys(DICT);

let lang = readSaved();
const listeners = new Set();

function readSaved() {
  try {
    const saved = localStorage.getItem('fagi.lang');
    if (saved && DICT[saved]) return saved;
  } catch { /* no localStorage: English and that's it */ }
  return 'en';
}

export function getLang() {
  return lang;
}

export function setLang(fresh) {
  if (!DICT[fresh] || fresh === lang) return;
  lang = fresh;
  try { localStorage.setItem('fagi.lang', fresh); } catch { /* doesn't matter */ }
  for (const f of listeners) f(lang);
}

// So the HUD and the panel rebuild themselves on a language switch.
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// t('reason.memory', { sec: { dur: 1.4, precise: true } })
//   ->  'lost sight of it, insists 1.4s more'
export function t(key, params) {
  const txt = DICT[lang][key] ?? DICT.en[key]
    ?? (key.startsWith('type.') ? traitLabel(key.slice(5)) : null) ?? key;
  if (!params) return txt;
  return txt.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (v && typeof v === 'object') {
      // A parameter can be another key: { key: 'water.sees' }.
      if (v.key) return t(v.key, v.params);
      // Or an unformatted duration in seconds: { dur: 90 } -> '1m 30s'.
      if (typeof v.dur === 'number') return formatDuration(v.dur, { precise: v.precise });
    }
    return v ?? `{${k}}`;
  });
}

// Readable durations. The simulation counts everything in seconds, but on
// screen "1m 30s" reads at a glance and "90.0s" doesn't. At most two units:
// the third adds nothing for whoever is looking at the HUD.
//
//   formatDuration(42)     -> '42s'
//   formatDuration(90)     -> '1m 30s'
//   formatDuration(3900)   -> '1h 05m'
//   formatDuration(180000) -> '2d 02h'
//
// `precise` keeps one decimal in the seconds, for short countdowns (active
// effects, memory insistence) where the tenth does show.
export function formatDuration(seconds, { precise = false } = {}) {
  const u = (k) => t(`unit.${k}`);
  const raw = Math.max(0, Number(seconds) || 0);
  // Round BEFORE splitting, or 59.7 would come out as '60s'.
  const total = precise ? Math.round(raw * 10) / 10 : Math.round(raw);

  if (total < 60) return `${precise ? total.toFixed(1) : total}${u('sec')}`;

  const sec = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600) % 24;
  const day = Math.floor(total / 86400);

  // The small unit disappears when it's zero: '5m' rather than '5m 00s'.
  if (total < 3600) return sec === 0 ? `${min}${u('min')}` : `${min}${u('min')} ${two(sec)}${u('sec')}`;
  if (total < 86400) return min === 0 ? `${hours}${u('hour')}` : `${hours}${u('hour')} ${two(min)}${u('min')}`;
  return hours === 0 ? `${day}${u('day')}` : `${day}${u('day')} ${two(hours)}${u('hour')}`;
}

// Stopwatch timestamp, for the console history: there two consecutive
// lines have to be told apart, so the seconds are not dropped.
//
//   formatClock(12.4) -> '12.4s'   formatClock(90) -> '1:30'   formatClock(3725) -> '1:02:05'
export function formatClock(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 60) return `${total.toFixed(1)}${t('unit.sec')}`;
  const sec = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours > 0 ? `${hours}:${two(min)}:${two(sec)}` : `${min}:${two(sec)}`;
}

function two(n) {
  return String(n).padStart(2, '0');
}

// A text that can be a key with parameters: { key, params } or already a string.
// A list of them reads as sentences one after another.
export function tx(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.map(tx).filter(Boolean).join(' ');
  return typeof value === 'string' ? value : t(value.key, value.params);
}

// Translated name of a food or of a map object.
// A classic type has its own name; a wild species (chemistry.js) is named by
// its traits, and a trait ('smell:sour') by its value. Anything that asks for
// 'type.<key>' gets these too, so the console and the narrator name them.
export function labelOf(key) {
  return t(`type.${key}`);
}

function traitLabel(key) {
  if (key.includes(':')) {
    const [dim, val] = key.split(':');
    return t(`cue.${dim}`, { v: t(`trait.${val}`) });
  }
  const traits = POINT_TYPES[key]?.species ? POINT_TYPES[key].traits : null;
  if (!traits) return null;
  // Where the language has grammatical gender, the color agrees with the
  // shape's noun ('gota roja', 'cristal rojo').
  const gender = DICT[lang][`gender.${traits.shape}`];
  const color = (gender && DICT[lang][`trait.${traits.color}.${gender}`]) ?? t(`trait.${traits.color}`);
  return t('species.label', { color, shape: t(`trait.${traits.shape}`), smell: t(`trait.${traits.smell}`) });
}

// Fills in the HTML's fixed texts (the ones with data-i18n) and does it
// again every time the language changes.
export function bindDom() {
  const applySets = () => {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
    for (const el of document.querySelectorAll('[data-i18n-title]')) {
      el.title = t(el.dataset.i18nTitle);
      el.setAttribute('aria-label', el.title);
    }
  };
  const selector = document.getElementById('lang');
  if (selector) {
    selector.value = lang;
    selector.addEventListener('change', () => setLang(selector.value));
  }
  onLangChange(applySets);
  applySets();
}
