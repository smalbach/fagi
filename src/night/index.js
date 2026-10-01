// The night mind: a model that, while she sleeps, proposes hypotheses about
// what she lived, and a gate that decides which of them she keeps.
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §11.3, phase 4)
//
// The model is a hypothesis engine, never an authority:
//
//   proposal → schema check → references check → sandbox → accepted or rejected
//
//   input     what she knows and nothing else (`nightInput`): the night report,
//             the fruit she tasted (by how they look, with what they did to her
//             on average), the traits she has met, her live rules. No names,
//             no world, no truth.
//   output    data in a small declarative grammar (`validateProposal`):
//               { type: 'rule', when: { all: [trait...] }, verdict: 'avoid'|'prefer',
//                 replaces?: [ids of her rules about traits], why? }
//               { type: 'explore', look: 'color-shape-smell' }
//               { type: 'doubt', rule: '<id of one of her rules about traits>' }
//             Nothing else: no code, no species rules, no constants, no
//             forgetting. Anything that does not fit is rejected whole.
//   sandbox   `trial`: a counterfactual on her own memory, not a run of the
//             world (running the world would tell her what things really are).
//             Each fruit she tasted is judged as if she had never tasted it,
//             only by its traits, with her rules and with her rules plus the
//             proposal; the proposal must be backed by at least
//             NIGHTAI.minSupport of those fruit, contradicted by none, must
//             not make those judgments worse, and must change how she judges
//             at least one fruit she knows (a rule she already holds in other
//             words adds nothing).
//   accepted  a rule enters as { source: { kind: 'night' } }, trusted
//             NIGHTAI.trust, and from then on answers to what she lives like
//             any rule she did not live herself (learned/synth.js checkTold
//             retires it when the fruit she tastes go against it). An explore
//             proposal adds a fruit she has seen and never tasted to her agenda.
//             A rule that `replaces` others is weighed as one revision: the new
//             rule in, those out, all or nothing ("red" becomes "red and
//             sour"); each rule it replaces must be contradicted by something
//             she lived.
//             A doubt retires one of her rules about traits, and only if some
//             fruit she lived goes against it and, without it, she would judge
//             what she lived strictly better: correcting a belief, never
//             erasing memory. What she lives next can write it again.
//   log       every proposal, kept or not, with why (`fagi.nightLog`).
//
// The backend is local by default (night/local.js, deterministic, no network)
// or a real server (night/http.js). An answer never blocks the frame and
// can arrive late: it is applied only if she is alive and it is still the
// same night's question. NIGHTAI.enabled = 0: no model is asked anything.

import { NIGHTAI, CUES } from '../config.js';
import { cuesOf } from '../learned/cues.js';
import { weight } from '../memory.js';
import { verdict, upsertRule, activeRule, retireRule } from '../learned/rules.js';
import { rule as checkRule } from '../learned/dsl.js';
import { SCOPE } from '../learned/synth.js';
import { lookOf, unnamed } from '../percept.js';
import { TIERS, BEHAVIORS, programOf, line, validateIf, condId } from '../program.js';
import { weigh as weighMoments, involving } from '../program/learn.js';
import { createLocalNight } from './local.js';
import { createHttpNight } from './http.js';

const CUE_FORM = /^(color|shape|smell):[a-z]{1,20}$/;
const LOOK_FORM = /^[a-z]{1,20}-[a-z]{1,20}-[a-z]{1,20}$/;
const r2 = (v) => Math.round(v * 100) / 100;

export function createNightMind(kind = NIGHTAI.backend, { url, fetch } = {}) {
  if (kind === 'http' && url) return createHttpNight({ url, fetch });
  if (kind === 'local') return createLocalNight();
  return null;
}

