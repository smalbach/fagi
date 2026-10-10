#!/usr/bin/env node
// Lineages with selection: does what mothers learned, passed on through the
// behavioral genome (src/program/genome.js), raise their daughters' survival?
//
// One population: N lives per generation, G generations, each life alone in
// its own world (map seed 4000 + seed, one fruit every TREE.interval s). In
// generation 0 every life is born; afterwards, by arm:
//   born        no learning, no inheritance
//   learn       learns in life (PROGRAM.learn), nothing inherited
//   inherit     learns, and each daughter carries the program genome of a
//               mother drawn from the survivors of the previous generation
//               (from the four longest-lived if none survived)
//   inheritAny  as inherit, the mother drawn from all, dead or alive
//   inheritStrip  as inherit, minus the revisions that repair the damage
//               (ids starting "<damaged line>-before-"): is the gain the
//               repair itself, or just carrying something?
//   inheritGated  as inherit, passing on only revisions whose evidence
//               cleared --gate standard errors (improvement / its error)
//   oracle      no learning; the damaged program with the designer's repair
//               (--oracle, e.g. dusk-before-pursue) put in as born
// World slots (seeds) are the same in every arm, so lives pair across arms.
//
//   node scripts/lineage-selection.js --arm inherit --pop 0 [--n 16] [--g 6]
//     [--secs 7200] [--interval 575] [--seed0 5000] [--sabotage dusk,...]
//     [--profile scripts/profiles/repair.json] [--set PROGRAM.judge=1]... [--gate 4]
//     [--oracle dusk-before-pursue] [--evidence]
// A profile sets the world (and the learner); --interval and --set go over it.
// Prints one JSON array: a row per life.

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf, line } from '../src/program.js';
import { applyGenome } from '../src/generations.js';
import { captureProgramGenome, filterProgramGenome } from '../src/program/genome.js';
import { rng, withRng } from './batch/random.js';
import { profile, applySets } from './batch/args.js';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const ARM = arg('arm', 'born');
const POP = Number(arg('pop', 0));
const N = Number(arg('n', 16));
const G = Number(arg('g', 6));
const SECS = Number(arg('secs', 7200));
const SEED0 = Number(arg('seed0', 5000));
const SABOTAGE = arg('sabotage', '') ? arg('sabotage').split(',') : [];
const GATE = Number(arg('gate', 0));
const ORACLE = arg('oracle', '');
const EVIDENCE = argv.includes('--evidence');
const DT = 0.05;
const ARMS = ['born', 'learn', 'inherit', 'inheritAny', 'inheritStrip', 'inheritGated', 'oracle'];
if (!ARMS.includes(ARM)) throw new Error(`unknown arm ${ARM}`);

enableOrganism();
CONFIG.TREE.interval = 575;
if (arg('profile')) applySets(profile(arg('profile')));
if (arg('interval')) CONFIG.TREE.interval = Number(arg('interval'));
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--set') continue;
  const [path, v] = argv[i + 1].split('=');
  const [group, key] = path.split('.');
  if (!(key in CONFIG[group])) throw new Error(`unknown parameter ${path}`);
  CONFIG[group][key] = Number.isNaN(Number(v)) ? v : Number(v);
}
if (ARM === 'inheritGated' && !(GATE > 0)) throw new Error('inheritGated needs --gate');
if (ARM === 'oracle' && !ORACLE) throw new Error('oracle needs --oracle');
const learn = ARM !== 'born' && ARM !== 'oracle';
const inherit = ARM.startsWith('inherit');
const survivorsOnly = ARM !== 'inheritAny';
const zOf = (e) => (e.standardError > 0 ? e.improvement / e.standardError : Infinity);
const repairs = (change) => SABOTAGE.some((id) => change.rule.id.startsWith(`${id}-before-`));
const passOn = {
  inheritStrip: (g) => filterProgramGenome(g, (c) => !repairs(c)),
  inheritGated: (g) => filterProgramGenome(g, (c) => c.operation === 'retire' || zOf(c.evidence) >= GATE),
}[ARM] ?? ((g) => g);
// The designer's repair: the damaged line's behavior in front of another line.
function installOracle(p) {
  const [from, over] = ORACLE.split('-before-');
  const f = p.lines.find((l) => l.id === from);
  if (!f || !p.lines.some((l) => l.id === over)) throw new Error(`bad --oracle ${ORACLE}`);
  const rule = line(ORACLE, { tier: f.tier, do: f.do, source: 'born', learnedAt: 0, from, over });
  p.lines.splice(p.lines.findIndex((l) => l.id === over), 0, rule);
}
CONFIG.PROGRAM.watch = learn ? 1 : 0;
CONFIG.PROGRAM.learn = learn ? 1 : 0;

const pick = rng(777 + POP);
let parents = null;
const rows = [];
for (let g = 0; g < G; g++) {
  const gen = [];
  for (let i = 0; i < N; i++) {
    const seed = SEED0 + POP * 1000 + g * N + i;
    const world = withRng(rng(4000 + seed), () => { const w = createWorld(); generateMap(w); return w; });
    const worldRng = rng(seed * 7919);
    const herRng = rng(seed);
    const fagi = withRng(herRng, () => createFagi());
    let mother = null;
    if (inherit && parents) {
      const alive = parents.filter((p) => p.alive);
      const pool = survivorsOnly ? (alive.length ? alive : [...parents].sort((a, b) => b.lived - a.lived).slice(0, 4)) : parents;
      mother = pool[Math.floor(pick() * pool.length)];
      applyGenome(fagi, { ...(fagi.genome ?? { cues: {} }), program: passOn(mother.genome) });
    } else if (SABOTAGE.length) {
      const p = programOf(fagi);
      const moved = p.lines.filter((l) => SABOTAGE.includes(l.id));
      p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
    }
    if (ARM === 'oracle') installOracle(programOf(fagi));
    for (let s = 0; s < SECS / DT && fagi.alive; s++) {
      withRng(worldRng, () => stepWorld(world, DT));
      withRng(herRng, () => updateFagi(fagi, world, DT));
    }
    const lines = programOf(fagi).lines;
    const genome = learn ? captureProgramGenome(fagi) : null;
    gen.push({ alive: fagi.alive ? 1 : 0, lived: Math.min(fagi.age, SECS), genome });
    rows.push({
      arm: ARM, pop: POP, g, i, seed, mother: mother ? parents.indexOf(mother) : null,
      alive: fagi.alive ? 1 : 0, lived: Math.round(Math.min(fagi.age, SECS)), eaten: fagi.eaten ?? 0,
      cause: fagi.alive ? 'alive' : fagi.cause,
      journal: genome ? genome.changes.length : 0,
      inherited: lines.filter((l) => l.source === 'inherited' && !l.retired).map((l) => l.id),
      own: lines.filter((l) => l.source === 'self' && !l.retired).map((l) => l.id),
      ...(EVIDENCE && genome ? { revisions: genome.changes.map((c) => ({
        id: c.rule.id, op: c.operation, at: Math.round(c.evidence.at), z: Math.round(zOf(c.evidence) * 100) / 100,
        imp: Math.round(c.evidence.improvement * 1e4) / 1e4, nx: c.evidence.baselineCount, ny: c.evidence.alternativeCount,
        asked: c.evidence.comparisons })) } : {}),
    });
  }
  parents = gen;
}
console.log(JSON.stringify(rows));
