// Interoception: the body feeling itself.
//
// Fagi doesn't know whether a fruit is good or bad. What she does know, from birth, is
// how her body feels: hunger going down is relief, going up hurts, moving more
// slowly feels clumsy and seeing farther feels good. Comparing the body from
// before with the one after yields the only signal she learns from.
//
// This is the innate part. Which thing in the world produced the feeling she finds out
// by trying, and that is the learned part.

import { feltHunger } from './stomach.js';
import { FEEL } from './config.js';
import { statMult } from './effects.js';

const STATS = ['speed', 'viewRange', 'fovDeg', 'smell', 'hungerRate'];

// Snapshot of the body at this instant.
export function snapshotBody(fagi) {
  const mults = {};
  for (const s of STATS) mults[s] = statMult(fagi, s);
  // A stat with an active effect that isn't on the list also counts.
  for (const s of Object.keys(fagi.effects ?? {})) if (!(s in mults)) mults[s] = statMult(fagi, s);
  // Hunger as she feels it: a full stomach is felt at once (STOMACH).
  return { hunger: feltHunger(fagi), thirst: fagi.thirst, energy: fagi.energy, mults, ...(fagi.sodium != null ? { sodium: fagi.sodium } : {}) };
}

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

// What she felt between two snapshots of the body. Returns the total reward, from -1 to
// +1, and the list of sensations that make it up, which is what later explains
// the learned rule ("because hunger +25, speed ×0.6").
export function feel(before, after) {
  const sensations = [];
  let total = 0;

  const dHunger = after.hunger - before.hunger;
  if (dHunger !== 0) {
    total += -dHunger / FEEL.hungerScale;
    sensations.push({ sense: 'hunger', v: round(dHunger) });
  }

  const dThirst = after.thirst - before.thirst;
  if (dThirst !== 0) {
    total += -dThirst / FEEL.thirstScale;
    sensations.push({ sense: 'thirst', v: round(dThirst) });
  }

  // Salt hunger eased (TASTE.salt): the more she lacked, the more it relieves.
  if (before.sodium != null && after.sodium != null && after.sodium > before.sodium) {
    const eased = (after.sodium - before.sodium) * (1 - before.sodium) * 2;
    total += eased;
    sensations.push({ sense: 'salt', v: round(after.sodium - before.sodium) });
  }

  // A multiplier that changes is felt; one refreshed to the same value is not.
  const stats = new Set([...Object.keys(before.mults ?? {}), ...Object.keys(after.mults ?? {})]);
  for (const s of stats) {
    const a = before.mults?.[s] ?? 1;
    const b = after.mults?.[s] ?? 1;
    if (a === b || a <= 0 || b <= 0) continue;
    const sense = FEEL.statSense[s] ?? 1;
    total += FEEL.effectWeight * sense * Math.log2(b / a);
    sensations.push({ sense: s, v: round(b / a) });
  }

  return { reward: clamp1(total), sensations };
}

function round(v) {
  return Math.round(v * 100) / 100;
}
