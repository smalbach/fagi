// El informe en texto: cada corrida, cuánto se parecen y un veredicto.

import { round, media, desv, coseno, parecidoReparto, divergencia, pares } from './estadistica.js';

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

export function informe(opts, runs) {
  const L = [];
  L.push(`mapa ${opts.mapSeed} · ${runs.length} corridas · máx ${opts.duration}s · dt ${opts.dt} · mundo ${opts.worldVaries ? 'varía' : 'fijo'}`);
  if (opts.sets.length) L.push('cambios: ' + opts.sets.map(([r, v]) => `${r.join('.')}=${JSON.stringify(v)}`).join(' '));
  L.push('');
  L.push(...informeCorridas(runs));
  L.push(...informeDispersion(runs));
  L.push(...informeAcciones(runs));
  L.push(...informePrimeros(runs));
  L.push(...informeFases(opts, runs));
  if (runs.length > 1) L.push(...informeParecido(runs));
  return L.join('\n');
}

function informeCorridas(runs) {
  const L = [];
  L.push(pad('semilla', 9) + pad('vivió', 8) + pad('causa', 8) + pad('comió', 7) + pad('bebió', 7) + pad('guardó', 8) + pad('1ªagua', 8) + pad('1ªcomida', 10) + 'huella');
  for (const r of runs) {
    L.push(pad(r.seed, 9) + pad(r.lived, 8) + pad(r.cause ?? 'vive', 8) + pad(r.eaten, 7) + pad(r.drunk, 7) + pad(r.stored, 8) + pad(r.firstDrink ?? '-', 8) + pad(r.firstMeal ?? '-', 10) + r.fingerprint);
  }
  L.push('');
  return L;
}

function informeDispersion(runs) {
  const L = [];
  const num = (k) => runs.map((r) => r[k]).filter((x) => x != null);
  const linea = (nombre, xs) => {
    if (!xs.length) return `${pad(nombre, 14)}sin datos`;
    const m = media(xs);
    return `${pad(nombre, 14)}media ${pad(round(m), 8)} desv ${pad(round(desv(xs)), 8)} cv ${pad(m ? round(desv(xs) / m * 100, 0) + '%' : '-', 6)} min ${pad(round(Math.min(...xs)), 7)} max ${round(Math.max(...xs))}`;
  };
  L.push('dispersión');
  for (const k of ['lived', 'eaten', 'drunk', 'stored', 'firstDrink', 'firstMeal', 'exploreLegs', 'waterFirst', 'waterLater']) L.push('  ' + linea(k, num(k)));

  const causas = {};
  for (const r of runs) causas[r.cause ?? 'vive'] = (causas[r.cause ?? 'vive'] ?? 0) + 1;
  L.push('  ' + pad('desenlace', 14) + Object.entries(causas).map(([k, v]) => `${k} ${v}/${runs.length}`).join(' · '));
  L.push('');
  return L;
}

// Reparto medio del tiempo por acción.
function informeAcciones(runs) {
  const L = [];
  const total = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.actions)) total[k] = (total[k] ?? 0) + v / r.lived;
  L.push('tiempo por acción (media de % por corrida, ± desv)');
  for (const [k] of Object.entries(total).sort((a, b) => b[1] - a[1])) {
    const xs = runs.map((r) => ((r.actions[k] ?? 0) / r.lived) * 100);
    L.push(`  ${pad(k, 20)} ${pad(round(media(xs)) + '%', 8)} ± ${round(desv(xs))}`);
  }
  L.push('');
  return L;
}

// Qué recurso encuentra primero.
function informePrimeros(runs) {
  const L = [];
  const primeros = {};
  for (const r of runs) {
    const agua = r.visited.find((v) => v.startsWith('agua')) ?? 'ninguna';
    const arbol = r.visited.find((v) => v.startsWith('arbol')) ?? 'ninguno';
    primeros[`agua ${agua}`] = (primeros[`agua ${agua}`] ?? 0) + 1;
    primeros[`árbol ${arbol}`] = (primeros[`árbol ${arbol}`] ?? 0) + 1;
  }
  L.push('primer recurso que pisa');
  for (const [k, v] of Object.entries(primeros).sort()) L.push(`  ${pad(k, 20)} ${v}/${runs.length}`);
  L.push('');
  return L;
}

