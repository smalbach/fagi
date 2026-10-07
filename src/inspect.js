// The inspector: click anything on the map (a Fagi, a fruit, a tree, the
// nest, water, a puddle, a rock, a thing) and a card shows all there is to
// know about it, live: stats, time left, where it came from, who is after it.
// For a Fagi also her life, body, mind and family, with her relatives one
// click away.
//
// It watches: nothing here changes the world. Following another Fagi is main.js's
// (onFollow), asking what she thinks of a fruit is ask.js's (onAsk).
//
// Live the objects carry every number; in a replay the sisters carry only what
// the recording kept (position, stage, load), and the card shows what there is.

import {
  POINT_TYPES, OBJECT_TYPES, TREE, FRUIT, HUNGER, THIRST, HEALTH, TASTE, THERMAL, NEST, LIFE, WATER, RAIN,
  SLEEP, CONCEPT, CASTES, specOf,
} from './config.js';
import { t, tx, labelOf, getLang, formatDuration, onLangChange } from './i18n.js';
import { fullName } from './names.js';
import { familyOf, everyone, findById } from './family.js';
import { energyMax, bodyOf } from './biology.js';
import { healthU } from './health.js';
import { sodiumOf } from './taste.js';
import { lifeAge, fertility } from './lifecycle.js';
import { activeEffects } from './effects.js';
import { viewRangeOf } from './vision.js';
import { HABIT_IDS, habit } from './habits.js';
import { choiceView } from './choice.js';
import { larderView } from './larder.js';
import { nestOf, nestRipeness, stockCount } from './world.js';
import { nestUnder } from './nest.js';
import { radiusOf, deepRadius } from './obstacles.js';
import { ripeness } from './food.js';
import { specOfFruit } from './chemistry.js';
import { affordanceOf, isThing } from './things.js';
import { nestTemperature, eggPace } from './reproduction.js';
import { treeAge, intervalOf, maxNearOf } from './trees.js';
import { programOf } from './program.js';
import { summarizePhylogeny, renderPhylogenyMermaid, exportPhylogenyJson } from './phylogeny.js';
import { casteOf } from './castes.js';
import { habitatOfNest } from './habitats.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v) => `${Math.round(v * 100)}%`;
const num = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d).replace(/\.0+$/, '') : '—');
const dur = (s) => formatDuration(s);
const habitatLabel = (name) => ({
  cold: L('cold hollow', 'hondonada fría'),
  lean: L('poor soil', 'suelo pobre'),
  toxic: L('poison close by', 'veneno cerca'),
}[name] ?? name);
const SEX_MARK = { female: '♀', male: '♂' };
const SEX_COLOR = { female: '#e58fb5', male: '#6fb3e8' };

// A row: label and value. Undefined values leave no row (a replayed sister).
const row = (label, value, cls = '') => (value == null || value === '' ? ''
  : `<div class="ins-row${cls ? ` ${cls}` : ''}"><span>${label}</span><b>${value}</b></div>`);

// A bar from 0 to 1, with its text; `bad` colors it as it grows.
function bar(label, u, text, color) {
  if (!Number.isFinite(u)) return '';
  const w = Math.max(0, Math.min(1, u)) * 100;
  return `<div class="ins-bar"><div class="ins-row"><span>${label}</span><b>${text}</b></div>`
    + `<div class="bar"><i style="width:${w.toFixed(1)}%;background:${color}"></i></div></div>`;
}

const section = (id, title, body) => (body ? `<details data-sec="${id}"><summary>${title}</summary>${body}</details>` : '');

// A person as a chip that inspects her when clicked.
function chip(p, note = '') {
  if (!p) return '';
  const mark = SEX_MARK[p.sex] ?? '';
  const state = p.alive === false ? ` <i class="ins-dead">✝</i>` : '';
  return `<button type="button" class="ins-chip" data-fagi="${p.id}" style="border-color:${SEX_COLOR[p.sex] ?? 'var(--line)'}">`
    + `${mark} ${esc(p.label)}${state}${note ? ` <i>${note}</i>` : ''}</button>`;
}
const chips = (list, empty = '—') => (list.filter(Boolean).length ? `<div class="ins-chips">${list.map((p) => chip(p, p?.full === false ? L('half', 'media') : '')).join('')}</div>` : `<div class="ins-none">${empty}</div>`);

// --- picking what is under a click ---

// What is at (x, y) in the world, in drawing order from the top: a Fagi, a
// fruit, a thing, then the bigger objects. `slack` widens small targets so
// they can be hit when zoomed out.
export function pickAt(world, fagi, x, y, slack = 6) {
  let best = null;
  let bestD = Infinity;
  for (const f of everyone(world, fagi)) {
    // Asleep inside the nest she is underground: a click there means the nest.
    if (f.x == null || (f.alive && f.thought?.action === 'rest' && nestUnder(f, world))) continue;
    const d = Math.hypot(f.x - x, f.y - y);
    if (d <= 12 + slack && d < bestD) { best = f; bestD = d; }
  }
  if (best) return best === fagi ? { kind: 'fagi', main: true, id: fagi.id } : { kind: 'fagi', id: best.id };
  for (const p of world.points) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= (POINT_TYPES[p.type]?.radius ?? 5) + slack && d < bestD) { best = p; bestD = d; }
  }
  if (best) return { kind: 'point', id: best.id };
  for (let i = world.objects.length - 1; i >= 0; i--) {
    const o = world.objects[i];
    if (isThing(o) && Math.hypot(o.x - x, o.y - y) <= radiusOf(o) + slack) return { kind: 'object', id: o.id };
  }
  for (let i = world.objects.length - 1; i >= 0; i--) {
    const o = world.objects[i];
    if (!isThing(o) && Math.hypot(o.x - x, o.y - y) <= radiusOf(o)) return { kind: 'object', id: o.id };
  }
  return null;
}

