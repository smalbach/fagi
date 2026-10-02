// What things are good for, in her decisions (things.js, concepts.js; spec §12.8).
//
// Three rules, each where its need already sits in the hierarchy:
//   sip     (survive) thirsty, and a thing she believes has sap is nearer than
//           the water: she goes and nibbles it;
//   huddle  (endure)  too cold or too hot, and a thing she believes warm or
//           cool is nearer than the nest: she presses against it;
//   probe   (explore) nothing presses and a kind she has not figured out is in
//           sight: she touches it, and if the touch said nothing, nibbles it.
//           Never one a concept she trusts says stings, nor one a concept
//           already predicts surely (CONCEPT.sure): that one she tries when she uses it.
//           After a surprise (concepts.js, volatility) she looks again at what she knew.
// "Believes" is her own contact with that kind or, never having touched it, a
// concept that covers its look (concepts.js). With CONCEPT off they never answer.

import { CONCEPT, THIRST, ENERGY } from '../config.js';
import { habit } from '../habits.js';
import { believe, experience, conceptsOf, drained } from '../concepts.js';
import { touching, contact, isThing, haul } from '../things.js';
import { nestOf } from '../world.js';
import { record } from '../world.js';
import { reasonOf, pressing } from './common.js';

const trusted = (b, aff) => b.aff === aff && b.confidence >= CONCEPT.trust;
const dist = (fagi, p) => Math.hypot(p.x - fagi.x, p.y - fagi.y);
const via = (b) => (b.via === 'self' || b.via === 'saw' ? b.via : 'concept');

// The things she believes afford `aff`: those in sight (not dry) and those she
// remembers, where she last saw them not dry, or dry but, by now, worth looking
// at again (CONCEPT.lookAgain). Nearest first.
function believed(fagi, world, ctx, aff) {
  const concepts = conceptsOf(fagi);
  const out = [];
  const inSight = new Set();
  for (const t of ctx.things) {
    inSight.add(t.ref.id);
    const b = believe(concepts, t.look);
    if (!t.dry && trusted(b, aff)) out.push({ ref: t.ref, d: t.dist, b });
  }
  for (const [id, place] of Object.entries(concepts.places)) {
    if (inSight.has(Number(id))) continue;
    if (place.dry && !(CONCEPT.lookAgain && place.lookAt != null && concepts.now >= place.lookAt)) continue;
    const b = believe(concepts, concepts.kinds[place.key].look);
    if (!trusted(b, aff)) continue;
    // She goes where she remembers it; the thing itself, if it is still there.
    const ref = world.objects.find((o) => o.id === Number(id) && isThing(o));
    if (ref) out.push({ ref, d: dist(fagi, place), b });
  }
  return out.sort((a, b) => a.d - b.d);
}

// The water she knows of: the one in sight or the one she remembers.
function waterDistance(fagi, ctx) {
  const w = ctx.visible ?? ctx.waterPlace;
  return w ? dist(fagi, w) : Infinity;
}

export function sip(fagi, world, ctx) {
  if (!CONCEPT.enabled || !ctx.things || fagi.drinking) return null;
  if (fagi.thirst / THIRST.max < CONCEPT.sipAt) return null;
  const best = believed(fagi, world, ctx, 'sap')[0];
  if (!best || best.d >= waterDistance(fagi, ctx)) return null;
  return {
    action: 'sip',
    reason: reasonOf(`reason.sip.${via(best.b)}`),
    target: best.ref,
    targetKind: 'thing',
    trailKey: null,
  };
}

const NEEDS_OF = { cold: 'warm', heat: 'cool' };

export function huddle(fagi, world, ctx) {
  if (!CONCEPT.enabled || !ctx.things || pressing(ctx)) return null;
  const need = NEEDS_OF[fagi.thermalFeel];
  if (!need) return null;
  const best = believed(fagi, world, ctx, need)[0];
  if (!best) return null;
  if (ctx.nest && !ctx.inNest && best.d >= dist(fagi, ctx.nest)) return null;
  if (ctx.inNest) return null;
  const params = { temp: Math.round(fagi.temperature) };
  const key = `${need === 'cool' ? 'reason.huddleCool' : 'reason.huddleWarm'}.${via(best.b)}`;
  if (touching(fagi, best.ref)) return { action: 'huddle', reason: reasonOf(key, params), target: null, targetKind: null };
  return { action: 'huddleTo', reason: reasonOf(key, params), target: best.ref, targetKind: 'thing', trailKey: null };
}

