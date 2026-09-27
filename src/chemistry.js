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

import { POINT_TYPES } from './config.js';

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
const FEED = { nourishing: -35, mild: -12, poison: 25 };
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
export function createChemistry(rnd = Math.random) {
  const smells = shuffle(TRAITS.smell, rnd);
  const colors = shuffle(TRAITS.color, rnd);
  return {
    smell: { [smells[0]]: 'poison', [smells[1]]: 'nourishing', [smells[2]]: 'mild', [smells[3]]: 'mild' },
    color: { [colors[0]]: 'speed', [colors[1]]: 'sight', [colors[2]]: 'metabolism' },
  };
}

export function effectOf(chem, traits) {
  const feed = chem.smell[traits.smell] ?? 'mild';
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
  const bySmell = (cls) => Object.keys(chem.smell).filter((s) => chem.smell[s] === cls);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const wanted = [
    ...Array(2).fill('poison'), ...Array(2).fill('nourishing'),
    ...Array(Math.max(0, count - 4)).fill(null),
  ].slice(0, count);
  const out = [];
  const used = new Set();
  for (const cls of wanted) {
    for (let tries = 0; tries < 50; tries++) {
      const traits = {
        color: pick(TRAITS.color),
        shape: pick(TRAITS.shape),
        smell: cls ? pick(bySmell(cls)) : pick(TRAITS.smell),
      };
      const key = speciesKey(traits);
      if (used.has(key) || POINT_TYPES[key] && !POINT_TYPES[key].species) continue;
      used.add(key);
      const fx = effectOf(chem, traits);
      out.push({
        key,
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
      });
      break;
    }
  }
  return out;
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
