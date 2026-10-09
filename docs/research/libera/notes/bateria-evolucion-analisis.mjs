import fs from 'node:fs';
const rs = fs.readFileSync('evo.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
for (const c of ['old', 'A', 'AB']) {
  const g = rs.filter((r) => r.cond === c);
  const al = g.filter((r) => !r.extinct);
  console.log(`\n### ${c}: ${g.length} corridas, extintas ${g.length - al.length}, vivas al final ${mean(al.map((r) => r.n)).toFixed(0)}, crías ${mean(al.map((r) => r.hatched)).toFixed(0)}, generación ${mean(al.map((r) => r.gen)).toFixed(1)}, refundaciones ${mean(g.map((r) => r.founded)).toFixed(1)}, ${Math.round(mean(g.map((r) => r.secs)) / 60)} min/corrida`);
  console.log('| rasgo | Δ gen medio | semillas que suben | t (media/ee) | β medio |');
  console.log('|---|---|---|---|---|');
  for (const t of T) {
    const d = al.map((r) => r.delta[t]).filter((v) => v != null);
    const b = al.map((r) => r.beta[t]).filter((v) => v != null);
    const tt = d.length > 1 ? mean(d) / (sd(d) / Math.sqrt(d.length)) : 0;
    console.log(`| ${t} | ${mean(d).toFixed(3)} | ${d.filter((v) => v > 0).length}/${d.length} | ${tt.toFixed(1)} | ${b.length ? mean(b).toFixed(3) : '—'} |`);
  }
  if (c === 'AB') for (const r of g) console.log(`  semilla ${r.seed}: ` + r.perColony.map((p) => `nido ${p.nest} n=${p.n} tamaño ${p.size?.toFixed(2) ?? '—'} músculo ${p.muscle?.toFixed(2) ?? '—'}`).join(' · '));
}
