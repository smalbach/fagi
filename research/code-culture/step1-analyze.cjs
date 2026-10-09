// Step 1 gates (plan-codigo-cultural.md): the seed text lives the same lives as
// 'current'; the caution text performs like the caution lines in dev2 (±0.02).
const fs = require('fs');
const dir = process.argv[2] ?? 'research/results/code-culture/step1';
const load = (t) => { const o = {}; for (const f of fs.readdirSync(`${dir}/${t}`)) if (f !== 'run.json') o[f] = JSON.parse(fs.readFileSync(`${dir}/${t}/${f}`)); return o; };
const C = load('current'), S = load('code-seed'), L = load('caution-lines'), K = load('code-caution');
const ks = Object.keys(C).sort();
console.log('seed = current, fingerprints:', ks.filter((k) => C[k].fingerprint === S[k].fingerprint).length, '/', ks.length);
const m = (o, g) => ks.reduce((a, k) => a + g(o[k]), 0) / ks.length;
for (const [n, o] of [['current', C], ['code-seed', S], ['caution-lines', L], ['code-caution', K]])
  console.log(n.padEnd(14), 'survival', m(o, (x) => x.survival).toFixed(3), 'alive', m(o, (x) => x.alive).toFixed(3), 'eaten', m(o, (x) => x.eaten).toFixed(1));
let s = 4242; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const ci = (d) => { const bs = []; for (let b = 0; b < 4000; b++) { let t = 0; for (let i = 0; i < d.length; i++) t += d[Math.floor(rnd() * d.length)]; bs.push(t / d.length); } bs.sort((a, b) => a - b); return [d.reduce((a, b) => a + b) / d.length, bs[100], bs[3899]].map((x) => x.toFixed(3)); };
console.log('code-caution − caution-lines:', ci(ks.map((k) => K[k].survival - L[k].survival)).join(' '));
console.log('caution-lines − current:', ci(ks.map((k) => L[k].survival - C[k].survival)).join(' '));
const f = Object.values(K).reduce((a, x) => { a.calls += x.code?.calls ?? 0; a.over += x.code?.overrides ?? 0; a.fail += Object.values(x.code?.failures ?? {}).reduce((p, q) => p + q, 0); a.wcalls += x.code?.wants?.calls ?? 0; a.wfail += x.code?.wants?.failures ?? 0; return a; }, { calls: 0, over: 0, fail: 0, wcalls: 0, wfail: 0 });
console.log('code-caution judge:', JSON.stringify(f));
