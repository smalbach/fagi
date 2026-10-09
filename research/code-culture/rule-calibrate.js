// Step 3c calibration (before any protocol): in worlds where one value of a
// trait poisons, fixed per lineage (battery.js `chem`), how far apart are
// 'current', the caution text and an oracle that knows the rule? The
// decisive experiment only makes sense if the oracle's edge over caution is
// large: that edge is what a lineage can only get from what it lived.
//
//   node research/code-culture/rule-calibrate.js [--worlds 30] [--set '{"HEALTH.poison":40}'] [--tag name]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { promisify } from 'node:util';
import { createChemistry } from '../../src/chemistry.js';
import { CAUTION_SOURCE } from '../../src/learned/code-judge.js';
import { rng } from '../../scripts/batch/random.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const N = Number(opt('--worlds', 30));
const SETS = JSON.parse(opt('--set', '{}'));
const TAG = opt('--tag', 'base');
const OUT = `research/results/code-culture/rule-calibrate/${TAG}`;
const run = promisify(execFile);

// The lineage rules: four, two on color and two on shape.
export const RULES = [0, 1, 2, 3].map((r) => {
  const dim = r % 2 ? 'shape' : 'color';
  const seed = 777001 + r;
  const chem = createChemistry(rng(seed), { family: 'one', dim });
  const [poison] = chem.rules.poison[0][0].split(':').slice(1);
  return { dim, seed, poison };
});

export const oracleSource = ({ dim, poison }) => CAUTION_SOURCE
  .replace('function ground(obs, look, diary) {', `function ground(obs, look, diary) {\n  if (look.${dim} === '${poison}') return 'leave';`)
  .replace('function wants(obs, look, diary) {', `function wants(obs, look, diary) {\n  if (look.${dim} === '${poison}') return false;`);

async function life(name, i, rule, controller, sets) {
  const file = `${OUT}/${name}/${i}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  mkdirSync(`${OUT}/${name}`, { recursive: true });
  const piece = { domain: 'food', controller, family: i % 2 ? 'novel' : 'stable', i, group: 'cdev', sets: { ...SETS, ...sets }, chem: { dim: rule.dim, seed: rule.seed } };
  await run('node', ['research/adaptive-decision/battery.js', '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  renameSync(`${file}.tmp`, file);
  return JSON.parse(readFileSync(file, 'utf8'));
}

if (process.argv[1].endsWith('rule-calibrate.js')) {
  const jobs = [];
  RULES.forEach((rule, r) => {
    for (let j = 0; j < N; j++) {
      const i = 8000 + r * 1000 + j;
      jobs.push(() => life(`r${r}-current`, i, rule, 'current', {}));
      jobs.push(() => life(`r${r}-caution`, i, rule, 'code', { 'CODE.enabled': 1, 'CODE.source': CAUTION_SOURCE }));
      jobs.push(() => life(`r${r}-oracle`, i, rule, 'code', { 'CODE.enabled': 1, 'CODE.source': oracleSource(rule) }));
    }
  });
  await Promise.all(Array.from({ length: 16 }, async () => { while (jobs.length) await jobs.shift()(); }));
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  for (const [r, rule] of RULES.entries()) {
    const get = (n, k) => Array.from({ length: N }, (_, j) => JSON.parse(readFileSync(`${OUT}/r${r}-${n}/${8000 + r * 1000 + j}.json`, 'utf8'))[k]);
    const row = ['current', 'caution', 'oracle'].map((n) => `${n} ${mean(get(n, 'survival')).toFixed(3)} (alive ${mean(get(n, 'alive')).toFixed(2)}, ${String(get(n, 'cause').filter(Boolean).join(',')).slice(0, 60)})`);
    console.log(`rule ${r} ${rule.dim}=${rule.poison}: ${row.join(' | ')}`);
  }
}
