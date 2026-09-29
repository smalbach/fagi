// Hidden chemistry: each map has its own rules for what a fruit does to whoever
// eats it, and those rules hang on what the fruit looks and smells like.
//
// A fruit is three traits: a color, a shape and a smell. The chemistry decides,
// once per map, what each trait tends to mean:
//   smell  -> how it feeds: one smell poisons, one nourishes, the rest are mild;
//   color  -> a side effect: some colors carry a buff (speed, sight, metabolism);
//   shape  -> nothing at all. It is there to be blamed wrongly.
// Species are random combinations of traits; their effects come out of the
// chemistry, so what Fagi learns from one species says something about the
// next one she meets. Fagi never reads any of this: she only feels the result.
//
// Species live in POINT_TYPES next to the classic fruit, so everything that
// already handles a fruit type (eating, rotting, carrying, drawing) handles
// them too. The classic fruit have traits as well (config.js): learning is the
// same for all.

import { POINT_TYPES, PERCEPT, TASTE } from './config.js';

export const TRAITS = {
  color: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
  shape: ['round', 'drop', 'crystal', 'orb'],
  smell: ['sweet', 'sour', 'musky', 'sharp'],
};

export const COLOR_HEX = {
  red: '#d9504f', orange: '#e8903d', yellow: '#e2c84a',
  green: '#5bd97e', blue: '#4cc9f0', purple: '#b57bff',
};

// Which painter draws each shape (fruit-sprite/).
export const SHAPE_PAINTER = { round: 'berry', drop: 'resin', crystal: 'spark', orb: 'eye' };

// What each smell class does to hunger. Negative feeds.
export const FEED = { nourishing: -35, mild: -12, poison: 25 };
const POISON_EFFECTS = [{ stat: 'speed', mult: 0.6, sec: 5 }];

// What a color may carry on top.
const BUFFS = {
  speed: [{ stat: 'speed', mult: 1.8, sec: 8 }],
  sight: [{ stat: 'viewRange', mult: 1.6, sec: 10 }, { stat: 'fovDeg', mult: 1.4, sec: 10 }],
  metabolism: [{ stat: 'hungerRate', mult: 0.5, sec: 14 }],
};

const shuffle = (list, rnd) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const speciesKey = ({ color, shape, smell }) => `${color}-${shape}-${smell}`;

export function cuesOfTraits(traits) {
  return traits ? Object.entries(traits).map(([dim, val]) => `${dim}:${val}`) : [];
}

// The chemistry of one map. `rnd` defaults to Math.random, which the batch
// runner seeds per map.
//
// `family` picks how the chemistry is built:
//   'smell' (the default): one smell poisons, one nourishes, the rest are mild;
//   'one':  the same, but written as rules (below) on any dimension (`dim`);
//   'conj': poison needs two traits at once, a color AND a smell; one smell
//           nourishes. A theory about the smell alone is then too broad.
// Rules-based chemistries ('one', 'conj') carry `rules: { poison, food }`,
// each a list of clauses, a clause a list of cues that must all be there.
// They are what research/ changes and seeds theories from.
export function createChemistry(rnd = Math.random, { family = 'smell', dim = 'smell' } = {}) {
  if (TASTE.enabled && family === 'smell') return createTasteChemistry(rnd);
  const smells = shuffle(TRAITS.smell, rnd);
  const colors = shuffle(TRAITS.color, rnd);
  const chem = {
    smell: { [smells[0]]: 'poison', [smells[1]]: 'nourishing', [smells[2]]: 'mild', [smells[3]]: 'mild' },
    color: { [colors[0]]: 'speed', [colors[1]]: 'sight', [colors[2]]: 'metabolism' },
  };
  if (family === 'smell') return chem;
  if (family === 'one') {
    const values = shuffle(TRAITS[dim], rnd);
    return { ...chem, rules: { poison: [[`${dim}:${values[0]}`]], food: [[`${dim}:${values[1]}`]] } };
  }
  if (family === 'conj') {
    return { ...chem, rules: { poison: [[`color:${colors[3]}`, `smell:${smells[0]}`]], food: [[`smell:${smells[1]}`]] } };
  }
  throw new Error(`unknown chemistry family: ${family}`);
}

// What a fruit with these traits does to hunger: 'poison', 'nourishing' or 'mild'.
export function feedOf(chem, traits) {
  if (chem.taste) {
    const comp = chem.compositions[speciesKey(traits)];
    return comp ? tasteEffect(chem, comp).feed : 'mild';
  }
  if (!chem.rules) return chem.smell[traits.smell] ?? 'mild';
  const cues = cuesOfTraits(traits);
  const hit = (clauses) => clauses.some((c) => c.every((x) => cues.includes(x)));
  if (hit(chem.rules.poison)) return 'poison';
  if (hit(chem.rules.food)) return 'nourishing';
  return 'mild';
}