// Only a Fagi (for clicks that would otherwise place something).
export function pickFagiAt(world, fagi, x, y, slack = 6) {
  const hit = pickAt(world, fagi, x, y, slack);
  return hit?.kind === 'fagi' ? hit : null;
}

// The thing a selection points at now, or null if it is gone.
export function resolve(sel, world, fagi) {
  if (!sel) return null;
  if (sel.kind === 'fagi') return sel.main ? fagi : findById(world, fagi, sel.id);
  if (sel.kind === 'point') return world.points.find((p) => p.id === sel.id) ?? null;
  return world.objects.find((o) => o.id === sel.id) ?? null;
}

// Where to draw the selection ring.
export function markOf(sel, world, fagi) {
  const it = resolve(sel, world, fagi);
  if (!it || it.x == null) return null;
  const r = sel.kind === 'fagi' ? 14 : sel.kind === 'point' ? (POINT_TYPES[it.type]?.radius ?? 5) + 6 : radiusOf(it) + 6;
  return { x: it.x, y: it.y, r };
}

// --- the card ---

// `hooks`: onFollow(target), onCenter(x, y), onAsk(x, y), canFollow() -> bool.
export function createInspector(el, hooks = {}) {
  if (!el) return { select() {}, update() {}, clear() {}, get selection() { return null; } };
  let sel = null;
  let lastPaint = -Infinity;
  let frozenUntil = 0;
  let lastWorld = null;
  let lastFagi = null;
  const open = new Map([['needs', true], ['now', true], ['family', true], ['what', true], ['time', true], ['stock', true], ['eggs', true]]);

  // A press on the card holds the repaint, so the click lands on the same element.
  el.addEventListener('pointerdown', () => { frozenUntil = performance.now() + 600; });
  el.addEventListener('toggle', (e) => { const s = e.target?.dataset?.sec; if (s) open.set(s, e.target.open); }, true);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.fagi) { select({ kind: 'fagi', id: Number(b.dataset.fagi) }); return; }
    if (b.dataset.obj) { select({ kind: 'object', id: Number(b.dataset.obj) }); return; }
    const it = resolve(sel, lastWorld, lastFagi);
    if (b.dataset.act === 'close') clear();
    else if (b.dataset.act === 'center' && it) hooks.onCenter?.(it.x, it.y);
    else if (b.dataset.act === 'follow' && it && sel.kind === 'fagi' && !sel.main) {
      hooks.onFollow?.(it);
      sel = { kind: 'fagi', main: true, id: it.id };
      frozenUntil = 0;
    } else if (b.dataset.act === 'ask' && it) hooks.onAsk?.(it.x, it.y);
    else if (b.dataset.act === 'copy-phylogeny-mermaid' && lastWorld) {
      const mmd = renderPhylogenyMermaid(lastWorld);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(mmd).then(() => {
          const old = b.textContent;
          b.textContent = '✓ Copied!';
          setTimeout(() => { b.textContent = old; }, 1500);
        });
      }
    } else if (b.dataset.act === 'download-phylogeny-json' && lastWorld) {
      const json = exportPhylogenyJson(lastWorld);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fagi-phylogeny-${Math.round(lastWorld.time ?? 0)}s.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
  onLangChange(() => { frozenUntil = 0; lastPaint = -Infinity; });

  function select(next) {
    sel = next;
    frozenUntil = 0;
    lastPaint = -Infinity;
    el.hidden = !sel;
  }

  function clear() { select(null); }

  // Once per frame: repaints a few times a second.
  function update(fagi, world, { live = true } = {}) {
    lastWorld = world;
    lastFagi = fagi;
    if (!sel || el.hidden) return;
    const now = performance.now();
    if (now < frozenUntil || now - lastPaint < 250) return;
    lastPaint = now;
    const it = resolve(sel, world, fagi);
    const scroll = el.querySelector('.ins-body')?.scrollTop ?? 0;
    el.innerHTML = it ? paint(sel, it, world, fagi, live) : gone(sel);
    for (const d of el.querySelectorAll('details[data-sec]')) d.open = open.get(d.dataset.sec) ?? false;
    const body = el.querySelector('.ins-body');
    if (body) body.scrollTop = scroll;
  }

  function paint(s, it, world, fagi, live) {
    if (s.kind === 'fagi') return paintFagi(it, world, fagi, s.main, live && hooks.canFollow?.());
    if (s.kind === 'point') return paintPoint(it, world, fagi);
    return paintObject(it, world, fagi);
  }

  return { select, update, clear, get selection() { return sel; } };
}

function head(title, sub, color, actions) {
  return `<header class="ins-head"><span class="ins-dot" style="background:${color}"></span>`
    + `<div class="ins-title"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>`
    + `<button type="button" data-act="close" class="ins-x" aria-label="${L('Close', 'Cerrar')}">×</button></header>`
    + (actions ? `<div class="ins-actions">${actions}</div>` : '');
}

function gone(sel) {
  const what = sel.kind === 'fagi' ? L('She is no longer on the map.', 'Ya no está en el mapa.')
    : sel.kind === 'point' ? L('Gone: eaten, carried off or rotted away.', 'Ya no está: comido, acarreado o deshecho.')
      : L('Gone from the map.', 'Ya no está en el mapa.');
  return head(L('Gone', 'Desaparecido'), '', '#555', '') + `<div class="ins-body"><p class="ins-none">${what}</p></div>`;
}

// --- a Fagi ---