function informeFases(opts, runs) {
  const L = [];
  const fases = opts.block != null ? ['antes', 'despues'] : ['antes'];
  const campos = [
    ['foodTrip', 'ida a por comida (s)'],
    ['onTrail', 'ida con feromona debajo (%)'],
    ['followsTrail', 'ida siguiendo feromona (%)'],
    ['ignoresTrail', 'feromona debajo e ignorada (%)'],
    ['byMemory', 'ida al árbol de memoria (%)'],
    ['stuck', 'atascada (s)'],
    ['waterTrip', 'llegar al agua (s)'],
  ];
  L.push(opts.block != null
    ? `muro a los ${opts.block}s (rocas puestas de media: ${round(media(runs.map((r) => Math.max(0, r.rocks))))})`
    : 'viajes a por comida');
  L.push('  ' + pad('', 34) + fases.map((f) => pad(f === 'despues' ? 'después' : f, 12)).join(''));
  for (const [k, nombre] of campos) {
    L.push('  ' + pad(nombre, 34) + fases.map((f) => {
      const xs = runs.map((r) => r.phases[f]?.[k]).filter((x) => x != null);
      return pad(xs.length ? round(media(xs)) : '-', 12);
    }).join(''));
  }
  const acciones = new Set(runs.flatMap((r) => fases.flatMap((f) => Object.keys(r.phases[f]?.tripActions ?? {}))));
  L.push('  en la ida, % del tiempo haciendo:');
  for (const a of [...acciones].sort()) {
    L.push('    ' + pad(a, 32) + fases.map((f) => pad(round(media(runs.map((r) => r.phases[f]?.tripActions?.[a] ?? 0))), 12)).join(''));
  }
  if (opts.block != null) {
    const muertas = runs.filter((r) => !r.alive && r.lived >= opts.block).length;
    L.push(`  mueren después del muro: ${muertas}/${runs.length}`);
  }
  L.push('');
  return L;
}

function informeParecido(runs) {
  const L = [];
  const reparto = pares(runs, (a, b) => parecidoReparto(a.actions, b.actions));
  const calor = pares(runs, (a, b) => coseno(a.heat, b.heat));
  const div = pares(runs, (a, b) => divergencia(a.path, b.path)).filter((x) => x != null);
  L.push('parecido entre pares de corridas (1 = iguales)');
  L.push(`  reparto de acciones   media ${round(media(reparto), 3)}  min ${round(Math.min(...reparto), 3)}`);
  L.push(`  mapa de calor         media ${round(media(calor), 3)}  min ${round(Math.min(...calor), 3)}`);
  L.push(`  caminos se separan    a los ${div.length ? round(media(div)) + 's de media' : 'nunca (>60px)'}`);
  const unicas = new Set(runs.map((r) => r.fingerprint)).size;
  L.push(`  sesiones distintas    ${unicas}/${runs.length}`);
  L.push('');
  L.push(veredicto(runs, reparto, calor));
  return L;
}

function veredicto(runs, reparto, calor) {
  const vidas = runs.map((r) => r.lived);
  const cv = desv(vidas) / (media(vidas) || 1);
  const r = media(reparto), c = media(calor);
  const partes = [];
  partes.push(r > 0.9 ? 'reparte el tiempo casi igual' : r > 0.75 ? 'reparte el tiempo parecido' : 'reparte el tiempo muy distinto');
  partes.push(c > 0.8 ? 'recorre las mismas zonas' : c > 0.5 ? 'recorre zonas parecidas' : 'recorre zonas distintas');
  partes.push(cv < 0.15 ? 'supervivencia estable' : cv < 0.4 ? 'supervivencia algo variable' : 'supervivencia muy variable');
  return `veredicto: ${partes.join(', ')} (cv vida ${round(cv * 100, 0)}%).`;
}
