// The text report: each run, how alike they are and a verdict.

import { round, mean, stdev, cosine, similarSplit, divergence, pairs } from './stats.js';

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

export function report(opts, runs) {
  const L = [];
  L.push(`map ${opts.mapSeed} · ${runs.length} runs · max ${opts.duration}s · dt ${opts.dt} · world ${opts.worldVaries ? 'varies' : 'fixed'}`);
  if (opts.sets.length) L.push('changes: ' + opts.sets.map(([r, v]) => `${r.join('.')}=${JSON.stringify(v)}`).join(' '));
  L.push('');
  L.push(...reportRuns(runs));
  L.push(...reportSpread(runs));
  L.push(...reportLearning(runs));
  L.push(...reportHabits(runs));
  L.push(...reportActions(runs));
  L.push(...reportFirsts(runs));
  L.push(...reportPhases(opts, runs));
  if (runs.length > 1) L.push(...reportSimilarity(runs));
  return L.join('\n');
}

function reportRuns(runs) {
  const L = [];
  L.push(pad('seed', 9) + pad('lived', 8) + pad('cause', 8) + pad('ate', 7) + pad('drank', 7) + pad('stored', 8) + pad('1stH2O', 8) + pad('1stfood', 10) + 'fingerprint');
  for (const r of runs) {
    L.push(pad(r.seed, 9) + pad(r.lived, 8) + pad(r.cause ?? 'alive', 8) + pad(r.eaten, 7) + pad(r.drunk, 7) + pad(r.stored, 8) + pad(r.firstDrink ?? '-', 8) + pad(r.firstMeal ?? '-', 10) + r.fingerprint);
  }
  L.push('');
  return L;
}

function reportSpread(runs) {
  const L = [];
  const num = (k) => runs.map((r) => r[k]).filter((x) => x != null);
  const line = (name, xs) => {
    if (!xs.length) return `${pad(name, 14)}no data`;
    const m = mean(xs);
    return `${pad(name, 14)}mean ${pad(round(m), 8)} sd ${pad(round(stdev(xs)), 8)} cv ${pad(m ? round(stdev(xs) / m * 100, 0) + '%' : '-', 6)} min ${pad(round(Math.min(...xs)), 7)} max ${round(Math.max(...xs))}`;
  };
  L.push('spread');
  for (const k of ['lived', 'eaten', 'drunk', 'stored', 'firstDrink', 'firstMeal', 'exploreLegs', 'waterFirst', 'waterLater']) L.push('  ' + line(k, num(k)));

  const causes = {};
  for (const r of runs) causes[r.cause ?? 'alive'] = (causes[r.cause ?? 'alive'] ?? 0) + 1;
  L.push('  ' + pad('outcome', 14) + Object.entries(causes).map(([k, v]) => `${k} ${v}/${runs.length}`).join(' · '));
  L.push('');
  return L;
}

// What she learned about food, and what it cost her. "avoided" = kinds she met
// and never bit; "tried" = helpful kinds she did bite. Over-avoidance shows up
// as a low "tried".
// Habits (habits.js): where each one ended, and how many times they moved.
function reportHabits(runs) {
  const ids = Object.keys(runs[0]?.habitValues ?? {});
  if (!ids.length) return [];
  const L = ['habits at the end (value: runs)'];
  for (const id of ids) {
    const counts = {};
    for (const r of runs) counts[r.habitValues[id]] = (counts[r.habitValues[id]] ?? 0) + 1;
    const moves = runs.reduce((a, r) => a + (r.habits?.[id]?.moves?.length ?? 0), 0);
    L.push(`  ${pad(id, 22)} ${Object.entries(counts).map(([v, n]) => `${v}: ${n}`).join(' · ')}   (${moves} moves kept)`);
  }
  L.push('');
  return L;
}

