// The snapshot the decision API receives: data only, never live references
// into the world. Everything she sees, smells and believes, in plain JSON — the same
// the console already paints, packaged so anyone can read it, inside or outside
// the browser.
//
// Alongside the snapshot goes `refs`: the id → live object map the cortex uses
// to translate the answer's `targetId` into something to actually go to. That is NOT
// sent to the API; it's the other half, the one that stays home.

import { renderRule } from './learned/dsl.js';
import { verdict } from './learned/rules.js';
import { THERMAL } from './config.js';
import { organismOn } from './organism.js';
import { energyMax } from './biology.js';
import { nauseous } from './appetite.js';
import { perceptOn, unnamed, smellOf } from './percept.js';

// What the API reads with PERCEPT on (percept.js): a fruit it only smells is
// its smell, and no classic fruit goes by the name this code gives it. A copy:
// byId, which stays home, keeps the real keys the cortex needs.
function asPerceived(observation) {
  const out = JSON.parse(unnamed(JSON.stringify(observation)));
  observation.candidates.forEach((c, i) => {
    if (c.kind === 'food' && c.via === 'smell') {
      out.candidates[i].key = `smell:${smellOf(c.key)}`;
      out.candidates[i].belief = null;
      out.candidates[i].verdict = null;
    }
  });
  return out;
}

const r2 = (v) => Math.round(v * 100) / 100;

function waterState(ctx) {
  if (ctx.visible) return 'sees';
  if (ctx.smellsWater) return 'smells';
  if (ctx.waterPlace) return 'remembers';
  return 'unknown';
}

export function observe(fagi, world, ctx) {
  // refs: id -> live object, to actually move Fagi toward what was chosen.
  // byId: id -> the same summary that was sent, to know WITHOUT touching the world
  // whether the choice was food or water, and whether it came from sight, smell or memory.
  const refs = new Map();
  const byId = new Map();
  const candidates = [];
  for (const c of ctx.ranked.slice(0, 8)) {
    const id = c.ref?.id;
    if (id == null) continue;   // without an id there's no way for the API to name it back
    refs.set(id, c.ref);
    const summary = {
      id, key: c.key, kind: c.kind, via: c.via,
      dist: r2(c.dist), score: r2(c.score),
      belief: { value: r2(c.value), confidence: r2(c.confidence), stage: c.stage },
      verdict: c.kind === 'food' ? verdict(fagi, 'pursue', c.key) : null,
      // It just entered what she perceives: the previous directive didn't account for it.
      new: Boolean(ctx.newOnes?.some((n) => n.ref === c.ref)),
    };
    byId.set(id, summary);
    candidates.push(summary);
  }

  const beliefs = {};
  for (const [k, r] of Object.entries(fagi.brain.facts)) {
    beliefs[k] = { value: r2(r.value), confidence: r2(r.confidence), stage: r.stage, tries: r.tries };
  }

  const observation = {
    version: organismOn() ? 2 : 1,
    t: r2(fagi.age),
    needs: { hungerU: r2(ctx.hungerU), thirstU: r2(ctx.thirstU), energyU: r2(ctx.energyU) },
    effects: Object.values(fagi.effects ?? {}).map((e) => ({ stat: e.stat, mult: e.mult, left: r2(e.time) })),
    carrying: fagi.carrying?.type ?? null,
    atNest: Boolean(ctx.inNest),
    nestKnown: Boolean(ctx.nest),
    pantry: { ...fagi.pantry },
    water: waterState(ctx),
    candidates,
    beliefs,
    rules: fagi.brain.rules.list.filter((r) => !r.retired).map(renderRule),
    lastEpisode: fagi.lastEpisode
      ? { key: fagi.lastEpisode.key, action: fagi.lastEpisode.action, reward: r2(fagi.lastEpisode.reward ?? 0) }
      : null,
    instinct: fagi.thought ? { action: fagi.thought.action, reason: fagi.thought.reason } : null,
  };
  if (organismOn()) Object.assign(observation, organism(fagi));

  return { observation: perceptOn() ? asPerceived(observation) : observation, refs, byId };
}

// Version 2 (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §17): only what she can
// know. The light and her own temperature she feels; the hour, the air's
// temperature and what anything really is she does not, so they are not here.
function organism(fagi) {
  const report = fagi.lastNightReport;
  return {
    senses: {
      light: fagi.light != null ? r2(fagi.light) : null,
      dark: Boolean(fagi.dark),
      dimming: Boolean(fagi.dimming),
    },
    biology: {
      sex: fagi.sex,
      stage: fagi.lifeStage,
      energyMax: r2(energyMax(fagi)),
      temperature: r2(fagi.temperature),
      thermalState: fagi.thermalFeel ?? 'comfortable',
      thermalStress: r2(fagi.thermalStress / THERMAL.maxStress),
      sleepPressure: r2(fagi.sleepPressure),
      asleep: Boolean(fagi.sleeping),
      nauseous: nauseous(fagi),
    },
    memory: {
      consolidations: fagi.consolidations ?? 0,
      lastNightReport: report ? {
        night: report.night, episodes: report.episodes, hypotheses: report.hypotheses,
        contradictions: report.contradictions, questions: report.questions,
      } : null,
    },
  };
}
