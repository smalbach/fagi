// Console: on top the reasoning of the moment, below the decision history.
// Everything is written by translating keys, so switching language rewrites it.

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

  // On a language switch the whole history is repainted from its keys.
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
      // New Fagi, ids from 1 again: the "painted up to here" mark also has
      // to go back to zero, or the history stays empty until the new ids
      // reach the old mark.
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

  // How she scores each thing she perceives. This is the brain's real math.
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

// Exploring goes in legs: up to a point she sees, and there she picks the next one.
function leg(fagi, th) {
  const w = fagi.exploreTarget;
  if (th.action !== 'explore' || !w) return '';
  const d = Math.round(Math.hypot(w.x - fagi.x, w.y - fagi.y));
  return `<div>${t('word.leg')} ${fagi.exploreLegs ?? ''} · ${d}px</div>`;
}

// The latest new thing she perceived and what she did about it.
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

// Colors do live in config: they don't depend on the language.
const TYPE_COLOR = (key) => (POINT_TYPES[key] ?? OBJECT_TYPES[key])?.color ?? '#8a90a2';
