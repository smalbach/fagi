import fs from 'node:fs';
const rs = fs.readFileSync('h3b.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const by = (c) => rs.filter((r) => r.cond === c).sort((a, b) => a.seed - b.seed);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
let s = 12345; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const boot = (d) => { const ms = []; for (let i = 0; i < 4000; i++) { let t = 0; for (let j = 0; j < d.length; j++) t += d[Math.floor(rnd() * d.length)]; ms.push(t / d.length); } ms.sort((a, b) => a - b); return [ms[100], ms[3899]]; };
const fmt = (d) => { const [lo, hi] = boot(d); return `${mean(d).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]`; };
const M = { judgment: (r) => r.judgment, auc: (r) => r.auc ?? 0.5, reached: (r) => r.reached ?? 2600, falseB: (r) => r.falseAvoid + r.falseTrust, dose: (r) => r.dose, helpful: (r) => r.helpful ?? 0, alive: (r) => (r.alive ? 1 : 0) };
console.log('| condición | juicio | área | llega a 0,8 en (s) | creencias falsas | dosis | buenas encontradas | vivas |');
console.log('|---|---|---|---|---|---|---|---|');
for (const c of ['agenda', 'lp']) { const g = by(c); console.log(`| ${c} | ${Object.values(M).map((f) => mean(g.map(f)).toFixed(3)).join(' | ')} |`); }
for (const [a, b] of [['lp', 'agenda']]) {
  console.log(`\n${a} − ${b} (pareado, n=60):`);
  for (const [k, f] of Object.entries(M)) { const d = by(a).map((r, i) => f(r) - f(by(b)[i])); console.log(`  ${k}: ${fmt(d)}`); }
}
const v = by('lp'); console.log(`\nveredictos lp: confirmados ${mean(v.map((r) => r.confirmed)).toFixed(1)}, refutados ${mean(v.map((r) => r.refuted)).toFixed(1)} por vida; experimentos ${mean(v.map((r) => r.experiments)).toFixed(1)} (agenda ${mean(by('agenda').map((r) => r.experiments)).toFixed(1)})`);
const differ = by('lp').filter((r, i) => r.judgment !== by('agenda')[i].judgment || r.dose !== by('agenda')[i].dose).length;
console.log(`vidas en que lp difiere de agenda: ${differ}/60`);
