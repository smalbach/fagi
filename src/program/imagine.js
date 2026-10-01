// Imagining: asking a behavior what it would do now, without anything of hers
// changing because she asked.
//
// Behaviors decide and, while deciding, keep a few things of hers up to date:
// the latch of resting or sleeping, how long she insists on what she lost
// sight of, whether she already went home looking for water... In the walk of
// her program (decision.js) that is how it should be. When she only wonders
// (program/watch.js: would this line have acted here?), it must not happen.
// So `imagine` hands the behavior a shadow of her: what it reads falls through
// to her, what it writes stays in the shadow. Anything deeper that a behavior
// would change (her record of conduct, learned/conduct.js) asks `imagining()`
// first and leaves it be.
//
// A behavior may change her state only through her own fields (fagi.x = ...),
// never through what hangs from them, unless it asks imagining(). The proof is
// in test/program.test.js: with PROGRAM.watch = 2 she imagines every line below
// the one that acts, every look, and every traced life is still the one
// recorded, frame by frame.

let depth = 0;

export const imagining = () => depth > 0;

export function imagine(fagi, fn) {
  const shadow = Object.create(fagi);
  depth += 1;
  try { return fn(shadow); } finally { depth -= 1; }
}