// The same chemistry turned upside down: the smell that poisoned now
// nourishes and the other way round. Colors keep their buffs. It is the
// hardest change for whoever learned the old one: what she avoided is now food.
export function invertChemistry(chem) {
  if (chem.taste) return { ...chem, inverted: !chem.inverted };
  if (chem.rules) return { ...chem, rules: { poison: chem.rules.food, food: chem.rules.poison } };
  const smell = { ...chem.smell };
  const poison = Object.keys(smell).find((s) => smell[s] === 'poison');
  const food = Object.keys(smell).find((s) => smell[s] === 'nourishing');
  smell[poison] = 'nourishing';
  smell[food] = 'poison';
  return { ...chem, smell };
}

// The smell that goes with a class of fruit ('poison' or 'nourishing'), for
// measuring only. Under a smell chemistry it is the chemistry's own. Under
// tastes (TASTE) there is none: the body answers to hidden compounds and a
// smell is only a hint, so it is the smell most of these species of that class
// carry (ties to the first in TRAITS.smell), or null when none is of that class.
export function smellOf(chem, cls, catalogue = speciesKeys().map((k) => POINT_TYPES[k].traits)) {
  if (chem.smell) return Object.keys(chem.smell).find((s) => chem.smell[s] === cls);
  const count = {};
  for (const traits of catalogue) if (feedOf(chem, traits) === cls) count[traits.smell] = (count[traits.smell] ?? 0) + 1;
  let best = null;
  for (const s of TRAITS.smell) if ((count[s] ?? 0) > (count[best] ?? 0)) best = s;
  return best;
}

// A rules-based chemistry after the world changes (`kind`):
//   'invert': poison and food swap (above);
//   'rotate': every poison cue moves to another value of its dimension, one no
//             clause uses: a theory about the old value is simply wrong now;
//   'shift':  the poison moves to another dimension (a smell becomes a color):
//             a theory on the right dimension becomes one on the wrong one.
// Food stays where it was in 'rotate' and 'shift'.
export function changeChemistry(chem, kind, rnd = Math.random) {
  if (!chem.rules) throw new Error('changeChemistry needs a rules-based chemistry');
  if (kind === 'invert') return invertChemistry(chem);
  const used = new Set([...chem.rules.poison, ...chem.rules.food].flat());
  const fresh = (dim) => {
    const free = TRAITS[dim].map((v) => `${dim}:${v}`).filter((c) => !used.has(c));
    const c = free[Math.floor(rnd() * free.length)];
    used.add(c);
    return c;
  };
  const dimOf = (c) => c.split(':')[0];
  let poison;
  if (kind === 'rotate') poison = chem.rules.poison.map((clause) => clause.map((c) => fresh(dimOf(c))));
  else if (kind === 'shift') {
    poison = chem.rules.poison.map((clause) => clause.map((c) => {
      const dims = Object.keys(TRAITS).filter((d) => d !== dimOf(c) && !clause.some((x) => dimOf(x) === d));
      return fresh(dims[Math.floor(rnd() * dims.length)]);
    }));
  } else throw new Error(`unknown change: ${kind}`);
  return { ...chem, rules: { poison, food: chem.rules.food } };
}

export function effectOf(chem, traits) {
  const feed = feedOf(chem, traits);
  const buff = chem.color[traits.color];
  return {
    hunger: FEED[feed],
    effects: [...(feed === 'poison' ? POISON_EFFECTS : []), ...(buff ? BUFFS[buff] : [])],
    feed,
    buff: buff ?? null,
  };
}

// `count` species, all distinct, with at least two poisonous and two
// nourishing ones so that there is something to generalize in both directions.
export function createSpecies(chem, count, rnd = Math.random) {
  if (chem.taste) return createTasteSpecies(chem, count, rnd);
  const bySmell = (cls) => Object.keys(chem.smell).filter((s) => chem.smell[s] === cls);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const wanted = [
    ...Array(2).fill('poison'), ...Array(2).fill('nourishing'),
    ...Array(Math.max(0, count - 4)).fill(null),
  ].slice(0, count);
  const out = [];
  const used = new Set();
  // With PERCEPT (percept.js) no species may look like a classic fruit: two
  // things that look the same would be told apart only by a name she cannot
  // see. Off, the draw stays exactly what the preregistered studies used.
  const looks = PERCEPT.enabled
    ? new Set(Object.values(POINT_TYPES).filter((s) => s.traits && !s.species).map((s) => speciesKey(s.traits)))
    : new Set();
  for (const cls of wanted) {
    for (let tries = 0; tries < (chem.rules ? 500 : 50); tries++) {
      // Smell-based chemistry: the smell decides, pick one of that class. A
      // rules-based one: draw at random until the fruit falls in the class.
      const traits = {
        color: pick(TRAITS.color),
        shape: pick(TRAITS.shape),
        smell: cls && !chem.rules ? pick(bySmell(cls)) : pick(TRAITS.smell),
      };
      if (cls && chem.rules && feedOf(chem, traits) !== cls) continue;
      const key = speciesKey(traits);
      if (used.has(key) || looks.has(key) || POINT_TYPES[key] && !POINT_TYPES[key].species) continue;
      used.add(key);
      out.push(speciesUnder(chem, traits));
      break;
    }
  }
  return out;
}

