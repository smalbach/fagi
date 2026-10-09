// Step 3 of docs/research/plan-codigo-cultural.md (development, format `code`):
// does anything useful evolve when a language model varies the code and
// survival selects it?
//
//   node research/code-culture/lineages.js --select tournament|random
//        [--lineages 3] [--generations 10] [--size 12] [--T 3] [--mutate 0.5]
//        [--model qwen3.6] [--blind] [--diary] [--until G'] [--rules] [--start caution]
//        [--set '{...}'] [--families stable,novel] [--start oracle] [--invert-at g]
//        [--format code|reasons|evidence] [--jobs 16] [--tag name]
//
// --blind: the model sees and writes the neutral vocabulary (mutate.js); the
// texts kept are the blind ones, run through the adapter (blindWrap).
// --diary: the model also sees the mother's diary (what she lived with that
// text), so what a life shows can reach the code (step 3b).
// --until G': stop after generation G'-1, with the worlds of a G-generation
// run (to compare with one that went further).
// --rules: every lineage lives under a rule of its own (step 3c, rule.js):
// one value of a trait poisons, the same in all its worlds, while the
// species change from world to world. --start caution: generation 0 is born
// with the caution text, not the seed. --set: settings for every life.
// Step 4: --start oracle: generation 0 knows its lineage's rule (rule.js);
// --invert-at g: from generation g the rule is upside down; --format: what a
// daughter's text is rewritten from, besides her mother's text: 'code'
// (nothing else), 'reasons' (her mother's reasons, carried down the line and
// replaced by the model's own when it rewrites), 'evidence' (her mother's
// diary). --format evidence is the same as --diary.
//
// Generation 0: every Fagi is born with the seed text (her innate judgment,
// the same lives as 'current'). Each daughter gets her mother's text (format
// `code`: a conclusion, nothing of why or of what the mother lived); with
// chance `mutate` the model rewrites it first, from the text alone. A
// rewrite that fails its shape keeps the mother's text.
//
// Mothers. `tournament`: for each daughter, T of the generation before drawn
// without replacement; the mother is the one that lived longest, then the
// one that ate most, then the first drawn. `random`: any of them (drift and
// variation, no selection). As in step 0 (seeded.js).
//
// Every life is a world of its own in `cdev` (world n = lineage·G·K +
// generation·K + k), the same n in every condition, and 'current' lives each
// world too, so every generation is compared with the innate judgment on the
// same worlds. Resumable: lives are files, calls are in the archive.

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

import { rng } from '../../scripts/batch/random.js';
import { SEED_SOURCE } from '../../src/learned/code-judge.js';
import { FOOD_FAMILIES } from '../adaptive-decision/foodworlds.js';
import { openArchive } from './archive.js';
import { rewrite, blindWrap, SEED_BLIND } from './mutate.js';
import { ruleOf, oracleSource, oracleWhy } from './rule.js';
import { CAUTION_SOURCE } from '../../src/learned/code-judge.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const SELECT = opt('--select', 'tournament');
const R = Number(opt('--lineages', 3));
const G = Number(opt('--generations', 10));
const K = Number(opt('--size', 12));
const T = Number(opt('--T', 3));
const MUTATE = Number(opt('--mutate', 0.5));
const MODEL = opt('--model', 'qwen3.6');
const JOBS = Number(opt('--jobs', 16));
const BLIND = argv.includes('--blind');
const DIARY = argv.includes('--diary') || opt('--format', '') === 'evidence';
const UNTIL = Number(opt('--until', G));
const RULES = argv.includes('--rules');
const START = opt('--start', 'seed');
const SETS = JSON.parse(opt('--set', '{}'));
const FAMILIES = opt('--families', FOOD_FAMILIES.join(',')).split(',');
const INVERT_AT = Number(opt('--invert-at', Infinity));
const FORMAT = opt('--format', argv.includes('--diary') ? 'evidence' : 'code');
const TAG = opt('--tag', `code-${BLIND ? 'blind-' : ''}${DIARY ? 'diary-' : ''}${SELECT}`);
const GROUP = 'cdev';
if (!['tournament', 'random'].includes(SELECT)) throw new Error(`unknown --select ${SELECT}`);

const OUT = `research/results/code-culture/lineages/${TAG}`;
const CURRENT = 'research/results/code-culture/lineages/current';
const run = promisify(execFile);

const worldOf = (r, g, k) => r * G * K + g * K + k;
const familyOf = (n) => FAMILIES[n % FAMILIES.length];
const better = (a, b) => (b.survival - a.survival) || ((b.eaten ?? 0) - (a.eaten ?? 0));

function mothers(prev, rnd) {
  return prev.map(() => {
    if (SELECT === 'random') return prev[Math.floor(rnd() * prev.length)];
    const pool = prev.slice();
    const drawn = [];
    for (let i = 0; i < T; i++) drawn.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return drawn.reduce((best, x) => (better(best, x) > 0 ? x : best));
  });
}

