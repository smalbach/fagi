// Banco de pruebas: el MISMO mapa, los mismos recursos, varias Fagis.
//
// Corre la simulación sin navegador (solo instinto, sin API de decisión) y
// compara las sesiones entre sí: cuánto viven, de qué mueren, en qué gastan
// el tiempo y por dónde andan. Sirve para ver si su conducta es estable o si
// cada partida es una lotería.
//
// El azar va en tres corrientes separadas, cada una con su semilla:
//   mapa   → dónde está cada cosa (y el viento inicial). Igual en todas.
//   mundo  → viento y fruta que cae. Igual en todas salvo --world-varies.
//   Fagi   → sus decisiones con azar (rumbo inicial, giros, deriva de la
//            memoria). Distinta en cada corrida: es lo que se pone a prueba.
// Con la misma semilla de Fagi dos veces la sesión sale idéntica (--check).
//
//   node scripts/batch.js --map-seed 42 --runs 20 --duration 900
//   node scripts/batch.js --map-seed 42 --runs 20 --json out.json
//
// Las piezas están en batch/: argumentos, azar con semilla, una corrida,
// estadística e informe. Aquí solo se corren y se cuentan.

import { args, aplicar } from './batch/argumentos.js';
import { correr } from './batch/corrida.js';
import { informe } from './batch/informe.js';
import { round } from './batch/estadistica.js';
import { writeFileSync } from 'node:fs';

// --- main -------------------------------------------------------------------

const opts = args(process.argv.slice(2));
aplicar(opts.sets);
const runs = [];
const t0 = Date.now();
for (let i = 0; i < opts.runs; i++) {
  const r = correr(opts, opts.seed0 + i);
  runs.push(r);
  process.stderr.write(`\rcorrida ${i + 1}/${opts.runs}`);
}
process.stderr.write(`\r${' '.repeat(30)}\r`);

console.log(informe(opts, runs));
console.log(`\n(${round((Date.now() - t0) / 1000)}s reales)`);

if (opts.check) {
  const otra = correr(opts, opts.seed0);
  const ok = otra.fingerprint === runs[0].fingerprint && JSON.stringify(otra.sequence) === JSON.stringify(runs[0].sequence);
  console.log(ok
    ? `check: semilla ${opts.seed0} repetida da la misma sesión ✓`
    : `check: semilla ${opts.seed0} repetida da OTRA sesión ✗ — hay azar fuera de las semillas`);
  if (!ok) process.exitCode = 1;
}

if (opts.json) {
  writeFileSync(opts.json, JSON.stringify({ opts, runs }, null, 1));
  console.log(`datos en ${opts.json}`);
}
