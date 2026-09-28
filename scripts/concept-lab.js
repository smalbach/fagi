// Phase 6's bench (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.8): does she
// classify, and use rightly, things she never touched?
//
// Each life is the whole organism with things on the map. At the end:
//   classify   over every look whose deciding trait is one the map uses, the
//              ones she never touched: share she believes rightly (no belief
//              counts as wrong)
//   precision  of those she has a belief about, share right
//   coverage   share she has a belief about
//   hits, misses  predictions for new kinds scored when she lived them
//   concepts   live concepts at the end; retired, how many were retired
//   stings     times something stung her
//   sips       nibbles of sap; novelSips, sips at a kind she had never touched
//   late…      the kinds that sprout later (CONCEPT.lateAt), never on the map before:
//              lateSeen, how many she saw; lateRight, share she believed rightly the
//              moment she first saw them (no belief counts as wrong); lateBelieved,
//              share she had a belief about; lateStings, stings from them;
//              lateSapUsed, sap kinds among them she first met by sipping
//              (using it before examining it)
//   lifetime, alive, cause
// With --turn, when the late kinds sprout the things' chemistry turns over:
// another trait decides from then on, for the old things too, and what she
// believed stops being true (concepts must be retired or remade).
// Compared: generalizing or not (CONCEPT.generalize), and the family of
// things: the ones used while tuning (shape or texture decides) or color.
//
//   node scripts/concept-lab.js [--lives 48] [--seed 1000] [--map 1] [--duration 2400]
//                               [--dims shape,texture] [--set BLOCK.key=V ...] [--json file]

import { writeFileSync } from 'node:fs';
import { createWorld, nestOf } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { enableOrganism } from '../src/organism.js';
import * as CONFIG from '../src/config.js';
import { THING_TRAITS, affordanceOf, lookKey, createThingChemistry } from '../src/things.js';
import { believe, liveConcepts } from '../src/concepts.js';
import { registerSpecies } from '../src/chemistry.js';
import { rng, withRng } from './batch/random.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : dflt);

const CATALOGUE = [];
for (const color of THING_TRAITS.color) for (const shape of THING_TRAITS.shape) for (const texture of THING_TRAITS.texture) CATALOGUE.push({ color, shape, texture });

export function classification(fagi, chem) {
  if (!chem) return { classify: null, precision: null, coverage: null };
  const concepts = fagi.brain.concepts;
  let n = 0; let right = 0; let believed = 0; let believedRight = 0;
  for (const look of CATALOGUE) {
    // Only looks whose deciding trait takes a value the map has: the rest are
    // something no thing she could meet ever showed her.
    if (!chem.values.includes(look[chem.dim])) continue;
    const kind = concepts?.kinds[lookKey(look)];
    if (kind && (kind.touch || kind.mouth)) continue;
    n += 1;
    const b = concepts ? believe(concepts, look) : { aff: null };
    if (!b.aff) continue;
    believed += 1;
    if (b.aff === affordanceOf(chem, look)) { right += 1; believedRight += 1; }
  }
  return { classify: n ? right / n : 0, precision: believed ? believedRight / believed : null, coverage: n ? believed / n : 0 };
}

