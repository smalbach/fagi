// HUD: botones de tipo, estado, rumbo, efectos activos y lo aprendido.
// Los botones y las barras se generan desde config, así que añadir un tipo
// nuevo no obliga a tocar nada aquí. Los textos salen de i18n.

import { HUNGER, THIRST, ENERGY, POINT_TYPES, TYPE_KEYS, OBJECT_TYPES, OBJECT_KEYS, TREE, specOf } from './config.js';
import { heading, verticalSense } from './compass.js';
import { activeEffects } from './effects.js';
import { nestOf, nestRipeness, record } from './world.js';
import { configIdOf } from './settings.js';
import { setFruitInterval } from './trees.js';
import { t, labelOf, onLangChange, formatDuration } from './i18n.js';
import { recall } from './memory.js';

// Resumen corto de lo que hace cada tipo, para el botón.
function hintOfFood(spec) {
  const parts = [];
  if (spec.hunger !== 0) parts.push(t('hint.hunger', { v: spec.hunger > 0 ? `+${spec.hunger}` : spec.hunger }));
  for (const e of spec.effects) parts.push(`${e.stat} ×${e.mult}`);
  parts.push(t('hint.aroma', { v: spec.aroma }));
  return parts.join(' · ');
}

function hintOfObject(spec) {
  return t({ water: 'hint.water', nest: 'hint.nest', spawner: 'hint.tree' }[spec.kind] ?? 'hint.rock');
}

function buildTypeButtons(foodBox, objectBox, input) {
  foodBox.innerHTML = '';
  objectBox.innerHTML = '';
  const buttons = {};

  const make = (key, spec, hint, container) => {
    const btn = document.createElement('button');
    btn.style.color = spec.color;
    btn.innerHTML = `<span class="dot"></span><span style="color:var(--text)">${labelOf(key)}</span>`
      + `<span class="hint">${hint}</span>`;
    btn.addEventListener('click', () => select(key));
    container.appendChild(btn);
    buttons[key] = btn;
  };

  for (const key of TYPE_KEYS) make(key, POINT_TYPES[key], hintOfFood(POINT_TYPES[key]), foodBox);
  for (const key of OBJECT_KEYS) make(key, OBJECT_TYPES[key], hintOfObject(OBJECT_TYPES[key]), objectBox);

  function select(key) {
    input.selectedType = key;
    for (const k of Object.keys(buttons)) buttons[k].classList.toggle('active', k === key);
  }
  select(input.selectedType);
}

// Ya no hay una lista fija de "lo que se puede creer": la barra de un tipo
// aparece la primera vez que Fagi se topa con él, ni una antes. `keys` es
// Object.keys(fagi.brain.facts), tal cual va creciendo con la partida.
function buildBeliefBars(container, keys) {
  container.innerHTML = '';
  const bars = {};
  for (const key of keys) {
    const spec = specOf(key) ?? { color: '#8a90a2' };
    const row = document.createElement('div');
    row.className = 'belief';
    row.innerHTML =
      `<div class="label"><span style="color:${spec.color}">${labelOf(key)}</span><span></span></div>` +
      `<div class="bar"><i style="background:${spec.color}"></i></div>`;
    container.appendChild(row);
    bars[key] = { fill: row.querySelector('i'), val: row.querySelector('.label span:last-child') };
  }
  return bars;
}

export function createUI(input, world, onReset) {
  const el = {
    status: document.getElementById('status'),
    hungerBar: document.getElementById('hunger-bar'),
    hungerVal: document.getElementById('hunger-val'),
    thirstBar: document.getElementById('thirst-bar'),
    thirstVal: document.getElementById('thirst-val'),
    energyBar: document.getElementById('energy-bar'),
    energyVal: document.getElementById('energy-val'),
    ageVal: document.getElementById('age-val'),
    eatenVal: document.getElementById('eaten-val'),
    carryVal: document.getElementById('carry-val'),
    stock: document.getElementById('stock'),
    posVal: document.getElementById('pos-val'),
    headingVal: document.getElementById('heading-val'),
    verticalVal: document.getElementById('vertical-val'),
    windVal: document.getElementById('wind-val'),
    effects: document.getElementById('effects'),
  };

  const foodBox = document.getElementById('type-buttons');
  const objectBox = document.getElementById('object-buttons');
  const beliefBox = document.getElementById('beliefs');

  buildTypeButtons(foodBox, objectBox, input);
  // Estado de las barras de creencia: qué claves tiene pintadas ahora mismo y
  // con qué elementos. Se reconstruye cuando aparece una clave nueva o al
  // cambiar de idioma.
  const beliefs = { keys: [], bars: {} };
  document.getElementById('btn-reset').addEventListener('click', onReset);

  // Al cambiar de idioma hay que rehacer lo que se construyó una sola vez.
  onLangChange(() => {
    buildTypeButtons(foodBox, objectBox, input);
    beliefs.bars = buildBeliefBars(beliefBox, beliefs.keys);
  });

  // Cada cuánto dan fruta los árboles. Vale para los que ya están puestos.
  const slider = document.getElementById('tree-interval');
  const sliderVal = document.getElementById('tree-interval-val');
  const pintar = () => { sliderVal.textContent = formatDuration(Number(slider.value)); };
  slider.addEventListener('input', () => {
    const antes = TREE.interval;
    const v = Number(slider.value);
    setFruitInterval(world, v);
    if (antes !== v) record(world, 'config', { id: configIdOf(TREE, 'interval'), from: antes, to: v, source: 'user' });
    pintar();
  });
  // El deslizador enseña lo que hay, no lo impone: los ajustes guardados o los
  // de la sesión mandan.
  const sincronizar = () => { slider.value = TREE.interval; pintar(); };
  sincronizar();

  return { update: (fagi, w) => update(el, beliefBox, beliefs, fagi, w), sync: sincronizar };
}

