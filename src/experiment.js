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

import { EXPERIMENT, SCIENCE } from './config.js';
import { cuesOf, predict } from './learned/cues.js';

const tasted = (fagi, key) => (fagi.brain.facts[key]?.tries ?? 0) > 0;

// Tomorrow's agenda from a night report: the fruit to taste, most asked first.
// A 'check' question about a trait asks for any untasted fruit she knows of
// that carries it. With the scientific night (SCIENCE), each comes with what
// her traits predict of it, and the order is by learning progress × safety.
export function agendaFrom(fagi, report) {
  const keys = [];
  const add = (k) => { if (!keys.includes(k) && !tasted(fagi, k) && cuesOf(k).length) keys.push(k); };
  for (const q of report.questions ?? []) {
    if (q.kind === 'taste') add(q.key);
    else if (q.kind === 'check') for (const k of Object.keys(fagi.brain.facts)) if (cuesOf(k).includes(q.cue)) add(k);
  }
  if (!SCIENCE.enabled) return keys.slice(0, EXPERIMENT.agenda);
  const hyps = keys.map((k) => hypothesisOf(fagi, k, report.night));
  if (SCIENCE.order === 'lp') hyps.sort((a, b) => b.worth - a.worth || (a.key < b.key ? -1 : 1));
  const chosen = hyps.slice(0, EXPERIMENT.agenda);
  fagi.hypotheses = Object.fromEntries(chosen.map((h) => [h.key, h]));
  return chosen.map((h) => h.key);
}

// --- the scientific night (SCIENCE) -------------------------------------------

const r2 = (v) => Math.round(v * 100) / 100;
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

// How much her predictions on a trait have been improving: the error of the
// older half of its record minus that of the newer half (> 0: improving).
// A trait never tested promises SCIENCE.novelty.
function progressOf(fagi, cue) {
  const errs = fagi.cueErrors?.[cue];
  if (!errs?.length) return { progress: SCIENCE.novelty, error: null, noisy: false };
  const half = Math.ceil(errs.length / 2);
  const older = errs.slice(0, half), newer = errs.slice(half);
  const progress = newer.length ? avg(older) - avg(newer) : SCIENCE.novelty / 2;
  const error = avg(newer.length ? newer : older);
  const noisy = errs.length >= SCIENCE.window && error > SCIENCE.noisy && progress <= 0;
  return { progress: Math.max(0, progress), error, noisy };
}

// A question as a hypothesis: what her traits predict of this fruit, how sure,
// how much she expects to learn (unsureness plus her traits' progress), how
// safe it looks, and whether it rests on a trait that is noise for now.
export function hypothesisOf(fagi, key, night = null) {
  const cues = cuesOf(key);
  const p = predict(fagi.brain.cues, cues);
  const traits = cues.map((c) => progressOf(fagi, c));
  const learn = (1 - p.confidence) + avg(traits.map((t) => t.progress));
  const safety = 1 - Math.max(0, -p.value);
  const noisy = traits.some((t) => t.noisy);
  return {
    key, night,
    predicts: p.value < 0 ? 'harm' : 'benefit',
    value: r2(p.value), confidence: r2(p.confidence),
    learn: r2(learn), safety: r2(safety), noisy,
    worth: r2(learn * safety * (noisy ? 0.25 : 1)),
  };
}

// What a tasted question says of its hypothesis: confirmed when the bite went
// the way the traits predicted, refuted when it went the other. Every trait
// it rested on keeps the error, which is how progress is told from noise.
function verdictOn(fagi, key) {
  const h = fagi.hypotheses?.[key];
  const meal = fagi.lastMeal;
  if (!h || !meal || meal.type !== key) return null;
  const outcome = meal.reward ?? 0;
  const err = Math.min(2, Math.abs(outcome - h.value));
  for (const c of cuesOf(key)) {
    const list = ((fagi.cueErrors ??= {})[c] ??= []);
    list.push(r2(err));
    if (list.length > SCIENCE.window) list.shift();
  }
  const v = {
    key, night: h.night, at: r2(fagi.age ?? 0),
    predicted: h.predicts, value: h.value, outcome: r2(outcome),
    verdict: outcome === 0 ? 'open' : (outcome < 0) === (h.predicts === 'harm') ? 'confirmed' : 'refuted',
  };
  (fagi.verdicts ??= []).push(v);
  if (fagi.verdicts.length > 40) fagi.verdicts.shift();
  delete fagi.hypotheses[key];
  return v;
}

// Is this fruit one of today's questions?
export const onAgenda = (fagi, key) => Boolean(EXPERIMENT.enabled && fagi.agenda?.includes(key));

// Tasted: the question is answered, whatever the answer was.
export function answered(fagi, key) {
  if (!fagi.agenda) return;
  if (SCIENCE.enabled) verdictOn(fagi, key);
  fagi.agenda = fagi.agenda.filter((k) => k !== key);
  fagi.experiments = (fagi.experiments ?? 0) + 1;
  fagi.lastExperiment = { n: fagi.experiments, key };
}
