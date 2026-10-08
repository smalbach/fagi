// What each setting means and what changing it does, in both languages.
//
// The texts live in settings-help/, one file per category of the dialog
// (settings.js). Fields are keyed by their setting id, groups by their English
// title; the per-fruit groups share one set of texts, keyed by field key.

import climate from './settings-help/climate.js';
import world from './settings-help/world.js';
import food from './settings-help/food.js';
import body from './settings-help/body.js';
import mindA from './settings-help/mind-a.js';
import mindB from './settings-help/mind-b.js';
import colony from './settings-help/colony.js';

const PARTS = [climate, world, food, body, mindA, mindB, colony];
const FIELDS = Object.assign({}, ...PARTS.map((p) => p.fields));
const GROUPS = Object.assign({}, ...PARTS.map((p) => p.groups));
const PER_FOOD = food.perFood ?? {};

const pick = (pair, lang) => (pair ? (lang === 'es' ? pair[1] : pair[0]) ?? pair[0] : '');

// `field`: a settings.js field; `group`: the group it is shown in.
export function fieldHelp(field, group, lang) {
  if (FIELDS[field.id]) return pick(FIELDS[field.id], lang);
  if (group?.title.type) return pick(PER_FOOD[field.key], lang);
  return '';
}

export function groupHelp(group, lang) {
  return pick(group.title.type ? PER_FOOD.group : GROUPS[group.title.en], lang);
}

// For the check that nothing is left unexplained.
export const helpTables = { FIELDS, GROUPS, PER_FOOD };