// What each habit (habits.js) is, in words.
const HABIT_LABEL = {
  tasteAt: () => L('Habit · hunger to taste rather than store', 'Hábito · hambre para probar en vez de guardar'),
  hungerAt: () => L('Habit · hunger urgent from', 'Hábito · hambre urgente desde'),
  thirstAt: () => L('Habit · thirst urgent from', 'Hábito · sed urgente desde'),
  restAt: () => L('Habit · energy at which she rests', 'Hábito · energía a la que descansa'),
  reserve: () => L('Habit · rations that are enough', 'Hábito · raciones que le bastan'),
};

// Her life stage; the Spanish words agree with a male's sex.
function stageName(f) {
  if (getLang() === 'es' && f.sex === 'male') return { juvenile: 'juvenil', adult: 'adulto', senescent: 'anciano' }[f.lifeStage] ?? f.lifeStage;
  return t(`stage.life.${f.lifeStage}`);
}

function actionOf(f) {
  if (!f.alive) return t('status.died', { cause: t(`cause.${f.cause || 'unknown'}`), age: { dur: f.age ?? 0 } });
  if (f.sleeping && f.thought?.action === 'rest') return L('Asleep', 'Durmiendo');
  const a = f.thought?.action;
  return a ? t(`action.${a}`) : null;
}

