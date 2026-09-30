// Step 1, the report: research/adaptive-decision/baseline.md, the manifest,
// and a readable trace of one episode. Reads what run.js wrote.
//
//   node research/adaptive-decision/analyze.js [--out research/results/adaptive-decision]

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { enableOrganism } from '../../src/organism.js';
import { set, resolvedConfig } from './episode.js';
import { PROFILES, HORIZON, DT, EPISODES, SEED, mapSeed, isReflex } from './design.js';
import { mean, bootstrapCI, paired } from '../stats.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision';
const REPORT = 'research/adaptive-decision/baseline.md';

const rows = readdirSync(`${OUT}/parts`).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`${OUT}/parts/${f}`, 'utf8')));
const of = (p) => rows.filter((r) => r.profile === p).sort((a, b) => a.i - b.i);
const f2 = (v) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(2));
const f3 = (v) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(3));
const pc = (v) => (v == null || Number.isNaN(v) ? '—' : `${Math.round(v * 100)} %`);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// --- manifest ---------------------------------------------------------------

const sh = (c) => { try { return execSync(c, { encoding: 'utf8' }).trim(); } catch { return null; } };
enableOrganism();
set(PROFILES.game);
const configGame = resolvedConfig();
set(PROFILES.experimental);   // a superset of game
const configExperimental = resolvedConfig();
set(PROFILES.connected);      // and of experimental
const configConnected = resolvedConfig();
const manifest = {
  step: 'adaptive-decision step 1 (baseline)',
  commit: sh('git rev-parse HEAD'),
  dirty: Boolean(sh('git status --porcelain -- src research/adaptive-decision scripts/batch')),
  node: process.version,
  generated: new Date().toISOString(),
  commands: ['node research/adaptive-decision/run.js --jobs 10', 'node research/adaptive-decision/analyze.js'],
  horizon: HORIZON, dt: DT, episodes: EPISODES,
  seeds: { fagi: `${SEED} + i`, world: `(${SEED} + i) * 7919`, map: `${mapSeed(0)} + 59 i`, i: `0..${EPISODES - 1}` },
  profiles: PROFILES,
  config: { game: configGame, experimental: configExperimental, connected: configConnected },
};
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));

// --- survival ---------------------------------------------------------------

const lines = [];
const P = (s = '') => lines.push(s);

function survivalRow(p) {
  const rs = of(p);
  const s = rs.map((r) => r.survival);
  const ci = bootstrapCI(s);
  const causes = {};
  for (const r of rs) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  const deaths = Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '—';
  return `| ${p} | ${rs.length} | ${f3(mean(s))} [${f3(ci[0])}, ${f3(ci[1])}] | ${pc(mean(rs.map((r) => r.alive)))} | ${deaths} | ${f2(mean(rs.map((r) => r.eaten)))} | ${f2(mean(rs.map((r) => r.stored)))} |`;
}

// --- who decides ------------------------------------------------------------

function shares(rs, field) {
  const tot = {};
  let all = 0;
  for (const r of rs) for (const [k, v] of Object.entries(r[field])) { tot[k] = (tot[k] ?? 0) + v; all += v; }
  return Object.entries(tot).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v / all]);
}
const tierOf = (rule) => rule.split('.')[0];

// --- report -----------------------------------------------------------------

const game = of('game');
const exp = of('experimental');
const con = of('connected');
const NAMES = Object.keys(PROFILES).filter((p) => of(p).length);

P('# Decisión adaptativa, pasos 1 y 1b: referencia y quién decide');
P();
P('Generado por `research/adaptive-decision/analyze.js` a partir de `run.js`; no editar a mano.');
P(`Plan: \`docs/research/plan-decision-adaptativa.md\`. Commit \`${manifest.commit?.slice(0, 7)}\`${manifest.dirty ? ' (con cambios sin confirmar en el código medido)' : ''}, Node ${manifest.node}.`);
P(`Manifiesto con configuración resuelta, semillas y comandos: \`${OUT}/manifest.json\`.`);
P();
P('## Qué se midió');
P();
P(`Una Fagi sola, sin reproducción ni hermanas, ${HORIZON} s (dt ${DT}), ${EPISODES} mundos de desarrollo por perfil, mismas semillas en ambos perfiles.`);
P();
P('- `game`: organismo con los números del juego (`app/organism-on.js`), `LIFE` apagado.');
P('- `experimental`: lo mismo más `FORAGE`, `SITES`, `CHOICE` (modo 1, aprendida) y `LARDER`, con el mundo escaso de la fase 9: Fagi actual tal cual.');
P('- `connected`: `experimental` con el punto de decisión encendido (`DECIDE`, paso 1b): la misma elección aprendida, conectada. Referencia del plan desde el paso 2.');
P();
P('## Supervivencia');
P();
P('Medida principal del plan: `min(tiempo vivo, horizonte) / horizonte`, sobre todos los episodios (intervalo 95 % por remuestreo de mundos).');
P();
P('| Perfil | N | Supervivencia media | Vivas al final | Muertes | Comidas | Raciones al nido |');
P('|---|---|---|---|---|---|---|');
for (const p of NAMES) P(survivalRow(p));
P();
const pair = (a, b, as, bs) => {
  if (!a.length || a.length !== b.length) return;
  const d = paired(a.map((r) => r.survival), b.map((r) => r.survival));
  P(`Diferencia pareada ${as} − ${bs}: ${f3(d.diff)} [${f3(d.ci[0])}, ${f3(d.ci[1])}], descriptiva.`);
};
pair(exp, game, 'experimental', 'game');
pair(con, exp, 'connected', 'experimental');
const ceiling = (rs) => rs.filter((r) => r.survival === 1).length / rs.length;
P();
P(`Episodios en el techo (vivas al horizonte): ${NAMES.map((p) => `${p} ${pc(ceiling(of(p)))}`).join(', ')}.`);
P();