// A species with these traits, as this chemistry makes it. The same traits
// under another chemistry (after the world changes) are the same species
// doing something else.
export function speciesUnder(chem, traits) {
  if (chem.taste) return tasteSpeciesUnder(chem, traits);
  const fx = effectOf(chem, traits);
  return {
    key: speciesKey(traits),
    spec: {
      color: COLOR_HEX[traits.color],
      radius: 6,
      aroma: 130,
      life: 200,
      hunger: fx.hunger,
      effects: fx.effects,
      traits,
      painter: SHAPE_PAINTER[traits.shape],
      species: true,
    },
  };
}

// --- tastes (TASTE, spec §12.9) ---------------------------------------------
// A wild species is a hidden mix of compounds; the tongue reads each as a
// taste. What the body gets comes from the compounds, not from the taste: a
// bitter alkaloid is poison on some species and harmless on others, and a
// poison can have no taste at all.

export const TASTES = ['sweet', 'umami', 'salty', 'sour', 'astringent', 'bitter', 'spicy'];
// What a species with this dominant taste tends to smell like: a hint, not a rule.
const SMELL_OF = {
  sweet: ['sweet'], umami: ['musky'], salty: ['musky', 'sharp'], sour: ['sour'],
  astringent: ['sour', 'musky'], bitter: ['musky', 'sharp'], spicy: ['sharp'],
};

export function createTasteChemistry(rnd = Math.random) {
  const colors = shuffle(TRAITS.color, rnd);
  return {
    taste: true,
    color: { [colors[0]]: 'speed', [colors[1]]: 'sight', [colors[2]]: 'metabolism' },
    compositions: {},
    twins: {},
    inverted: false,
  };
}

const r2 = (v) => Math.round(v * 100) / 100;

// What a composition does to the body. Turned upside down (a world that
// changes), the poisons feed and the most nourishing poison.
export function tasteEffect(chem, comp) {
  const g = (t) => comp.taste[t] ?? 0;
  let relief = (30 * g('sweet') + 40 * g('umami')) * (1 - 0.6 * g('astringent'));
  let toxic = comp.toxic;
  if (chem.inverted) {
    if (toxic) { toxic = false; relief = Math.max(relief, 35); } else if (relief >= 20) toxic = true;
  }
  return {
    hunger: toxic ? 25 : -Math.max(5, Math.round(relief)),
    feed: toxic ? 'poison' : relief >= 20 ? 'nourishing' : 'mild',
    thirst: Math.round(14 * g('salty') - 10 * g('sour')),
    burn: g('spicy'),
  };
}

// What one composition does, as the fields of a fruit spec.
function bodyOf(chem, comp, buff) {
  const fx = tasteEffect(chem, comp);
  return {
    hunger: fx.hunger, thirst: fx.thirst, burn: fx.burn, taste: { ...comp.taste },
    effects: [...(fx.feed === 'poison' ? POISON_EFFECTS : []), ...(buff ? BUFFS[buff] : [])],
  };
}

function tasteSpeciesUnder(chem, traits) {
  const key = speciesKey(traits);
  const buff = chem.color[traits.color];
  const twin = chem.twins?.[key];
  return {
    key,
    spec: {
      color: COLOR_HEX[traits.color], radius: 6, aroma: 130, life: 200,
      ...bodyOf(chem, chem.compositions[key], buff),
      // Its poisonous look-alike: the same look, another mix (TASTE.mimics).
      ...(twin ? { twin: { share: TASTE.twinShare, ...bodyOf(chem, twin, buff) } } : {}),
      traits, painter: SHAPE_PAINTER[traits.shape], species: true,
    },
  };
}

