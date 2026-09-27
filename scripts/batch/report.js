// El informe en texto: cada corrida, cuánto se parecen y un veredicto.

import { round, mean, stdev, coseno, similarSplit, divergence, pairs } from './stats.js';

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

export function report(opts, runs) {
  const L = [];
  L.push(`mapa ${opts.mapSeed} · ${runs.length} corridas · máx ${opts.duration}s · dt ${opts.dt} · mundo ${opts.worldVaries ? 'varía' : 'fijo'}`);
  if (opts.sets.length) L.push('cambios: ' + opts.sets.map(([r, v]) => `${r.join('.')}=${JSON.stringify(v)}`).join(' '));
  L.push('');
  L.push(...reportRuns(runs));
  L.push(...reportSpread(runs));
  L.push(...reportActions(runs));
  L.push(...reportFirsts(runs));
  L.push(...reportPhases(opts, runs));
  if (runs.length > 1) L.push(...reportSimilarity(runs));
  return L.join('\n');
}

function reportRuns(runs) {
  const L = [];
  L.push(pad('semilla', 9) + pad('vivió', 8) + pad('causa', 8) + pad('comió', 7) + pad('bebió', 7) + pad('guardó', 8) + pad('1ªagua', 8) + pad('1ªcomida', 10) + 'huella');
  for (const r of runs) {
    L.push(pad(r.seed, 9) + pad(r.lived, 8) + pad(r.cause ?? 'vive', 8) + pad(r.eaten, 7) + pad(r.drunk, 7) + pad(r.stored, 8) + pad(r.firstDrink ?? '-', 8) + pad(r.firstMeal ?? '-', 10) + r.fingerprint);
  }
  L.push('');
  return L;
}

function reportSpread(runs) {
  const L = [];
  const num = (k) => runs.map((r) => r[k]).filter((x) => x != null);
  const line = (name, xs) => {
    if (!xs.length) return `${pad(name, 14)}sin datos`;
    const m = mean(xs);
    return `${pad(name, 14)}medium ${pad(round(m), 8)} desv ${pad(round(stdev(xs)), 8)} cv ${pad(m ? round(stdev(xs) / m * 100, 0) + '%' : '-', 6)} min ${pad(round(Math.min(...xs)), 7)} max ${round(Math.max(...xs))}`;
  };
  L.push('dispersión');
  for (const k of ['lived', 'eaten', 'drunk', 'stored', 'firstDrink', 'firstMeal', 'exploreLegs', 'waterFirst', 'waterLater']) L.push('  ' + line(k, num(k)));

  const causes = {};
  for (const r of runs) causes[r.cause ?? 'vive'] = (causes[r.cause ?? 'vive'] ?? 0) + 1;
  L.push('  ' + pad('desenlace', 14) + Object.entries(causes).map(([k, v]) => `${k} ${v}/${runs.length}`).join(' · '));
  L.push('');
  return L;
}

// Reparto medio del tiempo por acción.
function reportActions(runs) {
  const L = [];
  const total = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.actions)) total[k] = (total[k] ?? 0) + v / r.lived;
  L.push('tiempo por acción (media de % por corrida, ± desv)');
  for (const [k] of Object.entries(total).sort((a, b) => b[1] - a[1])) {
    const xs = runs.map((r) => ((r.actions[k] ?? 0) / r.lived) * 100);
    L.push(`  ${pad(k, 20)} ${pad(round(mean(xs)) + '%', 8)} ± ${round(stdev(xs))}`);
  }
  L.push('');
  return L;
}

// Qué recurso encuentra primero.
function reportFirsts(runs) {
  const L = [];
  const firsts = {};
  for (const r of runs) {
    const water = r.visited.find((v) => v.startsWith('water')) ?? 'ninguna';
    const tree = r.visited.find((v) => v.startsWith('tree')) ?? 'ninguno';
    firsts[`water ${water}`] = (firsts[`water ${water}`] ?? 0) + 1;
    firsts[`árbol ${tree}`] = (firsts[`árbol ${tree}`] ?? 0) + 1;
  }
  L.push('primer recurso que pisa');
  for (const [k, v] of Object.entries(firsts).sort()) L.push(`  ${pad(k, 20)} ${v}/${runs.length}`);
  L.push('');
  return L;
}

