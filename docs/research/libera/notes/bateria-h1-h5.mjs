// LIBERA phase 2, H1 and H5: learned drives (κ from relief) against innate.
//   node h1.mjs <innate|learned> <seed>
// H1: is she as viable? H5: after a forced deprivation of water (her thirst
// set to DEPRIVE of its maximum at T1 and again at T2), how long until she
// drinks? Incentive learning predicts the learned drive slower the first
// time (she never felt that thirst) and faster the second.
const R = '/Users/smalbach/Documents/first-agi-body';
const C = await import(`${R}/src/config.js`);
const { enableOrganism } = await import(`${R}/src/organism.js`); enableOrganism();
const [mode, seedS] = process.argv.slice(2); const seed = Number(seedS);
C.DRIVE.mode = mode;
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { createFagi, updateFagi } = await import(`${R}/src/fagi.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const SECONDS = 3600, T1 = 1200, T2 = 2400, DEPRIVE = 0.5, dt = 0.1;
const world = withRng(rng(400000 + 17 * seed), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(seed * 7919); const f = withRng(fr, () => createFagi());
let safe = 0; const lat = [null, null]; let open = null; let k = -1;
for (let i = 0; i < SECONDS / dt && f.alive; i++) {
  withRng(wr, () => stepWorld(world, dt));
  for (const [j, T] of [[0, T1], [1, T2]]) if (k < j && world.time >= T) { k = j; f.thirst = Math.max(f.thirst, DEPRIVE * C.THIRST.max); open = world.time; }
  withRng(fr, () => updateFagi(f, world, dt));
  if (open != null && f.drinking) { lat[k] = Math.round((world.time - open) * 10) / 10; open = null; }
  if (f.hunger / C.HUNGER.max < C.NEEDS.critical && f.thirst / C.THIRST.max < C.NEEDS.critical) safe += dt;
}
console.log(JSON.stringify({ mode, seed, alive: f.alive, lived: Math.round(f.age), cause: f.cause || null, safe: +(safe / Math.max(1, f.age)).toFixed(3),
  lat1: lat[0], lat2: lat[1], kappa: f.brain.kappa ? Object.fromEntries(Object.entries(f.brain.kappa).map(([n, v]) => [n, v.map((x) => +x.toFixed(2))])) : null }));
