// Why do genes not evolve? Selection gradients on each organ from one run.
const R = '/Users/smalbach/Documents/first-agi-body';
await import(`${R}/src/app/organism-on.js`);
const C = await import(`${R}/src/config.js`);
const seed = Number(process.argv[2] ?? 1), dur = Number(process.argv[3] ?? 18000);
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { createColony, updateColony } = await import(`${R}/src/colony.js`);
const { crowding } = await import(`${R}/src/reproduction.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const world = withRng(rng(42), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(43);
const colony = withRng(fr, () => createColony(4)); world.colony = colony;
let k = 0, crowdSum = 0, capped = 0, readyBlocked = 0;
while (world.time < dur) {
  withRng(wr, () => stepWorld(world, 0.1));
  withRng(fr, () => updateColony(world, colony, 0.1));
  if (++k % 50 === 0) { const nest = world.objects.find((o) => o.type === 'nest'); const n = colony.ants.filter((f) => f.alive).length + (nest?.eggs?.length ?? 0); crowdSum += crowding(n); capped += n >= C.LIFE.maxPopulation - 2 ? 1 : 0; }
}
const L = world.lineage, kids = {};
for (const v of Object.values(L)) for (const p of [v.mother, v.father]) if (p != null) kids[p] = (kids[p] ?? 0) + 1;
// Individuals born and dead by the end (complete lives) with a morph genome.
const done = colony.ants.filter((f) => !f.alive && f.genome?.morph);
const T = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
const w = done.map((f) => kids[f.id] ?? 0), wm = mean(w);
const life = done.map((f) => f.age ?? 0);
console.log(`seed ${seed}: ${done.length} complete lives, offspring/ind mean ${wm.toFixed(2)} sd ${sd(w).toFixed(2)}, zero-offspring share ${(w.filter((v) => !v).length / w.length).toFixed(2)}`);
console.log(`mean crowding factor ${(crowdSum / (k / 50)).toFixed(2)}, time near cap ${(capped / (k / 50)).toFixed(2)}`);
const causes = {}; for (const f of done) causes[f.causeOfDeath ?? f.death ?? '?'] = (causes[f.causeOfDeath ?? f.death ?? '?'] ?? 0) + 1;
console.log('deaths', JSON.stringify(colony.life.deaths));
for (const t of T) {
  const z = done.map((f) => f.genome.morph[t]); const zm = mean(z), zs = sd(z);
  const cov = mean(z.map((v, i) => ((v - zm) / zs) * (w[i] / wm - 1)));
  const covL = mean(z.map((v, i) => ((v - zm) / zs) * (life[i] / mean(life) - 1)));
  console.log(`${t.padEnd(9)} sd ${zs.toFixed(3)}  β(offspring) ${cov.toFixed(3)}  β(lifespan) ${covL.toFixed(3)}`);
}
// Drift yardstick: what |β| a trait with no effect shows by chance here.
const shuffled = [];
for (let r = 0; r < 200; r++) { const z = done.map(() => Math.random()); const zm = mean(z), zs = sd(z); shuffled.push(Math.abs(mean(z.map((v, i) => ((v - zm) / zs) * (w[i] / wm - 1))))); }
shuffled.sort((a, b) => a - b);
console.log(`chance |β| 95th pct ${shuffled[190].toFixed(3)}`);
