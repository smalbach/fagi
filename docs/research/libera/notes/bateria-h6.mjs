// H6 (LIBERA phase 4): does a stomach in two stages give anticipatory satiety?
//   node h6.mjs <instant|two-stage|no-satiety> <seed>
const R = '/Users/smalbach/Documents/first-agi-body';
const C = await import(`${R}/src/config.js`);
const { enableOrganism } = await import(`${R}/src/organism.js`); enableOrganism();
const [cond, seedS] = process.argv.slice(2); const seed = Number(seedS);
if (cond !== 'instant') { C.STOMACH.enabled = 1; C.STOMACH.satiety = cond === 'no-satiety' ? 0 : 1; }
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { createFagi, updateFagi } = await import(`${R}/src/fagi.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
const world = withRng(rng(500000 + 17 * seed), () => { const w = createWorld(); generateMap(w); return w; });
const fr = rng(seed), wr = rng(seed * 7919); const f = withRng(fr, () => createFagi());
const dt = 0.1, BOUT = 20; let bouts = [], cur = null, crit = 0, hsum = 0, n = 0, lowAfter = [];
for (let i = 0; i < 3600 / dt && f.alive; i++) {
  withRng(wr, () => stepWorld(world, dt));
  const e = f.eaten;
  withRng(fr, () => updateFagi(f, world, dt));
  const t = world.time;
  if (f.eaten > e) { if (cur && t - cur.last <= BOUT) { cur.bites++; cur.last = t; } else { if (cur) bouts.push(cur); cur = { bites: 1, start: t, last: t, startHunger: f.hunger }; } }
  if (cur && t - cur.last > BOUT && !cur.done) { cur.done = true; cur.endFelt = (f.hunger - (C.STOMACH.enabled ? C.STOMACH.satiety * (f.stomach ?? 0) : 0)); }
  if (f.hunger / C.HUNGER.max >= C.NEEDS.critical) crit += dt;
  hsum += f.hunger; n++;
}
if (cur) bouts.push(cur);
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
console.log(JSON.stringify({ cond, seed, alive: f.alive, lived: Math.round(f.age), cause: f.cause || null, meals: f.eaten, bouts: bouts.length,
  bitesPerBout: mean(bouts.map((b) => b.bites)), wasted: +(f.wasted ?? 0).toFixed(1), meanHunger: +(hsum / n).toFixed(1), critical: +(crit / Math.max(1, f.age)).toFixed(4) }));