function reportPhases(opts, runs) {
  const L = [];
  const phaseList = opts.block != null ? ['antes', 'despues'] : ['antes'];
  const fieldsOf = [
    ['foodTrip', 'ida a por comida (s)'],
    ['onTrail', 'ida con feromona debajo (%)'],
    ['followsTrail', 'ida siguiendo feromona (%)'],
    ['ignoresTrail', 'feromona debajo e ignorada (%)'],
    ['byMemory', 'ida al árbol de memoria (%)'],
    ['stuck', 'atascada (s)'],
    ['waterTrip', 'llegar al agua (s)'],
  ];
  L.push(opts.block != null
    ? `muro a los ${opts.block}s (rocas puestas de medium: ${round(mean(runs.map((r) => Math.max(0, r.rocks))))})`
    : 'viajes a por comida');
  L.push('  ' + pad('', 34) + phaseList.map((f) => pad(f === 'despues' ? 'después' : f, 12)).join(''));
  for (const [k, name] of fieldsOf) {
    L.push('  ' + pad(name, 34) + phaseList.map((f) => {
      const xs = runs.map((r) => r.phases[f]?.[k]).filter((x) => x != null);
      return pad(xs.length ? round(mean(xs)) : '-', 12);
    }).join(''));
  }
  const actions = new Set(runs.flatMap((r) => phaseList.flatMap((f) => Object.keys(r.phases[f]?.tripActions ?? {}))));
  L.push('  en la ida, % del tiempo haciendo:');
  for (const a of [...actions].sort()) {
    L.push('    ' + pad(a, 32) + phaseList.map((f) => pad(round(mean(runs.map((r) => r.phases[f]?.tripActions?.[a] ?? 0))), 12)).join(''));
  }
  if (opts.block != null) {
    const deadOnes = runs.filter((r) => !r.alive && r.lived >= opts.block).length;
    L.push(`  mueren después del muro: ${deadOnes}/${runs.length}`);
  }
  L.push('');
  return L;
}

function reportSimilarity(runs) {
  const L = [];
  const split = pairs(runs, (a, b) => similarSplit(a.actions, b.actions));
  const warmth = pairs(runs, (a, b) => coseno(a.heat, b.heat));
  const div = pairs(runs, (a, b) => divergence(a.path, b.path)).filter((x) => x != null);
  L.push('parecido entre pares de corridas (1 = iguales)');
  L.push(`  reparto de acciones   medium ${round(mean(split), 3)}  min ${round(Math.min(...split), 3)}`);
  L.push(`  mapa de calor         medium ${round(mean(warmth), 3)}  min ${round(Math.min(...warmth), 3)}`);
  L.push(`  caminos se separan    a los ${div.length ? round(mean(div)) + 's de media' : 'nunca (>60px)'}`);
  const uniqueOnes = new Set(runs.map((r) => r.fingerprint)).size;
  L.push(`  sesiones distintas    ${uniqueOnes}/${runs.length}`);
  L.push('');
  L.push(verdict(runs, split, warmth));
  return L;
}

function verdict(runs, split, warmth) {
  const lives = runs.map((r) => r.lived);
  const cv = stdev(lives) / (mean(lives) || 1);
  const r = mean(split), c = mean(warmth);
  const parts = [];
  parts.push(r > 0.9 ? 'reparte el tiempo casi igual' : r > 0.75 ? 'reparte el tiempo parecido' : 'reparte el tiempo muy distinto');
  parts.push(c > 0.8 ? 'recorre las mismas zonas' : c > 0.5 ? 'recorre zonas parecidas' : 'recorre zonas distintas');
  parts.push(cv < 0.15 ? 'supervivencia estable' : cv < 0.4 ? 'supervivencia algo variable' : 'supervivencia muy variable');
  return `veredicto: ${parts.join(', ')} (cv vida ${round(cv * 100, 0)}%).`;
}
