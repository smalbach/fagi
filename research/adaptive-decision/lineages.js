// Rules of conduct, revision 1 (docs/research/plan-reglas-de-conducta.md):
// learning across lives. Resumable: every life is its own process and file.
//
//   node research/adaptive-decision/lineages.js --tag <name> [--mode select|random|current|heuristic]
//        [--lineages 10] [--generations 20] [--size 12] [--group lin] [--version 2] [--jobs 16]
//
// A lineage is `size` Fagis per generation, each in a world of her own that no
// other life uses (world n = lineage·generations·size + generation·size + k),
// the families taking turns (stable, invert, novel by n). A daughter is born
// with the live lines of conduct of a mother from the generation before — the
// lines only, with what they had gathered, never the memory of bites — and
// keeps judging them (CONDUCT.inherit). The mother is drawn with a chance
// proportional to how long she lived (`select`), or at random (`random`).
// `current` and `heuristic` run the same worlds with no lines at all, for
// pairing.

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { rng } from '../../scripts/batch/random.js';
import { FOOD_FAMILIES } from './foodworlds.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const TAG = opt('--tag', null);
const MODE = opt('--mode', 'select');
const R = Number(opt('--lineages', 10));
const G = Number(opt('--generations', 20));
const K = Number(opt('--size', 12));
const GROUP = opt('--group', 'lin');
const JOBS = Number(opt('--jobs', 16));
// Version: 1 and 2, the two of plan revision 1 (2: fruit left because of a line count against it);
// 3, plan revision 2 (every ban has a way out); 4, its variant 2 (and lines are lost at birth now and then).
const VERSION = Number(opt('--version', 2));
const OUT = `research/results/adaptive-decision/lineages/${TAG ?? MODE}`;
const run = promisify(execFile);
const BATTERY = 'research/adaptive-decision/battery.js';

export const worldOf = (r, g, k) => r * G * K + g * K + k;
export const familyOf = (n) => FOOD_FAMILIES[n % FOOD_FAMILIES.length];
const fileOf = (r, g, k) => `${OUT}/r${r}-g${g}-k${k}.json`;

// What a daughter inherits from her mother's life: her live lines, with what
// each had gathered (a line never judged in her life keeps what it brought).
// Version 4 (plan revision 2, variant 2): each line a daughter would inherit
// is lost with chance MUTATION, so sisters differ and selection has something
// to choose between.
const MUTATION = 0.2;
function inheritance(row, rnd = null) {
  if (!row?.conduct) return [];
  return row.conduct.lines.filter((l) => l.retired == null && !(rnd && rnd() < MUTATION)).map((l) => ({
    id: l.id, if: l.if, do: l.do,
    ...(l.lineage || l.inherited ? { lineage: l.lineage ?? l.inherited } : {}),
  }));
}

function mothers(prev, r, g) {
  const rnd = rng(9173 + r * 1009 + g * 31);
  return Array.from({ length: K }, () => {
    if (MODE === 'random') return prev[Math.floor(rnd() * prev.length)];
    const w = prev.map((x) => x.survival);
    const total = w.reduce((a, b) => a + b, 0);
    if (total <= 0) return prev[Math.floor(rnd() * prev.length)];
    let t = rnd() * total;
    for (let i = 0; i < prev.length; i++) { t -= w[i]; if (t <= 0) return prev[i]; }
    return prev.at(-1);
  });
}

async function life(r, g, k, born) {
  const file = fileOf(r, g, k);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const n = worldOf(r, g, k);
  const plain = MODE === 'current' || MODE === 'heuristic';
  const sets = plain ? {} : {
    'CONDUCT.enabled': 1, 'CONDUCT.learn': 1, 'CONDUCT.inherit': 1, 'CONDUCT.declined': VERSION >= 2 ? 1 : 0, 'CONDUCT.born': born,
    // Revision 2 of the plan (version 3 here): every ban has a way out, the kind before her hunger, three harms behind a line.
    ...(VERSION >= 3 ? { 'CONDUCT.explore': 0.2, 'CONDUCT.kindFirst': 1, 'CONDUCT.minSupport': 3 } : {}),
  };
  const controller = MODE === 'current' ? 'current' : MODE === 'heuristic' ? 'heuristic:1:75' : 'learned';
  const piece = { domain: 'food', controller, family: familyOf(n), i: n, group: GROUP, sets };
  await run('node', [BATTERY, '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  const row = { r, g, k, n, ...JSON.parse(readFileSync(`${file}.tmp`, 'utf8')) };
  // What she was born with, kept beside her, so a line her life never judged still carries its past.
  if (row.conduct) {
    const byId = Object.fromEntries(born.map((b) => [b.id, b.lineage]));
    for (const l of row.conduct.lines) if (!l.lineage && byId[l.id]) l.inherited = byId[l.id];
  }
  writeFileSync(`${file}.tmp`, JSON.stringify(row));
  renameSync(`${file}.tmp`, file);
  return row;
}

async function pool(tasks) {
  const out = new Array(tasks.length);
  let next = 0;
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (next < tasks.length) { const i = next++; out[i] = await tasks[i](); }
  }));
  return out;
}

mkdirSync(OUT, { recursive: true });
let prev = Array.from({ length: R }, () => null);
for (let g = 0; g < G; g++) {
  const tasks = [];
  for (let r = 0; r < R; r++) {
    const ms = g === 0 ? Array(K).fill(null) : mothers(prev[r], r, g);
    for (let k = 0; k < K; k++) {
      const rnd = VERSION >= 4 ? rng(7717 + r * 1009 + g * 31 + k) : null;
      const born = inheritance(ms[k], rnd);
      tasks.push(() => life(r, g, k, born));
    }
  }
  const rows = await pool(tasks);
  prev = Array.from({ length: R }, (_, r) => rows.slice(r * K, (r + 1) * K));
  const mean = rows.reduce((a, x) => a + x.survival, 0) / rows.length;
  console.log(`${TAG ?? MODE} generation ${g}: survival ${mean.toFixed(3)}`);
}
