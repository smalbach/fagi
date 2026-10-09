// Step 0 of docs/research/plan-codigo-cultural.md: reads the four runs of
// seeded.js and prints the gate, as markdown.
//
//   node research/code-culture/seeded-analyze.js [--dir research/results/code-culture/seeded]
//
// Per lineage (the unit), the fraction of each generation born with the
// seeded lines. The gate, written in the plan before running:
//   good: with tournament the lines go from 10 % to more than 50 % within G
//         generations in most lineages, and faster than with a random mother;
//   bad:  with tournament the line is gone (0 %) in most lineages.
// Besides, as description: how much longer carriers live than the rest of
// their own generation (the selection differential the tournament feeds on).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mean, paired, bootstrapCI } from '../stats.js';

const argv = process.argv.slice(2);
const DIR = argv.includes('--dir') ? argv[argv.indexOf('--dir') + 1] : 'research/results/code-culture/seeded';
const f3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : '—');
const ci = ([a, b]) => `[${f3(a)}, ${f3(b)}]`;

function load(tag) {
  const dir = `${DIR}/${tag}`;
  if (!existsSync(`${dir}/run.json`)) return null;
  const meta = JSON.parse(readFileSync(`${dir}/run.json`, 'utf8'));
  const rows = readdirSync(dir).filter((f) => /^r\d+-g\d+-k\d+\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  // freq[r][g]: fraction of generation g of lineage r born with the lines.
  const freq = Array.from({ length: meta.R }, () => Array(meta.G).fill(NaN));
  const surv = Array.from({ length: meta.R }, () => Array(meta.G).fill(NaN));
  const by = {};
  for (const x of rows) (by[`${x.r}:${x.g}`] ??= []).push(x);
  for (const [key, xs] of Object.entries(by)) {
    if (xs.length !== meta.K) continue;
    const [r, g] = key.split(':').map(Number);
    freq[r][g] = xs.filter((x) => x.born.length).length / xs.length;
    surv[r][g] = mean(xs.map((x) => x.survival));
  }
  return { meta, rows, freq, surv, gens: Math.max(0, ...rows.map((x) => x.g + 1)) };
}

// First generation at which the lineage crosses `level` (> level), or null.
const crossing = (fs, level) => { const g = fs.findIndex((f) => f > level); return g < 0 ? null : g; };
const last = (fs) => fs.filter(Number.isFinite).at(-1);

function describe(run) {
  const { freq } = run;
  const ends = freq.map(last);
  const cross = freq.map((fs) => crossing(fs, 0.5));
  return {
    ends,
    over: ends.filter((f) => f > 0.5).length,
    fixed: ends.filter((f) => f === 1).length,
    lost: ends.filter((f) => f === 0).length,
    crossed: cross.filter((g) => g != null).length,
    medianCross: (() => { const c = cross.filter((g) => g != null).sort((a, b) => a - b); return c.length ? c[Math.floor(c.length / 2)] : null; })(),
    // Mean frequency over all generations: how early and how far the lines went.
    area: freq.map((fs) => mean(fs.filter(Number.isFinite))),
  };
}

// Carriers' survival minus the rest's, within each generation of each lineage that has both.
function differential(run) {
  const by = {};
  for (const x of run.rows) (by[`${x.r}:${x.g}`] ??= []).push(x);
  const ds = [];
  for (const xs of Object.values(by)) {
    const a = xs.filter((x) => x.born.length).map((x) => x.survival);
    const b = xs.filter((x) => !x.born.length).map((x) => x.survival);
    if (a.length && b.length) ds.push(mean(a) - mean(b));
  }
  return { n: ds.length, diff: mean(ds), ci: bootstrapCI(ds) };
}

const out = ['# Paso 0: ¿la selección tiene fuerza?', '', `Datos: \`${DIR}\`. Generado por \`research/code-culture/seeded-analyze.js\`.`, ''];
const verdicts = [];

for (const seeded of ['good', 'bad']) {
  const tour = load(`${seeded}-tournament`);
  const rand = load(`${seeded}-random`);
  if (!tour) { out.push(`## ${seeded}: sin datos`, ''); continue; }
  const { R, G, K, C, T, lines } = tour.meta;
  out.push(`## Siembra ${seeded === 'good' ? 'buena' : 'mala'}: ${lines.map((l) => `\`${l.id}\``).join(', ')}`, '');
  out.push(`${R} linajes × ${G} generaciones × ${K} Fagis; ${C} portadoras en la generación 0; torneo de ${T}. Generaciones completas: torneo ${tour.gens}, azar ${rand?.gens ?? 0}.`, '');

  out.push('Fracción portadora por generación (media de linajes):', '');
  const steps = [...new Set([0, 1, 2, 5, 10, 15, G - 1].filter((g) => g < G))];
  out.push(`| | ${steps.map((g) => `g${g}`).join(' | ')} |`, `|---|${steps.map(() => '---').join('|')}|`);
  for (const [name, run] of [['torneo', tour], ['azar', rand]]) {
    if (!run) continue;
    out.push(`| ${name} | ${steps.map((g) => f3(mean(run.freq.map((fs) => fs[g]).filter(Number.isFinite)))).join(' | ')} |`);
  }
  out.push('');

  const dt = describe(tour);
  const dr = rand ? describe(rand) : null;
  out.push('Al final, por linaje:', '');
  out.push('| | > 50 % | fijada (100 %) | perdida (0 %) | cruzó 50 % alguna vez | mediana de la generación del cruce |', '|---|---|---|---|---|---|');
  for (const [name, d] of [['torneo', dt], ['azar', dr]]) {
    if (d) out.push(`| ${name} | ${d.over}/${R} | ${d.fixed}/${R} | ${d.lost}/${R} | ${d.crossed}/${R} | ${d.medianCross ?? '—'} |`);
  }
  out.push('');

  if (dr) {
    const cmp = paired(dt.area, dr.area, { alternative: seeded === 'good' ? 'greater' : 'two-sided' });
    out.push(`Frecuencia media a lo largo de las generaciones, torneo − azar (pareado por linaje): ${f3(cmp.diff)} ${ci(cmp.ci)}, p ${f3(cmp.p)}, dz ${f3(cmp.dz)}.`, '');
  }
  const sd = differential(tour);
  out.push(`Diferencial de selección (descriptivo): las portadoras viven ${f3(sd.diff)} ${ci(sd.ci)} más que el resto de su generación (supervivencia 0-1, ${sd.n} generaciones con ambas).`, '');

  if (seeded === 'good') {
    const ok = dt.over > R / 2 && (!dr || mean(dt.area) > mean(dr.area));
    verdicts.push(`- Siembra buena: ${ok ? '**se cumple**' : '**no se cumple**'} (${dt.over}/${R} linajes por encima del 50 % con torneo${dr ? `; frecuencia media ${f3(mean(dt.area))} frente a ${f3(mean(dr.area))} al azar` : ''}).`);
  } else {
    const ok = dt.lost > R / 2;
    verdicts.push(`- Siembra mala: ${ok ? '**se cumple**' : '**no se cumple**'} (${dt.lost}/${R} linajes la perdieron con torneo).`);
  }
}

out.push('## Puerta', '', ...verdicts, '');
console.log(out.join('\n'));
