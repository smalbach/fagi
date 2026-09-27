// The cortex: acts as the go-between with the external decision API without
// touching the loop's rhythm. It never waits for the answer — instinct keeps
// deciding meanwhile — and when it arrives (if it arrives, and in time) it
// becomes a directive with an expiry date that decision.js can
// consult like one more rule.

import { BACKEND } from './config.js';
import { observe } from './observation.js';
import { validateIntention } from './backend/index.js';
import { pressing } from './decision.js';

export function createCortex(backend) {
  return {
    backend,
    inflight: false,
    gen: 0,           // bumped on death or restart: invalidates an answer that arrives late
    lastAt: -Infinity,
    seenKeys: new Set(),
    lastEpisodeN: 0,
    idleFor: 0,
    wasPressing: false,
    calls: 0,          // how many times it has asked, for the HUD and the tests
  };
}

// On death or restart: whatever is in flight stops counting.
export function resetCortex(cortex) {
  if (!cortex) return;
  cortex.gen += 1;
  cortex.inflight = false;
  cortex.seenKeys = new Set();
  cortex.lastEpisodeN = 0;
  cortex.idleFor = 0;
  cortex.wasPressing = false;
}

// Is there anything that justifies asking now? A key she hadn't seen, something
// new in what she perceives, a freshly closed experience, starting to get pressed,
// having explored aimlessly for a long time, or being left without a directive.
function shouldAsk(cortex, fagi, ctx) {
  let newKey = false;
  for (const c of ctx.ranked) {
    if (!cortex.seenKeys.has(c.key)) { cortex.seenKeys.add(c.key); newKey = true; }
  }
  const newEpisode = Boolean(fagi.lastEpisode) && fagi.lastEpisode.n !== cortex.lastEpisodeN;
  const pressingNow = pressing(ctx);
  const pressingRises = pressingNow && !cortex.wasPressing;
  const idleTooLong = fagi.thought?.action === 'explore' && cortex.idleFor >= BACKEND.idleAfter;
  const noDirective = !fagi.directive;

  cortex.wasPressing = pressingNow;
  if (fagi.lastEpisode) cortex.lastEpisodeN = fagi.lastEpisode.n;

  // Something new in what she perceives (not just a new kind): the current directive
  // was thought up without it, so we ask again with the situation as it is now.
  const hasNews = (ctx.newOnes?.length ?? 0) > 0;

  return newKey || newEpisode || pressingRises || idleTooLong || noDirective || hasNews;
}

export function updateCortex(cortex, fagi, world, ctx, dt) {
  if (!cortex || !cortex.backend || !BACKEND.enabled) return;

  cortex.idleFor = fagi.thought?.action === 'explore' ? cortex.idleFor + dt : 0;

  // An expired directive is forgotten: until another arrives, instinct
  // decides, not a stale order.
  if (fagi.directive && fagi.age >= fagi.directive.until) fagi.directive = null;

  const needed = shouldAsk(cortex, fagi, ctx);
  const canAsk = !cortex.inflight && fagi.age - cortex.lastAt >= BACKEND.minInterval;
  if (!needed || !canAsk) return;

  cortex.lastAt = fagi.age;
  cortex.inflight = true;
  cortex.calls += 1;
  const gen = cortex.gen;
  const { observation, refs, byId } = observe(fagi, world, ctx);

  Promise.resolve(cortex.backend.decide(observation, {}))
    .then((response) => applySets(cortex, fagi, gen, response, observation, refs, byId))
    .catch(() => { cortex.inflight = false; });
}

function applySets(cortex, fagi, gen, response, observation, refs, byId) {
  cortex.inflight = false;
  // It arrived late: Fagi died, restarted, or is already on another generation. Discard it.
  if (gen !== cortex.gen || !fagi.alive) return;

  const validate = validateIntention(response, observation);
  if (!validate) return;

  const summary = validate.targetId != null ? byId.get(validate.targetId) : null;
  const isNestObj = ['toNest', 'pantry', 'carry'].includes(validate.action);

  fagi.directive = {
    action: validate.action,
    target: validate.targetId != null ? (refs.get(validate.targetId) ?? null) : null,
    targetKind: summary ? summary.kind : (isNestObj ? 'nest' : null),
    trailKey: summary && summary.via === 'smell' ? summary.key : null,
    reason: validate.reason ?? { key: 'reason.api', params: { backend: cortex.backend.name } },
    until: fagi.age + validate.ttl,
    source: cortex.backend.name,
  };
}
