// H3 (LIBERA phase 1): does the scientific night reach correct beliefs sooner
// without more false ones?   node h3.mjs <none|agenda|asked|lp> <seed> [seconds]
const R = '/Users/smalbach/Documents/first-agi-body';
const C = await import(`${R}/src/config.js`);
const { enableOrganism } = await import(`${R}/src/organism.js`);
enableOrganism();
C.MAPGEN.species = Number(process.env.SPECIES ?? 6); C.EXPERIMENT.agenda = Number(process.env.AGENDA ?? C.EXPERIMENT.agenda);
const [cond, seedS, secS] = process.argv.slice(2);
const seed = Number(seedS), seconds = Number(secS ?? 2400);
if (cond === 'none') C.EXPERIMENT.enabled = 0;
if (cond === 'asked') { C.SCIENCE.enabled = 1; C.SCIENCE.order = 'asked'; }
if (cond === 'lp') { C.SCIENCE.enabled = 1; C.SCIENCE.order = 'lp'; }
const { createWorld } = await import(`${R}/src/world.js`);
const { generateMap } = await import(`${R}/src/mapgen.js`);
const { createFagi, updateFagi } = await import(`${R}/src/fagi.js`);
const { stepWorld } = await import(`${R}/src/simulation.js`);
const { isHarmful, isHelpful, speciesKey, cuesOfTraits, feedOf, TRAITS } = await import(`${R}/src/chemistry.js`);
const { verdict } = await import(`${R}/src/learned/rules.js`);
const { aversive } = await import(`${R}/src/appetite.js`);
const { rng, withRng } = await import(`${R}/scripts/batch/random.js`);
// Judgment over the map's looks (as research/organism/life.js), with the counts.
function judge(f, chem) {
  let hit = 0, miss = 0, fa = 0, ok = 0;
  const looks = chem?.taste ? Object.keys(chem.compositions).map((k) => { const [color, shape, smell] = k.split('-'); return { color, shape, smell }; })
    : TRAITS.color.flatMap((color) => TRAITS.shape.flatMap((shape) => TRAITS.smell.map((smell) => ({ color, shape, smell }))));
  for (const t of looks) {
    const key = speciesKey(t), cues = cuesOfTraits(t);
    const avoids = verdict(f, 'pursue', key, { traits: cues }) === 'avoid' || aversive(f, key, cues);
    if (feedOf(chem, t) === 'poison') { if (avoids) hit++; else miss++; } else if (avoids) fa++; else ok++;
  }
  return { score: ((hit + miss ? hit / (hit + miss) : 1) + (fa + ok ? ok / (fa + ok) : 1)) / 2, falseAvoid: fa, falseTrust: miss };
}
const mapSeed = 300000 + 17 * seed;
const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
const worldRng = rng(seed * 7919), fagiRng = rng(seed);
const f = withRng(fagiRng, () => createFagi());
const dt = 0.1, curve = [];
let dose = 0, reached = null; const helpfulKinds = new Set(world.species.filter((s) => isHelpful(s.key)).map((s) => s.key)); const found = new Set();
for (let s = 0; s < seconds / dt && f.alive; s++) {
  withRng(worldRng, () => stepWorld(world, dt));
  const eaten = f.eaten;
  withRng(fagiRng, () => updateFagi(f, world, dt));
  if (f.eaten !== eaten && f.lastMeal) {
    const k = f.lastMeal.type, portion = f.lastEpisode?.portion ?? 1;
    if (isHarmful(k)) dose += portion;
    if (helpfulKinds.has(k)) found.add(k);
  }
  if (s % Math.round(200 / dt) === 0 && s > 0) {
    const j = judge(f, world.chemistry); curve.push(+j.score.toFixed(3));
    if (reached == null && j.score >= 0.8) reached = Math.round(world.time);
  }
}
const end = judge(f, world.chemistry);
const v = f.verdicts ?? [];
console.log(JSON.stringify({ cond, seed, alive: f.alive, lived: Math.round(f.age), cause: f.cause ?? null,
  judgment: +end.score.toFixed(3), falseAvoid: end.falseAvoid, falseTrust: end.falseTrust, reached, auc: curve.length ? +(curve.reduce((a, b) => a + b, 0) / curve.length).toFixed(3) : null,
  dose: +dose.toFixed(2), helpful: helpfulKinds.size ? +(found.size / helpfulKinds.size).toFixed(3) : null, experiments: f.experiments ?? 0,
  confirmed: v.filter((x) => x.verdict === 'confirmed').length, refuted: v.filter((x) => x.verdict === 'refuted').length }));
