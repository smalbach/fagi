// Step 3c (step3c-protocolo.md): does a lineage learn the rule of its world?
// Per lineage of each run: the probe of the final majority text (rule.js),
// and that text, the caution text and the oracle living 60 new worlds under
// the lineage's rule (harmful bites per life, survival).
//
//   node research/code-culture/step3c-analyze.js [--runs rule-diary,rule-nodiary] [--worlds 60]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { promisify } from 'node:util';
import { CAUTION_SOURCE } from '../../src/learned/code-judge.js';
import { ruleOf, probe, oracleSource } from './rule.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const RUNS = opt('--runs', 'rule-diary,rule-nodiary').split(',');
const N = Number(opt('--worlds', 60));
const BASE = 'research/results/code-culture';
const OUT = `${BASE}/rule-transplant`;
const run = promisify(execFile);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

async function life(name, i, r, source, sets) {
  const file = `${OUT}/${name}/${i}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  mkdirSync(`${OUT}/${name}`, { recursive: true });
  const piece = { domain: 'food', controller: 'code', family: i % 2 ? 'novel' : 'stable', i, group: 'cdev', sets: { ...sets, 'CODE.enabled': 1, 'CODE.source': source }, chem: ruleOf(r) };
  await run('node', ['research/adaptive-decision/battery.js', '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  renameSync(`${file}.tmp`, file);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const report = {};
const jobs = [];
for (const runTag of RUNS) {
  const dir = `${BASE}/lineages/${runTag}`;
  const info = JSON.parse(readFileSync(`${dir}/run.json`, 'utf8'));
  const texts = JSON.parse(readFileSync(`${dir}/texts.json`, 'utf8'));
  const last = (info.until ?? info.G) - 1;
  report[runTag] = [];
  for (let r = 0; r < info.R; r++) {
    const { lives } = JSON.parse(readFileSync(`${dir}/r${r}-g${last}.json`, 'utf8'));
    const count = {};
    for (const l of lives) count[l.text] = (count[l.text] ?? 0) + 1;
    const [id, carriers] = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    const rule = ruleOf(r);
    const p = probe(texts[id], rule);
    // Worlds for transplant: 9000 + 100·r + j, never lived by any lineage.
    const ids = Array.from({ length: N }, (_, j) => 9000 + 100 * r + j);
    const entry = { r, rule: `${rule.dim}=${rule.poison}`, id, carriers, probe: p, lives: {} };
    report[runTag].push(entry);
    for (const [name, src] of [[`${runTag}-r${r}-${id}`, texts[id]], [`caution-r${r}`, CAUTION_SOURCE], [`oracle-r${r}`, oracleSource(rule)]]) {
      for (const i of ids) jobs.push(async () => { const x = await life(name, i, r, src, info.sets ?? {}); (entry.lives[name.startsWith('caution') ? 'caution' : name.startsWith('oracle') ? 'oracle' : 'text'] ??= []).push(x); });
    }
  }
}
await Promise.all(Array.from({ length: 16 }, async () => { while (jobs.length) await jobs.shift()(); }));

const harmed = (xs) => mean(xs.map((x) => (x.diary ?? []).filter((d) => d.harmed).length));
const surv = (xs) => mean(xs.map((x) => x.survival));
for (const [runTag, entries] of Object.entries(report)) {
  console.log(`\n## ${runTag}`);
  console.log('| lineage | rule | carriers | probe | harmful bites: text · caution · oracle | survival: text · caution · oracle |');
  console.log('|---|---|---|---|---|---|');
  let learned = 0, halved = 0;
  for (const e of entries) {
    const [ht, hc, ho] = ['text', 'caution', 'oracle'].map((k) => harmed(e.lives[k]));
    const [st, sc, so] = ['text', 'caution', 'oracle'].map((k) => surv(e.lives[k]));
    if (e.probe.score >= 0.5) learned++;
    if (ht <= hc - (hc - ho) / 2) halved++;
    console.log(`| ${e.r} | ${e.rule} | ${e.carriers}/24 | ${e.probe.score.toFixed(2)} (leaves ${e.probe.poisonLeft.toFixed(2)} of poison, ${e.probe.otherLeft.toFixed(2)} of others) | ${ht.toFixed(2)} · ${hc.toFixed(2)} · ${ho.toFixed(2)} | ${st.toFixed(3)} · ${sc.toFixed(3)} · ${so.toFixed(3)} |`);
  }
  console.log(`\nprobe ≥ 0.5: ${learned}/${entries.length} lineages; harmful bites at least halfway from caution to oracle: ${halved}/${entries.length}`);
}
