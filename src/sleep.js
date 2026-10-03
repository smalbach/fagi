// Sleep pressure and the nights she sleeps through.
//
// Pressure builds up while she is awake (faster in the dark) and drains while
// she sleeps, better in the nest. Sleeping is resting for long enough: the
// decision to lie down is endure's (decision/endure.js, `sleep`); here only
// what it does to her.
//
// Once per night, after SLEEP.minSleep seconds asleep in the nest, the day is
// sorted (consolidation.js). Not awake, not the moment she walks in, not twice.

import { SLEEP, CYCLE, NIGHTAI, SCIENCE } from './config.js';
import { cycleAt, nightOf } from './cycle.js';
import { nestUnder } from './nest.js';
import { consolidate } from './consolidation.js';
import { record } from './world.js';
import { agendaFrom } from './experiment.js';
import { askTheNight, createNightMind } from './night/index.js';

// Is she asleep right now (as opposed to awake, doing anything else)?
export const isAsleep = (fagi) => fagi.alive && fagi.thought?.action === 'rest' && !fagi.swimming;

// Which night it is for "once per night". Without a day cycle, every bout of
// sleep in the nest counts as its own night.
function nightId(fagi, world) {
  return CYCLE.enabled ? nightOf(world.time) : fagi.sleepBouts ?? 0;
}

function sortTheDay(fagi, world) {
  const night = nightId(fagi, world);
  const since = fagi.consolidatedAt ?? -Infinity;
  const report = consolidate(fagi, { night, now: fagi.age, since });
  // The scientific night: yesterday's experiments come back as verdicts on
  // what she had predicted, with where the question came from (SCIENCE).
  if (SCIENCE.enabled) report.verdicts = (fagi.verdicts ?? []).filter((v) => v.at > since);
  fagi.consolidatedAt = fagi.age;
  fagi.consolidatedNight = night;
  fagi.consolidations = (fagi.consolidations ?? 0) + 1;
  report.n = fagi.consolidations;
  fagi.lastNightReport = report;
  (fagi.nightReports ??= []).push(report);
  if (fagi.nightReports.length > SLEEP.reports) fagi.nightReports.splice(0, fagi.nightReports.length - SLEEP.reports);
  // What the night asked becomes what she tries when she wakes up.
  fagi.agenda = agendaFrom(fagi, report);
  // And, if there is one, the night mind proposes on top of it (night/).
  if (NIGHTAI.enabled && report.sorted) {
    if (!fagi.nightMind || fagi.nightMind.name !== NIGHTAI.backend) {
      fagi.nightMind = createNightMind(NIGHTAI.backend, { url: NIGHTAI.url });
    }
    askTheNight(fagi, report, fagi.nightMind, (entries) => {
      if (!fagi.sister) record(world, 'night_mind', { night: report.night, entries });
    });
  }
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
  if (!fagi.sister) record(world, 'night_report', { report });
}

// Once per frame, after she decided (the decision says whether she lies down).
export function updateSleep(fagi, world, dt) {
  if (!SLEEP.enabled || !fagi.alive) return;
  const asleep = isAsleep(fagi);
  const inNest = Boolean(nestUnder(fagi, world));
  if (asleep) {
    fagi.sleepPressure = Math.max(0, fagi.sleepPressure - (inNest ? SLEEP.fall : SLEEP.fallOutside) * dt);
  } else {
    const dark = CYCLE.enabled && cycleAt(world.time).isNight;
    fagi.sleepPressure = Math.min(1, fagi.sleepPressure + SLEEP.rise * (dark ? SLEEP.nightRise : 1) * dt);
  }

  // Asleep in the nest: the bout grows. Waking up or leaving ends it.
  if (asleep && inNest) {
    if (!fagi.sleepTime) fagi.sleepBouts = (fagi.sleepBouts ?? 0) + 1;
    fagi.sleepTime = (fagi.sleepTime ?? 0) + dt;
  } else {
    fagi.sleepTime = 0;
  }

  // With a day cycle, only a night's sleep sorts the day: a nap at noon does not.
  const sleptEnough = fagi.sleepTime >= SLEEP.minSleep;
  const night = !CYCLE.enabled || cycleAt(world.time).isNight;
  if (sleptEnough && night && fagi.consolidatedNight !== nightId(fagi, world)) sortTheDay(fagi, world);
}
