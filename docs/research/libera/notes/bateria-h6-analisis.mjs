import fs from 'node:fs';
const rs = fs.readFileSync('h6.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const by = (c) => rs.filter((r) => r.cond === c).sort((a, b) => a.seed - b.seed);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
let s = 999; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const ci = (d) => { const ms = []; for (let i = 0; i < 4000; i++) { let t = 0; for (let j = 0; j < d.length; j++) t += d[Math.floor(rnd() * d.length)]; ms.push(t / d.length); } ms.sort((a, b) => a - b); return `${mean(d).toFixed(3)} [${ms[100].toFixed(3)}, ${ms[3899].toFixed(3)}]`; };
const M = { bitesPerBout: (r) => r.bitesPerBout ?? 0, wasted: (r) => r.wasted, meals: (r) => r.meals, meanHunger: (r) => r.meanHunger, critical: (r) => r.critical, alive: (r) => (r.alive ? 1 : 0) };
console.log('| condición | ' + Object.keys(M).join(' | ') + ' |'); console.log('|---|' + Object.keys(M).map(() => '---').join('|') + '|');
for (const c of ['instant', 'two-stage', 'no-satiety']) console.log(`| ${c} | ${Object.values(M).map((f) => mean(by(c).map(f)).toFixed(3)).join(' | ')} |`);
for (const [a, b] of [['two-stage', 'no-satiety'], ['two-stage', 'instant']]) { console.log(`\n${a} − ${b}:`); for (const [k, f] of Object.entries(M)) console.log(`  ${k}: ${ci(by(a).map((r, i) => f(r) - f(by(b)[i])))}`); }
