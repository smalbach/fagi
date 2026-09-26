// Consola: arriba el razonamiento del momento, abajo el histórico de decisiones.
// Todo se escribe traduciendo claves, así que cambiar de idioma lo reescribe.

import { BRAIN, POINT_TYPES, OBJECT_TYPES } from './config.js';
import { t, tx, labelOf, onLangChange, formatClock } from './i18n.js';
import { TAG_COLOR } from './narrator.js';

export function createConsola() {
  const el = {
    now: document.getElementById('c-now'),
    detail: document.getElementById('c-detail'),
    scores: document.getElementById('c-scores'),
    log: document.getElementById('c-log'),
  };
  let lineas = [];

  // Al cambiar de idioma se repinta el histórico entero desde sus claves.
  onLangChange(() => { el.log.innerHTML = ''; pintarLog(el.log, lineas, true); });

  return {
    update(fagi, nuevas) {
      lineas = nuevas;
      paintThought(el, fagi);
      pintarLog(el.log, lineas, false);
    },
    reset() {
      lineas = [];
      el.log.innerHTML = '';
      // Fagi nueva, ids desde 1 otra vez: la marca de "hasta dónde va pintado"
      // también tiene que volver a cero, o el histórico se queda vacío hasta
      // que los ids nuevos alcancen la marca vieja.
      delete el.log.dataset.last;
    },
  };
}

function bar(pct, color) {
  const width = Math.max(0, Math.min(100, pct));
  return `<span class="mini"><i style="width:${width}%;background:${color}"></i></span>`;
}

function etiqueta(tag) {
  return `<span class="tag" style="background:${TAG_COLOR[tag] ?? '#7f869a'}">${t(`tag.${tag}`)}</span>`;
}

function paintThought(el, fagi) {
  const th = fagi.thought;
  if (!th) return;

  el.now.innerHTML = `<b>${etiqueta(th.action)} ${t(`action.${th.action}`)}</b>` +
    `<span>${tx(th.reason)}</span>`;

  const agua = th.seesWater ? t('water.sees')
    : th.smellsWater ? t('water.smells')
    : th.recuerdaAgua ? t('water.remembers')
    : t('water.unknown');

  el.detail.innerHTML = [
    `<div>${t('stat.hunger').toLowerCase()} ${bar(th.hungerU * 100, '#d95b7e')} ${Math.round(th.hungerU * 100)}%</div>`,
    `<div>${t('stat.thirst').toLowerCase()} ${bar(th.thirstU * 100, '#3d8fd9')} ${Math.round(th.thirstU * 100)}%</div>`,
    `<div>${t('stat.energy').toLowerCase()} ${bar((th.energyU ?? 1) * 100, '#8fd93d')} ${Math.round((th.energyU ?? 1) * 100)}%</div>`,
    `<div>${t('word.eye')} ${th.seesPoints} · ${t('word.nose')} ${th.smellsPoints} · ${t('word.water')}: ${agua}</div>`,
    `<div>${t('word.carries')}: ${th.carrying ? labelOf(th.carrying) : t('word.nothing')}</div>`,
  ].join('');

  // Cómo puntúa cada cosa que percibe. Esta es la cuenta real del cerebro.
  if (th.ranked.length === 0) {
    el.scores.innerHTML = `<div class="dim">${t('word.nothingToChase')}</div>`;
    return;
  }
  el.scores.innerHTML = th.ranked.slice(0, 4).map((r, i) => {
    const partes = Object.entries(r.parts)
      .map(([k, v]) => `${t(`score.${CLAVE_PARTE[k] ?? k}`)} ${v >= 0 ? '+' : ''}${v.toFixed(2)}`)
      .join('  ');
    const win = i === 0 && r.score > BRAIN.minScore ? ' elegido' : '';
    return `<div class="score${win}">` +
      `<div class="head"><span style="color:${COLOR_TIPO(r.key)}">${labelOf(r.key)}` +
      `<em> ${t(`word.${SENTIDO[r.via]}`)}</em></span>` +
      `<span>${r.score.toFixed(2)} · ${Math.round(r.dist)}px</span></div>` +
      `<div class="partes">${partes}</div>` +
      `<div class="partes">${t('word.confidence')} ${Math.round((r.confidence ?? 0) * 100)}%` +
      ` · ${t(`stage.${r.stage ?? 'corta'}`)}</div></div>`;
  }).join('');
}

function pintarLog(box, lineas, todas) {
  const desde = todas ? 0 : Number(box.dataset.last ?? 0);
  const nuevas = lineas.filter((l) => l.id > desde);
  if (nuevas.length === 0) return;

  for (const l of nuevas) {
    const row = document.createElement('div');
    row.className = 'line';
    row.innerHTML = `<span class="t">${formatClock(l.t)}</span>${etiqueta(l.tag)}` +
      `<span class="tx"><b>${tx(l.text)}</b>${l.detail ? `<i>${tx(l.detail)}</i>` : ''}</span>`;
    box.appendChild(row);
  }
  while (box.childElementCount > 80) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
  box.dataset.last = lineas[lineas.length - 1].id;
}

const SENTIDO = { vista: 'eye', olfato: 'nose', memoria: 'memory' };
const CLAVE_PARTE = {
  creencia: 'belief', curiosidad: 'curiosity',
  necesidad: 'need', distancia: 'distance', olfato: 'smell',
};

// Los colores sí viven en config: no dependen del idioma.
const COLOR_TIPO = (key) => (POINT_TYPES[key] ?? OBJECT_TYPES[key])?.color ?? '#8a90a2';
