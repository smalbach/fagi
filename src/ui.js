// HUD: type buttons, status, heading, active effects and what she's learned.
// The buttons and bars are generated from config, so adding a new type
// doesn't require touching anything here. The texts come from i18n.

import { HUNGER, THIRST, POINT_TYPES, TYPE_KEYS, OBJECT_TYPES, OBJECT_KEYS, TREE, THERMAL, CYCLE, LIFE, specOf } from './config.js';
import { cycleAt } from './cycle.js';
import { census } from './reproduction.js';
import { organismOn } from './organism.js';
import { energyMax } from './biology.js';
import { heading, verticalSense } from './compass.js';
import { activeEffects } from './effects.js';
import { nestOf, nestRipeness, record } from './world.js';
import { configIdOf } from './settings.js';
import { setFruitInterval } from './trees.js';
import { t, labelOf, onLangChange, formatDuration } from './i18n.js';
import { recall } from './memory.js';
import { ASK, INSPECT } from './input.js';
import { HEALTH, TASTE } from './config.js';
import { healthU } from './health.js';
import { sodiumOf } from './taste.js';
import { lifeAge } from './lifecycle.js';
import { fullName } from './names.js';
import { familyOf } from './family.js';

// Short summary of what each type does, for the button.
function hintOfFood(spec) {
  const parts = [];
  if (spec.hunger !== 0) parts.push(t('hint.hunger', { v: spec.hunger > 0 ? `+${spec.hunger}` : spec.hunger }));
  for (const e of spec.effects) parts.push(`${e.stat} ×${e.mult}`);
  parts.push(t('hint.aroma', { v: spec.aroma }));
  return parts.join(' · ');
}

function hintOfObject(spec) {
  if (spec.shallow) return t('hint.puddle');
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
  for (const key of OBJECT_KEYS) if (OBJECT_TYPES[key].palette !== false) make(key, OBJECT_TYPES[key], hintOfObject(OBJECT_TYPES[key]), objectBox);
  make(ASK, { color: '#b57bff' }, t('why.askHint'), objectBox);
  make(INSPECT, { color: '#ffe08a' }, t('ins.toolHint'), objectBox);

  function select(key) {
    input.selectedType = key;
    for (const k of Object.keys(buttons)) buttons[k].classList.toggle('active', k === key);
  }
  select(input.selectedType);
  return select;
}

// There's no longer a fixed list of "what can be believed": a type's bar
// appears the first time Fagi runs into it, not a moment before. `keys` is
// Object.keys(fagi.brain.facts), as it grows over the game.
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
    bodyVal: document.getElementById('body-val'),
    skyVal: document.getElementById('sky-val'),
    pressureVal: document.getElementById('pressure-val'),
    effects: document.getElementById('effects'),
    organism: document.getElementById('organism-group'),
    dayVal: document.getElementById('day-val'),
    lightVal: document.getElementById('light-val'),
    airVal: document.getElementById('air-val'),
    tempVal: document.getElementById('temp-val'),
    stressBar: document.getElementById('stress-bar'),
    stressVal: document.getElementById('stress-val'),
    sleepBar: document.getElementById('sleep-bar'),
    sleepVal: document.getElementById('sleep-val'),
    sexVal: document.getElementById('sex-val'),
    nightsVal: document.getElementById('nights-val'),
    stageVal: document.getElementById('stage-val'),
    popVal: document.getElementById('pop-val'),
    healthRow: document.getElementById('health-row'),
    healthBar: document.getElementById('health-bar'),
    healthVal: document.getElementById('health-val'),
    sodiumRow: document.getElementById('sodium-row'),
    sodiumBar: document.getElementById('sodium-bar'),
    sodiumVal: document.getElementById('sodium-val'),
    nameVal: document.getElementById('name-val'),
    genVal: document.getElementById('gen-val'),
    lifespanVal: document.getElementById('lifespan-val'),
    family: document.getElementById('family-box'),
    familyAt: 0,
    familyHold: 0,
    onPick: null,
  };
  // A relative's chip inspects her (main.js sets onPick). A press holds the
  // repaint so the click lands on the same element.
  el.family?.addEventListener('pointerdown', () => { el.familyHold = performance.now() + 600; });
  el.family?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fagi]');
    if (b) el.onPick?.({ kind: 'fagi', id: Number(b.dataset.fagi) });
  });

  const foodBox = document.getElementById('type-buttons');
  const objectBox = document.getElementById('object-buttons');
  const beliefBox = document.getElementById('beliefs');

  let selectTool = buildTypeButtons(foodBox, objectBox, input);
  // State of the belief bars: which keys are painted right now and with
  // which elements. It's rebuilt when a new key appears or on a language
  // switch.
  const beliefs = { keys: [], bars: {} };
  document.getElementById('btn-reset').addEventListener('click', onReset);

  // On a language switch, whatever was built only once has to be redone.
  onLangChange(() => {
    selectTool = buildTypeButtons(foodBox, objectBox, input);
    beliefs.bars = buildBeliefBars(beliefBox, beliefs.keys);
  });

  // How often the trees drop fruit. Applies to the ones already placed too.
  const slider = document.getElementById('tree-interval');
  const sliderVal = document.getElementById('tree-interval-val');
  const paint = () => { sliderVal.textContent = formatDuration(Number(slider.value)); };
  slider.addEventListener('input', () => {
    const before = TREE.interval;
    const v = Number(slider.value);
    setFruitInterval(world, v);
    if (before !== v) record(world, 'config', { id: configIdOf(TREE, 'interval'), from: before, to: v, source: 'user' });
    paint();
  });
  // The slider shows what's there, it doesn't impose it: the saved settings or
  // the session's ones rule.
  const sync = () => { slider.value = TREE.interval; paint(); };
  sync();

  return {
    update: (fagi, w) => update(el, beliefBox, beliefs, fagi, w),
    sync,
    selectTool: (key) => selectTool(key),
    set onPick(fn) { el.onPick = fn; },
  };
}