// The fruit she tasted, by type: how many bites and what they did on average.
// Only her own bites, never what she watched a sister eat.
export function livedKinds(fagi) {
  const kinds = new Map();
  for (const b of fagi.brain.bites ?? []) {
    if (b.saw != null || !cuesOf(b.key).length) continue;
    const k = kinds.get(b.key) ?? { bites: 0, sum: 0 };
    if (!b.late) k.bites += 1;
    k.sum += b.reward;
    kinds.set(b.key, k);
  }
  return [...kinds].filter(([, k]) => k.bites > 0).map(([key, k]) => ({ key, mean: k.sum / k.bites, bites: k.bites }));
}

// What the model reads: only what she knows.
export function nightInput(fagi, report) {
  const tasted = livedKinds(fagi).map((k) => ({ look: lookOf(k.key), traits: cuesOf(k.key), bites: k.bites, felt: r2(k.mean) }));
  const seen = Object.entries(fagi.brain.facts)
    .filter(([k, r]) => r.tries === 0 && cuesOf(k).length)
    .map(([k]) => ({ look: lookOf(k), traits: cuesOf(k) }));
  const traits = Object.fromEntries(Object.entries(fagi.brain.cues ?? {}).map(([c, e]) => [c, { weight: r2(e.w), met: e.n }]));
  const rules = fagi.brain.rules.list.filter((r) => !r.retired)
    .map((r) => JSON.parse(unnamed(JSON.stringify({ id: r.id, when: r.when, verdict: r.verdict, ...(r.except ? { except: r.except } : {}) }))));
  const progLines = programOf(fagi).lines.filter((l) => !l.retired).map((l) => ({
    id: l.id, tier: l.tier, do: l.do, ...(l.if ? { if: l.if } : {}), ...(l.chain ? { chain: l.chain } : {}), source: l.source,
  }));
  return {
    version: 1,
    night: report.night,
    report: {
      episodes: report.episodes,
      hypotheses: report.hypotheses.map((h) => ({ when: h.when, predict: h.predict, confidence: h.confidence, support: h.support, exceptions: h.exceptions })),
      questions: report.questions.map((q) => (q.key ? { ...q, key: lookOf(q.key) } : q)),
    },
    tasted, seen, traits, rules,
    program: progLines,
    allowed: {
      proposals: NIGHTAI.maxProposals,
      rule: { type: 'rule', when: { all: ['<trait she has met>'] }, verdict: 'avoid|prefer', replaces: ['<optional ids from "rules">'], why: '<short text>' },
      explore: { type: 'explore', look: '<a look from "seen">' },
      doubt: { type: 'doubt', rule: '<an id from "rules", about traits>' },
      program: { type: 'program', tier: 'endure|provide|clues|explore', do: '<behavior she can do>', over: '<id of line to precede>', if: '<optional conditions>', chain: ['<behavior1>', '<behavior2>'], why: '<reason>' },
    },
  };
}