export function runThingLife({ fagiSeed, mapSeed, seconds, turn = false, extra = false, dt = 0.05 }) {
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(fagiSeed * 7919);
  const fagiRng = rng(fagiSeed);
  const fagi = withRng(fagiRng, () => createFagi());
  let last = 0; let stings = 0; let sips = 0; let novelSips = 0;
  let lateStings = 0; let lateSapUsed = 0; let stressed = 0;
  const touched = new Set();
  const judged = new Map();   // late kind -> was her belief right when she first saw it?
  const steps = Math.ceil(seconds / dt);
  for (let s = 0; s < steps && fagi.alive; s++) {
    if (turn && !world.turned && world.thingChemistry && world.time + dt >= CONFIG.CONCEPT.lateAt) {
      const dims = Object.keys(THING_TRAITS).filter((d) => d !== world.thingChemistry.dim && d !== 'color');
      world.thingChemistry = withRng(worldRng, () => createThingChemistry(Math.random, dims.length ? dims : ['color']));
      world.turned = true;
    }
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
    if ((fagi.thermalStress ?? 0) > 0) stressed += dt;
    const late = world.lateKinds ?? [];
    const kinds = fagi.brain.concepts?.kinds;
    for (const key of late) {
      if (judged.has(key) || !kinds?.[key]) continue;
      const look = kinds[key].look;
      const b = believe(fagi.brain.concepts, look);
      judged.set(key, { believed: Boolean(b.aff), right: b.aff === affordanceOf(world.thingChemistry, look) });
    }
    const t = fagi.lastThing;
    if (!t || t.n === last) continue;
    last = t.n;
    const isLate = late.includes(t.key);
    if (t.felt === 'pain') { stings += 1; if (isLate) lateStings += 1; }
    if (t.felt === 'sap') {
      sips += 1;
      if (!touched.has(t.key)) { novelSips += 1; if (isLate && t.via === 'sip') lateSapUsed += 1; }
    }
    touched.add(t.key);
  }
  const concepts = fagi.brain.concepts;
  const out = {
    ...classification(fagi, world.thingChemistry),
    dim: world.thingChemistry?.dim ?? null,
    hits: concepts?.tested.hits ?? 0,
    misses: concepts?.tested.misses ?? 0,
    concepts: liveConcepts(concepts).length,
    retired: concepts?.list.filter((c) => c.retired && c.why === 'fails').length ?? 0,
    revised: concepts?.list.filter((c) => c.retired && c.why === 'revised').length ?? 0,
    surprises: concepts?.surprises ?? 0,
    kindsKnown: Object.values(concepts?.kinds ?? {}).filter((k) => k.possible.length === 1).length,
    stings, sips, novelSips,
    lateSeen: judged.size,
    lateRight: judged.size ? [...judged.values()].filter((j) => j.right).length / judged.size : null,
    lateBelieved: judged.size ? [...judged.values()].filter((j) => j.believed).length / judged.size : null,
    lateStings, lateSapUsed,
    lifetime: Math.round(Math.min(fagi.age, seconds)),
    alive: fagi.alive ? 1 : 0,
    cause: fagi.alive ? null : fagi.cause,
  };
  // Measured after the concepts protocol was frozen: only when asked, so its
  // rows stay as they were.
  if (extra) Object.assign(out, { regrow: concepts?.regrow ?? null, lined: nestOf(world)?.lining?.length ?? 0, stressed: Math.round(stressed), cold: fagi.cause === 'cold' ? 1 : 0 });
  registerSpecies([]);
  return out;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const LIVES = Number(opt('lives', 48));
  const SEED = Number(opt('seed', 1000));
  const MAP = Number(opt('map', 1));
  const SECONDS = Number(opt('duration', 2400));
  enableOrganism();
  CONFIG.MAPGEN.species = 6;
  const dims = opt('dims', null);
  if (dims) CONFIG.CONCEPT.dims = dims.split(',');
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--set') continue;
    const [path, value] = args[i + 1].split('=');
    const [block, key] = path.split('.');
    CONFIG[block][key] = Number.isNaN(Number(value)) ? value : Number(value);
  }
  const rows = [];
  const turn = args.includes('--turn');
  for (let i = 0; i < LIVES; i++) rows.push({ i, ...runThingLife({ fagiSeed: SEED + i, mapSeed: MAP + 13 * i, seconds: SECONDS, turn, extra: true }) });
  const mean = (k) => {
    const v = rows.map((r) => r[k]).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
  };
  const se = (k) => {
    const v = rows.map((r) => r[k]).filter((x) => x != null);
    const m = mean(k);
    return v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1) / v.length) : NaN;
  };
  console.log(`${LIVES} lives, dims ${CONFIG.CONCEPT.dims.join(',')}, generalize ${CONFIG.CONCEPT.generalize}, surprise ${CONFIG.CONCEPT.surprise}${turn ? ', turns over' : ''}`);
  for (const k of ['classify', 'precision', 'coverage', 'hits', 'misses', 'concepts', 'retired', 'revised', 'surprises', 'kindsKnown', 'stings', 'sips', 'novelSips', 'regrow', 'lined', 'stressed', 'cold', 'lateSeen', 'lateRight', 'lateBelieved', 'lateStings', 'lateSapUsed', 'lifetime', 'alive']) {
    console.log(`  ${k.padEnd(11)} ${mean(k).toFixed(3)} ± ${se(k).toFixed(3)}`);
  }
  const causes = {};
  for (const r of rows) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  console.log('  deaths     ', JSON.stringify(causes));
  const json = opt('json', null);
  if (json) writeFileSync(json, JSON.stringify(rows));
}
