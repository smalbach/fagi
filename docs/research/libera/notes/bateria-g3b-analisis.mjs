import fs from 'node:fs';
const rs = fs.readFileSync(process.argv[2] ?? 'g3b.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const M = ['darwin', 'baldwin', 'epi'], E = ['pred', 'unpred', 'none'], T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const get = (m, e) => rs.filter((r) => r.mode === m && r.env === e).sort((a, b) => a.seed - b.seed);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const ci = (a, d = 1) => { if (a.length < 2) return '—'; const m = mean(a), h = 2.262 * sd(a) / Math.sqrt(a.length); return `${m.toFixed(d)} [${(m - h).toFixed(d)}, ${(m + h).toFixed(d)}]`; };
const f = (v, d = 2) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(d));
const minN = (r) => (r.extinct ? 0 : r.minN);
const hatched = (r) => r.end.hatched ?? r.years.at(-1).hatched ?? 0;
const nonAge = (r) => Object.entries(r.end.deaths).filter(([k]) => k !== 'age').reduce((s, [, v]) => s + v, 0);
const corr = (x, y) => { const mx = mean(x), my = mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return b && c ? a / Math.sqrt(b * c) : null; };
const tracking = (r, t) => { const ys = r.years.filter((y) => y.n > 0 && y.carried[t] != null); const dx = [], k = []; for (let i = 1; i < ys.length; i++) if (ys[i].far != null) { dx.push(ys[i].carried[t] - ys[i - 1].carried[t]); k.push(ys[i].far ? 1 : -1); } return dx.length > 2 ? corr(dx, k) : null; };
const gap = (r, t) => { const ys = r.years.filter((y) => y.n > 0 && y.year >= 1); return ys.length ? mean(ys.map((y) => Math.abs(y.carried[t] - y.genes[t]))) : null; };

console.log('## 0. Resumen por condición (media de 10 semillas)\n');
console.log('| modo | ambiente | extintas | pobl. mínima | crías | muertes no por edad | frío | hambre | músculo gen | antenas gen | plasticidad |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const e of E) for (const m of [0, 1, 2]) { const g = get(m, e); const al = g.filter((r) => r.end.n > 0);
  console.log(`| ${M[m]} | ${e} | ${g.filter((r) => r.extinct).length}/${g.length} | ${f(mean(g.map(minN)), 1)} | ${f(mean(g.map(hatched)), 1)} | ${f(mean(g.map(nonAge)), 1)} | ${f(mean(g.map((r) => r.end.deaths.cold ?? 0)), 1)} | ${f(mean(g.map((r) => r.end.deaths.hunger ?? 0)), 1)} | ${al.length ? f(mean(al.map((r) => r.end.genes.muscle)), 3) : '—'} | ${al.length ? f(mean(al.map((r) => r.end.genes.antennae)), 3) : '—'} | ${al.length ? f(mean(al.map((r) => r.end.plastic)), 3) : '—'} |`); }

console.log('\n## 1. Supervivencia y cría frente a darwin, pareado por semilla (modo − darwin)\n');
for (const e of ['pred', 'unpred']) for (const m of [1, 2]) { const d = get(0, e), x = get(m, e);
  const dh = x.map((r, i) => hatched(r) - hatched(d[i])), dm = x.map((r, i) => minN(r) - minN(d[i])), dd = x.map((r, i) => nonAge(d[i]) - nonAge(r));
  console.log(`- ${M[m]} ${e}: crías ${ci(dh)} (a favor ${dh.filter((v) => v > 0).length}/10); pobl. mínima ${ci(dm)}; muertes evitadas ${ci(dd)}`); }
{ const adv = (e) => get(2, e).map((r, i) => hatched(r) - hatched(get(0, e)[i]));
  const inter = adv('pred').map((v, i) => v - adv('unpred')[i]);
  console.log(`- **de Bruin** (ventaja epi en crías, pred − unpred): ${ci(inter)}; semillas con pred > unpred: ${inter.filter((v) => v > 0).length}/10`); }

console.log('\n## 2. Seguimiento (correlación Δcargado con año lejano +1 / cercano −1)\n');
for (const t of ['muscle', 'antennae']) for (const e of ['pred', 'unpred']) for (const m of [0, 1, 2]) { const c = get(m, e).filter((r) => !r.extinct).map((r) => tracking(r, t)).filter((v) => v != null); console.log(`- ${t} ${M[m]} ${e}: ${ci(c, 2)} (n=${c.length})`); }

console.log('\n## 3. ¿Pasó la experiencia el umbral? media |cargado − gen| por año\n');
for (const t of ['muscle', 'antennae', 'gut', 'brain', 'eyes']) { const line = []; for (const e of E) for (const m of [0, 1, 2]) { const v = get(m, e).map((r) => gap(r, t)).filter((x) => x != null); line.push(`${M[m]}/${e} ${f(mean(v), 3)}`); } console.log(`- ${t}: ${line.join(', ')}`); }

console.log('\n## 4. Baldwin: gen de plasticidad final\n');
for (const e of E) { const g = get(1, e).filter((r) => r.end.n > 0); console.log(`- ${e}: ${g.length ? f(mean(g.map((r) => r.end.plastic)), 3) : '—'} (rango ${f(Math.min(...g.map((r) => r.end.plastic)), 3)}–${f(Math.max(...g.map((r) => r.end.plastic)), 3)})`); }

console.log('\n## 5. Cambio frente a estasis (Δ gen desde fin del año 1, contra el rango de `none` del mismo modo)\n');
console.log('| modo | ambiente | ' + T.join(' | ') + ' |'); console.log('|---|---|' + T.map(() => '---').join('|') + '|');
for (const m of [0, 1, 2]) { const ctl = get(m, 'none').filter((r) => r.end.n > 0 && r.years[1]?.n > 0); const dl = (r, t) => r.end.genes[t] - r.years[1].genes[t];
  const rg = Object.fromEntries(T.map((t) => { const v = ctl.map((r) => dl(r, t)); return [t, [Math.min(...v), Math.max(...v)]]; }));
  console.log(`| ${M[m]} | rango none | ` + T.map((t) => `${f(rg[t][0], 3)}…${f(rg[t][1], 3)}`).join(' | ') + ' |');
  for (const e of ['pred', 'unpred']) { const g = get(m, e).filter((r) => r.end.n > 0 && r.years[1]?.n > 0);
    console.log(`| ${M[m]} | ${e} | ` + T.map((t) => { const v = mean(g.map((r) => dl(r, t))); const out = v < rg[t][0] || v > rg[t][1]; return `${f(v, 3)} ${out ? '**cambió**' : 'se mantuvo'}`; }).join(' | ') + ' |'); } }
