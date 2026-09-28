// Experiments: what last night's questions send her to try today.
//
// The night report (consolidation.js) ends with questions: fruit she has
// noticed and never tasted, and traits whose hypothesis has exceptions or
// little behind it. Waking up, those questions are her agenda. When nothing
// presses and one of those fruit is in sight, she goes to it and takes a
// small bite (EXPERIMENT.portion) instead of a meal: the body pays a fraction
// of what the fruit does, and she learns what a whole one would do, because
// she knows how small the bite was (episodes.js scales what she felt).
//
// Only what she lived makes a question, so nothing here knows what a fruit
// really is. With SLEEP.consolidate = 0 the night asks nothing and the agenda
// stays empty: the experiment is the part of sleeping that reaches the day.
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.3, §12.5)

import { EXPERIMENT } from './config.js';
import { cuesOf } from './learned/cues.js';

const tasted = (fagi, key) => (fagi.brain.facts[key]?.tries ?? 0) > 0;

// Tomorrow's agenda from a night report: the fruit to taste, most asked first.
// A 'check' question about a trait asks for any untasted fruit she knows of
// that carries it.
export function agendaFrom(fagi, report) {
  const keys = [];
  const add = (k) => { if (!keys.includes(k) && !tasted(fagi, k) && cuesOf(k).length) keys.push(k); };
  for (const q of report.questions ?? []) {
    if (q.kind === 'taste') add(q.key);
    else if (q.kind === 'check') for (const k of Object.keys(fagi.brain.facts)) if (cuesOf(k).includes(q.cue)) add(k);
  }
  return keys.slice(0, EXPERIMENT.agenda);
}

// Is this fruit one of today's questions?
export const onAgenda = (fagi, key) => Boolean(EXPERIMENT.enabled && fagi.agenda?.includes(key));

// Tasted: the question is answered, whatever the answer was.
export function answered(fagi, key) {
  if (!fagi.agenda) return;
  fagi.agenda = fagi.agenda.filter((k) => k !== key);
  fagi.experiments = (fagi.experiments ?? 0) + 1;
  fagi.lastExperiment = { n: fagi.experiments, key };
}