function reportLearning(runs) {
  const L = [];
  const sum = (k) => runs.reduce((a, r) => a + (r.learning?.[k] ?? 0), 0);
  const pctOf = (a, b) => (b ? `${round((a / b) * 100, 0)}%` : '-');
  const bites = sum('bites');
  L.push('learning (all runs together)');
  L.push(`  ${pad('bites', 22)} ${bites}   harmful ${sum('harmfulBites')} (${pctOf(sum('harmfulBites'), bites)})`);
  L.push(`  ${pad('harmful kinds avoided', 22)} ${sum('harmfulAvoided')}/${sum('harmfulMet')} (${pctOf(sum('harmfulAvoided'), sum('harmfulMet'))}) never bitten after meeting them`);
  L.push(`  ${pad('helpful kinds tried', 22)} ${sum('helpfulTried')}/${sum('helpfulMet')} (${pctOf(sum('helpfulTried'), sum('helpfulMet'))})`);
  L.push(`  ${pad('first harmful bites', 22)} ${sum('harmfulFirstBites')}   (${round(sum('harmfulFirstBites') / runs.length)} per run)`);
  const rules = {};
  const traitRules = runs.flatMap((r) => r.learning?.traitRules ?? []);
  for (const { id } of traitRules) rules[id] = (rules[id] ?? 0) + 1;
  const top = Object.entries(rules).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (top.length) L.push(`  ${pad('trait rules at the end', 22)} ${top.map(([k, v]) => `${k} ${v}/${runs.length}`).join(' · ')}`);
  // Against the hidden chemistry: a rule is right if every fruit it covers on
  // the map really does what it says; a superstition covers some that do not.
  if (traitRules.length) {
    const right = traitRules.filter((r) => r.total > 0 && r.ok === r.total).length;
    const covered = traitRules.reduce((a, r) => a + r.total, 0);
    const ok = traitRules.reduce((a, r) => a + r.ok, 0);
    const exceptions = traitRules.filter((r) => r.except).length;
    L.push(`  ${pad('trait rules vs truth', 22)} ${traitRules.length} rules, ${right} fully right (${pctOf(right, traitRules.length)}); ${pctOf(ok, covered)} of the fruit they cover really do what they say; ${exceptions} with exceptions`);
  }
  // Opinions about untasted fruit (each change of her stance on one): every
  // cautious or eager one should trace back to bites she really took.
  const opinions = runs.flatMap((r) => r.learning?.opinions ?? []);
  if (opinions.length) {
    const by = {};
    for (const o of opinions) by[o.stance] = (by[o.stance] ?? 0) + 1;
    const formed = opinions.filter((o) => o.stance !== 'curious');
    const traced = formed.filter((o) => o.traced).length;
    const hanging = formed.filter((o) => o.without).length;
    L.push(`  ${pad('opinions on untasted', 22)} ${opinions.length}: ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    L.push(`  ${pad('traced to real bites', 22)} ${traced}/${formed.length} (${pctOf(traced, formed.length)}); ${hanging} would change with one trait less`);
  }
  L.push('');
  return L;
}

// Average split of time per action.
function reportActions(runs) {
  const L = [];
  const total = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.actions)) total[k] = (total[k] ?? 0) + v / r.lived;
  L.push('time per action (mean of % per run, ± sd)');
  for (const [k] of Object.entries(total).sort((a, b) => b[1] - a[1])) {
    const xs = runs.map((r) => ((r.actions[k] ?? 0) / r.lived) * 100);
    L.push(`  ${pad(k, 20)} ${pad(round(mean(xs)) + '%', 8)} ± ${round(stdev(xs))}`);
  }
  L.push('');
  return L;
}

// Which resource she finds first.
function reportFirsts(runs) {
  const L = [];
  const firsts = {};
  for (const r of runs) {
    const water = r.visited.find((v) => v.startsWith('water')) ?? 'none';
    const tree = r.visited.find((v) => v.startsWith('tree')) ?? 'none';
    firsts[`water ${water}`] = (firsts[`water ${water}`] ?? 0) + 1;
    firsts[`tree ${tree}`] = (firsts[`tree ${tree}`] ?? 0) + 1;
  }
  L.push('first resource she steps on');
  for (const [k, v] of Object.entries(firsts).sort()) L.push(`  ${pad(k, 20)} ${v}/${runs.length}`);
  L.push('');
  return L;
}

function reportPhases(opts, runs) {
  const L = [];
  const phaseList = opts.block != null ? ['before', 'after'] : ['before'];
  const fieldsOf = [
    ['foodTrip', 'trip out for food (s)'],
    ['onTrail', 'trip with pheromone underfoot (%)'],
    ['followsTrail', 'trip following pheromone (%)'],
    ['ignoresTrail', 'pheromone underfoot, ignored (%)'],
    ['byMemory', 'trip to remembered tree (%)'],
    ['stuck', 'stuck (s)'],
    ['waterTrip', 'reach the water (s)'],
  ];
  L.push(opts.block != null
    ? `wall at ${opts.block}s (rocks placed on average: ${round(mean(runs.map((r) => Math.max(0, r.rocks))))})`
    : 'trips out for food');
  L.push('  ' + pad('', 34) + phaseList.map((f) => pad(f, 12)).join(''));
  for (const [k, name] of fieldsOf) {
    L.push('  ' + pad(name, 34) + phaseList.map((f) => {
      const xs = runs.map((r) => r.phases[f]?.[k]).filter((x) => x != null);
      return pad(xs.length ? round(mean(xs)) : '-', 12);
    }).join(''));
  }
  const actions = new Set(runs.flatMap((r) => phaseList.flatMap((f) => Object.keys(r.phases[f]?.tripActions ?? {}))));
  L.push('  on the way out, % of time doing:');
  for (const a of [...actions].sort()) {
    L.push('    ' + pad(a, 32) + phaseList.map((f) => pad(round(mean(runs.map((r) => r.phases[f]?.tripActions?.[a] ?? 0))), 12)).join(''));
  }
  if (opts.block != null) {
    const deadOnes = runs.filter((r) => !r.alive && r.lived >= opts.block).length;
    L.push(`  die after the wall: ${deadOnes}/${runs.length}`);
  }
  L.push('');
  return L;
}

function reportSimilarity(runs) {
  const L = [];
  const split = pairs(runs, (a, b) => similarSplit(a.actions, b.actions));
  const warmth = pairs(runs, (a, b) => cosine(a.heat, b.heat));
  const div = pairs(runs, (a, b) => divergence(a.path, b.path)).filter((x) => x != null);
  L.push('similarity between pairs of runs (1 = identical)');
  L.push(`  action split          mean ${round(mean(split), 3)}  min ${round(Math.min(...split), 3)}`);
  L.push(`  heat map              mean ${round(mean(warmth), 3)}  min ${round(Math.min(...warmth), 3)}`);
  L.push(`  paths diverge         at ${div.length ? round(mean(div)) + 's on average' : 'never (>60px)'}`);
  const uniqueOnes = new Set(runs.map((r) => r.fingerprint)).size;
  L.push(`  distinct sessions     ${uniqueOnes}/${runs.length}`);
  L.push('');
  L.push(verdict(runs, split, warmth));
  return L;
}

function verdict(runs, split, warmth) {
  const lives = runs.map((r) => r.lived);
  const cv = stdev(lives) / (mean(lives) || 1);
  const r = mean(split), c = mean(warmth);
  const parts = [];
  parts.push(r > 0.9 ? 'splits time almost the same' : r > 0.75 ? 'splits time similarly' : 'splits time very differently');
  parts.push(c > 0.8 ? 'covers the same areas' : c > 0.5 ? 'covers similar areas' : 'covers different areas');
  parts.push(cv < 0.15 ? 'stable survival' : cv < 0.4 ? 'somewhat variable survival' : 'highly variable survival');
  return `verdict: ${parts.join(', ')} (lifespan cv ${round(cv * 100, 0)}%).`;
}
