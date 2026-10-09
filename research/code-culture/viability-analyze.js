// Step 2 report (docs/research/plan-codigo-cultural.md): valid texts, failures
// while running, seconds per call and survival against 'current' in the same
// worlds, per arm.
//
//   node research/code-culture/viability-analyze.js [--tag v2-qwen3.6]

import { existsSync, readdirSync, readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const TAG = argv.includes('--tag') ? argv[argv.indexOf('--tag') + 1] : 'v2-qwen3.6';
const DIR = `research/results/code-culture/viability/${TAG}`;
const ARMS = ['zero-shot', 'zero-shot-blind', 'revise', 'revise-blind'];

const lives = (name) => {
  const o = {};
  if (!existsSync(`${DIR}/${name}`)) return o;
  for (const f of readdirSync(`${DIR}/${name}`)) if (f.endsWith('.json')) o[f.slice(0, -5)] = JSON.parse(readFileSync(`${DIR}/${name}/${f}`, 'utf8'));
  return o;
};
const texts = JSON.parse(readFileSync(`${DIR}/texts.json`, 'utf8'));
const current = lives('current');
const ids = Object.keys(current).sort();
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
let seed = 4242;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ci = (d) => {
  const bs = [];
  for (let b = 0; b < 4000; b++) { let t = 0; for (let i = 0; i < d.length; i++) t += d[Math.floor(rnd() * d.length)]; bs.push(t / d.length); }
  bs.sort((a, b) => a - b);
  return `${mean(d).toFixed(3)} [${bs[100].toFixed(3)}, ${bs[3899].toFixed(3)}]`;
};

console.log(`# Viability ${TAG}: ${ids.length} worlds\n`);
console.log(`current: survival ${mean(ids.map((k) => current[k].survival)).toFixed(3)}, alive ${mean(ids.map((k) => current[k].alive)).toFixed(3)}\n`);
console.log('| arm | valid | failures in texts | lives with run failures | s/call (median) | chars (median) | survival | − current (valid only, paired) | overrides: ground · wants |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const arm of ARMS) {
  const ts = ids.map((k) => texts[`${arm}/${k}`]).filter(Boolean);
  const ok = ts.filter((t) => t.ok);
  const why = {};
  for (const t of ts) if (!t.ok) why[t.failure] = (why[t.failure] ?? 0) + 1;
  const L = lives(arm);
  const ks = Object.keys(L).filter((k) => current[k]);
  const failed = ks.filter((k) => Object.keys(L[k].code?.failures ?? {}).length || L[k].code?.wants?.failures).length;
  const calls = ks.reduce((a, k) => a + (L[k].code?.calls ?? 0), 0);
  const over = ks.reduce((a, k) => a + (L[k].code?.overrides ?? 0), 0);
  const wcalls = ks.reduce((a, k) => a + (L[k].code?.wants?.calls ?? 0), 0);
  const wover = ks.reduce((a, k) => a + (L[k].code?.wants?.overrides ?? 0), 0);
  console.log(`| ${arm} | ${ok.length}/${ts.length} (${(100 * ok.length / ts.length).toFixed(0)} %) | ${JSON.stringify(why)} | ${failed}/${ks.length} | ${(median(ts.map((t) => t.ms)) / 1000).toFixed(1)} | ${median(ok.map((t) => t.text.length))} | ${mean(ks.map((k) => L[k].survival)).toFixed(3)} | ${ci(ks.map((k) => L[k].survival - current[k].survival))} | ${(over / calls).toFixed(2)} · ${wcalls ? (wover / wcalls).toFixed(2) : '—'} |`);
}
// By family, survival of each arm.
console.log('\nSurvival by family:\n');
console.log(`| family | current | ${ARMS.join(' | ')} |`);
console.log(`|---|---|${ARMS.map(() => '---').join('|')}|`);
for (const fam of ['stable', 'invert', 'novel']) {
  const row = [mean(ids.filter((k) => k.startsWith(fam)).map((k) => current[k].survival)).toFixed(3)];
  for (const arm of ARMS) { const L = lives(arm); row.push(mean(Object.keys(L).filter((k) => k.startsWith(fam)).map((k) => L[k].survival)).toFixed(3)); }
  console.log(`| ${fam} | ${row.join(' | ')} |`);
}
