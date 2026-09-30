// The confirmatory analysis of docs/research/caution-protocol.md, frozen with it.
//
//   node research/adaptive-decision/caution-confirm.js [--group gconf]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired } from '../stats.js';

const argv = process.argv.slice(2);
const GROUP = argv.includes('--group') ? argv[argv.indexOf('--group') + 1] : 'gconf';
const DIR = `research/results/adaptive-decision/caution/${GROUP}`;
const rows = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')));
const f3 = (v) => v.toFixed(3);

function arms(profile) {
  const c = {}; const k = {};
  for (const r of rows.filter((x) => x.profile === profile)) (r.arm === 'current' ? c : k)[r.i] = r;
  const ids = Object.keys(c).filter((i) => k[i]);
  return { ids, cur: ids.map((i) => c[i]), cau: ids.map((i) => k[i]) };
}
const causes = (rs) => { const z = {}; for (const r of rs) z[r.cause ?? 'alive'] = (z[r.cause ?? 'alive'] ?? 0) + 1; return Object.entries(z).map(([a, b]) => `${a} ${b}`).join(', '); };
const perSim = (rs) => mean(rs.map((r) => r.ms / Math.max(1, r.lived)));

const S = arms('species');
const h1 = paired(S.cau.map((r) => r.survival), S.cur.map((r) => r.survival), { alternative: 'greater', B: 20000 });
const C = arms('classic');
const dC = C.cau.map((r, j) => r.survival - C.cur[j].survival);
const lowC = dC.every((d) => d === 0) ? 0 : bootstrapCI(dC, { level: 0.9, B: 20000 })[0];
const cost = perSim([...S.cau, ...C.cau]) / perSim([...S.cur, ...C.cur]);
const H1 = h1.p < 0.05 && h1.diff > 0;
const H2 = lowC > -0.02;
const COST = cost <= 1.5;
const decision = H1 && H2 && COST ? 'integrate as the game\'s factory behaviour, with a setting to turn it off'
  : !H2 || !COST ? 'do not integrate' : 'do not integrate; publish the result';

const L = [];
L.push('# Cautela al comer en el juego: confirmación');
L.push('');
L.push('Generado por `research/adaptive-decision/caution-confirm.js`, congelado con `docs/research/caution-protocol.md`. No editar a mano.');
L.push('');
L.push('| Perfil | Brazo | n | Supervivencia | Desenlaces |');
L.push('|---|---|---|---|---|');
for (const [p, A] of [['species', S], ['classic', C]]) {
  L.push(`| ${p} | current | ${A.cur.length} | ${f3(mean(A.cur.map((r) => r.survival)))} | ${causes(A.cur)} |`);
  L.push(`| ${p} | caution | ${A.cau.length} | ${f3(mean(A.cau.map((r) => r.survival)))} | ${causes(A.cau)} |`);
}
L.push('');
L.push(`H1, con especies: ${f3(h1.diff)} [${f3(h1.ci[0])}, ${f3(h1.ci[1])}], p = ${h1.p.toFixed(4)} → ${H1 ? '✓' : '✗'}`);
L.push(`H2, mapa clásico: diferencia ${f3(mean(dC))}, cota inferior unilateral 95 % ${f3(lowC)} (margen −0,02) → ${H2 ? '✓' : '✗'}`);
L.push(`Coste: ${f3(cost)} veces el tiempo de current por segundo simulado (límite 1,5) → ${COST ? '✓' : '✗'}`);
L.push('');
L.push(`**Decisión según el protocolo: ${decision}.**`);
writeFileSync('research/adaptive-decision/caution-confirmation.md', `${L.join('\n')}\n`);
console.log(L.join('\n'));
