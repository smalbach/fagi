const R = '/Users/smalbach/Documents/first-agi-body';
await import(`${R}/src/app/organism-on.js`);
const C = await import(`${R}/src/config.js`);
const [mode, seed, unpred, dur] = process.argv.slice(2).map(Number);
C.MORPH.inherit = mode; C.SEASONS.enabled = 1; C.SEASONS.unpredictable = unpred;
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { createColony, updateColony } = await import(`${R}/src/colony.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const dt = 0.1;
const world = withRng(rng(42), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(43);
const colony = withRng(fr, () => createColony(4)); world.colony = colony;
let sumN = 0, k = 0, minN = 1e9, extinct = null;
while (world.time < dur) {
  withRng(wr, () => stepWorld(world, dt));
  withRng(fr, () => updateColony(world, colony, dt));
  const n = colony.ants.filter((f) => f.alive).length;
  if (world.time > C.SEASONS.year) { sumN += n; k++; minN = Math.min(minN, n); }
  if (!n && !world.objects.find((o) => o.type === 'nest')?.eggs?.length) { extinct = Math.round(world.time); break; }
}
const alive = colony.ants.filter((f) => f.alive);
const avg = (fn) => alive.length ? +(alive.reduce((a, f) => a + fn(f), 0) / alive.length).toFixed(3) : null;
const T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const r = { mode, seed, unpred, extinct, n: alive.length, meanN: k ? +(sumN / k).toFixed(1) : 0, minN, gen: Math.max(0, ...alive.map((f) => f.generation)), hatched: colony.life.hatched, deaths: colony.life.deaths,
  genes: Object.fromEntries(T.map((t) => [t, avg((f) => f.genome?.morph?.[t] ?? 1)])), carried: Object.fromEntries(T.map((t) => [t, avg((f) => f.morph?.[t] ?? 1)])),
  plastic: avg((f) => f.genome?.plastic ?? 1) };
console.log(JSON.stringify(r));
