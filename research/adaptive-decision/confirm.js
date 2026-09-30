// Step 4, the confirmatory analysis (docs/research/adaptive-decision-protocol.md).
// Frozen with the protocol: written before any confirmation world was run.
//
//   node research/adaptive-decision/confirm.js [--out research/results/adaptive-decision/food]
//
// Unit: the world. Every comparison pairs the two judges on the same world;
// families weigh alike; deaths are outcomes, never exclusions.

import { writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { load } from './summarize.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision/food';
const REPORT = 'research/adaptive-decision/confirmation.md';

export const MAIN = 'conf-model-fixed';
export const REF = 'conf-current';
export const RIVAL = 'conf-heuristic_1_75';
export const ABLATION = 'conf-model-fixed-h1';
const CHANGING = ['invert', 'novel'];
const ALPHA = 0.05;
const MIN_GAIN = 0.05;
const NI_MARGIN = 0.03;
const COST_LIMIT = 1.5;

const f3 = (v) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(3));
const byWorld = (tag) => {
  const o = {};
  for (const r of load(tag, OUT)) (o[r.i] ??= {})[r.family] = r;
  return o;
};
const J = { main: byWorld(MAIN), ref: byWorld(REF), rival: byWorld(RIVAL), abl: byWorld(ABLATION) };
const worldsOf = (a, b, fams) => Object.keys(a).filter((i) => b[i] && fams.every((f) => a[i][f] && b[i][f]));
// Per world: the mean over `fams` of a's survival minus b's.
const diffs = (a, b, fams) => {
  const ws = worldsOf(a, b, fams);
  return { ws, a: ws.map((i) => mean(fams.map((f) => a[i][f].survival))), b: ws.map((i) => mean(fams.map((f) => b[i][f].survival))) };
};
const test = (id, says, a, b, fams) => {
  const d = diffs(a, b, fams);
  const r = paired(d.a, d.b, { alternative: 'greater', B: 20000 });
  return { id, says, n: r.n, diff: r.diff, ci: r.ci, p: r.p };
};

const tests = [
  test('H1a', 'changing families: learned caution survives more than current', J.main, J.ref, CHANGING),
  test('H1b', 'changing families: and more than the heuristic', J.main, J.rival, CHANGING),
  test('H2a', 'composition (reserved): more than current', J.main, J.ref, ['composition']),
  test('H2b', 'composition (reserved): more than the heuristic', J.main, J.rival, ['composition']),
  test('H4', 'changing families: more than its own horizon-1 ablation', J.main, J.abl, CHANGING),
];
const adj = holm(tests.map((t) => t.p));
tests.forEach((t, k) => { t.pHolm = adj[k]; t.sig = adj[k] < ALPHA; });
const T = Object.fromEntries(tests.map((t) => [t.id, t]));

// C3: stable, non-inferiority to current by NI_MARGIN (one-sided 95%: the 5th percentile).
const st = diffs(J.main, J.ref, ['stable']);
const stD = st.a.map((x, k) => x - st.b[k]);
const stCI = bootstrapCI(stD, { level: 0.9, B: 20000 });
const C3 = { diff: mean(stD), lower: stCI[0], pass: stCI[0] > -NI_MARGIN };

// C5: wall time per simulated second, same machine and run, and the model's size.
const perSim = (tag) => mean(load(tag, OUT).map((r) => r.ms / Math.max(1, r.lived)));
const cost = { main: perSim(MAIN), ref: perSim(REF), rival: perSim(RIVAL) };
const bytes = load(MAIN, OUT).map((r) => r.adaptive?.bytes ?? 0);
const C5 = { ratio: cost.main / cost.ref, pass: cost.main / cost.ref <= COST_LIMIT, bytes: Math.max(...bytes) };

const C1 = T.H1a.sig && T.H1b.sig && T.H1a.diff >= MIN_GAIN && T.H1b.diff >= MIN_GAIN;
const C2 = T.H2a.sig && T.H2b.sig;
const C4 = T.H4.sig;

// The plan's table of outcomes.
let outcome;
if (!C5.pass || (T.H1a.diff < 0 && T.H1a.ci[1] < 0)) outcome = 'worse or too costly: withdraw from the default path and publish';
else if (C1 && C2 && C3.pass && C5.pass) outcome = C4 ? 'useful improvement: integrate this variant' : 'useful improvement, not from planning: integrate the horizon-1 version';
else if (T.H1a.sig && !T.H1b.sig) outcome = 'as good as a simpler alternative: prefer the simple one';
else if (!T.H1a.sig && T.H1a.ci[0] < 0 && T.H1a.ci[1] > MIN_GAIN) outcome = 'inconclusive: intervals too wide';
else outcome = 'no useful improvement shown';

const lines = [];
const P = (s = '') => lines.push(s);
P('# Decisión adaptativa, paso 4: confirmación');
P();
P('Generado por `research/adaptive-decision/confirm.js`, congelado con `docs/research/adaptive-decision-protocol.md`. No editar a mano.');
P();
P('## Supervivencia media por familia');
P();
P('| Juez | stable | invert | novel | composition |');
P('|---|---|---|---|---|');
for (const [name, tag] of [['current', REF], ['model-fixed', MAIN], ['heuristic 1:75', RIVAL], ['model-fixed-h1', ABLATION]]) {
  const rows = load(tag, OUT);
  const cell = (f) => { const s = rows.filter((r) => r.family === f).map((r) => r.survival); return `${f3(mean(s))} (n ${s.length})`; };
  P(`| ${name} | ${cell('stable')} | ${cell('invert')} | ${cell('novel')} | ${cell('composition')} |`);
}
P();
P('## Contrastes (unilaterales, pareados por mundo, Holm sobre los cinco)');
P();
P('| | Afirma | n | Diferencia [IC 95 %] | p | p Holm | |');
P('|---|---|---|---|---|---|---|');
for (const t of tests) P(`| ${t.id} | ${t.says} | ${t.n} | ${f3(t.diff)} [${f3(t.ci[0])}, ${f3(t.ci[1])}] | ${t.p.toFixed(4)} | ${t.pHolm.toFixed(4)} | ${t.sig ? '✓' : '✗'} |`);
P();
P(`C3, no inferioridad en stable (margen ${NI_MARGIN}): diferencia ${f3(C3.diff)}, cota inferior unilateral 95 % ${f3(C3.lower)} → ${C3.pass ? '✓' : '✗'}.`);
P(`C5, coste: ${f3(C5.ratio)} veces el tiempo de current por segundo simulado (límite ${COST_LIMIT}) → ${C5.pass ? '✓' : '✗'}; modelo de a lo sumo ${C5.bytes} bytes.`);
P();
P('## Criterios');
P();
P(`1. Mejora ≥ ${MIN_GAIN} y significativa frente a current y a la heurística en las familias cambiantes: ${C1 ? '✓' : '✗'}`);
P(`2. Ventaja en la composición reservada frente a ambos: ${C2 ? '✓' : '✗'}`);
P(`3. No inferior en stable: ${C3.pass ? '✓' : '✗'}`);
P(`4. Supera su ablación de horizonte 1: ${C4 ? '✓' : '✗'}`);
P(`5. Coste dentro del límite: ${C5.pass ? '✓' : '✗'}`);
P();
P(`**Resultado según la tabla del plan: ${outcome}.**`);
P();
writeFileSync(REPORT, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
