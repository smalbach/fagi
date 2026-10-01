// Sisters telling each other, in the nest, what their lines cost them.
//
// What one passes to another is not a conclusion ("rest before pursuing")
// but the moments behind it (program/watch.js): which line led, which others
// would have acted, which one did, the situation and what came of it. The
// receiver keeps them with her own and weighs them the same way
// (program/learn.js); a line of her program changes only when what she holds,
// lived and told, clears her own doubt. Nobody hands her a line, so no line
// goes round the colony on trust: a myth has nothing to stand on here.
//
// Each moment keeps where it was lived (`who`, the sister, and `at`, her age
// then) and is passed on as it is, marked `told` by whoever passed it last.
// A moment she already holds, whoever told it, is not taken twice. Moments
// told go on being told, so what the colony lived outlasts the one who lived
// it, while her record has room (PROGRAM.record).
//
// The newest first, at most PROGRAM.shareBudget per sister per exchange; the
// rest goes at the next one. PROGRAM.share = 0: nothing of this happens.

import { PROGRAM } from '../config.js';
import { watchOf, keep, keysOf, momentKey } from './watch.js';

// What `giver` can tell `receiver` now. Returns how many moments passed.
export function shareMoments(giver, receiver) {
  if (!PROGRAM.share) return 0;
  const from = giver.brain.watch;
  if (!from?.moments.length) return 0;
  const to = watchOf(receiver);
  const has = keysOf(to);
  const out = [];
  for (let i = from.moments.length - 1; i >= 0 && out.length < PROGRAM.shareBudget; i--) {
    const m = from.moments[i];
    if (!has.has(momentKey(m))) out.push(m);
  }
  for (let i = out.length - 1; i >= 0; i--) keep(to, { ...out[i], told: giver.id ?? 1 });
  if (out.length) to.stats.told = (to.stats.told ?? 0) + out.length;
  return out.length;
}
