// G3b battery (far/near fruit years): node g3.mjs <mode 0|1|2> <seed> <env none|pred|unpred> <seconds> [KEY=V ...]
const R = '/Users/smalbach/Documents/first-agi-body';
await import(`${R}/src/app/organism-on.js`);
const C = await import(`${R}/src/config.js`);
const [mode, seed] = process.argv.slice(2, 4).map(Number);
const env = process.argv[4], dur = Number(process.argv[5]);
// Scarce fruit, so reaching it fast matters (calibrated: TREE.interval 8 × 8).
C.TREE.interval = 64;
C.MORPH.inherit = mode;
C.SEASONS.enabled = 1; C.SEASONS.hotYears = 0; C.SEASONS.farYears = 0.5; C.SEASONS.persist = env === 'pred' ? 0.75 : 0;
const forced = env === 'far' ? true : env === 'near' ? false : null;   // calibration only
for (const kv of process.argv.slice(6)) { const [k, v] = kv.split('='); const [b, f] = k.split('.'); C[b][f] = Number(v); }
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { createColony } = await import(`${R}/src/colony.js`);
const { updateColony } = await import(`${R}/src/colony.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const dt = 0.1, Y = C.SEASONS.year;
// Six trees, three near the nest (~300 px) and three far (~440): map 19.
Object.assign(C.MAPGEN, { trees: 6, treeMinNestDistance: 120, treeMaxNestDistance: 480 });
const world = withRng(rng(19), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(1000 + seed);   // the years differ by seed too
const colony = withRng(fr, () => createColony(4)); world.colony = colony;
// The years, drawn ahead from their own stream: the same sequence for every
// inheritance mode at a seed (a paired design). Winters are all alike; only
// whether a year comes hot or cold is drawn. Predictable: it keeps last year's
// kind with chance `persist` (0.75), else turns. Unpredictable: a fresh coin.
// The first year is always near: a founding colony is not tested yet.
// none: every year as usual, all trees bearing (the drift control).
{
  const yr = rng(5000 + seed);
  world.years = {};
  let far = false;
  for (let n = 1; n <= Math.ceil(dur / Y) + 1; n++) {
    if (n > 1) far = env === 'pred' ? (yr() < C.SEASONS.persist ? far : !far) : yr() < C.SEASONS.farYears;
    world.years[n] = { at: C.SEASONS.winterAt, width: C.SEASONS.winter, hard: 1, hot: false,
      far: env === 'none' ? null : forced ?? far };
  }
}
const T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const snap = () => {
  const a = colony.ants.filter((f) => f.alive);
  const avg = (fn) => (a.length ? +(a.reduce((s, f) => s + fn(f), 0) / a.length).toFixed(3) : null);
  return { n: a.length, gen: Math.max(0, ...a.map((f) => f.generation ?? 0)),
    genes: Object.fromEntries(T.map((t) => [t, avg((f) => f.genome?.morph?.[t] ?? 1)])),
    carried: Object.fromEntries(T.map((t) => [t, avg((f) => f.morph?.[t] ?? 1)])),
    plastic: avg((f) => f.genome?.plastic ?? 1), hatched: colony.life?.hatched ?? 0, deaths: { ...(colony.life?.deaths ?? {}) } };
};
const years = [{ year: 0, ...snap() }];
let next = Y, minN = 1e9, extinct = null;
const t0 = Date.now();
while (world.time < dur) {
  withRng(wr, () => stepWorld(world, dt));
  withRng(fr, () => updateColony(world, colony, dt));
  const n = colony.ants.filter((f) => f.alive).length;
  if (world.time > Y) minN = Math.min(minN, n);
  if (world.time >= next) { years.push({ year: next / Y, far: world.years?.[next / Y]?.far ?? null, ...snap() }); next += Y; }
  if (!n && !world.objects.find((o) => o.type === 'nest')?.eggs?.length) { extinct = Math.round(world.time); break; }
}
console.log(JSON.stringify({ mode, seed, env, extinct, minN, secs: Math.round((Date.now() - t0) / 1000), end: snap(), years }));
