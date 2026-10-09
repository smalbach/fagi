import fs from 'node:fs';
const load = (n) => JSON.parse(fs.readFileSync(`h2_${n}.json`, 'utf8')).runs.sort((a, b) => a.seed - b.seed);
const C = { program: load('program'), 'program+learn': load('learn'), freeflow: load('freeflow'), 'freeflow+central': load('central') };
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
let s = 4242; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const ci = (d) => { const ms = []; for (let i = 0; i < 4000; i++) { let t = 0; for (let j = 0; j < d.length; j++) t += d[Math.floor(rnd() * d.length)]; ms.push(t / d.length); } ms.sort((a, b) => a - b); return [mean(d), ms[100], ms[3899]]; };
const nz = (v, d) => (v == null || Number.isNaN(v) ? d : v);
const M = [
  ['R1 sin atender', (r) => r.tyrrell.r1Untended, -1],
  ['R3 r(hambre,sed)', (r) => (nz(r.tyrrell.r3.hunger, 0) + nz(r.tyrrell.r3.thirst, 0)) / 2, 1],
  ['R4–5 come al alcance', (r) => nz(r.tyrrell.r45Eat, 1), 1],
  ['R7a cambios/min', (r) => r.tyrrell.r7Switches, -1],
  ['R7b titubeo', (r) => r.tyrrell.r7Dither, -1],
  ['R8 latencia', (r) => nz(r.tyrrell.r8Latency, 0), -1],
  ['R9 oportunismo', (r) => nz(r.tyrrell.r9Opportune, 0), 1],
  ['R11–12 compromiso', (r) => r.tyrrell.r1112Compromise, 1],
];
console.log('| medida | ' + Object.keys(C).join(' | ') + ' |'); console.log('|---|' + Object.keys(C).map(() => '---').join('|') + '|');
for (const [n, f] of M) console.log(`| ${n} | ${Object.values(C).map((g) => mean(g.map(f)).toFixed(3)).join(' | ')} |`);
console.log(`| R2 persistencia (s) | ${Object.values(C).map((g) => mean(g.map((r) => nz(r.tyrrell.r2Past, 0))).toFixed(2)).join(' | ')} |`);
console.log(`| vivas | ${Object.values(C).map((g) => mean(g.map((r) => (r.cause ? 0 : 1))).toFixed(3)).join(' | ')} |`);
for (const [a, b] of [['freeflow+central', 'program'], ['freeflow+central', 'freeflow'], ['freeflow', 'program'], ['program+learn', 'program']]) {
  let win = 0, loss = 0; const lines = [];
  for (const [n, f, dir] of M) {
    const d = C[a].map((r, i) => f(r) - f(C[b][i])); const [m, lo, hi] = ci(d);
    const verdict = (lo > 0 && dir > 0) || (hi < 0 && dir < 0) ? 'victoria' : (lo > 0 && dir < 0) || (hi < 0 && dir > 0) ? 'derrota' : '—';
    if (verdict === 'victoria') win++; if (verdict === 'derrota') loss++;
    lines.push(`  ${n}: ${m.toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}] ${verdict}`);
  }
  console.log(`\n${a} − ${b}: ${win} victorias, ${loss} derrotas`); console.log(lines.join('\n'));
}
