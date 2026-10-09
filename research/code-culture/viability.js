// Step 2 of docs/research/plan-codigo-cultural.md: is the model viable as the
// variation operator, and what does it know before any life?
//
// In `cdev`, per world (40 per family by default):
//   1. a life with the seed text records her diary (same life as 'current');
//   2. the model writes four judges:
//        zero-shot / zero-shot-blind : from the description alone
//        revise / revise-blind       : the seed text rewritten from that diary
//   3. each judge lives that same world from birth.
// Reported: valid texts, failures while running, seconds per call, survival
// against 'current' in the same worlds. Gate: ≥ 80 % valid, < 10 % of lives
// with failures while running.
//
//   node research/code-culture/viability.js [--model qwen3.6] [--worlds 40] [--jobs 16] [--tag v1]
// Resumable: every life and every call is kept (the calls in the archive).

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

import { SEED_SOURCE } from '../../src/learned/code-judge.js';
import { FOOD_FAMILIES } from '../adaptive-decision/foodworlds.js';
import { openArchive } from './archive.js';
import { rewrite, PROMPT_VERSION, SEED_BLIND } from './mutate.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const MODEL = opt('--model', 'qwen3.6');
const N = Number(opt('--worlds', 40));
const JOBS = Number(opt('--jobs', 16));
const TAG = opt('--tag', `v${PROMPT_VERSION}-${MODEL}`);
const GROUP = 'cdev';
const OUT = `research/results/code-culture/viability/${TAG}`;
const run = promisify(execFile);
const ARMS = ['zero-shot', 'zero-shot-blind', 'revise', 'revise-blind'];

mkdirSync(OUT, { recursive: true });
const worlds = [];
for (let i = 0; i < N; i++) for (const family of FOOD_FAMILIES) worlds.push({ family, i, id: `${family}-${i}` });

// A life, as its own process (battery.js --piece), kept in a file.
async function life(name, w, controller, sets) {
  const file = `${OUT}/${name}/${w.id}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  mkdirSync(`${OUT}/${name}`, { recursive: true });
  const piece = { domain: 'food', controller, family: w.family, i: w.i, group: GROUP, sets };
  await run('node', ['research/adaptive-decision/battery.js', '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  renameSync(`${file}.tmp`, file);
  return JSON.parse(readFileSync(file, 'utf8'));
}

async function pool(items, fn, jobs) {
  const todo = [...items];
  let done = 0;
  await Promise.all(Array.from({ length: jobs }, async () => {
    while (todo.length) {
      const it = todo.shift();
      await fn(it);
      done += 1;
      if (done % 30 === 0 || done === items.length) console.log(`  ${done}/${items.length}`);
    }
  }));
}

const codeSets = (source) => ({ 'CODE.enabled': 1, 'CODE.source': source });

console.log(`viability ${TAG}: ${worlds.length} worlds, model ${MODEL}`);
console.log('1. current and the seed text (diaries)');
await pool(worlds, async (w) => {
  await life('current', w, 'current', {});
  await life('seed', w, 'code', codeSets(SEED_SOURCE));
}, JOBS);

console.log('2. the model writes');
const archive = openArchive();
const textsFile = `${OUT}/texts.json`;
const texts = existsSync(textsFile) ? JSON.parse(readFileSync(textsFile, 'utf8')) : {};
let n = 0;
for (const w of worlds) {
  const seedLife = JSON.parse(readFileSync(`${OUT}/seed/${w.id}.json`, 'utf8'));
  for (const arm of ARMS) {
    const key = `${arm}/${w.id}`;
    if (texts[key]) continue;
    const blind = arm.endsWith('blind');
    const req = arm.startsWith('zero')
      ? { kind: 'zero-shot', blind }
      : { kind: 'revise', blind, parentText: blind ? SEED_BLIND : SEED_SOURCE, parentSource: SEED_SOURCE, diary: seedLife.diary ?? [] };
    // One seed per world: the same call in every rerun.
    const r = await rewrite(req, { model: MODEL, seed: 1000 + worlds.indexOf(w), archive });
    texts[key] = { ok: r.ok, failure: r.failure, ms: r.ms, why: r.why, text: r.text, source: r.ok ? r.source : null, key: r.key };
    n += 1;
    if (n % 10 === 0) { writeFileSync(textsFile, JSON.stringify(texts)); console.log(`  ${n} calls (${Object.keys(texts).length}/${worlds.length * ARMS.length})`); }
  }
}
writeFileSync(textsFile, JSON.stringify(texts));

console.log('3. each judge lives its world');
const lives = [];
for (const w of worlds) for (const arm of ARMS) if (texts[`${arm}/${w.id}`].ok) lives.push([arm, w]);
await pool(lives, ([arm, w]) => life(arm, w, 'code', codeSets(texts[`${arm}/${w.id}`].source)), JOBS);
console.log('done; analyse with research/code-culture/viability-analyze.js');