function paintFagi(f, world, main, isMain, canFollow) {
  const fam = world.lineage || world.colony ? familyOf(world, main, f.id ?? 1) : null;
  const stage = f.lifeStage ? stageName(f) : null;
  const caste = CASTES.enabled ? casteOf(f) : null;
  const casteTag = caste ? `<span class="ins-tag" style="background:${caste.color};color:#000;font-weight:bold;">${caste.icon} ${L(caste.name.en, caste.name.es)}</span>` : null;
  const sub = [
    f.id != null ? `#${f.id}` : null,
    f.sex ? `${SEX_MARK[f.sex]} ${t(`sex.${f.sex}`)}` : null,
    stage,
    casteTag,
    f.generation != null ? L(`gen. ${f.generation}`, `gen. ${f.generation}`) : null,
    isMain ? `<span class="ins-tag">${L('followed', 'seguida')}</span>` : null,
  ].filter(Boolean).join(' · ');
  const actions = `<button type="button" data-act="center">⦿ ${L('Center', 'Centrar')}</button>`
    + (!isMain && canFollow && f.alive ? `<button type="button" data-act="follow">★ ${L('Follow her', 'Seguirla')}</button>` : '');

  const now = actionOf(f);
  const needs = [
    f.hunger != null ? bar(t('stat.hunger'), f.hunger / HUNGER.max, pct(f.hunger / HUNGER.max), '#d95b7e') : '',
    f.thirst != null ? bar(t('stat.thirst'), f.thirst / THIRST.max, pct(f.thirst / THIRST.max), '#3d8fd9') : '',
    f.energy != null ? bar(t('stat.energy'), f.energy / energyMax(f), `${Math.round(f.energy)} / ${Math.round(energyMax(f))}`, '#8fd93d') : '',
    HEALTH.enabled && f.health != null ? bar(L('Health', 'Salud'), healthU(f), `${Math.round(f.health)} / ${HEALTH.max}`, '#e05a5a') : '',
    TASTE.enabled && TASTE.salt && f.sodium != null ? bar(L('Sodium', 'Sodio'), sodiumOf(f), pct(sodiumOf(f)), '#e0d05a') : '',
    SLEEP.enabled && f.sleepPressure != null ? bar(t('stat.sleepPressure'), f.sleepPressure, pct(f.sleepPressure), '#8f7fd0') : '',
    THERMAL.enabled && f.thermalStress != null ? bar(t('stat.thermalStress'), f.thermalStress / THERMAL.maxStress, pct(f.thermalStress / THERMAL.maxStress), '#e0875a') : '',
  ].join('');

  const nest = nestOf(world, f);
  const inNest = nest && f.x != null && nestUnder(f, world);
  const state = [
    row(L('Doing', 'Haciendo'), now ? esc(now) : null),
    f.home != null ? row(L('Colony', 'Colonia'), `${L('nest', 'nido')} #${f.home}${habitatOfNest(world, nest) ? ` · ${habitatLabel(nest.habitat)}` : ''}`) : null,
    f.carrying?.weight != null ? row(L('Load', 'Carga'), `×${num(f.carrying.weight, 2)} ${L('weight', 'peso')}, ×${num(f.carrying.hardness ?? 1, 2)} ${L('hardness', 'dureza')}`) : null,
    caste ? row(L('Colony role', 'Rol en la colonia'), `${caste.icon} ${L(caste.name.en, caste.name.es)} (${Math.round(caste.affinity * 100)}% ${L('affinity', 'afinidad')})`) : null,
    row(L('Why', 'Por qué'), f.thought?.reason ? esc(tx(f.thought.reason)) : null, 'ins-wrap'),
    row(L('Decided by', 'Lo decide'), f.thought?.tier ? `${f.thought.tier} · ${f.thought.rule}` : null),
    row(t('stat.carrying'), f.carrying ? labelOf(f.carrying.type) : f.hauling ? L('a thing', 'una cosa') : (f.thought ? t('word.nothing') : null)),
    row(L('Where', 'Dónde'), f.x != null ? `x ${Math.round(f.x)}, y ${Math.round(f.y)}${inNest ? ` · ${L('in the nest', 'en el nido')}` : ''}` : null),
    row(t('stat.bodyTemp'), THERMAL.enabled && f.temperature != null ? `${num(f.temperature)} °C${f.thermalFeel ? ` · ${t(`thermal.${f.thermalFeel}`)}` : ''}` : null),
    row(t('stat.body'), f.swimming ? t('body.swimming') : f.wet > 0 ? t('body.wet', { sec: { dur: f.wet, precise: true } }) : (f.thought ? t('body.dry') : null)),
    row(L('Sight', 'Vista'), f.brain ? `${Math.round(viewRangeOf(f))} px` : null),
  ].filter(Boolean).join('');

  const age = lifeAge(f);
  const life = [
    row(t('stat.age'), f.age != null ? dur(age) : null),
    row(L('Lifespan', 'Esperanza de vida'), f.lifespan ? dur(f.lifespan) : null),
    row(L('Time left', 'Le queda'), f.lifespan && f.alive ? dur(Math.max(0, f.lifespan - age)) : null),
    row(L('Adult at', 'Adulta a los'), LIFE.enabled && f.lifeStage === 'juvenile' ? dur(LIFE.adultAt) : null),
    row(L('Fertility', 'Fertilidad'), LIFE.enabled && f.sex && f.lifespan ? pct(fertility(f)) : null),
    row(L('Matings', 'Apareamientos'), f.lastMate ? String(f.lastMate.n) : null),
    row(L('Broods hatched', 'Crías nacidas'), f.lastBrood ? String(f.lastBrood.n) : null),
    row(L('Born at', 'Nació a los'), fam?.me?.bornAt ? `${dur(fam.me.bornAt)} ${L('of the session', 'de sesión')}` : null),
    row(t('stat.nights'), f.consolidations != null ? String(f.consolidations) : null),
  ].join('');

  const b = f.body ? bodyOf(f) : null;
  const fx = f.effects ? activeEffects(f) : [];
  const body = b ? [
    row(L('Speed', 'Velocidad'), `×${num(b.speed, 2)}`),
    row(L('Energy capacity', 'Capacidad de energía'), `×${num(b.energyMax, 2)}`),
    row(L('Metabolism', 'Metabolismo'), `×${num(b.metabolism, 2)}`),
    row(L('Insulation', 'Aislamiento'), `×${num(b.insulation, 2)}`),
    f.morph ? row(L('Organs (inherited)', 'Órganos (heredado)'), morphLine(f.morph, f.genome?.morph), 'ins-wrap') : '',
    f.genome?.plastic != null ? row(L('Plasticity gene', 'Gen de plasticidad'), `×${num(f.genome.plastic, 2)}`) : '',
    f.epi ? row(L('Mark from her parents', 'Marca de sus padres'), morphLine(f.epi), 'ins-wrap') : '',
    fx.length ? row(t('panel.effects'), fx.map((e) => `${t(`fx.${e.stat}`)} ×${e.mult} (${formatDuration(e.time, { precise: true })})`).join(', '), 'ins-wrap') : '',
  ].join('') : '';

  const brain = f.brain;
  const liveRules = brain?.rules?.list?.filter((r) => !r.retired).length;
  const cues = brain ? Object.values(brain.cues ?? {}) : [];
  const mind = brain ? [
    row(L('Beliefs', 'Creencias'), String(Object.keys(brain.facts ?? {}).length)),
    row(L('Written rules', 'Reglas escritas'), String(liveRules ?? 0)),
    row(L('Traits learned (innate)', 'Rasgos aprendidos (innatos)'), `${cues.filter((c) => !c.innate).length} (${cues.filter((c) => c.innate).length})`),
    row(L('Questions for tomorrow', 'Preguntas para mañana'), f.agenda?.length ? String(f.agenda.length) : null),
    row(t('stat.eaten'), String(f.eaten ?? 0)),
    row(L('Seconds drinking', 'Segundos bebiendo'), f.drunk != null ? String(Math.round(f.drunk)) : null),
    row(L('Rations stored', 'Raciones guardadas'), String(f.stored ?? 0)),
    HABIT_IDS.map((h) => row(HABIT_LABEL[h]?.() ?? h, num(habit(f, h), 2))).join(''),
  ].join('') : '';

  // Explore or come back (SITES, CHOICE, LARDER): her sites, how she weighs
  // them against exploring, and the pantry she predicts.
  const view = f.brain ? choiceView(f) : null;
  const larder = f.brain ? larderView(f) : null;
  const sitesOf = f.brain?.sites ?? [];
  const outcome = (e) => `${e.chose === 'explore' ? L('explore', 'explorar') : `#${e.site}`} → ${t(`brainmap.forage.outcome.${e.outcome.replace(' ', '')}`)}`;
  const forage = [
    sitesOf.map((s) => bar(
      `#${s.id} ${s.ref ? labelOf('tree') : L('ground', 'suelo')} · ${L('trust', 'confianza')} ${pct(s.confidence)}`,
      s.value, `${num(s.value, 2)} · ${s.visits}/${s.empties}∅`, s.value >= 0.6 ? '#8fd93d' : s.value >= 0.3 ? '#f0c75e' : '#d95b7e')).join(''),
    view ? bar(L('Exploring is worth', 'Explorar le vale'), view.exploreValue, num(view.exploreValue, 2), '#7f869a') : '',
    view ? row(L('Now she would', 'Ahora elegiría'), view.options.slice().sort((a, b) => b.p - a.p)
      .map((o) => `${o.kind === 'explore' ? L('explore', 'explorar') : `#${o.id}`} ${Math.round(o.p * 100)}%`).join(' · '), 'ins-wrap') : '',
    view && view.mode === 1 ? row(L('How she chooses', 'Cómo elige'), L(`a guess from her evidence (${num(view.exploreEvidence, 1)} explorations weigh; one takes her ${num(view.exploreTime, 0)} s)`,
      `una apuesta según lo vivido (pesan ${num(view.exploreEvidence, 1)} exploraciones; una le lleva ${num(view.exploreTime, 0)} s)`), 'ins-wrap') : '',
    view && view.mode !== 1 ? row(L('Noise when choosing', 'Ruido al elegir'), `${num(view.temperature, 2)} (${L('innate', 'innato')} ×${num(view.innate ?? 1, 2)})`) : '',
    view ? row(L('Decisions', 'Decisiones'), `${view.counts.site} ${L('back', 'volver')} · ${view.counts.explore} ${L('explore', 'explorar')}`) : '',
    view?.recent.length ? row(L('Last ones', 'Últimas'), view.recent.map(outcome).join(' · '), 'ins-wrap') : '',
    larder ? row(L('Pantry she believes', 'Despensa que cree'), `${num(larder.predicted, 1)} / ${larder.capacity} (${L('saw', 'vio')} ${larder.seen}, ${dur(larder.ago)})`) : '',
    larder ? row(L('It empties', 'Se vacía'), `${num(larder.rate * 60, 2)} / min`) : '',
    larder && !larder.room ? row(L('Room at home', 'Sitio en casa'), L('none, she believes', 'ninguno, cree')) : '',
  ].join('');

  let family = '';
  if (fam && (fam.mother || fam.father || fam.children.length || fam.siblings.length || world.colony)) {
    family = `<div class="ins-fam">`
      + `<h4>${L('Parents', 'Padres')}</h4>${chips([fam.father, fam.mother], f.sex === 'male' ? L('Founder: no known parents', 'Fundador: sin padres conocidos') : L('Founder: no known parents', 'Fundadora: sin padres conocidos'))}`
      + (fam.grandparents.some(Boolean) ? `<h4>${L('Grandparents', 'Abuelos')}</h4>${chips(fam.grandparents)}` : '')
      + `<h4>${L('Siblings', 'Hermanos')}</h4>${chips(fam.siblings)}`
      + `<h4>${L('Children', 'Hijos')}</h4>${chips(fam.children)}`
      + (fam.grandchildren.length ? `<h4>${L('Grandchildren', 'Nietos')}</h4>${chips(fam.grandchildren)}` : '')
      + `<p class="ins-note">${L('Surnames: first from the father, second from the mother.', 'Apellidos: el primero del padre, el segundo de la madre.')}</p>`
      + `</div>`;
  }

  const genes = f.genome ? Object.entries(f.genome.cues ?? {}).sort((a, b2) => Math.abs(b2[1]) - Math.abs(a[1])).slice(0, 6) : [];
  const genome = genes.length ? genes.map(([c, w]) => row(esc(labelOf(c)), `${w > 0 ? '+' : ''}${num(w, 2)}`)).join('') : '';

  const prog = f.brain ? programOf(f) : null;
  let programHtml = '';
  if (prog) {
    const lines = prog.lines;
    const own = lines.filter((l) => l.source !== 'born');
    const activeNow = f.thought?.line;
    const seq = prog.seq ?? 0;
    const headerRow = row(L('Program mutations', 'Mutaciones del programa'), `${seq} ${L('revisions', 'revisiones')} (${own.length} ${L('custom lines', 'líneas propias')})`);
    let phyRow = '';
    let exportBtns = '';
    if (world?.codePhylogeny) {
      const phySummary = summarizePhylogeny(world);
      phyRow = row(L('Colony innovations', 'Innovaciones colonia'), `${phySummary.totalInnovations} (${phySummary.bySource.self} self · ${phySummary.bySource.night} night · ${phySummary.bySource.told} told)`);
      exportBtns = `<div style="margin-top:6px;display:flex;gap:6px;">`
        + `<button type="button" data-act="copy-phylogeny-mermaid" style="flex:1;font-size:11px;padding:3px 6px;">📋 ${L('Copy Mermaid', 'Copiar Mermaid')}</button>`
        + `<button type="button" data-act="download-phylogeny-json" style="flex:1;font-size:11px;padding:3px 6px;">📥 ${L('Export JSON', 'Exportar JSON')}</button>`
        + `</div>`;
    }
    const lineRows = lines.map((l) => {
      const isNow = activeNow === l.id;
      const isOwn = l.source !== 'born';
      const tag = l.source === 'born' ? '' : `<span style="font-size:75%;padding:1px 4px;border-radius:3px;background:${l.source === 'night' ? '#8f7fd0' : l.source === 'told' ? '#3d8fd9' : '#8fd93d'};color:#000;margin-right:4px;font-weight:bold;">${l.source.toUpperCase()}</span>`;
      const chain = l.chain ? `<span style="color:#f0c75e;font-size:80%;"> [macro: ${l.chain.join(' → ')}]</span>` : '';
      const cond = l.if ? `<div style="font-size:80%;color:#aaa;margin-top:2px;">if: ${esc(JSON.stringify(l.if))}</div>` : '';
      const why = l.why ? `<div style="font-size:75%;color:#888;font-style:italic;">${esc(l.why)}</div>` : '';
      const prefix = isNow ? `<span style="color:#8fd93d;font-weight:bold;">▶ </span>` : '';
      const style = isNow ? 'background:rgba(143,217,61,0.15);padding:3px 6px;border-radius:4px;border-left:3px solid #8fd93d;' : isOwn ? 'background:rgba(255,255,255,0.04);padding:3px 6px;border-radius:4px;' : '';
      return `<div style="margin-bottom:6px;${style}">${prefix}${tag}<b>${esc(l.id)}</b> <span style="color:#888;font-size:80%;">(${l.tier})</span>${chain}${cond}${why}</div>`;
    }).join('');
    programHtml = headerRow + phyRow + exportBtns + `<div style="margin-top:8px;max-height:260px;overflow-y:auto;padding-right:4px;">${lineRows}</div>`;
  }

  return head(esc(fullName(f)), sub, SEX_COLOR[f.sex] ?? '#c9c9c9', actions)
    + `<div class="ins-body">`
    + section('needs', L('Needs', 'Necesidades'), needs)
    + section('now', L('Right now', 'Ahora'), state)
    + section('program', L('Self-Programmed Code & Lineage', 'Código Auto-Programado y Filogenia'), programHtml)
    + section('family', L('Family', 'Familia'), family)
    + section('life', L('Life', 'Vida'), life)
    + section('body', L('Body', 'Cuerpo'), body)
    + section('mind', L('Mind', 'Mente'), mind)
    + section('forage', L('Explore or come back', 'Explorar o volver'), forage)
    + section('genome', L('Inherited biases', 'Sesgos heredados'), genome)
    + `</div>`;
}

// --- a fruit ---

function traitsText(traits) {
  if (!traits) return null;
  return Object.values(traits).map((v) => esc(t(`trait.${v}`))).join(' · ');
}

function whoIsAfter(world, main, target) {
  const list = everyone(world, main).filter((f) => f.alive && f.target && (f.target === target || f.target.ref === target || f.target.id === target.id));
  return list.length ? list.map((f) => esc(fullName(f))).join(', ') : null;
}

function paintPoint(p, world, main) {
  const spec = specOfFruit(p.type, p.variant) ?? POINT_TYPES[p.type] ?? {};
  const life = spec.life ?? 0;
  const age = p.age ?? 0;
  const rotten = p.type === FRUIT.rot;
  const sub = [rotten ? L('rotten', 'podrido') : null, spec.species ? L('wild species', 'especie silvestre') : null,
    spec.custom ? L('made by you', 'creado por ti') : null,
    p.variant === 'twin' ? L('look-alike', 'doble') : null].filter(Boolean).join(' · ');
  const actions = `<button type="button" data-act="center">⦿ ${L('Center', 'Centrar')}</button>`
    + (main ? `<button type="button" data-act="ask">? ${L(`What does ${esc(fullName(main))} think?`, `¿Qué piensa ${esc(fullName(main))}?`)}</button>` : '');

  const hunger = spec.hunger ?? 0;
  const what = [
    row(L('Hunger', 'Hambre'), hunger < 0 ? `${L('removes', 'quita')} ${-hunger}` : hunger > 0 ? `${L('adds', 'suma')} ${hunger}` : '0'),
    spec.thirst ? row(L('Thirst', 'Sed'), spec.thirst < 0 ? `${L('removes', 'quita')} ${-spec.thirst}` : `${L('adds', 'suma')} ${spec.thirst}`) : '',
    (spec.effects ?? []).length ? row(L('Effects', 'Efectos'), spec.effects.map((e) => `${t(`fx.${e.stat}`)} ×${e.mult} · ${e.sec}s`).join(', '), 'ins-wrap') : '',
    row(L('Looks, smells', 'Aspecto, olor'), traitsText(spec.traits), 'ins-wrap'),
    row(L('Aroma (plume length)', 'Aroma (largo de estela)'), spec.aroma != null ? String(spec.aroma) : null),
    TASTE.enabled && spec.taste ? row(L('Tastes', 'Sabe'), Object.entries(spec.taste).map(([k, v]) => `${esc(t(`taste.${k}`) === `taste.${k}` ? k : t(`taste.${k}`))} ${pct(v)}`).join(', '), 'ins-wrap') : '',
    p.variant === 'twin' ? `<p class="ins-note">${L('A poisonous look-alike: the same look, another mix inside. Only the tongue tells them apart.', 'Un doble venenoso: el mismo aspecto, otra mezcla por dentro. Solo el paladar los distingue.')}</p>` : '',
  ].join('');

  const time = [
    row(L('Age', 'Edad'), dur(age)),
    row(L('Lifetime', 'Vida total'), life > 0 ? dur(life) : L('forever', 'para siempre')),
    life > 0 ? row(rotten ? L('Falls apart in', 'Se deshace en') : L('Rots in', 'Se pudre en'), dur(Math.max(0, life - age))) : '',
    life > 0 ? bar(rotten ? L('Decay', 'Descomposición') : L('Ripeness', 'Madurez'), ripeness(p), pct(ripeness(p)), rotten ? '#9a6a4a' : '#e8a33d') : '',
    !rotten && life > 0 ? row(L('Looks overripe from', 'Se nota pasado desde'), pct(FRUIT.warnFrom)) : '',
  ].join('');

  const nest = nestOf(world);
  const tree = p.from != null && p.from !== 'user' && p.from !== 'patch' && p.from !== 'nest' ? world.objects.find((o) => o.id === p.from) : null;
  const origin = [
    row(L('Fell from', 'Cayó de'), tree ? `<button type="button" class="ins-chip" data-obj="${tree.id}">${labelOf('tree')} #${tree.id}</button>`
      : p.from === 'user' ? L('placed by you', 'puesto por ti') : p.from === 'patch' ? L('a patch on the ground', 'una mancha en el suelo') : p.from === 'nest' ? L('left at the door of a full nest', 'dejado a la puerta del nido lleno') : p.from != null ? `${labelOf('tree')} #${p.from} (${L('gone', 'ya no está')})` : null),
    row(L('Where', 'Dónde'), `x ${Math.round(p.x)}, y ${Math.round(p.y)}`),
    nest ? row(L('From the nest', 'Del nido'), `${Math.round(Math.hypot(p.x - nest.x, p.y - nest.y))} px`) : '',
    row(L('Who is after it', 'Quién va a por él'), whoIsAfter(world, main, p), 'ins-wrap'),
  ].join('');

  return head(`${esc(labelOf(p.type))} <small>#${p.id}</small>`, sub, spec.color ?? '#999', actions)
    + `<div class="ins-body">`
    + section('what', L('What it is', 'Qué es'), what)
    + section('time', L('Time', 'Tiempo'), time)
    + section('origin', L('Origin and place', 'Origen y lugar'), origin)
    + `</div>`;
}

// --- a map object ---

function fagisIn(world, main, test) {
  const list = everyone(world, main).filter((f) => f.alive && f.x != null && test(f));
  return list.length ? chips(list.map((f) => ({ id: f.id ?? 1, label: fullName(f), sex: f.sex, alive: true }))) : null;
}

function paintObject(o, world, main) {
  const type = OBJECT_TYPES[o.type] ?? {};
  const kind = type.kind;
  const r = radiusOf(o);
  const actions = `<button type="button" data-act="center">⦿ ${L('Center', 'Centrar')}</button>`;
  const common = row(L('Where', 'Dónde'), `x ${Math.round(o.x)}, y ${Math.round(o.y)}`) + row(L('Radius', 'Radio'), `${Math.round(r)} px`);
  let sub = '';
  let body = '';

  if (kind === 'spawner') {
    const fruit = o.fruit ?? TREE.fruit;
    const scope = r * TREE.dropRadius + 20;
    const near = world.points.filter((p) => p.type === fruit && Math.hypot(p.x - o.x, p.y - o.y) <= scope).length;
    const fspec = POINT_TYPES[fruit];
    sub = `${L('drops', 'da')} ${esc(labelOf(fruit))}`;
    body = section('what', L('Fruit', 'Fruto'), [
      row(L('Fruit it drops', 'Fruto que da'), `<span style="color:${fspec?.color}">●</span> ${esc(labelOf(fruit))}`),
      row(L('Looks, smells', 'Aspecto, olor'), traitsText(fspec?.traits), 'ins-wrap'),
      row(L('One fruit every', 'Un fruto cada'), dur(intervalOf(o))),
      row(L('Next fruit in', 'Próximo fruto en'), o.timer != null ? formatDuration(Math.max(0, o.timer), { precise: true }) : null),
      bar(L('Its fruit on the ground', 'Sus frutos en el suelo'), near / maxNearOf(o), `${near} / ${maxNearOf(o)}${near >= maxNearOf(o) ? ` · ${L('stopped', 'parado')}` : ''}`, fspec?.color ?? '#5bd97e'),
      row(L('Fruit dropped', 'Frutos tirados'), o.lastDrop != null ? String(o.lastDrop) : null),
      row(L('Falls within', 'Cae hasta'), `${Math.round(r * TREE.dropRadius)} px`),
    ].join(''))
      + section('time', L('Time', 'Tiempo'), [
        row(L('Age', 'Edad'), o.age != null ? dur(o.age) : null),
        row(L('Lifetime', 'Vida total'), TREE.life > 0 ? dur(TREE.life) : L('forever', 'para siempre')),
        TREE.life > 0 ? bar(L('Life used', 'Vida gastada'), treeAge(o), pct(treeAge(o)), '#4f9552') : '',
        row(L('Shade', 'Sombra'), THERMAL.enabled ? `−${THERMAL.shade} °C ${L('at full daylight', 'a pleno día')}` : null),
      ].join(''))
      + section('place', L('Place', 'Lugar'), common);
  } else if (kind === 'nest') {
    const total = stockCount(o.stock);
    const temp = nestTemperature(world, o);
    const habitat = habitatOfNest(world, o);
    const rows = Object.keys(o.stock ?? {}).filter((k) => o.stock[k] > 0).map((k) => {
      const life = (POINT_TYPES[k]?.life ?? 0) * NEST.keepFactor;
      const step = nestRipeness(o, k);
      return bar(`<span style="color:${specOf(k)?.color}">●</span> ${esc(labelOf(k))} × ${o.stock[k]}`, step,
        life > 0 ? `${L('oldest spoils in', 'la más vieja se estropea en')} ${dur(life * (1 - step))}` : '', '#c9a227');
    }).join('');
    const eggs = (o.eggs ?? []).map((egg) => {
      const mother = findById(world, main, egg.mother) ?? { id: egg.mother, name: world.lineage?.[egg.mother]?.name };
      const father = findById(world, main, egg.father) ?? { id: egg.father, name: world.lineage?.[egg.father]?.name };
      const ready = egg.progress >= 1;
      const wait = ready ? `${L('ready, waiting for a ration', 'listo, esperando una ración')} (${dur(Math.max(0, LIFE.eggStarve - (world.time - egg.readyAt)))})` : pct(egg.progress);
      return `<div class="ins-egg">${bar(`🥚 #${egg.id} ${egg.sex ? SEX_MARK[egg.sex] : ''} · ${L('gen.', 'gen.')} ${egg.generation}`, egg.progress, wait, ready ? '#e8a33d' : '#d8cfa8')}`
        + `<div class="ins-sub">${esc(fullName(father))} × ${esc(fullName(mother))}${egg.inbreeding ? ` · ${L('inbreeding', 'consanguinidad')} ${egg.inbreeding}` : ''}</div></div>`;
    }).join('');
    sub = `${total} / ${NEST.full} ${L('rations', 'raciones')}${(o.eggs?.length ?? 0) ? ` · ${o.eggs.length} ${L('eggs', 'huevos')}` : ''}`;
    body = section('stock', L('Pantry', 'Despensa'), (rows || `<div class="ins-none">${t('word.empty')}</div>`)
      + row(L('Full at', 'Llena con'), String(NEST.full))
      + row(L('Stored food lasts', 'Lo guardado dura'), `×${NEST.keepFactor}`)
      + row(L('Spoiled so far', 'Estropeadas hasta ahora'), o.spoiled ? String(o.spoiled) : null))
      + section('eggs', L('Eggs', 'Huevos'), LIFE.enabled ? (eggs || `<div class="ins-none">${L('No eggs', 'Sin huevos')}</div>`)
        + row(L('Hatching pace now', 'Ritmo de incubación ahora'), pct(eggPace(temp))) : '')
      + (habitat ? section('habitat', L('Habitat', 'Hábitat'), [
        row(L('Kind', 'Tipo'), habitatLabel(habitat.name)),
        habitat.cold ? row(L('Air', 'Aire'), `−${num(habitat.cold)} °C`) : null,
        habitat.fruit !== 1 ? row(L('Its trees bear', 'Sus árboles dan'), `×${num(habitat.fruit)}`) : null,
        habitat.trees ? row(L('Poisonous trees close by', 'Árboles venenosos cerca'), String(habitat.trees)) : null,
      ].join('')) : '')
      + section('now', L('Inside now', 'Dentro ahora'), [
        row(L('Temperature', 'Temperatura'), temp != null ? `${num(temp)} °C` : null),
        row(L('Lining', 'Forro'), o.lining?.length ? String(o.lining.length) : null),
        fagisIn(world, main, (f) => nestUnder(f, world) === o) ?? `<div class="ins-none">${L('Nobody', 'Nadie')}</div>`,
      ].join(''))
      + section('place', L('Place', 'Lugar'), common);
  } else if (kind === 'water') {
    const shallow = type.shallow;
    sub = shallow ? L('rain puddle', 'charco de lluvia') : L('pond', 'estanque');
    const left = shallow && !world.rain?.on && RAIN.evaporate > 0 ? (r - RAIN.minRadius) / RAIN.evaporate : null;
    body = section('what', L('Water', 'Agua'), [
      row(L('Deep water radius', 'Radio del agua honda'), shallow ? L('none: all shallows', 'ninguno: todo es vado') : `${Math.round(deepRadius(o))} px`),
      row(L('Shallows to drink from', 'Vado donde bebe'), shallow ? `${Math.round(r)} px` : `${WATER.shallows} px`),
      row(L('Aroma', 'Aroma'), String(type.aroma ?? 0)),
      shallow ? row(L('Now', 'Ahora'), world.rain?.on ? L('growing in the rain', 'creciendo con la lluvia') : L('drying in the sun', 'secándose al sol')) : '',
      left != null ? row(L('Dry in about', 'Seco en unos'), dur(left)) : '',
      row(L('Drinking now', 'Bebiendo ahora'), fagisIn(world, main, (f) => f.drinking && Math.hypot(f.x - o.x, f.y - o.y) <= r)),
    ].join('')) + section('place', L('Place', 'Lugar'), common);
  } else if (kind === 'thing') {
    const aff = affordanceOf(world.thingChemistry, o.look ?? {});
    const dry = (o.dryUntil ?? 0) > world.time;
    sub = L('a thing with no inborn meaning', 'una cosa sin significado innato');
    const AFF = { sap: L('sap: a nibble eases thirst', 'savia: un mordisco quita sed'), cool: L('cool to the touch', 'fresca al tacto'),
      warm: L('warm to the touch', 'cálida al tacto'), sting: L('stings', 'pincha'), inert: L('nothing', 'nada') };
    body = section('what', L('What it is', 'Qué es'), [
      row(L('Looks', 'Aspecto'), traitsText(o.look), 'ins-wrap'),
      row(L('What it really does', 'Qué hace de verdad'), world.thingChemistry ? AFF[aff] : null, 'ins-wrap'),
      aff === 'sap' ? row(L('Sap', 'Savia'), dry ? `${L('dry, back in', 'seca, vuelve en')} ${dur(o.dryUntil - world.time)}` : L('ready', 'lista')) : '',
      aff === 'sap' ? row(L('Thirst a nibble takes', 'Sed que quita un mordisco'), String(CONCEPT.sap)) : '',
      `<p class="ins-note">${L('She does not know this: she finds out by touching and nibbling.', 'Ella no lo sabe: lo descubre tocando y mordisqueando.')}</p>`,
    ].join('')) + section('place', L('Place', 'Lugar'), common);
  } else {
    sub = L('blocks the way and the sight', 'bloquea el paso y la vista');
    body = section('place', L('Place', 'Lugar'), common);
  }

  return head(`${esc(labelOf(o.type))} <small>#${o.id}</small>`, sub, type.color ?? '#999', actions) + `<div class="ins-body">${body}</div>`;
}

// Her inherited organs (MORPH), as she carries them: × today's Fagi.
const MORPH_LABEL = {
  brain: ['brain', 'cerebro'], gut: ['gut', 'estómago'], muscle: ['muscle', 'músculo'],
  eyes: ['eyes', 'ojos'], antennae: ['antennae', 'antenas'], size: ['size', 'tamaño'],
};
// What she carries, and in brackets what she inherited when what she lived moved it.
function morphLine(m, gene = null) {
  return Object.entries(MORPH_LABEL).map(([k, [en, es]]) => {
    const now = num(m[k] ?? 1, 2);
    const was = gene ? num(gene[k] ?? 1, 2) : now;
    return `${L(en, es)} ×${now}${was !== now ? ` (${was})` : ''}`;
  }).join(', ');
}
