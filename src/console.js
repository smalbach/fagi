// Consola: arriba el razonamiento del momento, abajo el histórico de decisiones.
// Todo se escribe traduciendo claves, así que cambiar de idioma lo reescribe.

import { BRAIN, POINT_TYPES, OBJECT_TYPES } from './config.js';
import { t, tx, labelOf, onLangChange, formatClock } from './i18n.js';
import { TAG_COLOR, rethinkLine, rethinkWhy } from './narrator.js';

export function createConsole() {
  const el = {
    now: document.getElementById('c-now'),
    detail: document.getElementById('c-detail'),
    scores: document.getElementById('c-scores'),
    log: document.getElementById('c-log'),
  };
  let lines = [];

  // Al cambiar de idioma se repinta el histórico entero desde sus claves.
  onLangChange(() => { el.log.innerHTML = ''; paintLog(el.log, lines, true); });

  return {
    update(fagi, newOnes) {
      lines = newOnes;
      paintThought(el, fagi);
      paintLog(el.log, lines, false);
    },
    reset() {
      lines = [];
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

function tagLabel(tag) {
  return `<span class="tag" style="background:${TAG_COLOR[tag] ?? '#7f869a'}">${t(`tag.${tag}`)}</span>`;
}

function paintThought(el, fagi) {
  const th = fagi.thought;
  if (!th) return;

  el.now.innerHTML = `<b>${tagLabel(th.action)} ${t(`action.${th.action}`)}</b>` +
    `<span>${tx(th.reason)}</span>`;

  const water = th.seesWater ? t('water.sees')
    : th.smellsWater ? t('water.smells')
    : th.remembersWater ? t('water.remembers')
    : t('water.unknown');

  el.detail.innerHTML = [
    `<div>${t('stat.hunger').toLowerCase()} ${bar(th.hungerU * 100, '#d95b7e')} ${Math.round(th.hungerU * 100)}%</div>`,
    `<div>${t('stat.thirst').toLowerCase()} ${bar(th.thirstU * 100, '#3d8fd9')} ${Math.round(th.thirstU * 100)}%</div>`,
    `<div>${t('stat.energy').toLowerCase()} ${bar((th.energyU ?? 1) * 100, '#8fd93d')} ${Math.round((th.energyU ?? 1) * 100)}%</div>`,
    `<div>${t('word.eye')} ${th.seesPoints} · ${t('word.nose')} ${th.smellsPoints} · ${t('word.water')}: ${water}</div>`,
    `<div>${t('word.carries')}: ${th.carrying ? labelOf(th.carrying) : t('word.nothing')}</div>`,
    leg(fagi, th),
    news(th),
  ].join('');

  // Cómo puntúa cada cosa que percibe. Esta es la cuenta real del cerebro.
  if (th.ranked.length === 0) {
    el.scores.innerHTML = `<div class="dim">${t('word.nothingToChase')}</div>`;
    return;
  }
  el.scores.innerHTML = th.ranked.slice(0, 4).map((r, i) => {
    const parts = Object.entries(r.parts)
      .map(([k, v]) => `${t(`score.${PART_KEY[k] ?? k}`)} ${v >= 0 ? '+' : ''}${v.toFixed(2)}`)
      .join('  ');
    const win = i === 0 && r.score > BRAIN.minScore ? ' chosen' : '';
    return `<div class="score${win}">` +
      `<div class="head"><span style="color:${TYPE_COLOR(r.key)}">${labelOf(r.key)}` +
      `<em> ${t(`word.${SENSE[r.via]}`)}</em></span>` +
      `<span>${r.score.toFixed(2)} · ${Math.round(r.dist)}px</span></div>` +
      `<div class="parts">${parts}</div>` +
      `<div class="parts">${t('word.confidence')} ${Math.round((r.confidence ?? 0) * 100)}%` +
      ` · ${t(`stage.${r.stage ?? 'short'}`)}</div></div>`;
  }).join('');
}

// Explorando va por tramos: hasta un punto que ve, y ahí decide el siguiente.
function leg(fagi, th) {
  const w = fagi.exploreTarget;
  if (th.action !== 'explore' || !w) return '';
  const d = Math.round(Math.hypot(w.x - fagi.x, w.y - fagi.y));
  return `<div>${t('word.leg')} ${fagi.exploreLegs ?? ''} · ${d}px</div>`;
}

// Lo último nuevo que percibió y qué hizo con ello.
function news(th) {
  const r = th.rethink;
  if (!r) return '';
  const line = rethinkLine(r, th) ?? { text: { key: 'log.rethinkKeep', params: {
    what: { key: `type.${r.what}` }, more: '', side: { key: `side.${r.side}` }, action: { key: `action.${r.to}` },
  } }, detail: rethinkWhy(r) };
  return `<div class="dim">${t('word.lastNews')}: ${tx(line.text)}${line.detail ? ` · ${tx(line.detail)}` : ''}</div>`;
}

function paintLog(box, lines, allOf) {
  const since = allOf ? 0 : Number(box.dataset.last ?? 0);
  const newOnes = lines.filter((l) => l.id > since);
  if (newOnes.length === 0) return;

  for (const l of newOnes) {
    const row = document.createElement('div');
    row.className = 'line';
    row.innerHTML = `<span class="t">${formatClock(l.t)}</span>${tagLabel(l.tag)}` +
      `<span class="tx"><b>${tx(l.text)}</b>${l.detail ? `<i>${tx(l.detail)}</i>` : ''}</span>`;
    box.appendChild(row);
  }
  while (box.childElementCount > 80) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
  box.dataset.last = lines[lines.length - 1].id;
}

const SENSE = { sight: 'eye', smell: 'nose', memory: 'memory' };
const PART_KEY = {
  belief: 'belief', curiosity: 'curiosity',
  need: 'need', distance: 'distance', smell: 'smell',
};

// Los colores sí viven en config: no dependen del idioma.
const TYPE_COLOR = (key) => (POINT_TYPES[key] ?? OBJECT_TYPES[key])?.color ?? '#8a90a2';
