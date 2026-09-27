// Synapses: what was learned seen as connections between neurons, just like in a
// real brain, where learning means creating new connections and strengthening or
// weakening the ones already there.
//
// Neurons (prefixed ids):
//   sense:sight | sense:smell | sense:memory     — where the perceived comes in
//   key:<type>                                   — the concept: nectar, water…
//   feel:<sensation>                             — what the body noticed: hunger,
//                                                  thirst, speed… (interoception.js)
//
// Two ways to form, as in biology:
//   - Hebb ("neurons that fire together wire together"): perceiving a
//     type through a sense strengthens sense→concept while it lasts. Unused it
//     weakens and, below SYNAPSE.prune, gets pruned.
//   - Learning from consequences: every time brain.js's learn() learns from
//     something she felt, the concept wires to that sensation, with a sign:
//     positive if it relieved, negative if it harmed. It forgets much more slowly.
//
// Remembered places (memory.places) and written rules (learned/) are already
// connections in themselves; the brain map draws them from there.
//
// This decides NOTHING: the reckoning stays in memory.js and brain.js. It's the trace
// of that learning shaped as a network, so it can be seen.

import { FEEL, SYNAPSE } from './config.js';

export function createSynapses() {
  return {};
}

function connection(syn, a, b, kind, now) {
  const id = `${a}>${b}`;
  let s = syn[id];
  if (!s) s = syn[id] = { a, b, kind, w: 0, born: now, last: now, n: 0 };
  return s;
}

// Hebb: strengthens while both fire together (rate per second).
export function hebb(syn, a, b, dt, now) {
  const s = connection(syn, a, b, 'hebb', now);
  s.w += SYNAPSE.hebbRate * dt * (1 - s.w);
  s.last = now;
  s.n += dt;
}

// What a sensation tells her about something: from -1 (harmed) to +1 (relieved). The same
// reckoning as interoception.feel(), sensation by sensation.
export function valueFrom(x) {
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  if (x.sense === 'hunger') return clamp(-x.v / FEEL.hungerScale);
  if (x.sense === 'thirst') return clamp(-x.v / FEEL.thirstScale);
  if (x.sense === 'peril') return clamp(x.v);
  if (x.sense === 'energy') return clamp(x.v / FEEL.energyScale);
  if (x.v > 0 && FEEL.statSense[x.sense] !== undefined) {
    return clamp(FEEL.effectWeight * FEEL.statSense[x.sense] * Math.log2(x.v));
  }
  return 0;
}

// Learning from a consequence: concept → sensation, toward its value.
export function wire(syn, key, sensations, now) {
  for (const x of sensations ?? []) {
    const v = valueFrom(x);
    if (!v) continue;
    const s = connection(syn, `key:${key}`, `feel:${x.sense}`, 'feel', now);
    s.w += SYNAPSE.learnRate * (v - s.w);
    s.last = now;
    s.n += 1;
  }
}

// Time passes: what isn't used weakens and what's very weak gets pruned.
// A newborn one (used a moment ago) isn't pruned even if still weak.
export function decaySynapses(syn, dt, now) {
  if (!syn) return;
  for (const [id, s] of Object.entries(syn)) {
    const k = s.kind === 'hebb' ? SYNAPSE.hebbDecay : SYNAPSE.feelDecay;
    s.w -= Math.sign(s.w) * Math.min(Math.abs(s.w), k * dt);
    if (Math.abs(s.w) < SYNAPSE.prune && now - s.last > 1) delete syn[id];
  }
}

// What she perceives this frame fires its sense → concept connections.
export function perceiveSynapses(fagi, ctx, dt) {
  const syn = fagi.brain.synapses;
  if (!syn) return;
  const seenList = new Set();
  for (const c of ctx.ranked ?? []) {
    const id = `sense:${c.via}>key:${c.key}`;
    if (seenList.has(id)) continue;
    seenList.add(id);
    hebb(syn, `sense:${c.via}`, `key:${c.key}`, dt, fagi.age);
  }
  if (ctx.visible && !seenList.has('sense:sight>key:water')) hebb(syn, 'sense:sight', 'key:water', dt, fagi.age);
}
