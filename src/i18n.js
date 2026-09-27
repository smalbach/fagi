// Idiomas. Inglés por defecto; el idioma elegido se guarda en el navegador.
//
// Nada guarda texto ya traducido: los módulos guardan CLAVES y traducen al
// pintar, así que cambiar de idioma reetiqueta también lo que ya está en
// pantalla, incluido el histórico de la consola.

import en from './i18n/en.js';
import es from './i18n/es.js';

// Un diccionario por idioma, en src/i18n/. El orden de aquí es el de LANGS.
const DICT = { en, es };

export const LANGS = Object.keys(DICT);

let lang = leerGuardado();
const oyentes = new Set();

function leerGuardado() {
  try {
    const guardado = localStorage.getItem('fagi.lang');
    if (guardado && DICT[guardado]) return guardado;
  } catch { /* sin localStorage: inglés y ya está */ }
  return 'en';
}

export function getLang() {
  return lang;
}

export function setLang(nuevo) {
  if (!DICT[nuevo] || nuevo === lang) return;
  lang = nuevo;
  try { localStorage.setItem('fagi.lang', nuevo); } catch { /* da igual */ }
  for (const f of oyentes) f(lang);
}

// Para que el HUD y el panel se reconstruyan al cambiar de idioma.
export function onLangChange(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

// t('reason.memory', { sec: { dur: 1.4, precise: true } })
//   ->  'lo perdió de vista, insiste 1.4s más'
export function t(key, params) {
  const txt = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (!params) return txt;
  return txt.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (v && typeof v === 'object') {
      // Un parámetro puede ser otra clave: { key: 'water.sees' }.
      if (v.key) return t(v.key, v.params);
      // O una duración en segundos sin formatear: { dur: 90 } -> '1m 30s'.
      if (typeof v.dur === 'number') return formatDuration(v.dur, { precise: v.precise });
    }
    return v ?? `{${k}}`;
  });
}

// Duraciones legibles. La simulación cuenta todo en segundos, pero en pantalla
// "1m 30s" se lee de un vistazo y "90.0s" no. Como mucho dos unidades: la
// tercera no aporta nada a quien está mirando el HUD.
//
//   formatDuration(42)     -> '42s'
//   formatDuration(90)     -> '1m 30s'
//   formatDuration(3900)   -> '1h 05m'
//   formatDuration(180000) -> '2d 02h'
//
// `precise` deja un decimal en los segundos, para cuentas atrás cortas (efectos
// activos, insistencia de memoria) donde la décima sí se nota.
export function formatDuration(segundos, { precise = false } = {}) {
  const u = (k) => t(`unit.${k}`);
  const bruto = Math.max(0, Number(segundos) || 0);
  // Redondear ANTES de repartir, o 59.7 saldría como '60s'.
  const total = precise ? Math.round(bruto * 10) / 10 : Math.round(bruto);

  if (total < 60) return `${precise ? total.toFixed(1) : total}${u('sec')}`;

  const seg = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hor = Math.floor(total / 3600) % 24;
  const dia = Math.floor(total / 86400);

  // La unidad pequeña desaparece cuando es cero: '5m' antes que '5m 00s'.
  if (total < 3600) return seg === 0 ? `${min}${u('min')}` : `${min}${u('min')} ${dos(seg)}${u('sec')}`;
  if (total < 86400) return min === 0 ? `${hor}${u('hour')}` : `${hor}${u('hour')} ${dos(min)}${u('min')}`;
  return hor === 0 ? `${dia}${u('day')}` : `${dia}${u('day')} ${dos(hor)}${u('hour')}`;
}

// Marca de tiempo de cronómetro, para el histórico de la consola: ahí dos
// líneas seguidas tienen que distinguirse, así que los segundos no se pierden.
//
//   formatClock(12.4) -> '12.4s'   formatClock(90) -> '1:30'   formatClock(3725) -> '1:02:05'
export function formatClock(segundos) {
  const total = Math.max(0, Number(segundos) || 0);
  if (total < 60) return `${total.toFixed(1)}${t('unit.sec')}`;
  const seg = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hor = Math.floor(total / 3600);
  return hor > 0 ? `${hor}:${dos(min)}:${dos(seg)}` : `${min}:${dos(seg)}`;
}

function dos(n) {
  return String(n).padStart(2, '0');
}

// Un texto que puede ser una clave con parámetros: { key, params } o ya una cadena.
export function tx(valor) {
  if (!valor) return '';
  return typeof valor === 'string' ? valor : t(valor.key, valor.params);
}

// Nombre traducido de un alimento o de un objeto del mapa.
export function labelOf(key) {
  return t(`type.${key}`);
}

// Rellena los textos fijos del HTML (los que llevan data-i18n) y vuelve a
// hacerlo cada vez que se cambia de idioma.
export function bindDom() {
  const aplicar = () => {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
  };
  const selector = document.getElementById('lang');
  if (selector) {
    selector.value = lang;
    selector.addEventListener('change', () => setLang(selector.value));
  }
  onLangChange(aplicar);
  aplicar();
}
