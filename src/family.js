// Family: who is whose, read from the lineage the colony keeps (reproduction.js,
// world.lineage: id -> { mother, father, generation, sex, name, bornAt }) and
// from the individuals themselves. For the panels: nothing here decides.
//
// Works the same live and in a replay (recorder 'people' events rebuild the
// lineage there).

import { fullName } from './names.js';

// Every individual on screen: the one followed and the colony, once each.
export function everyone(world, fagi) {
  const list = [];
  const seen = new Set();
  for (const f of [fagi, ...(world.colony?.ants ?? [])]) {
    if (!f || seen.has(f)) continue;
    seen.add(f);
    list.push(f);
  }
  return list;
}

// The individual with this id: the live object if she is on screen.
export function findById(world, fagi, id) {
  if (id == null) return null;
  return everyone(world, fagi).find((f) => (f.id ?? 1) === id) ?? null;
}

// What is known of someone by id, alive, dead or never on screen (an ancestor).
export function personInfo(world, fagi, id) {
  if (id == null) return null;
  const live = findById(world, fagi, id);
  const l = world.lineage?.[id] ?? null;
  if (!live && !l) return { id, label: `#${id}`, unknown: true };
  const name = live?.name ?? l?.name ?? null;
  return {
    id,
    name,
    label: fullName({ id, name }),
    sex: live?.sex ?? l?.sex ?? null,
    alive: live ? live.alive !== false : null,   // null: not on screen, unknown
    generation: live?.generation ?? l?.generation ?? 0,
    stage: live?.lifeStage ?? null,
    bornAt: l?.bornAt ?? null,
    mother: l?.mother ?? null,
    father: l?.father ?? null,
  };
}

// Ids of everyone the lineage or the screen knows.
function allIds(world, fagi) {
  const ids = new Set(Object.keys(world.lineage ?? {}).map(Number));
  for (const f of everyone(world, fagi)) if (f.id != null) ids.add(f.id);
  return [...ids];
}

// Her whole family, one generation up and two down, plus her siblings.
export function familyOf(world, fagi, id) {
  const me = personInfo(world, fagi, id);
  if (!me) return null;
  const info = (x) => (x == null ? null : personInfo(world, fagi, x));
  const mother = info(me.mother);
  const father = info(me.father);
  const grandparents = [
    info(father?.father), info(father?.mother), info(mother?.father), info(mother?.mother),
  ];
  const ids = allIds(world, fagi);
  const lin = world.lineage ?? {};
  const childrenOf = (pid) => ids.filter((x) => lin[x] && (lin[x].mother === pid || lin[x].father === pid));
  const children = childrenOf(id).map(info);
  const grandchildren = children.flatMap((c) => childrenOf(c.id)).map(info);
  const siblings = me.mother == null && me.father == null ? [] : ids
    .filter((x) => x !== id && lin[x] && ((me.mother != null && lin[x].mother === me.mother) || (me.father != null && lin[x].father === me.father)))
    .map((x) => ({ ...info(x), full: lin[x].mother === me.mother && lin[x].father === me.father }));
  return { me, mother, father, grandparents, siblings, children, grandchildren };
}

// Ancestors up to `depth` generations, for the tree: [[parents], [grandparents], ...].
export function ancestry(world, fagi, id, depth = 3) {
  const rows = [];
  let level = [id];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const x of level) {
      const p = x == null ? null : personInfo(world, fagi, x);
      next.push(p?.father ?? null, p?.mother ?? null);
    }
    if (next.every((x) => x == null)) break;
    rows.push(next.map((x) => (x == null ? null : personInfo(world, fagi, x))));
    level = next;
  }
  return rows;
}