// Lining the nest (things.js): nothing presses and her hands are free, the
// lining is not full and she believes a thing warm, by her own touch or by a
// concept. She takes it home. Laying it down happens in the nest (nest.js).
export function line(fagi, world, ctx) {
  if (!CONCEPT.enabled || !CONCEPT.lining || !ctx.things || !ctx.nest) return null;
  if (fagi.hauling) {
    return { action: 'lineNest', reason: reasonOf('reason.lineNest'), target: ctx.nest, targetKind: 'nest', trailKey: null };
  }
  if (pressing(ctx) || fagi.carrying || fagi.thermalFeel) return null;
  if ((nestOf(world, fagi)?.lining?.length ?? 0) >= CONCEPT.lining) return null;
  const best = believed(fagi, world, ctx, 'warm')[0];
  if (!best) return null;
  return { action: 'haul', reason: reasonOf(`reason.haul.${via(best.b)}`), target: best.ref, targetKind: 'thing', trailKey: null };
}

// What she would do next to a kind: touch it first, then nibble. null when
// her contact has already told her all a contact can.
function nextAct(kind) {
  if (kind?.stale) return 'touch';
  if (!kind || kind.possible.length === 1) return null;
  if (!kind.touch) return 'touch';
  if (!kind.mouth) return 'nibble';
  return null;
}

export function probe(fagi, world, ctx) {
  if (!CONCEPT.enabled || !ctx.things?.length) return null;
  if (pressing(ctx) || fagi.carrying || fagi.thermalFeel) return null;
  if (fagi.energy <= Math.max(habit(fagi, 'restAt'), ENERGY.tired)) return null;
  const concepts = conceptsOf(fagi);
  for (const t of ctx.things) {
    const act = nextAct(concepts.kinds[t.key]);
    if (!act || (act === 'nibble' && t.dry)) continue;
    const b = believe(concepts, t.look);
    if (trusted(b, 'sting')) continue;
    // What a concept already tells her surely is not worth examining (§12.5):
    // she will find out when she needs it.
    if (b.via && b.via !== 'self' && b.confidence >= CONCEPT.sure) continue;
    return {
      action: 'probe',
      reason: reasonOf(act === 'touch' ? 'reason.probeTouch' : 'reason.probeNibble'),
      target: t.ref,
      targetKind: 'thing',
      trailKey: null,
      act,
    };
  }
  return null;
}

// Once she reaches the thing she was going for, the touch or the nibble
// happens (fagi.js calls this every step).
export function useThing(fagi, world) {
  const action = fagi.thought?.action;
  if (action !== 'probe' && action !== 'sip' && action !== 'haul') return;
  const obj = fagi.target;
  if (!isThing(obj) || !touching(fagi, obj) || !world.objects.includes(obj)) return;
  if (action === 'haul') {
    haul(fagi, world, obj);
    fagi.target = null;
    fagi.targetKind = null;
    return;
  }
  const act = action === 'sip' ? 'nibble' : nextAct(conceptsOf(fagi).kinds[obj.key]);
  if (!act) return;
  const felt = contact(fagi, world, obj, act);
  const change = experience(conceptsOf(fagi), world, obj, act, felt, fagi.age);
  if (felt === 'sap') drained(conceptsOf(fagi), obj, fagi.age);
  record(world, 'thing_contact', { id: obj.id, act, felt, ...(felt === 'sap' ? { dry: CONCEPT.sapRegrow } : {}) });
  fagi.lastThing = { n: (fagi.lastThing?.n ?? 0) + 1, id: obj.id, key: obj.key, act, felt, change, via: action };
  // What she was going for is done: she decides afresh next step.
  fagi.target = null;
  fagi.targetKind = null;
}