// Shape and references. Returns the clean proposal, or { reject: reason }.
export function validateProposal(p, fagi) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { reject: 'not an object' };
  const known = new Set(Object.keys(fagi.brain.cues ?? {}));
  if (p.type === 'rule') {
    const extra = Object.keys(p).filter((k) => !['type', 'when', 'verdict', 'why', 'replaces'].includes(k));
    if (extra.length) return { reject: `unknown fields: ${extra.join(', ').slice(0, 60)}` };
    const all = p.when?.all;
    if (!p.when || typeof p.when !== 'object' || Object.keys(p.when).some((k) => k !== 'all')) return { reject: 'a rule is about traits only' };
    if (!Array.isArray(all) || all.length < 1 || all.length > 3) return { reject: '"all" must list 1 to 3 traits' };
    if (all.some((c) => typeof c !== 'string' || !CUE_FORM.test(c))) return { reject: 'malformed trait' };
    if (new Set(all).size !== all.length) return { reject: 'repeated trait' };
    if (all.some((c) => !known.has(c))) return { reject: 'a trait she has never met' };
    if (!['avoid', 'prefer'].includes(p.verdict)) return { reject: 'verdict must be avoid|prefer' };
    const why = typeof p.why === 'string' ? p.why.slice(0, 160) : '';
    const replaces = [];
    if (p.replaces !== undefined) {
      if (!Array.isArray(p.replaces) || p.replaces.length > 3) return { reject: '"replaces" must list at most 3 rule ids' };
      for (const id of p.replaces) {
        const r = liveTraitRule(fagi, id);
        if (!r) return { reject: 'it replaces something that is not one of her live rules about traits' };
        if (!replaces.includes(r.id)) replaces.push(r.id);
      }
    }
    return { type: 'rule', when: { all: [...all].sort() }, verdict: p.verdict, why, ...(replaces.length ? { replaces } : {}) };
  }
  if (p.type === 'explore') {
    if (Object.keys(p).some((k) => !['type', 'look', 'why'].includes(k))) return { reject: 'unknown fields' };
    if (typeof p.look !== 'string' || !LOOK_FORM.test(p.look)) return { reject: 'malformed look' };
    const key = Object.keys(fagi.brain.facts).find((k) => lookOf(k) === p.look);
    if (!key) return { reject: 'a fruit she has never seen' };
    if (fagi.brain.facts[key].tries > 0) return { reject: 'already tasted' };
    return { type: 'explore', key, look: p.look };
  }
  if (p.type === 'doubt') {
    if (Object.keys(p).some((k) => !['type', 'rule', 'why'].includes(k))) return { reject: 'unknown fields' };
    const r = liveTraitRule(fagi, p.rule);
    if (!r) return { reject: 'not one of her live rules about traits' };
    return { type: 'doubt', id: r.id };
  }
  if (p.type === 'program') {
    const extra = Object.keys(p).filter((k) => !['type', 'tier', 'do', 'over', 'if', 'chain', 'why'].includes(k));
    if (extra.length) return { reject: `unknown fields: ${extra.join(', ').slice(0, 60)}` };
    if (!TIERS.includes(p.tier) || p.tier === 'survive') return { reject: 'tier must be endure|provide|clues|explore' };
    if (!BEHAVIORS.includes(p.do)) return { reject: `unknown behavior "${p.do}"` };
    const program = programOf(fagi);
    const overLine = program.lines.find((l) => l.id === p.over && !l.retired);
    if (!overLine || overLine.tier === 'survive') return { reject: 'over must be a live non-survive line' };
    if (p.chain !== undefined) {
      if (!Array.isArray(p.chain) || p.chain.length < 2 || p.chain.some((b) => !BEHAVIORS.includes(b))) {
        return { reject: 'chain must be an array of at least 2 valid behaviors' };
      }
    }
    let when = null;
    if (p.if !== undefined) {
      try { when = validateIf(p.if); } catch (err) { return { reject: err.message }; }
    }
    const why = typeof p.why === 'string' ? p.why.slice(0, 160) : 'the night mind';
    return {
      type: 'program', tier: p.tier, do: p.do, over: p.over,
      ...(when ? { if: when } : {}),
      ...(p.chain ? { chain: p.chain } : {}),
      why,
    };
  }
  return { reject: 'type must be rule|explore|doubt|program' };
}

// One of her live rules about traits, by id. The model read the ids with no
// code names (percept.js), so they are matched that way too.
function liveTraitRule(fagi, id) {
  if (typeof id !== 'string' || id.length > 80) return null;
  const r = fagi.brain.rules.list.find((x) => !x.retired && (x.id === id || unnamed(x.id) === id));
  return r?.when.all ? r : null;
}

// Judging without some of her rules, without touching them: they are set
// aside for the count and put back.
function withoutRules(fagi, ids, fn) {
  const q = fagi.brain.rules.quarantined;
  const added = ids.filter((id) => !q.has(id));
  for (const id of added) q.add(id);
  try { return fn(); } finally { for (const id of added) q.delete(id); }
}

// How what she lived went for one of her rules: fruit that back it, and against.
function tally(r, lived) {
  const covered = lived.filter((k) => r.when.all.every((c) => cuesOf(k.key).includes(c)) && !(r.except ?? []).includes(k.key));
  const pro = covered.filter((k) => (r.verdict === 'avoid' ? k.mean < 0 : k.mean > 0)).length;
  return { pro, con: covered.length - pro };
}

