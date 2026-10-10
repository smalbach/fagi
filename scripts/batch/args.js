// Command-line arguments and parameter overrides (--profile, --set).

import * as CONFIG from '../../src/config.js';
import { readFileSync } from 'node:fs';

export function args(argv) {
  const o = { mapSeed: 1, runs: 10, duration: 600, dt: 0.05, seed0: 1000, worldVaries: false, check: false, json: null, cell: 80, sets: [], block: null, rock: 30, chain: false, habitsIn: null, habitsOut: null, colony: 1, generations: 0, switchAt: null, jobs: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--map-seed') o.mapSeed = Number(next());
    else if (a === '--runs') o.runs = Number(next());
    else if (a === '--duration') o.duration = Number(next());
    else if (a === '--dt') o.dt = Number(next());
    else if (a === '--seed') o.seed0 = Number(next());
    else if (a === '--world-varies') o.worldVaries = true;
    else if (a === '--check') o.check = true;
    else if (a === '--json') o.json = next();
    else if (a === '--cell') o.cell = Number(next());
    else if (a === '--block') o.block = Number(next());
    else if (a === '--rock') o.rock = Number(next());
    else if (a === '--colony') o.colony = Number(next());
    else if (a === '--generations') o.generations = Number(next());
    else if (a === '--switch-at') o.switchAt = Number(next());
    else if (a === '--chain') o.chain = true;
    else if (a === '--habits-in') o.habitsIn = next();
    else if (a === '--habits-out') o.habitsOut = next();
    else if (a === '--organism') o.organism = true;
    else if (a === '--tyrrell') o.tyrrell = true;
    else if (a === '--jobs') o.jobs = Math.max(1, Number(next()));
    else if (a === '--profile') o.sets.push(...profile(next()));
    else if (a === '--set') o.sets.push(assignment(next()));
    else if (a === '-h' || a === '--help') { console.log(help()); process.exit(0); }
    else { console.error(`unknown argument: ${a}\n\n${help()}`); process.exit(1); }
  }
  return o;
}

function help() {
  return `usage: node scripts/batch.js [options]
  --map-seed N     map seed (same in every run)                     [1]
  --runs N         how many Fagis                                   [10]
  --duration S     maximum simulated seconds per run                [600]
  --dt S           simulation step                                  [0.05]
  --seed N         seed of the first Fagi (then +1, +2...)          [1000]
  --world-varies   wind and fruit also change from run to run
  --check          repeats the first run and requires the same result
  --cell PX        heat-map cell size                               [80]
  --profile FILE   JSON with parameters to change: {"HUNGER": {"rate": 0.1}}
  --set A.b=V      changes a single parameter (can be repeated)
  --block S        after S seconds puts a wall of rocks on the nest-tree line
                   and on the nest-water line, and compares before and after
  --rock PX        radius of each rock in the wall                  [30]
  --colony N       N sisters per run, sharing the map and the nest; each is
                   measured as a run, and the report adds how rules travelled
  --generations G  lineages of G generations of colonies (--colony ants, 4 if
                   not given); --runs is the number of lineages. Newborns
                   inherit culture and/or genes (GEN.culture, GEN.genes)
  --switch-at G    generation at which the chemistry turns over      [G/2]
  --chain          each Fagi starts with the habits the previous one ended with
  --jobs N         runs (or lineages) at once, one per core; the results are
                   the same as one after another (not with --chain)    [1]
  --tyrrell        measures Tyrrell's requirements for action selection
                   (lives one after another, as with "Recover what it learned")
  --habits-in FILE the habits the first Fagi starts with (JSON from --habits-out)
  --habits-out FILE saves the habits the last Fagi ended with
  --organism       day and night, body temperature, sex and sleep
                   (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md); --set can still
                   switch a part off, e.g. --set SLEEP.consolidate=0
  --json FILE      saves all the data to a file`;
}

// Parameters are changed on the config.js objects, which are what the whole
// simulation reads: that way a profile is tried without touching the file.
export function profile(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const lower = (routeOf, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, w] of Object.entries(v)) lower([...routeOf, k], w);
    else if (!routeOf.at(-1).startsWith('_')) out.push([routeOf, v]);   // "_note": comments
  };
  for (const [k, v] of Object.entries(data)) if (!k.startsWith('_')) lower([k], v);
  return out;
}

function assignment(txt) {
  const [routeOf, value] = txt.split('=');
  // A bare word is a string: --set SOCIAL.format=verdict.
  let v;
  try { v = JSON.parse(value); } catch { v = value; }
  return [routeOf.split('.'), v];
}

export function applySets(sets) {
  for (const [routeOf, v] of sets) {
    let o = CONFIG;
    for (const k of routeOf.slice(0, -1)) {
      o = o[k];
      if (o == null) throw new Error(`unknown parameter: ${routeOf.join('.')}`);
    }
    if (!(routeOf.at(-1) in o)) throw new Error(`unknown parameter: ${routeOf.join('.')}`);
    o[routeOf.at(-1)] = v;
  }
}
