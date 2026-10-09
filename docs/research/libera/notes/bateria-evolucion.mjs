// Evolution battery: node evo.mjs <cond old|A|AB> <seed> <seconds>
const R = '/Users/smalbach/Documents/first-agi-body';
await import(`${R}/src/app/organism-on.js`);
const C = await import(`${R}/src/config.js`);
const [cond, seedS, durS] = process.argv.slice(2);
const seed = Number(seedS), dur = Number(durS);
if (cond === 'old') { C.LIFE.provision = 0; C.MORPH.choice = 0; C.MORPH.maternal.share = 0; }
if (cond === 'AB') { C.COLONIES.count = 3; C.LIFE.maxPopulation = 30; }
const { createWorld, nestsOf } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { createColony, updateColony } = await import(`${R}/src/colony.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const world = withRng(rng(42), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(43);
const colony = withRng(fr, () => createColony(4)); world.colony = colony;
const T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
let founders = null, extinct = null; const t0 = Date.now();
while (world.time < dur) {
  withRng(wr, () => stepWorld(world, 0.1));
  withRng(fr, () => updateColony(world, colony, 0.1));
  if (!founders && colony.life) founders = Object.fromEntries(T.map((t) => [t, mean(colony.ants.map((f) => f.genome.morph[t]))]));
  if (!colony.ants.some((f) => f.alive) && !nestsOf(world).some((n) => n.eggs?.length)) { extinct = Math.round(world.time); break; }
}
const alive = colony.ants.filter((f) => f.alive && f.genome?.morph);
const genes = Object.fromEntries(T.map((t) => [t, mean(alive.map((f) => f.genome.morph[t]))]));
// Selection gradients over complete lives (offspring counted in the lineage).
const kids = {}; for (const v of Object.values(world.lineage)) for (const p of [v.mother, v.father]) if (p != null) kids[p] = (kids[p] ?? 0) + 1;
const done = colony.ants.filter((f) => !f.alive && f.genome?.morph);
const w = done.map((f) => kids[f.id] ?? 0), wm = mean(w);
const beta = Object.fromEntries(T.map((t) => { const z = done.map((f) => f.genome.morph[t]); const zm = mean(z); const zs = Math.sqrt(mean(z.map((v) => (v - zm) ** 2))); return [t, done.length > 10 && zs ? +mean(z.map((v, i) => ((v - zm) / zs) * (w[i] / wm - 1))).toFixed(3) : null]; }));
// Between colonies: how far apart their gene means are (AB).
const nests = nestsOf(world);
const perColony = nests.map((n) => { const a = alive.filter((f) => (f.home ?? nests[0].id) === n.id); return { nest: n.id, n: a.length, size: mean(a.map((f) => f.genome.morph.size)), muscle: mean(a.map((f) => f.genome.morph.muscle)) }; });
console.log(JSON.stringify({ cond, seed, extinct, n: alive.length, hatched: colony.life?.hatched, gen: Math.max(0, ...alive.map((f) => f.generation ?? 0)), founded: colony.life?.founded ?? 0,
  delta: Object.fromEntries(T.map((t) => [t, genes[t] != null && founders ? +(genes[t] - founders[t]).toFixed(3) : null])), beta, perColony, deaths: colony.life?.deaths, secs: Math.round((Date.now() - t0) / 1000) }));
