// Drives (DRIVE; LIBERA phase 2, docs/research/libera/README.md): how much a
// need makes what relieves it worth, W = κ·V. V is what she has learned a
// thing is worth (memory, cues); κ is how much her state multiplies it.
//
//   innate   κ is born: a fixed curve of the need, BRAIN.baseInterest at no
//            need up to 1 at full need (as Fagi always was)
//   learned  κ is learned (incentive learning, Dickinson & Balleine 1994):
//            each time eating or drinking relieves her, she notes how good it
//            felt at how needy she was. Eating with a little hunger relieves
//            little; with a lot, a lot. So she comes to want food the more
//            the hungrier she is, from what she lived, not from a curve she
//            was given. It starts flat (DRIVE.prior): a newborn does not know
//            yet that hunger makes food matter.
//
// κ is kept per need in DRIVE.bins bins of the need (0-1), read with linear
// interpolation. Only a good experience teaches it: a poison relieves nothing,
// and what it teaches about the fruit is V's business. With mode 'innate'
// nothing here changes what she does.

import { DRIVE, BRAIN } from './config.js';

export const learnedDrives = () => DRIVE.mode === 'learned';

// Which need a candidate relieves (perception.js kinds).
export const needOfKind = (kind) => (kind === 'food' || kind === 'trail' ? 'hunger' : kind === 'water' ? 'thirst' : null);

function table(brain, need) {
  brain.kappa ??= {};
  return (brain.kappa[need] ??= Array(DRIVE.bins).fill(DRIVE.prior));
}

// κ at this level of need (0-1).
export function kappaAt(brain, need, level) {
  if (!learnedDrives()) return BRAIN.baseInterest + (1 - BRAIN.baseInterest) * level;
  const t = table(brain, need);
  const x = Math.max(0, Math.min(1, level)) * (t.length - 1);
  const i = Math.min(t.length - 2, Math.floor(x));
  return t[i] + (t[i + 1] - t[i]) * (x - i);
}

// A consumption felt as `reward` (-1..1) at `level` of the need it relieves.
// The two bins around the level move toward it, by how close they are.
export function learnKappa(brain, need, level, reward) {
  if (!learnedDrives() || !need || reward <= 0) return;
  const t = table(brain, need);
  const x = Math.max(0, Math.min(1, level)) * (t.length - 1);
  const i = Math.min(t.length - 2, Math.floor(x));
  const f = x - i;
  t[i] += DRIVE.rate * (1 - f) * (reward - t[i]);
  t[i + 1] += DRIVE.rate * f * (reward - t[i + 1]);
}
