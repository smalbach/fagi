// The organism in a batch run (--organism): what the day, the temperature and
// sleep did to each life. Nothing here runs without it, so the preregistered
// reports stay byte for byte what they were.

import { THERMAL } from '../../src/config.js';
import { organismOn } from '../../src/organism.js';
import { cycleAt } from '../../src/cycle.js';
import { isAsleep } from '../../src/sleep.js';
import { round, mean } from './stats.js';

export function newOrganismFollow() {
  if (!organismOn()) return null;
  return { cold: 0, heat: 0, stressed: 0, maxStress: 0, asleep: 0, nightOut: 0, night: 0, minTemp: Infinity, maxTemp: -Infinity };
}

export function noteOrganism(o, fagi, world, dt) {
  if (!o) return;
  if (fagi.thermalFeel === 'cold') o.cold += dt;
  if (fagi.thermalFeel === 'heat') o.heat += dt;
  if (fagi.thermalStress > 0) o.stressed += dt;
  o.maxStress = Math.max(o.maxStress, fagi.thermalStress);
  o.minTemp = Math.min(o.minTemp, fagi.temperature);
  o.maxTemp = Math.max(o.maxTemp, fagi.temperature);
  if (isAsleep(fagi)) o.asleep += dt;
  if (cycleAt(world.time).isNight) {
    o.night += dt;
    if (fagi.thought?.action !== 'rest') o.nightOut += dt;
  }
}

export function organismSummary(o, fagi) {
  if (!o) return null;
  const facts = fagi.brain.facts;
  const belief = (k) => (facts[k] ? round(facts[k].value, 2) : null);
  return {
    sex: fagi.sex,
    body: fagi.body,
    cold: round(o.cold), heat: round(o.heat), stressed: round(o.stressed),
    maxStress: round(o.maxStress / THERMAL.maxStress, 2),
    minTemp: round(o.minTemp, 1), maxTemp: round(o.maxTemp, 1),
    asleep: round(o.asleep), night: round(o.night), nightAwake: round(o.nightOut),
    consolidations: fagi.consolidations ?? 0,
    // What she ended up believing about the cold, the nest as refuge and the dark.
    beliefs: { cold: belief('cold'), heat: belief('heat'), refuge: belief('refuge'), dusk: belief('dusk') },
    reports: (fagi.nightReports ?? []).map((r) => ({
      night: r.night, episodes: r.episodes, hypotheses: r.hypotheses.length, strengthened: r.strengthened.length, forgotten: r.forgotten,
    })),
  };
}

export function reportOrganism(runs) {
  const rows = runs.map((r) => r.organism).filter(Boolean);
  if (!rows.length) return [];
  const m = (f) => round(mean(rows.map(f).filter((x) => x != null)), 2);
  const bySex = (sex) => runs.filter((r) => r.organism?.sex === sex);
  const L = ['organism (--organism)'];
  L.push(`  thermal     cold ${m((o) => o.cold)}s · heat ${m((o) => o.heat)}s · stressed ${m((o) => o.stressed)}s · peak stress ${m((o) => o.maxStress)} · body ${m((o) => o.minTemp)}–${m((o) => o.maxTemp)} °C`);
  L.push(`  nights      dark ${m((o) => o.night)}s · awake in the dark ${m((o) => o.nightAwake)}s · asleep ${m((o) => o.asleep)}s · nights sorted ${m((o) => o.consolidations)}`);
  L.push(`  learned     cold ${m((o) => o.beliefs.cold)} · heat ${m((o) => o.beliefs.heat)} · refuge ${m((o) => o.beliefs.refuge)} · dusk ${m((o) => o.beliefs.dusk)}`);
  for (const sex of ['female', 'male']) {
    const rs = bySex(sex);
    if (rs.length) L.push(`  ${sex.padEnd(10)}  ${rs.length} · lived ${round(mean(rs.map((r) => r.lived)))}s · alive ${rs.filter((r) => r.alive).length}`);
  }
  L.push('');
  return L;
}
