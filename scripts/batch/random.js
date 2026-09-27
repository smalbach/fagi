// Seeded randomness: each stream (map, world, Fagi) has its own.

export function rng(seed) {
  // mulberry32: fast and more than enough for this
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The simulation uses Math.random: while `fn` runs, it comes from `random`.
const original = Math.random;
export function withRng(random, fn) {
  Math.random = random;
  try { return fn(); } finally { Math.random = original; }
}
