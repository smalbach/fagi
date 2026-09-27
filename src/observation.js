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
    version: 1,
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

  return { observation, refs, byId };
}