// A belief goes from -1 to +1 and the bar grows from the center. The bar's
// opacity is the confidence: a memory she no longer trusts looks dim.
function paintBelief(bar, r) {
  const pct = Math.abs(r.value) * 50;
  bar.fill.style.left = r.value >= 0 ? '50%' : `${50 - pct}%`;
  bar.fill.style.width = `${pct}%`;
  bar.fill.style.opacity = (0.25 + r.confidence * 0.75).toFixed(2);
  bar.val.textContent = r.tries === 0
    ? t('word.untested')
    : `${r.value.toFixed(2)} · ${t(`stage.${r.stage}`)} ${Math.round(r.confidence * 100)}%`;
}

// What's stored in the nest.
function paintStock(container, world) {
  const nestObj = nestOf(world);
  if (!nestObj) { container.innerHTML = `<div class="none">${t('word.noNest')}</div>`; return; }

  const rows = Object.keys(nestObj.stock).filter((k) => nestObj.stock[k] > 0);
  if (rows.length === 0) { container.innerHTML = `<div class="none">${t('word.empty')}</div>`; return; }

  // The row dims as the stored food gets close to spoiling.
  container.innerHTML = rows.map((k) => {
    const step = nestRipeness(nestObj, k);
    return `<div class="label" style="opacity:${(1 - step * 0.6).toFixed(2)}">` +
      `<span style="color:${specOf(k).color}">${labelOf(k)}</span>` +
      `<span>${nestObj.stock[k]}</span></div>`;
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

// The body (soaked, in deep water, probing) and the sky as she feels it:
// whether it's raining and how far the pressure has dropped, and if it keeps dropping.
function paintSky(el, fagi, world) {
  let body = t('body.dry');
  if (fagi.swimming) body = t('body.swimming');
  else if (fagi.wet > 0) body = t('body.wet', { sec: { dur: fagi.wet, precise: true } });
  if (fagi.probing && !fagi.swimming) body += ` · ${t('body.probing')}`;
  el.bodyVal.textContent = body;
  el.skyVal.textContent = t(world.rain?.on ? 'sky.rain' : 'sky.clear');
  const p = fagi.pressure ?? 0;
  el.pressureVal.textContent = p <= 0 ? t('pressure.normal')
    : `${fagi.pressureFalling ? '↓ ' : ''}${t(fagi.pressureFalling ? 'pressure.falling' : 'pressure.low')} ${Math.round(p * 100)}%`;
}

// The day as the one watching sees it (the hour, the air), and her body as she
// feels it. The whole group hides while the organism is off.
function phaseName(sky) {
  const tw = CYCLE.twilight;
  if (Math.abs(sky.phase - CYCLE.dawn) <= tw) return 'phase.dawn';
  if (Math.abs(sky.phase - CYCLE.dusk) <= tw) return 'phase.dusk';
  return sky.isNight ? 'phase.night' : 'phase.day';
}

function paintOrganism(el, fagi, world) {
  const on = organismOn();
  if (el.organism) el.organism.hidden = !on;
  if (!on || !el.dayVal) return;
  const sky = cycleAt(world.time);
  el.dayVal.textContent = sky.on ? `${sky.day} · ${t(phaseName(sky))}` : t('word.off');
  el.lightVal.textContent = sky.on ? `${Math.round(sky.light * 100)}%` : t('word.off');
  el.airVal.textContent = sky.on ? `${sky.ambient.toFixed(1)} °C` : t('word.off');
  if (THERMAL.enabled && fagi.temperature != null) {
    const feel = fagi.thermalFeel ? t(`thermal.${fagi.thermalFeel}`) : t('thermal.ok');
    el.tempVal.textContent = `${fagi.temperature.toFixed(1)} °C · ${feel}`;
  } else {
    el.tempVal.textContent = t('word.off');
  }
  barEl(el.stressBar, el.stressVal, fagi.thermalStress ?? 0, THERMAL.maxStress);
  barEl(el.sleepBar, el.sleepVal, fagi.sleepPressure ?? 0, 1);
  el.sexVal.textContent = t(fagi.sex ? `sex.${fagi.sex}` : 'sex.none');
  el.nightsVal.textContent = String(fagi.consolidations ?? 0);
  if (el.stageVal) el.stageVal.textContent = LIFE.enabled ? t(`stage.life.${fagi.lifeStage}`) : t('word.off');
  if (el.popVal) {
    const c = LIFE.enabled && world.colony?.life ? census(world, world.colony) : null;
    el.popVal.textContent = c
      ? (c.extinctAt != null ? t('pop.extinct') : t('pop.line', { alive: c.alive, f: c.females, m: c.males, eggs: c.eggs, gen: c.generations }))
      : t('word.off');
  }
}

function barEl(bar, val, value, max) {
  const pct = (value / max) * 100;
  bar.style.width = `${pct}%`;
  val.textContent = `${Math.round(pct)}%`;
}

// Who she is: her name, generation and lifespan, and her parents and
// children as chips that open them in the inspector. A few times a second.
const SEX_MARK = { female: '♀', male: '♂' };
function chipOf(p) {
  const dead = p.alive === false ? ' ✝' : '';
  return `<button type="button" class="ins-chip" data-fagi="${p.id}">${SEX_MARK[p.sex] ?? ''} ${p.label}${dead}</button>`;
}

function paintIdentity(el, fagi, world) {
  if (!el.nameVal) return;
  el.nameVal.textContent = `${fullName(fagi)}${fagi.sex ? ` ${SEX_MARK[fagi.sex]}` : ''}`;
  el.genVal.textContent = fagi.generation != null ? String(fagi.generation) : '—';
  el.lifespanVal.textContent = fagi.lifespan
    ? `${formatDuration(lifeAge(fagi))} / ${formatDuration(fagi.lifespan)}`
    : '—';
  const now = performance.now();
  if (!el.family || now < el.familyHold || now - el.familyAt < 500) return;
  el.familyAt = now;
  if (!world.colony) { el.family.innerHTML = ''; return; }
  const fam = familyOf(world, fagi, fagi.id ?? 1);
  const parents = [fam.father, fam.mother].filter(Boolean);
  const line = (label, list, empty) => `<div class="fam-line"><span>${label}</span>`
    + `<div class="ins-chips">${list.length ? list.map(chipOf).join('') : `<i class="ins-none">${empty}</i>`}</div></div>`;
  el.family.innerHTML = line(t('stat.parents'), parents, t(fagi.sex === 'male' ? 'fam.founderM' : 'fam.founder'))
    + line(t('stat.children'), fam.children, t('fam.none'));
}

function update(el, beliefBox, beliefs, fagi, world) {
  barEl(el.hungerBar, el.hungerVal, fagi.hunger, HUNGER.max);
  barEl(el.thirstBar, el.thirstVal, fagi.thirst, THIRST.max);
  barEl(el.energyBar, el.energyVal, fagi.energy, energyMax(fagi));
  // Health and sodium only exist with their blocks on (health.js, taste.js).
  if (el.healthRow) {
    el.healthRow.hidden = !HEALTH.enabled;
    if (HEALTH.enabled) barEl(el.healthBar, el.healthVal, healthU(fagi), 1);
  }
  if (el.sodiumRow) {
    const salt = Boolean(TASTE.enabled && TASTE.salt);
    el.sodiumRow.hidden = !salt;
    if (salt) barEl(el.sodiumBar, el.sodiumVal, sodiumOf(fagi), 1);
  }
  paintIdentity(el, fagi, world);
  paintOrganism(el, fagi, world);

  el.ageVal.textContent = formatDuration(fagi.age);
  el.eatenVal.textContent = String(fagi.eaten);
  el.carryVal.textContent = fagi.carrying ? labelOf(fagi.carrying.type) : t('word.nothing');
  paintStock(el.stock, world);

  // Heading: where she is and which way she's going.
  el.posVal.textContent = `x ${Math.round(fagi.x)}, y ${Math.round(fagi.y)}`;
  const dir = heading(fagi.angle);
  const vert = verticalSense(fagi.angle);
  const wind = heading(world.wind.angle);
  el.headingVal.textContent = `${dir.arrow} ${t(dir.key)}`;
  el.verticalVal.textContent = `${vert.arrow} ${t(vert.key)}`;
  el.windVal.textContent = `${wind.arrow} ${t(wind.key)}`;
  paintSky(el, fagi, world);

  paintEffects(el.effects, fagi);
  // She's born believing nothing at all: the list of keys grows by itself as
  // Fagi gets to know the world, so each bar is built on the fly.
  const keys = Object.keys(fagi.brain.facts);
  if (keys.length !== beliefs.keys.length) {
    beliefs.keys = keys;
    beliefs.bars = buildBeliefBars(beliefBox, keys);
  }
  for (const key of keys) paintBelief(beliefs.bars[key], recall(fagi.brain, key));

  el.status.textContent = fagi.alive
    ? (fagi.sleeping && fagi.thought?.action === 'rest' ? `${t('action.rest')} · 💤` : t(`action.${fagi.thought?.action ?? 'explore'}`))
    : t('status.died', { cause: t(`cause.${fagi.cause}`), age: { dur: fagi.age } });
  el.status.classList.toggle('dead', !fagi.alive);
}