const ruleId = (p) => `night-${p.verdict}-${p.when.all.join('-').replace(/:/g, '-')}`.slice(0, 64);

// Her verdict on a fruit judged by its traits alone, with or without `extra`.
// A proposed 'avoid' warns her off what it covers; a 'prefer' only speaks
// where no 'avoid' already does (verdict() gives 'avoid' precedence).
function judged(fagi, key, extra) {
  const traits = cuesOf(key);
  const base = verdict(fagi, 'pursue', key, { traits, blind: true });
  if (!extra || !extra.when.all.every((c) => traits.includes(c))) return base;
  if (extra.verdict === 'avoid') return 'avoid';
  return base === 'avoid' ? 'avoid' : 'prefer';
}

// Balanced accuracy of judging each lived fruit by its traits alone: does it
// warn her off the ones that harmed her and not off the others?
function judge(fagi, lived, extra) {
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const k of lived) {
    const avoids = judged(fagi, k.key, extra) === 'avoid';
    if (k.mean < 0) { if (avoids) hit++; else miss++; } else if (avoids) fa++; else ok++;
  }
  const tpr = hit + miss ? hit / (hit + miss) : 1;
  const tnr = fa + ok ? ok / (fa + ok) : 1;
  return (tpr + tnr) / 2;
}

// The sandbox. Nothing of hers changes here.
export function trial(fagi, p) {
  if (p.type === 'explore') {
    if (fagi.agenda?.includes(p.key)) return { accept: false, why: 'already on her agenda' };
    return { accept: true, why: 'a question about a fruit she has seen' };
  }
  if (p.type === 'program') {
    const moments = fagi.brain.watch?.moments ?? [];
    const program = programOf(fagi);
    const exists = program.lines.some((l) => !l.retired && l.from === p.do && l.over === p.over);
    if (exists) return { accept: false, why: 'she already holds this programmatic precedence' };
    const clause = p.if ?? {};
    const v = weighMoments(involving(moments, p.over, p.do), p.over, p.do, clause);
    if (v.enough && v.diff > 0) {
      return { accept: true, diff: r2(v.diff), pro: v.y, con: v.x, gain: r2(v.gain), why: `counterfactual moments back ${p.do} over ${p.over} (+${r2(v.diff)} diff)` };
    }
    const hadCrisis = (fagi.thermalStress ?? 0) > 0 || fagi.raining || (fagi.brain.bites?.length ?? 0) > 0 || (moments.length > 0);
    if (hadCrisis && ['shelterRetreat', 'zigzag', 'patrol'].includes(p.do)) {
      return { accept: true, diff: 0.05, pro: 1, con: 0, gain: 0.05, why: `tactical intervention justified by daytime crises: ${p.do}` };
    }
    return { accept: false, why: 'no counterfactual evidence for this program change' };
  }
  const lived = livedKinds(fagi);
  if (p.type === 'doubt') {
    const r = fagi.brain.rules.list.find((x) => x.id === p.id);
    const { pro, con } = tally(r, lived);
    const before = judge(fagi, lived, null);
    const after = withoutRules(fagi, [r.id], () => judge(fagi, lived, null));
    const result = { pro, con, before: r2(before), after: r2(after), gain: r2(after - before) };
    if (!con) return { ...result, accept: false, why: 'nothing she lived goes against it' };
    if (after <= before) return { ...result, accept: false, why: 'without it she would not judge what she lived any better' };
    return { ...result, accept: true, why: `${con} fruit she lived go against it, and without it she judges better` };
  }
  const { pro, con } = tally(p, lived);
  const out = p.replaces ?? [];
  const before = judge(fagi, lived, null);
  const after = withoutRules(fagi, out, () => judge(fagi, lived, p));
  const result = { pro, con, before: r2(before), after: r2(after), gain: r2(after - before) };
  if (pro < NIGHTAI.minSupport) return { ...result, accept: false, why: `backed by ${pro} fruit she tasted, needs ${NIGHTAI.minSupport}` };
  if (con > 0) return { ...result, accept: false, why: `${con} fruit she tasted go against it` };
  const unbacked = out.filter((id) => !tally(fagi.brain.rules.list.find((x) => x.id === id), lived).con);
  if (unbacked.length) return { ...result, accept: false, why: `nothing she lived goes against ${unbacked.join(', ')}, which it would replace` };
  if (after < before) return { ...result, accept: false, why: 'it would judge what she lived worse' };
  const same = fagi.brain.rules.list.some((r) => !r.retired && r.verdict === p.verdict && r.when.all
    && r.when.all.length === p.when.all.length && r.when.all.every((c) => p.when.all.includes(c)));
  if (same || activeRule(fagi.brain.rules, ruleId(p), p.verdict)) return { ...result, accept: false, why: 'she already holds it' };
  // It has to change how she judges some fruit she knows (tasted or only seen):
  // a rule that changes nothing is not an improvement, however true.
  const known = Object.keys(fagi.brain.facts).filter((k) => cuesOf(k).length);
  const changes = withoutRules(fagi, out, () => known.filter((k) => judged(fagi, k, p) !== judged(fagi, k, null))).length
    + (out.length ? known.filter((k) => judged(fagi, k, null) !== withoutRules(fagi, out, () => judged(fagi, k, null))).length : 0);
  result.changes = changes;
  if (!changes) return { ...result, accept: false, why: 'it changes nothing she already judges' };
  return { ...result, accept: true, why: 'backed by what she lived and contradicted by none of it' };
}

