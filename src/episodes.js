// Episodes: an experience from the moment it starts until we know how it ended.
//
// Eating or drinking opens an episode with a snapshot of the body before. What
// she feels right after (interoception.js) teaches immediately. But a bite
// can also disagree with her later: if in the following seconds the
// need it was meant to relieve shoots up to critical, or if Fagi dies with
// it in her body, the episode closes with a punishment.
//
// There is only one pending episode at a time. Opening another closes the previous one
// outright: two bites in a row can't both carry the same scare.

import { FEEL, NEEDS, HUNGER, THIRST, PHERO, TASTE } from './config.js';
import { learn } from './brain.js';
import { snapshotBody, feel } from './interoception.js';

const NEED_OF = { eat: 'hunger', drink: 'thirst' };

// Fraction of a need, read from any body (the one from before or the
// one from now): that way they can be compared without mixing one up with the other.
function needU(body, need) {
  return need === 'thirst' ? body.thirst / THIRST.max : body.hunger / HUNGER.max;
}

// learn() already handles everything: it adjusts the belief and, when due, writes or
// revises the rule. Here we only pass it the sensations that explain it.
function learnFrom(fagi, key, reward, sensations) {
  return learn(fagi.brain, key, reward, fagi.age, sensations);
}

// Opens an episode and immediately teaches what she felt. `before` is the snapshot of the
// body before eating or starting to drink.
export function openEpisode(fagi, { action, key, before, portion = 1, taste = null }) {
  const previous = fagi.episode;
  if (previous) close(fagi, previous, null);   // the scare, if it comes, belongs to the new one

  const need = NEED_OF[action] ?? 'hunger';
  const ep = {
    n: (fagi.lastEpisode?.n ?? 0) + 1,
    action, key, need,
    ...(portion !== 1 ? { portion } : {}),
    ...(taste != null ? { taste } : {}),
    at: fagi.age,
    before,
    // If the need was ALREADY critical before the bite, the bad outcome is no surprise:
    // immediate interoception already taught it. Delayed punishment only applies
    // when the bite leaves her crossing the threshold she wasn't crossing before.
    critAt: needU(before, need) >= NEEDS.critical,
    reward: 0,
    sensations: [],
    change: null,
    correction: null,
    pending: true,
  };

  // Drinking is judged later, once she has been drinking a while (or on leaving the water).
  if (action !== 'drink') feelNow(fagi, ep);

  fagi.episode = ep;
  fagi.lastEpisode = ep;
  return ep;
}

function feelNow(fagi, ep) {
  const after = snapshotBody(fagi);
  const felt = feel(ep.before, after);
  // A trial bite: she felt a fraction of the fruit, and knows how small the bite
  // was, so she learns what a whole one would do.
  let reward = ep.portion ? Math.max(-1, Math.min(1, felt.reward / ep.portion)) : felt.reward;
  const sensations = ep.portion ? [...felt.sensations, { sense: 'trial', v: ep.portion }] : [...felt.sensations];
  // How it tasted (TASTE, taste.js): liking or disgust, right away, whatever
  // the body makes of it later.
  if (ep.taste != null) {
    reward = Math.max(-1, Math.min(1, reward + TASTE.hedonic * ep.taste));
    sensations.push({ sense: 'taste', v: Math.round(ep.taste * 100) / 100 });
  }
  ep.reward = reward;
  ep.sensations = sensations;
  ep.change = learnFrom(fagi, ep.key, reward, sensations);
}

// Time passes: checks whether the pending episode can be closed yet.
export function resolveEpisodes(fagi, dt) {
  const ep = fagi.episode;
  if (!ep) return;

  if (ep.action === 'drink') {
    // Crossing the shallows without stopping (skirting the water, on the way to something else)
    // wets her legs and eases a little thirst, but it isn't drinking: if it were judged,
    // the passing sip would teach that water barely quenches thirst.
    if (fagi.thought?.action === 'drink') ep.stopped = true;
    if (!fagi.drinking && !ep.stopped) { close(fagi, ep, null); return; }
    const enough = fagi.age - ep.at >= FEEL.drinkSample || !fagi.drinking;
    if (enough) {
      feelNow(fagi, ep);
      fagi.lastDrink = {
        n: ep.n, thirst: ep.before.thirst,
        beliefBefore: ep.change.before.value, beliefAfter: ep.change.after.value,
        kind: ep.change.kind,
      };
      close(fagi, ep, null);
    }
    return;
  }

  if (fagi.age - ep.at < FEEL.window) return;

  // Bad outcome: it was meant to relieve a need and the need ended up critical within the window.
  const nowCritical = needU(fagi, ep.need) >= NEEDS.critical;   // fagi = body NOW
  const correction = !ep.critAt && nowCritical ? -FEEL.perilWeight : null;
  close(fagi, ep, correction);
}

// Following her own trail is also an experience, and it's judged by how it
// ends: if within PHERO.learnWindow seconds she picks up or eats something, the trail led to
// food; if not, it led nowhere. If she drops it because something more urgent takes over
// (thirst, critical hunger), it isn't judged: that's not the trail's fault.
// Called after acting, once we know whether she picked up or ate.
export function resolveTrail(fagi) {
  const food = (fagi.picked ?? 0) + fagi.eaten;
  const following = fagi.thought?.action === 'pheromone';
  const ep = fagi.trailEp;

  if (!ep) {
    if (following) fagi.trailEp = { at: fagi.age, food };
    return;
  }
  if (food > ep.food) {
    learnFrom(fagi, 'pheromone', PHERO.found, [{ sense: 'found', v: 1 }]);
    fagi.trailEp = null;
  } else if (!following && fagi.thought?.tier === 'survive') {
    fagi.trailEp = null;
  } else if (fagi.age - ep.at >= PHERO.learnWindow) {
    learnFrom(fagi, 'pheromone', PHERO.miss, [{ sense: 'lost', v: -1 }]);
    fagi.trailEp = null;
  }
}

// Dying with a recent bite in her body is the worst possible lesson.
export function closeOnDeath(fagi) {
  const ep = fagi.episode;
  if (!ep) return null;
  if (ep.action === 'drink' && ep.change === null) feelNow(fagi, ep);
  close(fagi, ep, -FEEL.deathPenalty);
  return ep;
}

function close(fagi, ep, correction) {
  if (!ep.pending) return;
  ep.pending = false;
  if (correction !== null && correction !== 0) {
    ep.correction = correction;
    ep.change = learnFrom(fagi, ep.key, correction, [{ sense: 'peril', v: correction }]);
  }
  if (fagi.episode === ep) fagi.episode = null;
}
