// Step 2: a quick table of what battery.js wrote, per run and family.
//
//   node research/adaptive-decision/summarize.js [tag ...] [--out research/results/adaptive-decision/battery]

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { mean, bootstrapCI } from '../stats.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision/battery';
const tags = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out');

export function load(tag, out = OUT) {
  const dir = `${out}/${tag}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /^[a-z]+-\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const tag of tags.length ? tags : readdirSync(OUT)) {
    const rows = load(tag);
    const fams = [...new Set(rows.map((r) => r.family))];
    for (const f of fams) {
      const rs = rows.filter((r) => r.family === f);
      const s = rs.map((r) => r.survival);
      const ci = bootstrapCI(s);
      const causes = {};
      for (const r of rs) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
      const top = rs.filter((r) => r.survival === 1).length / rs.length;
      console.log(`${tag.padEnd(16)} ${f.padEnd(10)} n ${rs.length} surv ${mean(s).toFixed(3)} [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}] ceiling ${(top * 100).toFixed(0)}% eaten ${mean(rs.map((r) => r.eaten)).toFixed(1)} stored ${mean(rs.map((r) => r.stored)).toFixed(1)} deaths ${JSON.stringify(causes)}`);
    }
  }
}
