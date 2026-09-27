// Azar con semilla: cada corriente (mapa, mundo, Fagi) tiene la suya.

export function rng(seed) {
  // mulberry32: rápido y de sobra para esto
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// La simulación usa Math.random: mientras corre `fn`, sale de `random`.
const original = Math.random;
export function con(random, fn) {
  Math.random = random;
  try { return fn(); } finally { Math.random = original; }
}
