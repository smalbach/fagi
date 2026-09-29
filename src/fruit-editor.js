// The setup panel's fruit and map controls: the list of the fruit the person
// made, the dialog that makes or edits one (custom-fruits.js holds what it
// is), and the map's size, ponds and rocks.
//
// Only while setting up a session: a fruit changed in the middle of one would
// be a different world from the one being recorded.

import { MAPGEN, POINT_TYPES, TREE } from './config.js';
import {
  customFruits, registerFruits, saveFruits, blankFruit, cleanFruit, specOfDef, keyOf, starterFruits,
  FX_STATS, SHAPES, SMELLS, TASTES,
} from './custom-fruits.js';
import { paintFruitPreview } from './fruit-sprite.js';
import { removePoint } from './world.js';
import { setSetting } from './settings.js';
import { t, getLang, onLangChange } from './i18n.js';
import { sliderize } from './controls.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = (id) => document.getElementById(id);

// Default and range of each temporary effect's multiplier.
const FX_DEFAULT = { speed: 1.5, viewRange: 1.5, fovDeg: 1.3, smell: 1.5, hungerRate: 0.6 };

// `onFruitsChanged`: the palette and the map summary follow. `onMapChanged`:
// a new map with the new size (main.js regenerate).
export function createFruitEditor(world, { onFruitsChanged, onMapChanged }) {
  const list = $('fruit-list');
  const overlay = $('fruit-overlay');
  const form = $('fruit-editor');
  let editing = null;   // the definition in the dialog (a copy)
  let isNew = false;

  // --- the list ---------------------------------------------------------------

  function paintList() {
    const defs = customFruits();
    list.innerHTML = defs.length ? '' : `<p class="help">${L('No fruit of your own yet: only nectar.', 'Aún no hay frutos tuyos: solo néctar.')}</p>`;
    for (const def of defs) {
      const spec = specOfDef(def);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fruit-chip';
      btn.title = summaryOf(def);
      const c = document.createElement('canvas');
      c.width = 28; c.height = 28;
      paintFruitPreview(c.getContext('2d'), spec, 14, 14, 7);
      btn.append(c);
      const text = document.createElement('span');
      text.innerHTML = `<b>${esc(def.name || L('Unnamed', 'Sin nombre'))}</b><small>${esc(summaryOf(def))}</small>`;
      btn.append(text);
      btn.addEventListener('click', () => open(def, false));
      list.append(btn);
    }
  }

  function summaryOf(def) {
    const parts = [def.hunger < 0 ? L(`feeds ${-def.hunger}`, `alimenta ${-def.hunger}`)
      : def.hunger > 0 ? L(`sickens +${def.hunger}`, `enferma +${def.hunger}`) : L('no food', 'no alimenta')];
    if (def.thirst) parts.push(def.thirst < 0 ? L(`quenches ${-def.thirst}`, `quita sed ${-def.thirst}`) : L(`thirst +${def.thirst}`, `da sed +${def.thirst}`));
    for (const e of def.effects) parts.push(`${t(`fx.${e.stat}`)} ×${e.mult}`);
    parts.push(`${L('tree', 'árbol')} ${def.tree.interval}s ×${def.tree.count}`);
    return parts.join(' · ');
  }

  // --- the dialog -------------------------------------------------------------

  const fields = {
    name: $('fe-name'), color: $('fe-color'), shape: $('fe-shape'), radius: $('fe-radius'),
    smell: $('fe-smell'), aroma: $('fe-aroma'), hunger: $('fe-hunger'), thirst: $('fe-thirst'),
    life: $('fe-life'), interval: $('fe-interval'), maxNear: $('fe-maxnear'), count: $('fe-count'),
  };
  sliderize(fields.radius, { suffix: 'px' });
  sliderize(fields.aroma);
  sliderize(fields.hunger);
  sliderize(fields.thirst);
  sliderize(fields.life, { suffix: 's' });
  sliderize(fields.interval, { suffix: 's' });
  sliderize(fields.maxNear);
  sliderize(fields.count);
  const tastesBox = $('fe-tastes');
  const effectsBox = $('fe-effects');
  const preview = $('fruit-preview');
  const seen = $('fe-seen');

  function buildChoices() {
    fields.shape.innerHTML = SHAPES.map((v) => `<option value="${v}">${esc(t(`trait.${v}`))}</option>`).join('');
    fields.smell.innerHTML = SMELLS.map((v) => `<option value="${v}">${esc(t(`trait.${v}`))}</option>`).join('');
    // Tastes in percent on screen, 0-1 in the fruit.
    tastesBox.innerHTML = TASTES.map((k) => `<label class="fe-row"><span>${esc(t(`taste.${k}`))}</span>`
      + `<input type="number" min="0" max="100" step="5" data-taste="${k}"></label>`).join('');
    effectsBox.innerHTML = FX_STATS.map((k) => `<div class="fe-fx" data-fx="${k}">`
      + `<label class="fe-fx-name"><input type="checkbox"> ${esc(t(`fx.${k}`))}</label>`
      + `<div class="fe-fx-vals"><label class="fe-row"><span>${esc(L('Strength', 'Fuerza'))}</span>`
      + `<input type="number" min="0.1" max="4" step="0.05" data-part="mult"></label>`
      + `<label class="fe-row"><span>${esc(L('Lasts', 'Dura'))}</span>`
      + `<input type="number" min="1" max="120" step="1" data-part="sec"></label></div></div>`).join('');
    for (const input of tastesBox.querySelectorAll('[data-taste]')) sliderize(input, { suffix: '%' });
    for (const input of effectsBox.querySelectorAll('[data-part=mult]')) sliderize(input, { suffix: '×' });
    for (const input of effectsBox.querySelectorAll('[data-part=sec]')) sliderize(input, { suffix: 's' });
    fields.name.placeholder = L('Fruit name', 'Nombre del fruto');
  }

  // The dialog's values as a definition, clean.
  function read() {
    const taste = {};
    for (const input of tastesBox.querySelectorAll('[data-taste]')) taste[input.dataset.taste] = Number(input.value) / 100;
    const effects = [];
    for (const row of effectsBox.querySelectorAll('[data-fx]')) {
      if (!row.querySelector('input[type=checkbox]').checked) continue;
      effects.push({ stat: row.dataset.fx, mult: Number(row.querySelector('[data-part=mult]').value), sec: Number(row.querySelector('[data-part=sec]').value) });
    }
    return cleanFruit({
      id: editing.id, name: fields.name.value.trim(), color: fields.color.value, shape: fields.shape.value,
      smell: fields.smell.value, radius: Number(fields.radius.value), aroma: Number(fields.aroma.value),
      hunger: Number(fields.hunger.value), thirst: Number(fields.thirst.value), life: Number(fields.life.value),
      taste, effects,
      tree: { interval: Number(fields.interval.value), maxNear: Number(fields.maxNear.value), count: Number(fields.count.value) },
    });
  }

  function write(def) {
    fields.name.value = def.name;
    fields.color.value = def.color;
    fields.shape.value = def.shape;
    fields.radius.value = def.radius;
    fields.smell.value = def.smell;
    fields.aroma.value = def.aroma;
    fields.hunger.value = def.hunger;
    fields.thirst.value = def.thirst;
    fields.life.value = def.life;
    fields.interval.value = def.tree.interval;
    fields.maxNear.value = def.tree.maxNear;
    fields.count.value = def.tree.count;
    for (const input of tastesBox.querySelectorAll('[data-taste]')) input.value = Math.round((def.taste[input.dataset.taste] ?? 0) * 100);
    for (const row of effectsBox.querySelectorAll('[data-fx]')) {
      const e = def.effects.find((x) => x.stat === row.dataset.fx);
      row.querySelector('input[type=checkbox]').checked = Boolean(e);
      row.querySelector('[data-part=mult]').value = e?.mult ?? FX_DEFAULT[row.dataset.fx];
      row.querySelector('[data-part=sec]').value = e?.sec ?? 10;
      row.classList.toggle('on', Boolean(e));
    }
    live();
  }

  // What changes as the person moves a control: the effects shown, the
  // preview, and what she will perceive of it.
  function live() {
    for (const row of effectsBox.querySelectorAll('[data-fx]')) row.classList.toggle('on', row.querySelector('input[type=checkbox]').checked);
    const def = read();
    const spec = specOfDef(def);
    const g = preview.getContext('2d');
    g.clearRect(0, 0, preview.width, preview.height);
    paintFruitPreview(g, spec, preview.width / 2, preview.height / 2, Math.min(24, def.radius * 2.6));
    seen.textContent = L(
      `She perceives: ${t(`trait.${spec.traits.color}`)} · ${t(`trait.${def.shape}`)} · smells ${t(`trait.${def.smell}`)}`,
      `Ella percibe: ${t(`trait.${spec.traits.color}`)} · ${t(`trait.${def.shape}`)} · huele ${t(`trait.${def.smell}`)}`,
    );
  }

  function open(def, fresh) {
    editing = { ...def };
    isNew = fresh;
    $('fe-delete').hidden = fresh;
    write(def);
    overlay.hidden = false;
    fields.name.focus();
  }

  function close() {
    overlay.hidden = true;
    editing = null;
  }

  // The set changed: POINT_TYPES, the browser's copy, and the map (fruit of a
  // deleted kind goes, its trees bear nectar).
  function commit(defs) {
    registerFruits(defs);
    saveFruits();
    for (const p of [...world.points]) if (!POINT_TYPES[p.type]) removePoint(world, p, 'removed');
    for (const o of world.objects) if (o.fruit && !POINT_TYPES[o.fruit]) delete o.fruit;
    paintList();
    onFruitsChanged?.();
  }

  form.addEventListener('input', live);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const def = read();
    if (!def.name) def.name = L('Fruit', 'Fruto');
    const defs = customFruits();
    const i = defs.findIndex((d) => d.id === def.id);
    if (i === -1) defs.push(def); else defs[i] = def;
    commit(defs);
    // A fruit's tree changed pace: the ones already on the map follow.
    for (const o of world.objects) if (o.fruit === keyOf(def)) o.timer = Math.min(o.timer ?? def.tree.interval, def.tree.interval);
    close();
  });
  $('fe-delete').addEventListener('click', () => {
    if (isNew || !editing) return;
    commit(customFruits().filter((d) => d.id !== editing.id));
    close();
  });
  $('fe-cancel').addEventListener('click', close);
  $('fe-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });

  $('btn-fruit-new').addEventListener('click', () => {
    const def = blankFruit(L('New fruit', 'Fruto nuevo'));
    def.tree.interval = TREE.interval;
    open(def, true);
  });
  $('btn-fruit-starters').addEventListener('click', () => {
    const mine = customFruits();
    const names = new Set(mine.map((d) => d.name));
    commit([...mine, ...starterFruits().filter((d) => !names.has(d.name))]);
  });

  // --- map size, ponds, rocks --------------------------------------------------

  const size = $('map-size');
  const pools = $('map-pools');
  const rocks = $('map-rocks');
  sliderize(pools);
  sliderize(rocks);
  function syncMap() {
    size.value = String(MAPGEN.size);
    pools.value = MAPGEN.pools;
    rocks.value = MAPGEN.rocks;
  }
  const remake = (key, input) => {
    const v = Number(input.value);
    if (!Number.isFinite(v)) return;
    setSetting(MAPGEN, key, v);
    syncMap();
    onMapChanged?.();
  };
  size.addEventListener('change', () => remake('size', size));
  pools.addEventListener('change', () => remake('pools', pools));
  rocks.addEventListener('change', () => remake('rocks', rocks));

  buildChoices();
  paintList();
  syncMap();
  onLangChange(() => { buildChoices(); paintList(); if (editing) write(editing); });

  return { sync: () => { syncMap(); paintList(); } };
}
