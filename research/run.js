// Runs a design: every cell (a combination of factor levels) × every seed, in
// parallel, one lineage per task.
//
//   node research/run.js --design research/designs/pilot.json [--workers 4] [--seeds 60] [--out DIR]
//
// A design is JSON:
//   { "name": "pilot", "description": "...",
//     "base":    { lab parameters shared by every cell (research/lab/params.js) },
//     "factors": { "format": ["rule", "verdict"], "sets.SOCIAL.trust": [0.4, 0.8] },
//     "seeds": 30, "seed0": 1 }
// A factor named "sets.GROUP.key" changes src/config.js for that cell.
//
// Output, in DIR (research/results/<name> by default):
//   rows.csv          one row per generation of every lineage;
//   genealogy.jsonl   one line per belief that went from ant to ant;
//   manifest.json     the design, the commit and when it ran.
// It resumes: a (cell, seed) already in rows.csv is not run again. Every cell
// runs on the same seeds, so cells are compared on the same worlds.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { params } from './lab/params.js';
import { runLineage } from './lab/lineage.js';
import { rng } from '../scripts/batch/random.js';

const HERE = fileURLToPath(import.meta.url);

// --- the design -------------------------------------------------------------

export function cells(design) {
  const factors = Object.entries(design.factors ?? {});
  let out = design.sample ? samplePoints(design.sample) : [{}];
  for (const [name, levels] of factors) out = out.flatMap((c) => levels.map((v) => ({ ...c, [name]: v })));
  return out;
}

// A sensitivity design samples parameters instead of listing them:
//   "sample": { "n": 64, "seed": 1, "ranges": { "budget": [1, 8, "int"], "sets.SOCIAL.trust": [0.3, 0.9] } }
// Latin hypercube: each range is cut in n strata and every stratum is used
// once, so n points cover every parameter evenly. Each point is crossed with
// the factors, so factor levels are still compared on the same point and seeds.
export function samplePoints({ n, seed = 1, ranges }) {
  const rnd = rng(seed * 2654435761);
  const names = Object.keys(ranges);
  const columns = names.map((name) => {
    const [lo, hi, kind] = ranges[name];
    const strata = Array.from({ length: n }, (_, i) => (i + rnd()) / n);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [strata[i], strata[j]] = [strata[j], strata[i]];
    }
    return strata.map((u) => {
      const v = lo + u * (hi - lo);
      return kind === 'int' ? Math.min(hi, Math.floor(lo + u * (hi - lo + 1))) : Math.round(v * 1e4) / 1e4;
    });
  });
  return Array.from({ length: n }, (_, k) => ({
    point: k, ...Object.fromEntries(names.map((name, i) => [name, columns[i][k]])),
  }));
}

export const cellId = (cell) => Object.entries(cell).map(([k, v]) => `${k}=${v}`).join(';') || 'base';

export function paramsOf(design, cell) {
  const over = { ...design.base, sets: { ...(design.base?.sets ?? {}) } };
  for (const [k, v] of Object.entries(cell)) {
    if (k === 'point') continue;
    if (k.startsWith('sets.')) over.sets[k.slice(5)] = v;
    else over[k] = v;
  }
  return params(over);
}

// --- CSV --------------------------------------------------------------------

export function readCsv(file) {
  if (!existsSync(file)) return [];
  const [head, ...lines] = readFileSync(file, 'utf8').trim().split('\n');
  if (!head) return [];
  const cols = head.split(',');
  return lines.filter(Boolean).map((l) => {
    const vals = l.split(',');
    const row = {};
    cols.forEach((c, i) => {
      const v = vals[i];
      row[c] = v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v;
    });
    return row;
  });
}

const csvValue = (v) => String(v).replace(/[,\n]/g, ';');

// --- main -------------------------------------------------------------------

function args(argv) {
  const o = { design: null, workers: availableParallelism(), seeds: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--design') o.design = argv[++i];
    else if (a === '--workers') o.workers = Number(argv[++i]);
    else if (a === '--seeds') o.seeds = Number(argv[++i]);
    else if (a === '--out') o.out = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!o.design) throw new Error('usage: node research/run.js --design FILE [--workers N] [--seeds N] [--out DIR]');
  return o;
}

async function main() {
  const o = args(process.argv.slice(2));
  const design = JSON.parse(readFileSync(o.design, 'utf8'));
  const seeds = o.seeds ?? design.seeds ?? 30;
  const seed0 = design.seed0 ?? 1;
  const out = o.out ?? `research/results/${design.name}`;
  mkdirSync(out, { recursive: true });
  const rowsFile = `${out}/rows.csv`;
  const genFile = `${out}/genealogy.jsonl`;

  const all = cells(design);
  all.forEach((c) => paramsOf(design, c));   // fail now, not in a worker
  const factorNames = [...Object.keys(all[0])];
  const done = new Set(readCsv(rowsFile).map((r) => `${r.cell}|${r.seed}`));
  const tasks = [];
  for (let s = seed0; s < seed0 + seeds; s++) {
    for (const cell of all) if (!done.has(`${cellId(cell)}|${s}`)) tasks.push({ cell, seed: s });
  }
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { /* not a repo */ }
  writeFileSync(`${out}/manifest.json`, JSON.stringify({
    design, seeds, seed0, commit, node: process.version, startedAt: new Date().toISOString(),
    cells: all.length, lineages: all.length * seeds, pending: tasks.length,
  }, null, 1));
  if (!tasks.length) { console.log(`nothing to run: ${out} is complete`); return; }

  let header = existsSync(rowsFile) && readFileSync(rowsFile, 'utf8').length > 0;
  const write = (task, result) => {
    const id = cellId(task.cell);
    const lead = { cell: id, ...Object.fromEntries(factorNames.map((f) => [f, task.cell[f]])), seed: task.seed };
    const lines = result.rows.map((r) => ({ ...lead, ...r }));
    if (!header) { appendFileSync(rowsFile, `${Object.keys(lines[0]).join(',')}\n`); header = true; }
    appendFileSync(rowsFile, lines.map((l) => Object.values(l).map(csvValue).join(',')).join('\n') + '\n');
    if (result.genealogy.length) {
      appendFileSync(genFile, result.genealogy.map(({ trail, ...g }) => JSON.stringify({ ...lead, ...g })).join('\n') + '\n');
    }
  };

  const t0 = Date.now();
  const total = tasks.length;
  let finished = 0;
  let shown = 0;
  const n = Math.max(1, Math.min(o.workers, tasks.length));
  await Promise.all(Array.from({ length: n }, () => new Promise((resolve, reject) => {
    const w = new Worker(HERE, { workerData: { design } });
    const next = () => {
      const task = tasks.shift();
      if (!task) { w.terminate(); resolve(); return; }
      w.once('message', (result) => {
        write(task, result);
        finished += 1;
        if (Date.now() - shown > 1000 || finished === total) {
          shown = Date.now();
          const rate = finished / ((Date.now() - t0) / 1000);
          process.stderr.write(`\r${finished}/${total} lineages · ${rate.toFixed(1)}/s   `);
        }
        next();
      });
      w.postMessage(task);
    };
    w.on('error', reject);
    next();
  })));
  process.stderr.write('\n');
  console.log(`${finished} lineages in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${out}`);
}

if (isMainThread) {
  if (process.argv[1] === HERE) main().catch((e) => { console.error(e.message); process.exit(1); });
} else {
  parentPort.on('message', ({ cell, seed }) => {
    parentPort.postMessage(runLineage(paramsOf(workerData.design, cell), seed));
  });
}
