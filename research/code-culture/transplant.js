// Transplant (docs/research/plan-codigo-cultural.md): the text a lineage ends
// with, as the judge of Fagis born in worlds it never lived, against
// 'current' in the same worlds.
//
//   node research/code-culture/transplant.js --run <lineages tag> [--from 400] [--worlds 120] [--gen g] [--jobs 16]
// Picks, per lineage, the text most Fagis carry in the last generation.

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { promisify } from 'node:util';
import { FOOD_FAMILIES } from '../adaptive-decision/foodworlds.js';
import { blindWrap } from './mutate.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const RUN = opt('--run', 'code-tournament');
const FROM = Number(opt('--from', 400));
const N = Number(opt('--worlds', 120));
const JOBS = Number(opt('--jobs', 16));
const SRC = `research/results/code-culture/lineages/${RUN}`;
const OUT = `research/results/code-culture/transplant`;
const run = promisify(execFile);

const texts = JSON.parse(readFileSync(`${SRC}/texts.json`, 'utf8'));
const sourceOf = (id) => (BLIND ? blindWrap(texts[id]) : texts[id]);
const gens = readdirSync(SRC).map((f) => f.match(/^r(\d+)-g(\d+)\.json$/)).filter(Boolean);
// Only lineages that reached the last generation (a run may still be going).
const RUN_INFO = JSON.parse(readFileSync(`${SRC}/run.json`, 'utf8'));
const BLIND = RUN_INFO.blind ?? false;
const lastG = argv.includes('--gen') ? Number(opt('--gen')) : (RUN_INFO.until ?? RUN_INFO.G) - 1;
const picks = {};
for (const r of new Set(gens.filter((m) => Number(m[2]) === lastG).map((m) => Number(m[1])))) {
  const { lives } = JSON.parse(readFileSync(`${SRC}/r${r}-g${lastG}.json`, 'utf8'));
  const count = {};
  for (const l of lives) count[l.text] = (count[l.text] ?? 0) + 1;
  picks[`${RUN}-r${r}`] = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}

async function life(name, i, controller, sets) {
  const file = `${OUT}/${name}/${i}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  mkdirSync(`${OUT}/${name}`, { recursive: true });
  const piece = { domain: 'food', controller, family: FOOD_FAMILIES[i % 3], i, group: 'cdev', sets };
  await run('node', ['research/adaptive-decision/battery.js', '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  renameSync(`${file}.tmp`, file);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const jobs = [];
for (let i = FROM; i < FROM + N; i++) {
  jobs.push(() => life('current', i, 'current', {}));
  for (const [name, id] of Object.entries(picks)) jobs.push(() => life(`${name}-${id}`, i, 'code', { 'CODE.enabled': 1, 'CODE.source': sourceOf(id) }));
}
await Promise.all(Array.from({ length: JOBS }, async () => { while (jobs.length) await jobs.shift()(); }));

let seed = 4242;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ci = (d) => { const bs = []; for (let b = 0; b < 4000; b++) { let t = 0; for (let i = 0; i < d.length; i++) t += d[Math.floor(rnd() * d.length)]; bs.push(t / d.length); } bs.sort((a, b) => a - b); return `${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(3)} [${bs[100].toFixed(3)}, ${bs[3899].toFixed(3)}]`; };
const cur = (i) => JSON.parse(readFileSync(`${OUT}/current/${i}.json`, 'utf8')).survival;
const ids = Array.from({ length: N }, (_, j) => FROM + j);
console.log(`current: ${(ids.reduce((a, i) => a + cur(i), 0) / N).toFixed(3)}`);
for (const [name, id] of Object.entries(picks)) {
  const s = (i) => JSON.parse(readFileSync(`${OUT}/${name}-${id}/${i}.json`, 'utf8')).survival;
  console.log(`${name} (${id}): ${(ids.reduce((a, i) => a + s(i), 0) / N).toFixed(3)}, − current ${ci(ids.map((i) => s(i) - cur(i)))}`);
}