P('## Quién tiene el control');
P();
P('Tiempo en control de cada nivel de la jerarquía (`decision.js`), sumado sobre episodios.');
P();
P(`| Nivel | ${NAMES.join(' | ')} |`);
P(`|---|${NAMES.map(() => '---').join('|')}|`);
const tiers = (rs) => {
  const t = {};
  for (const [k, v] of shares(rs, 'byRule')) t[tierOf(k)] = (t[tierOf(k)] ?? 0) + v;
  return t;
};
const byTier = NAMES.map((p) => tiers(of(p)));
for (const t of ['survive', 'endure', 'decide', 'provide', 'clues', 'explore']) P(`| ${t} | ${byTier.map((x) => pc(x[t] ?? 0)).join(' | ')} |`);
P();
P('`decide` es el punto de decisión (solo `connected`); la comida a la vista, reflejo común, cuenta en `provide` como `provide.seen`.');
P();
P('Reglas con más tiempo en control (experimental):');
P();
P('| Regla | Tiempo |');
P('|---|---|');
for (const [k, v] of shares(exp, 'byRule').slice(0, 10)) P(`| \`${k}\` | ${pc(v)} |`);
P();
P(`Segmentos (cambio de regla, acción u objetivo) por minuto vivo: ${NAMES.map((p) => `${p} ${f2(mean(of(p).map((r) => r.perMinute)))}`).join(', ')}. Una "decisión" así contada se reevalúa cada fotograma; no equivale a una elección deliberada.`);
P();

