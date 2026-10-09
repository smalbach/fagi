// The colonies' history (evolution-modal.js): what each one carries, every so
// often, so the game can show how they change over the years.
//
// Every EVERY seconds of world time, for each nest: how many live in it, the
// mean of each organ's gene and body (MORPH), the epigenetic mark of size, the
// lines of conduct they carry that they were not born with, and how far the
// generations have gone. Only reads the colony: it draws nothing and changes
// nothing, so a life recorded with it is the same life.

import { SEASONS } from './config.js';
import { nestsOf } from './world.js';
import { programOf } from './program.js';

export const EVERY = 120;            // seconds of world time between samples
export const ORGANS = ['muscle', 'brain', 'size', 'gut', 'eyes', 'antennae'];
const MAX = 1200;                    // samples kept; past it, every other one is dropped

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

export function evolutionOf(world) {
  return world.evolution ?? null;
}

// One look at every nest.
export function sampleColonies(world) {
  const ants = world.colony?.ants ?? [];
  const nests = nestsOf(world);
  const first = nests[0];
  return nests.map((nest) => {
    const here = ants.filter((f) => f.alive && (f.home ?? first?.id) === nest.id);
    const grown = here.filter((f) => f.lifeStage !== 'juvenile');
    const pool = grown.length ? grown : here;
    const gene = {};
    const body = {};
    for (const k of ORGANS) {
      gene[k] = r3(mean(pool.map((f) => f.genome?.morph?.[k]).filter(Number.isFinite)));
      body[k] = r3(mean(pool.map((f) => f.morph?.[k]).filter(Number.isFinite)));
    }
    const lines = pool.map((f) => (f.brain ? programOf(f).lines.filter((l) => !l.retired && l.source !== 'born') : []));
    const carriers = {};
    for (const ls of lines) for (const k of new Set(ls.map((l) => `${l.from}>${l.over}`))) carriers[k] = (carriers[k] ?? 0) + 1;
    const top = Object.entries(carriers).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([k, v]) => [k, r3(v / pool.length)]);
    return {
      nest: nest.id,
      habitat: nest.habitat ?? null,
      alive: here.length,
      adults: grown.length,
      generation: here.length ? Math.max(...here.map((f) => f.generation ?? 0)) : null,
      gene,
      body,
      epi: r3(mean(pool.map((f) => f.genome?.epi?.size ?? f.epi?.size).filter(Number.isFinite))),
      ownLines: r3(mean(lines.map((ls) => ls.length))),
      top,
    };
  });
}

// Called once per step of the game (simulation.js): samples when it is time.
export function recordEvolution(world) {
  if (!world.colony) return;
  const t = world.time ?? 0;
  const log = (world.evolution ??= { every: EVERY, samples: [] });
  const last = log.samples.at(-1);
  if (last && t - last.t < log.every) return;
  log.samples.push({ t: Math.round(t), year: SEASONS.enabled ? t / SEASONS.year : null, nests: sampleColonies(world) });
  if (log.samples.length > MAX) {
    log.samples = log.samples.filter((_, i) => i % 2 === 0 || i === log.samples.length - 1);
    log.every *= 2;
  }
}