// Una creencia va de -1 a +1 y la barra crece desde el centro. La opacidad de
// la barra es la confianza: un recuerdo en el que ya no se fía se ve apagado.
function paintBelief(bar, r) {
  const pct = Math.abs(r.value) * 50;
  bar.fill.style.left = r.value >= 0 ? '50%' : `${50 - pct}%`;
  bar.fill.style.width = `${pct}%`;
  bar.fill.style.opacity = (0.25 + r.confidence * 0.75).toFixed(2);
  bar.val.textContent = r.tries === 0
    ? t('word.untested')
    : `${r.value.toFixed(2)} · ${t(`stage.${r.stage}`)} ${Math.round(r.confidence * 100)}%`;
}

// Lo que hay guardado en el nido.
function paintStock(container, world) {
  const nido = nestOf(world);
  if (!nido) { container.innerHTML = `<div class="none">${t('word.noNest')}</div>`; return; }

  const filas = Object.keys(nido.stock).filter((k) => nido.stock[k] > 0);
  if (filas.length === 0) { container.innerHTML = `<div class="none">${t('word.empty')}</div>`; return; }

  // La fila se apaga a medida que lo guardado se acerca a echarse a perder.
  container.innerHTML = filas.map((k) => {
    const paso = nestRipeness(nido, k);
    return `<div class="label" style="opacity:${(1 - paso * 0.6).toFixed(2)}">` +
      `<span style="color:${specOf(k).color}">${labelOf(k)}</span>` +
      `<span>${nido.stock[k]}</span></div>`;
  }).join('');
}

function paintEffects(container, fagi) {
  const list = activeEffects(fagi);
  if (list.length === 0) {
    container.innerHTML = `<div class="none">${t('word.none')}</div>`;
    return;
  }
  container.innerHTML = list.map((fx) =>
    `<div class="fx"><span style="color:${fx.color}">${t(`fx.${fx.stat}`)} ×${fx.mult}</span>` +
    `<span style="color:var(--muted)">${formatDuration(fx.time, { precise: true })}</span></div>`
  ).join('');
}

function barra(bar, val, valor, max) {
  const pct = (valor / max) * 100;
  bar.style.width = `${pct}%`;
  val.textContent = `${Math.round(pct)}%`;
}

function update(el, beliefBox, beliefs, fagi, world) {
  barra(el.hungerBar, el.hungerVal, fagi.hunger, HUNGER.max);
  barra(el.thirstBar, el.thirstVal, fagi.thirst, THIRST.max);
  barra(el.energyBar, el.energyVal, fagi.energy, ENERGY.max);

  el.ageVal.textContent = formatDuration(fagi.age);
  el.eatenVal.textContent = String(fagi.eaten);
  el.carryVal.textContent = fagi.carrying ? labelOf(fagi.carrying.type) : t('word.nothing');
  paintStock(el.stock, world);

  // Rumbo: dónde está y hacia dónde avanza.
  el.posVal.textContent = `x ${Math.round(fagi.x)}, y ${Math.round(fagi.y)}`;
  const dir = heading(fagi.angle);
  const vert = verticalSense(fagi.angle);
  const viento = heading(world.wind.angle);
  el.headingVal.textContent = `${dir.arrow} ${t(dir.key)}`;
  el.verticalVal.textContent = `${vert.arrow} ${t(vert.key)}`;
  el.windVal.textContent = `${viento.arrow} ${t(viento.key)}`;

  paintEffects(el.effects, fagi);
  // Nace sin creer nada de nada: la lista de claves crece sola según Fagi va
  // conociendo el mundo, así que la barra que le toca se construye al vuelo.
  const keys = Object.keys(fagi.brain.facts);
  if (keys.length !== beliefs.keys.length) {
    beliefs.keys = keys;
    beliefs.bars = buildBeliefBars(beliefBox, keys);
  }
  for (const key of keys) paintBelief(beliefs.bars[key], recall(fagi.brain, key));

  el.status.textContent = fagi.alive
    ? t(`action.${fagi.thought?.action ?? 'explore'}`)
    : t('status.died', { cause: t(`cause.${fagi.cause}`), age: { dur: fagi.age } });
  el.status.classList.toggle('dead', !fagi.alive);
}