P('## La elección: propuesta frente a ejecución');
P();
P('`choice.js` hace un plan (volver al sitio k o explorar) cuando tiene hambre y no ve comida. Sin el punto de decisión solo ofrece ese sitio a la jerarquía como candidato; con él (`connected`) el plan se ejecuta salvo que un reflejo común lo sustituya (niveles sobrevivir y aguantar, comida a la vista). El plan es la propuesta; la regla en control, la ejecución. Solo cuentan los segundos en que el plan corre (busca comida, despierta), como los cuenta `choice.js`.');
P();
P(`| | ${NAMES.filter((p) => p !== 'game').join(' | ')} |`);
P(`|---|${NAMES.filter((p) => p !== 'game').map(() => '---').join('|')}|`);
const planStats = (rs) => {
  const lived = sum(rs.map((r) => r.lived));
  const st = {};
  for (const k of ['site', 'explore']) {
    const secs = sum(rs.map((r) => r.plan[k].secs));
    const followed = sum(rs.map((r) => r.plan[k].followed));
    const reflex = sum(rs.map((r) => sum(Object.entries(r.plan[k].instead).filter(([rule]) => isReflex(rule)).map(([, v]) => v))));
    st[k] = { perEp: secs / rs.length, followed: followed / secs, reflex: reflex / secs, free: followed / (secs - reflex),
      unoffered: sum(rs.map((r) => r.plan[k].unoffered ?? 0)) / secs };
  }
  const plans = sum(rs.map((r) => (r.choice?.site ?? 0) + (r.choice?.explore ?? 0)));
  st.plans = plans / rs.length;
  st.share = mean(rs.map((r) => r.choice?.exploreShare).filter((x) => x != null));
  st.planTime = (st.site.perEp + st.explore.perEp) * rs.length / lived;
  return st;
};
const PS = NAMES.filter((p) => p !== 'game').map((p) => planStats(of(p)));
const rowOf = (label, f) => P(`| ${label} | ${PS.map(f).join(' | ')} |`);
rowOf('Planes por episodio (parte explorar)', (x) => `${f2(x.plans)} (${pc(x.share)})`);
rowOf('Tiempo con plan en curso / tiempo vivo', (x) => pc(x.planTime));
rowOf('Plan de sitio: segundos por episodio', (x) => f2(x.site.perEp));
rowOf('Plan de sitio: va a ese sitio', (x) => `**${pc(x.site.followed)}**`);
rowOf('Plan de sitio: sustituido por reflejos', (x) => pc(x.site.reflex));
rowOf('Plan de sitio: va a ese sitio, del tiempo sin reflejo', (x) => pc(x.site.free));
rowOf('Plan de sitio: el sitio no es candidato', (x) => pc(x.site.unoffered));
rowOf('Plan de explorar: segundos por episodio', (x) => f2(x.explore.perEp));
rowOf('Plan de explorar: busca', (x) => `**${pc(x.explore.followed)}**`);
rowOf('Plan de explorar: busca, del tiempo sin reflejo', (x) => pc(x.explore.free));
P();
P('"El sitio no es candidato" solo tiene sentido sin el punto de decisión: con él, el sitio se persigue sin pasar por la lista de candidatos.');
P();
for (const p of NAMES.filter((x) => x !== 'game')) {
  const rs = of(p);
  const secs = sum(rs.map((r) => r.plan.site.secs));
  const instead = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.plan.site.instead)) instead[k] = (instead[k] ?? 0) + v;
  P(`Quién controla mientras no se sigue el plan de sitio (${p}): ${Object.entries(instead).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `\`${k}\`${isReflex(k) ? ' (reflejo)' : ''} ${pc(v / secs)}`).join(', ')}.`);
  P();
  const outcomes = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.choice?.outcomes ?? {})) outcomes[k] = (outcomes[k] ?? 0) + v;
  P(`Cómo terminaron los planes (${p}, total): ${Object.entries(outcomes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  P();
}

P('## Repetibilidad');
P();
for (const p of Object.keys(PROFILES)) {
  const file = `${OUT}/check-${p}.json`;
  if (!existsSync(file)) { P(`- ${p}: sin comprobación.`); continue; }
  const again = JSON.parse(readFileSync(file, 'utf8'));
  const first = of(p)[0];
  P(`- ${p}, episodio 0 repetido en otro proceso: huella \`${first.fingerprint}\` / \`${again.fingerprint}\` ${first.fingerprint === again.fingerprint ? '✓ idéntica' : '✗ DISTINTA'}.`);
}
const traceFile = `${OUT}/trace-experimental-0.json`;
let trace = null;
if (existsSync(traceFile)) {
  trace = JSON.parse(readFileSync(traceFile, 'utf8'));
  P(`- Con traza completa activada la huella es \`${trace.fingerprint}\` ${trace.fingerprint === of('experimental')[0].fingerprint ? '✓ (trazar no altera el episodio)' : '✗ (trazar altera el episodio)'}.`);
}
P();

// The reading is written by hand, after the numbers, in its own file.
const READING = 'research/adaptive-decision/reading.md';
P('## Lectura');
P();
P(existsSync(READING) ? readFileSync(READING, 'utf8').trim() : 'Pendiente: escribir `research/adaptive-decision/reading.md` tras revisar los números.');
P();
writeFileSync(REPORT, `${lines.join('\n')}\n`);

// --- readable trace -----------------------------------------------------------

if (trace) {
  const T = [];
  T.push('# Traza legible: perfil experimental, episodio 0');
  T.push('');
  T.push(`Semilla ${trace.seed}, mapa ${trace.mapSeed}. ${trace.alive ? 'Viva al horizonte' : `Muere a los ${trace.lived} s (${trace.cause})`}. ${trace.segments.length} segmentos; se muestran los primeros 400 s.`);
  T.push('Cada fila es un tramo con la misma regla, acción y objetivo. Necesidades: hambre / sed (0-1) y energía, al inicio → al final.');
  T.push('');
  T.push('| t0–t1 (s) | Plan de `choice` | Regla en control | Acción | Objetivo | Hambre | Sed | Energía | Comió | Guardó |');
  T.push('|---|---|---|---|---|---|---|---|---|---|');
  // Merge the frame-by-frame flicker: consecutive segments with the same rule and action.
  const merged = [];
  for (const s of trace.segments) {
    const last = merged.at(-1);
    const planKey = s.plan ? `${s.plan.kind}${s.plan.id != null ? ` ${s.plan.id}` : ''}` : '—';
    if (last && last.rule === s.rule && last.action === s.action && last.planKey === planKey) {
      last.t1 = s.t1; last.after = s.after; last.ate += s.ate; last.stored += s.stored;
    } else merged.push({ ...s, planKey });
  }
  for (const s of merged.filter((x) => x.t0 < 400)) {
    T.push(`| ${s.t0}–${s.t1} | ${s.planKey} | \`${s.rule}\` | ${s.action} | ${s.targetKind ?? '—'} | ${f2(s.before.hunger)}→${f2(s.after.hunger)} | ${f2(s.before.thirst)}→${f2(s.after.thirst)} | ${Math.round(s.before.energy)}→${Math.round(s.after.energy)} | ${s.ate || ''} | ${s.stored || ''} |`);
  }
  writeFileSync(`${OUT}/trace-experimental-0.md`, `${T.join('\n')}\n`);
}
console.log(`${REPORT}, ${OUT}/manifest.json${trace ? `, ${OUT}/trace-experimental-0.md` : ''}`);
