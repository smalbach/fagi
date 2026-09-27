// Argumentos de la línea de órdenes y los cambios de parámetros (--profile, --set).

import * as CONFIG from '../../src/config.js';
import { readFileSync } from 'node:fs';

export function args(argv) {
  const o = { mapSeed: 1, runs: 10, duration: 600, dt: 0.05, seed0: 1000, worldVaries: false, check: false, json: null, cell: 80, sets: [], block: null, rock: 30 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--map-seed') o.mapSeed = Number(next());
    else if (a === '--runs') o.runs = Number(next());
    else if (a === '--duration') o.duration = Number(next());
    else if (a === '--dt') o.dt = Number(next());
    else if (a === '--seed') o.seed0 = Number(next());
    else if (a === '--world-varies') o.worldVaries = true;
    else if (a === '--check') o.check = true;
    else if (a === '--json') o.json = next();
    else if (a === '--cell') o.cell = Number(next());
    else if (a === '--block') o.block = Number(next());
    else if (a === '--rock') o.rock = Number(next());
    else if (a === '--profile') o.sets.push(...profile(next()));
    else if (a === '--set') o.sets.push(assignment(next()));
    else if (a === '-h' || a === '--help') { console.log(help()); process.exit(0); }
    else { console.error(`argumento desconocido: ${a}\n\n${help()}`); process.exit(1); }
  }
  return o;
}

function help() {
  return `uso: node scripts/batch.js [opciones]
  --map-seed N     semilla del mapa (igual en todas las corridas)   [1]
  --runs N         cuántas Fagis                                    [10]
  --duration S     segundos simulados como máximo por corrida       [600]
  --dt S           paso de simulación                               [0.05]
  --seed N         semilla de la first Fagi (luego +1, +2...)     [1000]
  --world-varies   el viento y la fruta también cambian por corrida
  --check          repeats la first corrida y exige que salga igual
  --cell PX        tamaño de casilla del mapa de calor              [80]
  --profile FILE   JSON con parámetros a cambiar: {"HUNGER": {"rate": 0.1}}
  --set A.b=V      cambia un parámetro suelto (se puede repetir)
  --block S        a los S segundos pone un muro de rocas en la recta nest-árbol
                   y en la recta nest-water, y compara antes y después
  --rock PX        radio de cada rock del muro                      [30]
  --json FILE      guarda todos los datos en un archivo`;
}

// Los parámetros se cambian sobre los objetos de config.js, que son los que
// lee toda la simulación: así se prueba un perfil sin tocar el archivo.
function profile(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const lower = (routeOf, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, w] of Object.entries(v)) lower([...routeOf, k], w);
    else if (!routeOf.at(-1).startsWith('_')) out.push([routeOf, v]);   // "_nota": comentarios
  };
  for (const [k, v] of Object.entries(data)) if (!k.startsWith('_')) lower([k], v);
  return out;
}

function assignment(txt) {
  const [routeOf, value] = txt.split('=');
  return [routeOf.split('.'), JSON.parse(value)];
}

export function applySets(sets) {
  for (const [routeOf, v] of sets) {
    let o = CONFIG;
    for (const k of routeOf.slice(0, -1)) {
      o = o[k];
      if (o == null) throw new Error(`parámetro desconocido: ${routeOf.join('.')}`);
    }
    if (!(routeOf.at(-1) in o)) throw new Error(`parámetro desconocido: ${routeOf.join('.')}`);
    o[routeOf.at(-1)] = v;
  }
}
