// Phase 2's exit test (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §15, fase 2):
// does either sex win in every scenario? The same life twice, once female and
// once male (same map, same random stream), over a battery of worlds. Nothing
// here decides anything: it runs the organism and compares.
//
//   node scripts/sex-battery.js [--lives 60] [--jobs 12] [--out research/results/sex]
//
// Resumable like research/organism/run.js: every piece is its own process and
// file, and a rerun skips what is done. Then it writes report.md.
//
// A piece alone: node scripts/sex-battery.js --piece <scenario> <sex> <from> <to> <file>

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { runLife } from '../research/organism/life.js';
import { mean, bootstrapCI } from '../research/stats.js';

// Each scenario pushes on a different part of the body: cold and heat on
// insulation, thirst and distance on speed, famine on metabolism and reserves.
const SCENARIOS = {
  temperate: {},
  cold: { 'CYCLE.mean': 13 },
  hot: { 'CYCLE.mean': 31 },
  dry: { 'THIRST.rate': 0.7 },
  famine: { 'HUNGER.rate': 0.12 },
  far: { 'MAPGEN.speciesMinDistance': 330, 'MAPGEN.speciesMaxDistance': 480 },
  shift: {},
};
const SEXES = ['female', 'male'];
const SECONDS = 2400;
const SHIFT_AT = 1200;
const SPECIES = 6;
// Seeds used by nothing else (development 1000-1047 and 5000-5047, the
// organism evaluation 9000-9119 and 9500-9511).
const SEED = 14000;
const mapSeed = (i) => 400000 + 23 * i;
const OUTCOMES = ['lifetime', 'alive', 'safe', 'stressed', 'dose', 'judgment', 'helpful'];
// Which direction is better for each outcome.
const BETTER = { lifetime: 1, alive: 1, safe: 1, stressed: -1, dose: -1, judgment: 1, helpful: 1 };

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, scenario, sex, from, to, file] = argv;
  enableOrganism();
  CONFIG.MAPGEN.species = SPECIES;
  for (const [path, value] of Object.entries(SCENARIOS[scenario])) {
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
  const rows = [];
  for (let i = Number(from); i < Number(to); i++) {
    rows.push({ i, ...runLife({ fagiSeed: SEED + i, mapSeed: mapSeed(i), seconds: SECONDS, shiftAt: scenario === 'shift' ? SHIFT_AT : null, sex }) });
  }
  writeFileSync(file, JSON.stringify(rows));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 12));
const OUT = opt('--out', 'research/results/sex');
const LIVES = Number(opt('--lives', 60));
const CHUNK = 10;
const self = fileURLToPath(import.meta.url);
const part = (sc, sex, from) => `${OUT}/parts/${sc}-${sex}-${from}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
for (let from = 0; from < LIVES; from += CHUNK) {
  for (const sc of Object.keys(SCENARIOS)) {
    for (const sex of SEXES) {
      if (!existsSync(part(sc, sex, from))) todo.push([sc, sex, from, Math.min(LIVES, from + CHUNK)]);
    }
  }
}
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [sc, sex, from, to] = todo.shift();
    const file = part(sc, sex, from);
    await run('node', [self, '--piece', sc, sex, String(from), String(to), `${file}.tmp`], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${sc} ${sex} ${from}-${to} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));

// --- report -------------------------------------------------------------------

const data = {};
for (const f of readdirSync(`${OUT}/parts`).filter((n) => n.endsWith('.json'))) {
  const [sc, sex] = f.split('-');
  for (const row of JSON.parse(readFileSync(`${OUT}/parts/${f}`, 'utf8'))) ((data[sc] ??= {})[sex] ??= []).push(row);
}
const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const lines = [];
const say = (s = '') => lines.push(s);
say('# Sex battery: does either sex win everywhere?');
say();
say(`Produced by \`node scripts/sex-battery.js\`. ${LIVES} lives per scenario, each lived twice (female, male) on the same map and random stream; whole organism, ${SPECIES} wild species, ${SECONDS} s. Cells: female − male, paired, with its 95% bootstrap interval; **bold** when the interval excludes 0, with the sex it favours. Exploratory: no correction for multiplicity.`);
say();
say(`| scenario | ${OUTCOMES.join(' | ')} | deaths (female / male) |`);
say(`|---|${OUTCOMES.map(() => '---').join('|')}|---|`);
const wins = { female: new Set(), male: new Set() };
for (const sc of Object.keys(SCENARIOS)) {
  const F = (data[sc]?.female ?? []).sort((a, b) => a.i - b.i);
  const M = new Map((data[sc]?.male ?? []).map((r) => [r.i, r]));
  const cells = OUTCOMES.map((o) => {
    const d = F.filter((r) => M.has(r.i)).map((r) => r[o] - M.get(r.i)[o]);
    const [lo, hi] = bootstrapCI(d, { seed: 3 });
    const m = mean(d);
    const text = `${f3(m)} [${f3(lo)}, ${f3(hi)}]`;
    if (lo > 0 || hi < 0) {
      const who = Math.sign(m) * BETTER[o] > 0 ? 'female' : 'male';
      wins[who].add(`${sc}:${o}`);
      return `**${text} ${who === 'female' ? '♀' : '♂'}**`;
    }
    return text;
  });
  const causes = (rows) => {
    const c = {};
    for (const r of rows) if (r.cause) c[r.cause] = (c[r.cause] ?? 0) + 1;
    return Object.entries(c).map(([k, n]) => `${k} ${n}`).join(', ') || '–';
  };
  say(`| ${sc} | ${cells.join(' | ')} | ${causes(F)} / ${causes([...M.values()])} |`);
}
say();
say('Means per sex:');
say();
say(`| scenario | sex | ${OUTCOMES.join(' | ')} |`);
say(`|---|---|${OUTCOMES.map(() => '---').join('|')}|`);
for (const sc of Object.keys(SCENARIOS)) {
  for (const sex of SEXES) {
    const rows = data[sc]?.[sex] ?? [];
    say(`| ${sc} | ${sex} | ${OUTCOMES.map((o) => f3(mean(rows.map((r) => r[o])))).join(' | ')} |`);
  }
}
say();
say(`Where each sex is better (interval excludes 0): female ${wins.female.size} (${[...wins.female].join(', ') || 'none'}); male ${wins.male.size} (${[...wins.male].join(', ') || 'none'}).`);
const report = lines.join('\n');
writeFileSync(`${OUT}/report.md`, report);
console.log(report);