async function life(file, n, controller, sets, r, g = 0) {
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const piece = { domain: 'food', controller, family: familyOf(n), i: n, group: GROUP, sets: { ...SETS, ...sets }, chem: RULES ? { ...ruleOf(r), invert: g >= INVERT_AT } : null };
  await run('node', ['research/adaptive-decision/battery.js', '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  renameSync(`${file}.tmp`, file);
  return JSON.parse(readFileSync(file, 'utf8'));
}

async function pool(items, fn) {
  const todo = items.map((x, i) => [x, i]);
  const out = new Array(items.length);
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (todo.length) { const [x, i] = todo.shift(); out[i] = await fn(x); }
  }));
  return out;
}

const textId = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

mkdirSync(OUT, { recursive: true });
mkdirSync(CURRENT, { recursive: true });
writeFileSync(`${OUT}/run.json`, JSON.stringify({ select: SELECT, R, G, K, T, mutate: MUTATE, model: MODEL, group: GROUP, blind: BLIND, diary: DIARY, until: UNTIL, rules: RULES, start: START, sets: SETS, families: FAMILIES, invertAt: Number.isFinite(INVERT_AT) ? INVERT_AT : null, format: FORMAT }, null, 1));
const archive = openArchive();
const texts = existsSync(`${OUT}/texts.json`) ? JSON.parse(readFileSync(`${OUT}/texts.json`, 'utf8')) : {};
const keep = (s) => { const id = textId(s); texts[id] ??= s; return id; };
const seedId = keep(BLIND ? SEED_BLIND : START === 'caution' ? CAUTION_SOURCE : SEED_SOURCE);
const startOf = (r) => (START === 'oracle' ? keep(oracleSource(ruleOf(r))) : seedId);
// What the judge runs: the text itself, or the blind text in its adapter.
const sourceOf = (id) => (BLIND ? blindWrap(texts[id]) : texts[id]);

for (let r = 0; r < R; r++) {
  let prev = null;
  for (let g = 0; g < UNTIL; g++) {
    const genFile = `${OUT}/r${r}-g${g}.json`;
    let born;
    if (existsSync(genFile)) born = JSON.parse(readFileSync(genFile, 'utf8')).born;
    else {
      // Who is born with what: drawn from a stream of this lineage and generation.
      const rnd = rng(1_000_003 * (r + 1) + 7919 * g + (SELECT === 'random' ? 1 : 0));
      const moms = g === 0 ? null : mothers(prev, rnd);
      born = [];
      for (let k = 0; k < K; k++) {
        if (!moms) { born.push({ text: startOf(r), mother: null, rewritten: false, reasons: START === 'oracle' ? oracleWhy(ruleOf(r)) : null }); continue; }
        const mom = moms[k];
        const wants = rnd() < MUTATE;
        if (!wants) { born.push({ text: mom.text, mother: mom.k, rewritten: false, reasons: mom.reasons ?? null }); continue; }
        const seed = Number.parseInt(createHash('sha256').update(`${TAG}|${r}|${g}|${k}`).digest('hex').slice(0, 8), 16);
        const diary = DIARY ? JSON.parse(readFileSync(`${OUT}/r${r}-g${g - 1}-k${mom.k}.json`, 'utf8')).diary ?? [] : [];
        const res = await rewrite({ kind: 'revise', blind: BLIND, parentText: texts[mom.text], parentSource: sourceOf(mom.text), diary, reasons: FORMAT === 'reasons' ? mom.reasons : null },
          { model: MODEL, seed, archive });
        born.push({ text: res.ok ? keep(res.text) : mom.text, mother: mom.k, rewritten: res.ok, failure: res.failure, why: res.why, ms: res.ms, reasons: res.ok ? res.why : mom.reasons ?? null });
      }
      writeFileSync(`${OUT}/texts.json`, JSON.stringify(texts));
    }
    const lives = await pool(born.map((b, k) => ({ b, k })), async ({ b, k }) => {
      const n = worldOf(r, g, k);
      const sets = { 'CODE.enabled': 1, 'CODE.source': sourceOf(b.text) };
      const [x, c] = await Promise.all([
        life(`${OUT}/r${r}-g${g}-k${k}.json`, n, 'code', sets, r, g),
        life(RULES ? `${OUT}/current-n${n}.json` : `${CURRENT}/n${n}.json`, n, 'current', {}, r, g),
      ]);
      return { k, n, text: b.text, reasons: b.reasons ?? null, survival: x.survival, eaten: x.eaten, alive: x.alive, current: c.survival, harmed: (x.diary ?? []).filter((d) => d.harmed).length };
    });
    writeFileSync(genFile, JSON.stringify({ born, lives }));
    prev = lives;
    const distinct = new Set(lives.map((x) => x.text)).size;
    console.log(`${TAG} r${r} g${g}: survival ${mean(lives.map((x) => x.survival)).toFixed(3)} (current ${mean(lives.map((x) => x.current)).toFixed(3)}), rewritten ${born.filter((b) => b.rewritten).length}/${K}, texts ${distinct}, seed text ${lives.filter((x) => x.text === seedId).length}/${K}`);
  }
}