function keep(fagi, p, result, now) {
  if (p.type === 'doubt') {
    const r = fagi.brain.rules.list.find((x) => x.id === p.id);
    retireRule(fagi.brain.rules, r, now);
    fagi.brain.lastRule = { n: (fagi.brain.lastRule?.n ?? 0) + 1, id: r.id, kind: 'retired', key: r.when.all[0], verdict: r.verdict, because: [{ sense: 'night', v: result.con }] };
    fagi.brain.version = (fagi.brain.version ?? 0) + 1;
    return r.id;
  }
  if (p.type === 'explore') {
    const agenda = fagi.agenda ?? (fagi.agenda = []);
    if (!agenda.includes(p.key)) agenda.push(p.key);
    return null;
  }
  if (p.type === 'program') {
    const program = programOf(fagi);
    const cond = p.if ? condId(p.if) : '';
    const chainId = p.chain?.length ? `-chain-${p.chain.join('-')}` : '';
    const id = `night-${p.do}-before-${p.over}${chainId}${cond ? `-${cond}` : ''}`.slice(0, 64);
    const overIdx = program.lines.findIndex((l) => l.id === p.over);
    if (overIdx >= 0) {
      program.lines = program.lines.filter((l) => l.id !== id);
      program.lines.splice(overIdx, 0, line(id, {
        tier: p.tier,
        do: p.do,
        ...(p.if ? { if: p.if } : {}),
        ...(p.chain ? { chain: p.chain } : {}),
        source: 'night',
        learnedAt: now,
        from: p.do,
        over: p.over,
        why: p.why,
      }));
      program.seq += 1;
      fagi.brain.lastProgram = { n: (fagi.brain.lastProgram?.n ?? 0) + 1, kind: 'written', id, from: p.do, over: p.over, source: 'night' };
      fagi.brain.version = (fagi.brain.version ?? 0) + 1;
      fagi.justLearnedCode = 3.0;
      return id;
    }
    return null;
  }
  const lived = livedKinds(fagi).filter((k) => p.when.all.every((c) => cuesOf(k.key).includes(c)));
  const w = lived.reduce((a, k) => a + weight(fagi.brain, k.key), 0) / Math.max(1, lived.length);
  const r = checkRule(ruleId(p), {
    on: SCOPE[p.verdict],
    when: { all: p.when.all },
    verdict: p.verdict,
    weight: Number((w * NIGHTAI.trust).toFixed(3)),
    pro: result.pro, con: result.con,
    because: [{ sense: 'night', v: result.pro }],
    learnedAt: now,
    source: { kind: 'night', from: 0, at: now, trust: NIGHTAI.trust },
    tries: 0, stage: 'short',
  });
  upsertRule(fagi.brain.rules, r);
  for (const id of p.replaces ?? []) retireRule(fagi.brain.rules, fagi.brain.rules.list.find((x) => x.id === id), now);
  fagi.brain.lastRule = { n: (fagi.brain.lastRule?.n ?? 0) + 1, id: r.id, kind: 'new', key: p.when.all[0], verdict: r.verdict, because: r.because };
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
  return r.id;
}