function createTasteSpecies(chem, count, rnd) {
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const wanted = [
    ...Array(2).fill('poison'), ...Array(2).fill('nourishing'),
    ...Array(Math.max(0, count - 4)).fill(null),
  ].slice(0, count);
  const looks = new Set(Object.values(POINT_TYPES).filter((s) => s.traits && !s.species).map((s) => speciesKey(s.traits)));
  const out = [];
  for (const cls of wanted) {
    for (let tries = 0; tries < 500; tries++) {
      const d = pick(TASTES);
      const taste = { [d]: r2(0.6 + 0.4 * rnd()) };
      if (rnd() < 0.5) taste[pick(TASTES.filter((t) => t !== d))] = r2(0.2 + 0.3 * rnd());
      const toxic = (taste.bitter ?? 0) >= 0.3 ? rnd() < TASTE.toxicBitter : rnd() < TASTE.hiddenToxin;
      const comp = { taste, toxic };
      if (cls && tasteEffect(chem, comp).feed !== cls) continue;
      const traits = {
        color: pick(TRAITS.color), shape: pick(TRAITS.shape),
        smell: rnd() < 0.7 ? pick(SMELL_OF[d]) : pick(TRAITS.smell),
      };
      const key = speciesKey(traits);
      if (chem.compositions[key] || looks.has(key) || POINT_TYPES[key] && !POINT_TYPES[key].species) continue;
      chem.compositions[key] = comp;
      out.push(tasteSpeciesUnder(chem, traits));
      break;
    }
  }
  // Look-alikes: some nourishing species get a poisonous twin with the same
  // look. Mostly it tastes bitter; now and then of nothing unusual (TASTE.toxicBitter).
  let mimics = 0;
  for (const s of out) {
    if (mimics >= TASTE.mimics) break;
    if (tasteEffect(chem, chem.compositions[s.key]).feed !== 'nourishing') continue;
    const base = chem.compositions[s.key].taste;
    const taste = rnd() < TASTE.toxicBitter
      ? { bitter: r2(0.5 + 0.5 * rnd()) }
      : { ...base };
    chem.twins[s.key] = { taste, toxic: true };
    Object.assign(s, tasteSpeciesUnder(chem, s.spec.traits));
    mimics += 1;
  }
  return out;
}

// The tastes of a fruit type (what the tongue says), as cues: 'taste:bitter'.
// Only what is there enough to notice.
export function tasteCuesOf(key, taste = null) {
  const t = taste ?? POINT_TYPES[key]?.taste;
  return t ? Object.entries(t).filter(([, v]) => v >= 0.3).map(([k]) => `taste:${k}`) : [];
}

// The fruit that falls from a species with a look-alike: this one or its twin.
export function drawVariant(key, rnd = Math.random) {
  const twin = TASTE.enabled ? POINT_TYPES[key]?.twin : null;
  return twin && rnd() < twin.share ? 'twin' : null;
}

// What this very fruit is: its kind's spec, or its look-alike's.
export function specOfFruit(key, variant = null) {
  const spec = POINT_TYPES[key];
  return variant === 'twin' && spec?.twin ? { ...spec, ...spec.twin } : spec;
}

// Species are part of the map: a new map drops the old ones.
export function registerSpecies(list) {
  for (const k of Object.keys(POINT_TYPES)) if (POINT_TYPES[k].species) delete POINT_TYPES[k];
  for (const { key, spec } of list) POINT_TYPES[key] = spec;
}

// A replay draws another map's species without dropping the current ones.
export function addSpecies(list) {
  for (const { key, spec } of list) if (!POINT_TYPES[key] || POINT_TYPES[key].species) POINT_TYPES[key] = spec;
}

export function speciesKeys() {
  return Object.keys(POINT_TYPES).filter((k) => POINT_TYPES[k].species);
}

// Ground truth, for measuring and showing only (scripts/batch, the brain map):
// Fagi never calls these.
export const isHarmful = (key) => (POINT_TYPES[key]?.hunger ?? 0) > 0;
export const isHelpful = (key) => {
  const s = POINT_TYPES[key];
  return Boolean(s) && s.hunger <= 0 && (s.hunger < 0 || s.effects.length > 0);
};

// The fruit that can be on this map: its species and rotten fruit, or the
// classic ones on a map without chemistry.
function fruitOnMap() {
  const wild = speciesKeys();
  if (wild.length) return [...wild, 'toxic'];
  return Object.keys(POINT_TYPES).filter((k) => POINT_TYPES[k].traits);
}

// How a rule about traits compares with the hidden chemistry: of the fruit on
// this map it covers, how many really do what it says.
export function ruleTruth(rule) {
  const covered = fruitOnMap().filter((k) => {
    const traits = cuesOfTraits(POINT_TYPES[k].traits);
    return rule.when.all.every((c) => traits.includes(c))
      && !(rule.except ?? []).some((e) => e === k || traits.includes(e));
  });
  const right = rule.verdict === 'avoid' ? isHarmful : isHelpful;
  return { ok: covered.filter(right).length, total: covered.length };
}