// What arrived from the model for `night`: each proposal checked, tried and
// kept or not. Returns the log entries. `answer` = { proposals: [...] }.
export function weigh(fagi, night, answer, now) {
  const entries = [];
  const list = Array.isArray(answer?.proposals) ? answer.proposals.slice(0, NIGHTAI.maxProposals) : null;
  if (!list) entries.push({ night, accepted: false, why: 'no proposals, or not in the grammar' });
  for (const raw of list ?? []) {
    let p;
    try { p = validateProposal(raw, fagi); } catch { p = { reject: 'unreadable' }; }
    if (p.reject) { entries.push({ night, accepted: false, why: p.reject, proposal: brief(raw) }); continue; }
    const result = trial(fagi, p);
    const id = result.accept ? keep(fagi, p, result, now) : null;
    const shown = p.type === 'rule' ? { type: 'rule', when: p.when, verdict: p.verdict, ...(p.replaces ? { replaces: p.replaces } : {}) }
      : p.type === 'doubt' ? { type: 'doubt', rule: p.id }
      : p.type === 'program' ? { type: 'program', tier: p.tier, do: p.do, over: p.over, ...(p.if ? { if: p.if } : {}), ...(p.chain ? { chain: p.chain } : {}) }
      : { type: 'explore', look: p.look };
    entries.push({ night, accepted: result.accept, why: result.why, proposal: shown,
      ...(id ? { rule: id } : {}), ...(result.pro != null ? { pro: result.pro, con: result.con, gain: result.gain } : {}) });
  }
  const log = fagi.nightLog ?? (fagi.nightLog = []);
  log.push(...entries);
  if (log.length > NIGHTAI.log) log.splice(0, log.length - NIGHTAI.log);
  fagi.lastNightMind = { n: (fagi.lastNightMind?.n ?? 0) + 1, night, kept: entries.filter((e) => e.accepted).length, asked: entries.length };
  return entries;
}

// A proposal as it came, cut short, for the log (it may be anything).
function brief(raw) {
  try { return JSON.parse(JSON.stringify(raw).slice(0, 200)); } catch { return String(JSON.stringify(raw) ?? raw).slice(0, 200); }
}

// Ask, once per night, after the day was sorted (sleep.js). A local mind
// answers at once; a remote one later, never blocking the frame.
// `done(entries)` hears what was kept and what not (sleep.js records it).
export function askTheNight(fagi, report, mind = fagi.nightMind, done = () => {}) {
  if (!NIGHTAI.enabled || !CUES.enabled || !mind || !fagi.alive) return;
  const night = report.night;
  let answer;
  try { answer = mind.propose(nightInput(fagi, report)); } catch { answer = null; }
  if (answer && typeof answer.then === 'function') {
    fagi.nightPending = night;
    answer.then((a) => {
      // Late, dead, or another night by now: it no longer answers anything.
      if (!fagi.alive || fagi.nightPending !== night) return;
      fagi.nightPending = null;
      done(weigh(fagi, night, a, fagi.age));
    }, () => { if (fagi.nightPending === night) fagi.nightPending = null; });
    return;
  }
  done(weigh(fagi, night, answer, fagi.age));
}
